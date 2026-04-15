import { forwardRef } from 'react';
import { cn } from '@core/utils';
import type { Message, MessageButton } from '@core/types/message.types';
import { MessageBubble } from '../Messages/MessageBubble';
import { TypingIndicator } from '../Messages/TypingIndicator';

interface ChatBodyProps {
  messages: Message[];
  isTyping: boolean;
  onButtonClick?: (messageId: string, button: MessageButton) => void;
  onRatingSubmit?: (messageId: string, rating: number) => void;
  onFeedbackSubmit?: (payload: {
    messageId: string;
    isHelpful: boolean;
    reason?: string | null;
  }) => Promise<boolean>;
}

export const ChatBody = forwardRef<HTMLDivElement, ChatBodyProps>(
  function ChatBody({ messages, isTyping, onButtonClick, onRatingSubmit, onFeedbackSubmit }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4',
          'bg-chat-bg-light dark:bg-chat-bg-dark',
          'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700'
        )}
      >
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onButtonClick={(btn) => onButtonClick?.(message.id, btn)}
            onRatingSubmit={(rating) => onRatingSubmit?.(message.id, rating)}
            onFeedbackSubmit={onFeedbackSubmit}
          />
        ))}

        {isTyping && <TypingIndicator />}

        <div className="h-0" />
      </div>
    );
  }
);
