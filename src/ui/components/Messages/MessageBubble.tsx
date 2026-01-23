import { cn } from '@core/utils';
import type { Message, MessageButton } from '@core/types/message.types';
import { Timestamp } from '../Common/Timestamp';
import { MessageStatus } from './MessageStatus';
import { ButtonGroup } from '../Interactive/ButtonGroup';
import { RatingInput } from '../Interactive/RatingInput';
import { ImageMessage } from '../Media/ImageMessage';
import { VideoPlayer } from '../Media/VideoPlayer';

interface MessageBubbleProps {
  message: Message;
  onButtonClick?: (button: MessageButton) => void;
  onRatingSubmit?: (rating: number) => void;
}

function formatContent(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    .replace(/<a /g, '<a class="text-primary underline font-medium" ')
    .replace(/\n/g, '<br/>');
}

export function MessageBubble({
  message,
  onButtonClick,
  onRatingSubmit,
}: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  const isBot = message.sender === 'bot';
  const isSystem = message.sender === 'system';
  const title = message.metadata?.title as string | undefined;

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="px-3 py-1 bg-white/50 dark:bg-gray-800/50 rounded-lg text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-end gap-2 max-w-[85%] animate-fade-in',
        isUser && 'ml-auto justify-end',
        isBot && 'justify-start'
      )}
    >
      <div
        className={cn(
          'p-3 rounded-2xl shadow-sm',
          isUser &&
            'bg-user-bubble-light dark:bg-user-bubble-dark rounded-br-none',
          isBot && 'bg-bot-bubble-light dark:bg-bot-bubble-dark rounded-bl-none',
          (message.options || message.attachment) && 'w-full'
        )}
      >
        {message.content && (
          <p
            className="text-sm text-gray-800 dark:text-gray-100"
            dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
          />
        )}

        {message.attachment?.type === 'image' && (
          <div className="mt-2">
            <ImageMessage attachment={message.attachment} />
          </div>
        )}

        {message.attachment?.type === 'video' && (
          <div className="mt-2">
            <VideoPlayer attachment={message.attachment} />
          </div>
        )}

        {title && (
          <p className="text-sm font-semibold text-primary mt-2 mb-1">
            {title}
          </p>
        )}

        {message.options && (
          <ButtonGroup
            options={message.options}
            onSelect={(btn) => onButtonClick?.(btn)}
            disabled={message.options.buttons.some((b) => b.disabled)}
          />
        )}

        {message.rating && (
          <RatingInput
            min={message.rating.min}
            max={message.rating.max}
            selected={message.rating.selectedValue}
            onSelect={onRatingSubmit}
            disabled={message.rating.selectedValue !== undefined}
          />
        )}

        <div className="flex items-center justify-end gap-1 mt-1">
          <Timestamp date={message.timestamp} />
          {isUser && <MessageStatus status={message.status} />}
        </div>
      </div>
    </div>
  );
}
