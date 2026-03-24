import { useEffect, useCallback } from 'react';
import { FloatingButton } from '../FloatingButton/FloatingButton';
import { ChatWindow } from '../ChatWindow/ChatWindow';
import { useChatStore } from '@core/store/chat.store';
import { useUIStore } from '@core/store/ui.store';
import { useConfigStore } from '@core/store/config.store';
import { generateId } from '@core/utils';
import type { Message, MessageButton } from '@core/types/message.types';
import type {
  WebSocketService,
  WebSocketEvents,
} from '@core/services/websocket.service';

interface WidgetProps {
  websocketService: WebSocketService;
}

export function Widget({ websocketService }: WidgetProps) {
  const { isOpen, hasUnread, toggleOpen, setHasUnread } = useUIStore();
  const { position, bot, features, autoOpen, autoOpenDelay, endpoints } = useConfigStore();
  const {
    messages,
    isTyping,
    connectionStatus,
    conversationId,
    addMessage,
    updateMessageStatus,
    updateMessageOptions,
    setTyping,
    setConnectionStatus,
  } = useChatStore();

  const isConnected = connectionStatus === 'connected';

  const resolveBackendLink = useCallback(
    (raw: string): string => {
      if (!raw.startsWith('/')) return raw;
      try {
        const endpointUrl = new URL(endpoints.websocket);
        return `${endpointUrl.origin}${raw}`;
      } catch {
        return `${window.location.origin}${raw}`;
      }
    },
    [endpoints.websocket]
  );

  useEffect(() => {
    const events: WebSocketEvents = {
      onConnect: () => setConnectionStatus('connected'),
      onDisconnect: () => setConnectionStatus('disconnected'),
      onError: () => setConnectionStatus('error'),
      onMessage: (message) => {
        setTyping(false);
        addMessage(message);
        if (!isOpen) {
          setHasUnread(true);
        }
      },
      onTyping: setTyping,
    };

    websocketService.setEvents(events);
    websocketService.connect();

    return () => {
      websocketService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (autoOpen && !isOpen) {
      const timer = setTimeout(() => {
        toggleOpen();
      }, autoOpenDelay);
      return () => clearTimeout(timer);
    }
  }, [autoOpen, autoOpenDelay]);

  const handleSendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      const message: Message = {
        id: generateId(),
        type: 'text',
        sender: 'user',
        content: text,
        timestamp: new Date(),
        status: 'sending',
      };

      addMessage(message);
      setTyping(true);
      websocketService.sendMessage(text, { conversationId: conversationId ?? undefined });

      setTimeout(() => {
        updateMessageStatus(message.id, 'sent');
      }, 300);
    },
    [addMessage, updateMessageStatus, setTyping, websocketService, conversationId]
  );

  const handleButtonClick = useCallback(
    (messageId: string, button: MessageButton) => {
      const message = messages.find((m) => m.id === messageId);
      const listItems = message?.metadata?.listItems as Array<{ id: string; enlace?: string; value: string }> | undefined;
      const listItem = listItems?.find((i) => i.id === button.id);

      if (listItem?.enlace) {
        const targetUrl = resolveBackendLink(listItem.enlace);
        window.open(targetUrl, '_blank');
        updateMessageOptions(messageId, button.value);
        return;
      }

      const isLink = button.action === 'open_link' || (typeof button.value === 'string' && /^https?:\/\//i.test(button.value));
      if (isLink) {
        window.open(resolveBackendLink(String(button.value)), '_blank');
        updateMessageOptions(messageId, button.value);
        return;
      }

      updateMessageOptions(messageId, button.value);

      const response: Message = {
        id: generateId(),
        type: 'text',
        sender: 'user',
        content: button.label,
        timestamp: new Date(),
        status: 'sending',
      };

      addMessage(response);
      setTyping(true);
      websocketService.sendMessage(String(button.value), { conversationId: conversationId ?? undefined });

      setTimeout(() => {
        updateMessageStatus(response.id, 'sent');
      }, 300);
    },
    [addMessage, updateMessageOptions, updateMessageStatus, setTyping, websocketService, conversationId, messages, resolveBackendLink]
  );

  const handleRatingSubmit = useCallback(
    (messageId: string, rating: number) => {
      const message = messages.find((m) => m.id === messageId);
      if (message?.rating) {
        useChatStore.setState((state) => ({
          messages: state.messages.map((m) =>
            m.id === messageId
              ? { ...m, rating: { ...m.rating!, selectedValue: rating } }
              : m
          ),
        }));
      }

      const response: Message = {
        id: generateId(),
        type: 'text',
        sender: 'user',
        content: String(rating),
        timestamp: new Date(),
        status: 'sending',
      };

      addMessage(response);
      setTyping(true);
      websocketService.sendMessage(String(rating), { conversationId: conversationId ?? undefined });

      setTimeout(() => {
        updateMessageStatus(response.id, 'sent');
      }, 300);
    },
    [messages, addMessage, updateMessageStatus, setTyping, websocketService, conversationId]
  );

  // Backend does not support typing indicators, so this is a no-op
  const handleTyping = useCallback(() => {}, []);

  return (
    <>
      <FloatingButton
        onClick={toggleOpen}
        isOpen={isOpen}
        hasUnread={hasUnread}
        position={position}
      />

      {isOpen && (
        <ChatWindow
          messages={messages}
          isTyping={isTyping}
          isConnected={isConnected}
          bot={bot}
          features={features}
          position={position}
          onClose={toggleOpen}
          onSendMessage={handleSendMessage}
          onButtonClick={handleButtonClick}
          onRatingSubmit={handleRatingSubmit}
          onTyping={handleTyping}
        />
      )}
    </>
  );
}
