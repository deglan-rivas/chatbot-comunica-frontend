import { cn } from '@core/utils';
import type { MessageStatus as Status } from '@core/types/message.types';

interface MessageStatusProps {
  status: Status;
}

export function MessageStatus({ status }: MessageStatusProps) {
  const iconClass = 'material-icons-round text-[14px]';

  switch (status) {
    case 'sending':
      return (
        <span className={cn(iconClass, 'text-gray-400 animate-pulse')}>
          schedule
        </span>
      );
    case 'sent':
      return <span className={cn(iconClass, 'text-gray-400')}>done_all</span>;
    case 'delivered':
      return <span className={cn(iconClass, 'text-gray-400')}>done_all</span>;
    case 'read':
      return <span className={cn(iconClass, 'text-blue-500')}>done_all</span>;
    case 'error':
      return <span className={cn(iconClass, 'text-red-500')}>error</span>;
    default:
      return null;
  }
}
