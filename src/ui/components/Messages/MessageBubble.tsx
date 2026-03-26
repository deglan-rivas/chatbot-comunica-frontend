import { cn, formatMarkdownContent } from '@core/utils';
import type { Message, MessageButton } from '@core/types/message.types';
import type { BackendListItem } from '@core/types/backend.types';
import { Timestamp } from '../Common/Timestamp';
import { MessageStatus } from './MessageStatus';
import { ButtonGroup } from '../Interactive/ButtonGroup';
import { ListMessage } from './ListMessage';
import { RatingInput } from '../Interactive/RatingInput';
import { ImageMessage } from '../Media/ImageMessage';
import { VideoPlayer } from '../Media/VideoPlayer';

interface MessageBubbleProps {
  message: Message;
  onButtonClick?: (button: MessageButton) => void;
  onRatingSubmit?: (rating: number) => void;
}

export function MessageBubble({
  message,
  onButtonClick,
  onRatingSubmit,
}: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  const isBot = message.sender === 'bot';
  const isSystem = message.sender === 'system';
  const isError = Boolean(message.metadata?.isError);
  const title = message.metadata?.title as string | undefined;
  const listItems = message.metadata?.listItems as BackendListItem[] | undefined;
  const listTitle = message.metadata?.listTitle as string | undefined;
  const isList = Array.isArray(listItems) && listItems.length > 0 && message.options?.buttons;

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
          'p-3 rounded-2xl shadow-sm overflow-hidden',
          isUser &&
            'bg-user-bubble-light dark:bg-user-bubble-dark rounded-br-none',
          isBot && 'bg-bot-bubble-light dark:bg-bot-bubble-dark rounded-bl-none text-left',
          isBot && isError && 'border border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-950/30',
          (message.options || message.attachment) && 'w-full'
        )}
      >
        {isList ? (
          <>
            <ListMessage
              title={listTitle}
              introText={message.content || undefined}
              items={listItems!}
              disabled={message.options!.buttons.some((b) => b.disabled)}
              onItemClick={(item) => {
                const btn = message.options!.buttons.find((b) => b.id === item.id);
                if (btn) onButtonClick?.(btn);
              }}
            />
          </>
        ) : (
          <>
            {message.content && (
              <p
                className="text-sm text-gray-800 dark:text-gray-100 break-words overflow-hidden"
                dangerouslySetInnerHTML={{ __html: formatMarkdownContent(message.content) }}
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
          </>
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

        {isBot && message.metadata?.disclaimer != null && (
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2 italic">
            {String(message.metadata?.disclaimer)}
          </p>
        )}
        <div className="flex items-center justify-end gap-1 mt-1">
          <Timestamp date={message.timestamp} />
          {isUser && <MessageStatus status={message.status} />}
        </div>
      </div>
    </div>
  );
}
