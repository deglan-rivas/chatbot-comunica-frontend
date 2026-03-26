import { cn } from '@core/utils';
import type { MessageStatus as Status } from '@core/types/message.types';

interface MessageStatusProps {
  status: Status;
}

export function MessageStatus({ status }: MessageStatusProps) {
  const iconClass = 'inline-flex items-center justify-center';

  switch (status) {
    case 'sending':
      return (
        <span className={cn(iconClass, 'text-gray-400 animate-pulse')} aria-hidden>
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v6l4 2" />
          </svg>
        </span>
      );
    case 'sent':
      return (
        <span className={cn(iconClass, 'text-gray-400')} aria-hidden>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 13l4 4L20 7" />
            <path d="M8 13l4 4" />
          </svg>
        </span>
      );
    case 'delivered':
      return (
        <span className={cn(iconClass, 'text-gray-400')} aria-hidden>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 13l4 4L20 7" />
            <path d="M8 13l4 4" />
          </svg>
        </span>
      );
    case 'read':
      return (
        <span className={cn(iconClass, 'text-blue-500')} aria-hidden>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 13l4 4L20 7" />
            <path d="M8 13l4 4" />
          </svg>
        </span>
      );
    case 'error':
      return (
        <span className={cn(iconClass, 'text-red-500')} aria-hidden>
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 8v5" />
            <path d="M12 16h.01" />
            <path d="M10.3 3.6l-8 14A2 2 0 004 21h16a2 2 0 001.7-3.4l-8-14a2 2 0 00-3.4 0z" />
          </svg>
        </span>
      );
    default:
      return null;
  }
}
