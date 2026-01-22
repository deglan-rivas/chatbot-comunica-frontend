import { cn } from '@core/utils';
import type { MessageOptions, MessageButton } from '@core/types/message.types';

interface ButtonGroupProps {
  options: MessageOptions;
  onSelect: (button: MessageButton) => void;
  disabled?: boolean;
}

const gridCols = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
};

export function ButtonGroup({ options, onSelect, disabled = false }: ButtonGroupProps) {
  return (
    <div className={cn('grid gap-2 mt-3', gridCols[options.columns ?? 2])}>
      {options.buttons.map((button) => (
        <button
          key={button.id}
          onClick={() => onSelect(button)}
          disabled={disabled || button.disabled}
          className={cn(
            'py-2 px-3 rounded-lg text-sm font-medium',
            'border transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            button.variant === 'primary'
              ? 'bg-primary text-white border-primary hover:bg-primary/90'
              : 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-300 border-primary/20 hover:bg-primary/20'
          )}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
}
