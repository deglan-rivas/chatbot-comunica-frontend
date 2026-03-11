import { cn, formatMarkdownContent } from '@core/utils';
import type { BackendListItem } from '@core/types/backend.types';

interface ListMessageProps {
  /** Título de la lista (ej. "📋 Servicios Digitales Encontrados") */
  title?: string;
  /** Texto introductorio (ej. "Encontré 6 servicios que pueden ayudarte...") */
  introText?: string;
  items: BackendListItem[];
  onItemClick?: (item: BackendListItem) => void;
  /** Si true, deshabilita clics (tras elegir) */
  disabled?: boolean;
}

const DESCRIPTION_MAX_LENGTH = 140;

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max).trim() + '…';
}

export function ListMessage({
  title,
  introText,
  items,
  onItemClick,
  disabled = false,
}: ListMessageProps) {
  return (
    <div className="space-y-4 text-left">
      {/* Encabezado: título e intro bien diferenciados, siempre alineado a la izquierda */}
      <header className="space-y-1">
        {title && (
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
            {title}
          </h3>
        )}
        {introText && (
          <div
            className="text-sm text-gray-600 dark:text-gray-400 leading-tight [&_a]:text-primary [&_a]:underline [&_a]:font-medium"
            dangerouslySetInnerHTML={{ __html: formatMarkdownContent(introText) }}
          />
        )}
      </header>

      {/* Lista de tarjetas */}
      <ul className="space-y-4 list-none p-0 m-0">
        {items.map((item) => (
          <li key={item.id}>
            <article
              className={cn(
                'rounded-lg border border-gray-200 dark:border-gray-600',
                'bg-gray-100 dark:bg-gray-800/50',
                'overflow-hidden transition-colors',
                !disabled && 'hover:bg-gray-200 dark:hover:bg-gray-700/50'
              )}
            >
              <button
                type="button"
                onClick={() => onItemClick?.(item)}
                disabled={disabled}
                className={cn(
                  'w-full text-left block p-4',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset',
                  'disabled:opacity-60 disabled:cursor-not-allowed'
                )}
              >
                {/* Título del ítem */}
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                  {item.title}
                </h4>

                {/* Descripción */}
                {item.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-tight">
                    {truncate(item.description, DESCRIPTION_MAX_LENGTH)}
                  </p>
                )}

                {/* Acción "Acceder" al pie de la tarjeta, solo si hay enlace */}
                {item.enlace && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-xs font-medium text-primary',
                        !disabled && 'hover:underline'
                      )}
                      aria-hidden
                    >
                      <span aria-hidden>🔗</span>
                      Acceder al servicio
                    </span>
                  </div>
                )}
              </button>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
