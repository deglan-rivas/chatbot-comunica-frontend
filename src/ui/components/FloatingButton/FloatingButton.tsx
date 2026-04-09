import React, { useEffect, useRef, useState } from 'react';
import { useConfigStore } from '@core/store/config.store';
import { cn, emitWidgetAnalytics } from '@core/utils';

const ONBOARDING_SESSION_KEY = 'chatbot-widget-onboarding-dismissed';

/** Fase A: texto exclusivo de la píldora (copia acordada). */
const FAB_HINT_ES = '¿Necesitas Asistencia?';

function getElecciaLogoUrl(): string {
  const win = window as Window & { __chatbotWidgetAssetBase?: string };
  const base = win.__chatbotWidgetAssetBase;
  if (base) {
    return new URL('eleccia-logo.png', base).toString();
  }
  return '/eleccia-logo.png';
}

function readOnboardingDismissed(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  try {
    return sessionStorage.getItem(ONBOARDING_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

interface FloatingButtonProps {
  onClick: () => void;
  isOpen: boolean;
  hasUnread: boolean;
  position: 'bottom-right' | 'bottom-left';
  /** Fase B: WebSocket conectado */
  isConnected?: boolean;
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({
  onClick,
  isOpen,
  hasUnread,
  position,
  isConnected = false,
}) => {
  const bot = useConfigStore((s) => s.bot);

  const imageUrl = bot.avatar ?? getElecciaLogoUrl();

  const [showAttention, setShowAttention] = useState(true);
  const [showSessionGlow, setShowSessionGlow] = useState(true);
  const [onboardingDismissed, setOnboardingDismissed] = useState(() =>
    readOnboardingDismissed()
  );
  const onboardingShownRef = useRef(false);

  useEffect(() => {
    emitWidgetAnalytics('fab_mounted', { position });
  }, [position]);

  useEffect(() => {
    const timer = setTimeout(() => setShowAttention(false), 9000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowSessionGlow(false), 12000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShowAttention(false);
      setShowSessionGlow(false);
    }
  }, [isOpen]);

  const showOnboarding = !onboardingDismissed && !isOpen;

  useEffect(() => {
    if (showOnboarding && !onboardingShownRef.current) {
      onboardingShownRef.current = true;
      emitWidgetAnalytics('onboarding_banner_shown', { position });
    }
  }, [showOnboarding, position]);

  const dismissOnboarding = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      sessionStorage.setItem(ONBOARDING_SESSION_KEY, '1');
    } catch {
      /* ignore */
    }
    setOnboardingDismissed(true);
    emitWidgetAnalytics('onboarding_banner_dismissed', { position });
  };

  const handleMainClick = () => {
    emitWidgetAnalytics('fab_toggle', { willOpen: !isOpen, position });
    onClick();
  };

  const flexDirection = {
    'bottom-right': 'flex-row',
    'bottom-left': 'flex-row-reverse',
  };

  const isRight = position === 'bottom-right';

  return (
    <div
      className={cn(
        'fixed z-50 pointer-events-none flex flex-col gap-2',
        isRight ? 'right-4 bottom-4 items-end' : 'left-4 bottom-4 items-start'
      )}
    >
      {showOnboarding && (
        <div
          className="pointer-events-auto max-w-[250px] rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md flex gap-2"
          role="region"
          aria-label="Invitación al asistente virtual"
        >
          <p className="text-xs text-gray-800 flex-1">
            ¿Tienes consultas sobre trámites o multas electorales? Usa el botón
            de abajo para chatear con nuestro asistente.
          </p>
          <button
            type="button"
            onClick={dismissOnboarding}
            className="flex-shrink-0 w-6 h-6 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center text-base"
            aria-label="Cerrar mensaje"
            title="Cerrar"
          >
            ×
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleMainClick}
        aria-label={isOpen ? 'Cerrar chat' : `${FAB_HINT_ES} Abrir asistente`}
        title={isOpen ? 'Cerrar chat' : `${FAB_HINT_ES} Abrir asistente`}
        className={cn(
          'pointer-events-auto relative mb-0 font-semibold rounded-full shadow-lg flex items-center border-2 transition-all duration-300 ease-in-out',
          'hover:scale-105 hover:shadow-2xl active:scale-95',
          isOpen
            ? 'w-10 h-10 justify-center bg-primary text-white border-transparent p-0'
            : cn(
                'bg-white text-gray-500 border-gray-400 gap-3 px-3 py-3',
                flexDirection[position],
                !showAttention ? '' : 'animate-attention-limited',
                !showSessionGlow ? '' : 'animate-soft-pulse-session'
              )
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
          <>
            <span className="flex items-center gap-1 flex-shrink-0">
              {isConnected && (
                <span
                  className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 border border-white shadow-sm"
                  aria-hidden
                  title="Servicio activo"
                />
              )}
              <span className="text-sm text-gray-800 whitespace-nowrap">
                {FAB_HINT_ES}
              </span>
            </span>
            <span className="relative flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 bg-primary">
              <img
                src={imageUrl}
                alt="Eleccia - Asistente Virtual JNE"
                className="w-6 h-6 object-contain rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getElecciaLogoUrl();
                }}
              />
            </span>
          </>
        )}

        {hasUnread && !isOpen && (
          <span
            className={cn(
              'absolute -top-1 w-5 h-5',
              isRight ? '-right-1' : '-left-1',
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
    </div>
  );
};
