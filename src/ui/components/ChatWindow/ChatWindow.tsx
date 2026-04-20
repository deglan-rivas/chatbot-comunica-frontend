import { useRef, useEffect } from 'react';
import { cn } from '@core/utils';
import { ChatHeader } from './ChatHeader';
import { ChatBody } from './ChatBody';
import { ChatInput } from './ChatInput';
import type { Message, MessageButton } from '@core/types/message.types';
import type { BotConfig } from '@/config/schema';

interface ChatWindowProps {
  messages: Message[];
  isTyping: boolean;
  isConnected: boolean;
  bot: BotConfig;
  position: 'bottom-right' | 'bottom-left';
  onClose: () => void;
  onSendMessage: (text: string) => void;
  onButtonClick?: (messageId: string, button: MessageButton) => void;
  onRatingSubmit?: (messageId: string, rating: number) => void;
  onFeedbackSubmit?: (payload: {
    messageId: string;
    isHelpful: boolean;
    reason?: string | null;
  }) => Promise<boolean>;
  onTyping?: (isTyping: boolean) => void;
}

export function ChatWindow({
  messages,
  isTyping,
  isConnected,
  bot,
  position,
  onClose,
  onSendMessage,
  onButtonClick,
  onRatingSubmit,
  onFeedbackSubmit,
  onTyping,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div
      className={cn(
        'fixed z-40 flex flex-col',
        'w-full max-w-[400px] h-[600px] max-h-[80vh]',
        'bg-white dark:bg-gray-900 rounded-2xl shadow-2xl',
        'overflow-hidden animate-slide-up',
        position === 'bottom-right' ? 'right-4 bottom-20' : 'left-4 bottom-20'
      )}
    >
      <ChatHeader
        botName={bot.name}
        botAvatar={bot.avatar}
        isOnline={isConnected}
        onClose={onClose}
      />

      <ChatBody
        ref={scrollRef}
        messages={messages}
        isTyping={isTyping}
        onButtonClick={onButtonClick}
        onRatingSubmit={onRatingSubmit}
        onFeedbackSubmit={onFeedbackSubmit}
      />

      <ChatInput
        onSend={onSendMessage}
        onTyping={onTyping}
        disabled={!isConnected}
      />
    </div>
  );
}
