import { cn } from '@core/utils';

// En embed, cargar assets desde el mismo host del widget; fallback local para desarrollo normal.
function getElecciaLogoUrl(): string {
  const win = window as Window & { __chatbotWidgetAssetBase?: string };
  const base = win.__chatbotWidgetAssetBase;
  if (base) {
    return new URL('eleccia-logo.png', base).toString();
  }
  return '/eleccia-logo.png';
}

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
        'fixed z-50 w-10 h-10 rounded-full',
        'flex items-center justify-center',
        'bg-transparent shadow-xl',
        'transition-all duration-300 ease-in-out',
        'hover:scale-110 hover:shadow-2xl active:scale-95',
        'hover:brightness-105',
        position === 'bottom-right' ? 'right-4 bottom-4' : 'left-4 bottom-4',
        isOpen && 'bg-primary'
      )}
    >
      {isOpen ? (
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6 text-white"
          aria-hidden
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      ) : (
        <img
          src={getElecciaLogoUrl()}
          alt="Eleccia - Asistente Virtual JNE"
          className="w-10 h-10 rounded-full object-cover"
        />
      )}

      {hasUnread && !isOpen && (
        <span
          className={cn(
            'absolute -top-1 -right-1 w-5 h-5',
            'bg-green-500 rounded-full',
            'flex items-center justify-center',
            'text-xs font-bold text-white',
            'animate-bounce-in',
            'border-2 border-white'
          )}
        >
          !
        </span>
      )}
    </button>
  );
}
