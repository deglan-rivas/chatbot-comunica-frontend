import { cn } from '@core/utils';
import type { BackendListItem } from '@core/types/backend.types';

interface ListMessageProps {
  title?: string;
  subtitle?: string;
  items: BackendListItem[];
  onItemClick?: (item: BackendListItem) => void;
}

export function ListMessage({ title, subtitle, items, onItemClick }: ListMessageProps) {
  return (
    <div className="space-y-2">
      {title && (
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {title}
        </p>
      )}
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {subtitle}
        </p>
      )}
      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick?.(item)}
            className={cn(
              'w-full text-left p-3 rounded-lg border transition-colors',
              'border-gray-200 dark:border-gray-600',
              'hover:bg-gray-50 dark:hover:bg-gray-700',
              'focus:outline-none focus:ring-2 focus:ring-primary/50'
            )}
          >
            <div className="flex items-center gap-2">
              {item.icon && <span className="text-lg">{item.icon}</span>}
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {item.title}
                </p>
                {item.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
