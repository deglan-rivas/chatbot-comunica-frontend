import { cn } from '@core/utils';
import { Avatar } from '../Common/Avatar';

interface ChatHeaderProps {
  botName: string;
  botAvatar?: string;
  isOnline: boolean;
  onClose: () => void;
}

export function ChatHeader({
  botName,
  botAvatar,
  isOnline,
  onClose,
}: ChatHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3',
        'bg-white dark:bg-gray-900',
        'border-b border-gray-200 dark:border-gray-800'
      )}
    >
      <button
        onClick={onClose}
        className="text-primary hover:opacity-70 transition-opacity"
        aria-label="Cerrar chat"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5"
          aria-hidden
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <Avatar src={botAvatar} name={botName} size="md" online={isOnline} />

      <div className="flex-1 min-w-0">
        <h2 className="font-bold text-gray-900 dark:text-white leading-tight truncate">
          {botName}
        </h2>
        <span
          className={cn(
            'text-xs',
            isOnline
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-400 dark:text-gray-500'
          )}
        >
          {isOnline ? 'En linea' : 'Desconectado'}
        </span>
      </div>
    </div>
  );
}
