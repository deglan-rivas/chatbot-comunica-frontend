import { cn } from '@core/utils';
import type { BackendAction } from '@core/types/backend.types';

interface CardMessageProps {
  title?: string;
  subtitle?: string;
  text?: string;
  actions?: BackendAction[];
  onActionClick?: (action: BackendAction) => void;
}

export function CardMessage({
  title,
  subtitle,
  text,
  actions,
  onActionClick,
}: CardMessageProps) {
  const getButtonStyles = (style: BackendAction['style']) => {
    switch (style) {
      case 'primary':
        return 'bg-primary text-white hover:bg-primary/90';
      case 'danger':
        return 'bg-red-500 text-white hover:bg-red-600';
      case 'secondary':
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600';
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
      <div className="p-4 space-y-2">
        {title && (
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        )}
        {text && (
          <p className="text-sm text-gray-700 dark:text-gray-200">
            {text}
          </p>
        )}
      </div>
      {actions && actions.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-600 p-3 flex gap-2 flex-wrap">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => onActionClick?.(action)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-primary/50',
                getButtonStyles(action.style)
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
