import { useEffect, useCallback, useRef, useState } from 'react';
import { FloatingButton } from '../FloatingButton/FloatingButton';
import { ChatWindow } from '../ChatWindow/ChatWindow';
import { useChatStore } from '@core/store/chat.store';
import { useUIStore } from '@core/store/ui.store';
import { useConfigStore } from '@core/store/config.store';
import { emitWidgetAnalytics, generateId } from '@core/utils';
import {
  endChatSession,
  sendChatFeedback,
  sendChatResolution,
  type SessionEndReason,
} from '@core/services/chat-feedback.service';
import type { Message, MessageButton } from '@core/types/message.types';
import type {
  WebSocketService,
  WebSocketEvents,
} from '@core/services/websocket.service';

interface WidgetProps {
  websocketService: WebSocketService;
}

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_SESSION_AGE_MS = 60 * 60 * 1000;
const GOODBYE_GRACE_MS = 60 * 1000;
const GOODBYE_REGEX = /\b(adios|adiós|hasta luego|nos vemos|chao|bye)\b/i;

export function Widget({ websocketService }: WidgetProps) {
  const { isOpen, hasUnread, toggleOpen, setHasUnread, setIsOpen } = useUIStore();
  const { position, bot, autoOpen, autoOpenDelay, endpoints } = useConfigStore();
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
    clearMessages,
  } = useChatStore();

  const isConnected = connectionStatus === 'connected';
  const [sessionLifecycle, setSessionLifecycle] = useState<'active' | 'closing' | 'closed'>('active');
  const endingSessionRef = useRef(false);
  const sessionStartedAtRef = useRef<number | null>(null);
  const lastActivityAtRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxAgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goodbyeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getApiBaseUrl = useCallback((): string => {
    const cfg = useConfigStore.getState();
    return cfg.endpoints.api || cfg.endpoints.websocket;
  }, []);

  const clearSessionTimers = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (maxAgeTimerRef.current) {
      clearTimeout(maxAgeTimerRef.current);
      maxAgeTimerRef.current = null;
    }
    if (goodbyeTimerRef.current) {
      clearTimeout(goodbyeTimerRef.current);
      goodbyeTimerRef.current = null;
    }
  }, []);

  const prevOpenRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (prevOpenRef.current === null) {
      prevOpenRef.current = isOpen;
      return;
    }
    if (prevOpenRef.current !== isOpen) {
      emitWidgetAnalytics(isOpen ? 'chat_opened' : 'chat_closed', {
        projectId: useConfigStore.getState().projectId,
      });
      prevOpenRef.current = isOpen;
    }
  }, [isOpen]);

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

  const finalizeSession = useCallback(
    async (
      reason: SessionEndReason,
      resolution?: { resolved: boolean; reason: string | null }
    ): Promise<void> => {
      if (endingSessionRef.current) return;

      const sessionId = websocketService.getSessionId();
      if (!sessionId) return;

      endingSessionRef.current = true;
      setSessionLifecycle('closing');
      clearSessionTimers();

      try {
        if (resolution) {
          await sendChatResolution(getApiBaseUrl(), {
            session_id: sessionId,
            resolved: resolution.resolved,
            reason: resolution.reason,
            channel: 'ws',
          });
        }

        await endChatSession(getApiBaseUrl(), {
          session_id: sessionId,
          reason,
          resolved: resolution?.resolved ?? null,
          resolution_reason: resolution?.reason ?? null,
          channel: 'ws',
        });

        websocketService.disconnect();
        websocketService.clearStoredSessionId();
        useChatStore.getState().setConversationId(null);
        setConnectionStatus('disconnected');
        setIsOpen(false);

        emitWidgetAnalytics('session_ended', {
          closeReason: reason,
          resolved: resolution?.resolved ?? null,
          resolutionReason: resolution?.reason ?? null,
        });

        sessionStartedAtRef.current = null;
        lastActivityAtRef.current = Date.now();
        setSessionLifecycle('closed');
      } finally {
        endingSessionRef.current = false;
      }
    },
    [clearSessionTimers, getApiBaseUrl, setConnectionStatus, setIsOpen, websocketService]
  );

  const scheduleSessionTimeouts = useCallback(() => {
    clearSessionTimers();
    const now = Date.now();
    const startedAt = sessionStartedAtRef.current ?? now;
    const lastActivity = lastActivityAtRef.current;

    const ageElapsed = now - startedAt;
    const inactivityElapsed = now - lastActivity;

    const maxAgeRemaining = Math.max(0, MAX_SESSION_AGE_MS - ageElapsed);
    const inactivityRemaining = Math.max(0, INACTIVITY_TIMEOUT_MS - inactivityElapsed);

    maxAgeTimerRef.current = setTimeout(() => {
      void finalizeSession('MAX_SESSION_AGE');
    }, maxAgeRemaining);

    inactivityTimerRef.current = setTimeout(() => {
      void finalizeSession('INACTIVITY_TIMEOUT');
    }, inactivityRemaining);
  }, [clearSessionTimers, finalizeSession]);

  const registerMessageActivity = useCallback(() => {
    lastActivityAtRef.current = Date.now();
    if (goodbyeTimerRef.current) {
      clearTimeout(goodbyeTimerRef.current);
      goodbyeTimerRef.current = null;
    }
    if (sessionStartedAtRef.current != null) {
      scheduleSessionTimeouts();
    }
  }, [scheduleSessionTimeouts]);

  const startGoodbyeGrace = useCallback(() => {
    if (goodbyeTimerRef.current) {
      clearTimeout(goodbyeTimerRef.current);
    }
    goodbyeTimerRef.current = setTimeout(() => {
      void finalizeSession('USER_GOODBYE');
    }, GOODBYE_GRACE_MS);
  }, [finalizeSession]);

  useEffect(() => {
    const events: WebSocketEvents = {
      onConnect: () => {
        setConnectionStatus('connected');
        setSessionLifecycle('active');
        const activeSessionId = websocketService.getSessionId();
        if (activeSessionId) {
          sessionStartedAtRef.current = Date.now();
          lastActivityAtRef.current = Date.now();
          scheduleSessionTimeouts();
        }
      },
      onDisconnect: () => setConnectionStatus('disconnected'),
      onError: () => setConnectionStatus('error'),
      onMessage: (message) => {
        registerMessageActivity();
        setTyping(false);
        addMessage(message);
        if (!useUIStore.getState().isOpen) {
          setHasUnread(true);
        }
      },
      onTyping: setTyping,
    };

    websocketService.setEvents(events);
    websocketService.connect();

    return () => {
      clearSessionTimers();
      websocketService.disconnect();
    };
  }, [
    addMessage,
    clearSessionTimers,
    registerMessageActivity,
    scheduleSessionTimeouts,
    setConnectionStatus,
    setHasUnread,
    setTyping,
    websocketService,
  ]);

  useEffect(() => {
    if (autoOpen && !isOpen) {
      const timer = setTimeout(() => {
        toggleOpen();
      }, autoOpenDelay);
      return () => clearTimeout(timer);
    }
  }, [autoOpen, autoOpenDelay]);

  useEffect(() => {
    if (isOpen && sessionLifecycle === 'closed') {
      clearMessages();
      useChatStore.getState().setConversationId(null);
      setSessionLifecycle('active');
      websocketService.connect();
      return;
    }

    if (isOpen && !isConnected && !endingSessionRef.current) {
      websocketService.connect();
    }
  }, [clearMessages, isConnected, isOpen, sessionLifecycle, websocketService]);

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
      registerMessageActivity();
      emitWidgetAnalytics('message_sent', {
        projectId: useConfigStore.getState().projectId,
        length: text.trim().length,
      });
      websocketService.sendMessage(text, { conversationId: conversationId ?? undefined });

      if (GOODBYE_REGEX.test(text)) {
        startGoodbyeGrace();
      }

      setTimeout(() => {
        updateMessageStatus(message.id, 'sent');
      }, 300);
    },
    [
      addMessage,
      conversationId,
      registerMessageActivity,
      setTyping,
      startGoodbyeGrace,
      updateMessageStatus,
      websocketService,
    ]
  );

  const handleButtonClick = useCallback(
    (messageId: string, button: MessageButton) => {
      const actionValue = String(button.value);
      if (actionValue === '__RESOLUTION_YES__' || actionValue === '__RESOLUTION_NO__') {
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
        setTyping(false);

        const resolved = actionValue === '__RESOLUTION_YES__';
        const resolutionReason = resolved ? 'quick_reply_yes' : 'quick_reply_no';
        void finalizeSession('USER_GOODBYE', {
          resolved,
          reason: resolutionReason,
        });
        return;
      }

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
      registerMessageActivity();
      websocketService.sendMessage(String(button.value), { conversationId: conversationId ?? undefined });

      setTimeout(() => {
        updateMessageStatus(response.id, 'sent');
      }, 300);
    },
    [
      addMessage,
      conversationId,
      finalizeSession,
      messages,
      registerMessageActivity,
      resolveBackendLink,
      setTyping,
      updateMessageOptions,
      updateMessageStatus,
      websocketService,
    ]
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
      registerMessageActivity();
      websocketService.sendMessage(String(rating), { conversationId: conversationId ?? undefined });

      setTimeout(() => {
        updateMessageStatus(response.id, 'sent');
      }, 300);
    },
    [
      addMessage,
      conversationId,
      messages,
      registerMessageActivity,
      setTyping,
      updateMessageStatus,
      websocketService,
    ]
  );

  // Backend does not support typing indicators, so this is a no-op
  const handleTyping = useCallback(() => {}, []);

  const handleFeedbackSubmit = useCallback(
    async ({
      messageId,
      isHelpful,
      reason,
    }: {
      messageId: string;
      isHelpful: boolean;
      reason?: string | null;
    }): Promise<boolean> => {
      const sessionId = websocketService.getSessionId();
      if (!sessionId) return false;

      const ok = await sendChatFeedback(getApiBaseUrl(), {
        session_id: sessionId,
        is_helpful: isHelpful,
        reason: reason ?? null,
        channel: 'ws',
        message_id: messageId,
      });

      if (ok) {
        useChatStore.setState((state) => ({
          messages: state.messages.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  metadata: {
                    ...(m.metadata ?? {}),
                    feedbackSent: true,
                    feedbackHelpful: isHelpful,
                    feedbackReason: reason ?? null,
                  },
                }
              : m
          ),
        }));
      }

      emitWidgetAnalytics('message_feedback_sent', {
        ok,
        helpful: isHelpful,
        reason: reason ?? null,
      });
      return ok;
    },
    [getApiBaseUrl, websocketService]
  );

  const handleCloseChat = useCallback(() => {
    toggleOpen();
  }, [toggleOpen]);

  return (
    <>
      <FloatingButton
        onClick={toggleOpen}
        isOpen={isOpen}
        hasUnread={hasUnread}
        position={position}
        isConnected={isConnected}
      />

      {isOpen && (
        <ChatWindow
          messages={messages}
          isTyping={isTyping}
          isConnected={isConnected}
          bot={bot}
          position={position}
          onClose={handleCloseChat}
          onSendMessage={handleSendMessage}
          onButtonClick={handleButtonClick}
          onRatingSubmit={handleRatingSubmit}
          onFeedbackSubmit={handleFeedbackSubmit}
          onTyping={handleTyping}
        />
      )}
    </>
  );
}
