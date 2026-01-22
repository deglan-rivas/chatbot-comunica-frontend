import { cn } from '@core/utils';

interface TypingIndicatorProps {
  className?: string;
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div
      className={cn(
        'flex items-end gap-2 max-w-[85%]',
        className
      )}
    >
      <div className="bg-bot-bubble-light dark:bg-bot-bubble-dark p-3 rounded-2xl rounded-bl-none shadow-sm">
        <div className="flex gap-1 items-center h-5">
          <span
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );
}
