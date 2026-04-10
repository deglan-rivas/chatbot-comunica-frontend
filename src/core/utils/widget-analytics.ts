/** Evento DOM para que sitios terceros u otras capas escuchen métricas sin acoplar código. */
export const WIDGET_ANALYTICS_EVENT = 'chatbot-widget-analytics';

export function emitWidgetAnalytics(
  event: string,
  detail: Record<string, unknown> = {}
): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(
      new CustomEvent(WIDGET_ANALYTICS_EVENT, {
        detail: {
          event,
          timestamp: Date.now(),
          ...detail,
        },
      })
    );
  } catch {
    // sin side effects si el entorno bloquea CustomEvent
  }
}
