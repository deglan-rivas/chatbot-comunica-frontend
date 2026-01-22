import { cn } from '@core/utils';

interface FloatingButtonProps {
  onClick: () => void;
  isOpen: boolean;
  hasUnread: boolean;
  position: 'bottom-right' | 'bottom-left';
}

export function FloatingButton({
  onClick,
  isOpen,
  hasUnread,
  position,
}: FloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat'}
      className={cn(
        'fixed z-50 w-14 h-14 rounded-full shadow-lg',
        'flex items-center justify-center',
        'bg-primary text-white',
        'transition-all duration-300 ease-in-out',
        'hover:scale-110 active:scale-95',
        position === 'bottom-right' ? 'right-4 bottom-4' : 'left-4 bottom-4',
        isOpen && 'rotate-90'
      )}
    >
      <span className="material-icons-round text-2xl">
        {isOpen ? 'close' : 'chat'}
      </span>

      {hasUnread && !isOpen && (
        <span
          className={cn(
            'absolute -top-1 -right-1 w-5 h-5',
            'bg-red-500 rounded-full',
            'flex items-center justify-center',
            'text-xs font-bold text-white',
            'animate-bounce-in'
          )}
        >
          !
        </span>
      )}
    </button>
  );
}
