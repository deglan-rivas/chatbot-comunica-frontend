import { formatTime } from '@core/utils';
import { cn } from '@core/utils';

interface TimestampProps {
  date: Date | string;
  className?: string;
}

export function Timestamp({ date, className }: TimestampProps) {
  return (
    <span
      className={cn(
        'text-[10px] text-gray-400 dark:text-gray-500',
        className
      )}
    >
      {formatTime(date)}
    </span>
  );
}
