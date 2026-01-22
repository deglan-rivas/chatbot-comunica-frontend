import type { Plugin, PluginFactory } from '@core/types/plugin.types';

interface AnalyticsOptions {
  trackingId?: string;
  debug?: boolean;
}

const track = (event: string, data?: Record<string, unknown>) => {
  // Custom analytics implementation
  console.log('[Analytics]', event, data);
};

export const createAnalyticsPlugin: PluginFactory = (
  options: AnalyticsOptions = {}
): Plugin => {
  const { debug = false } = options;

  return {
    name: 'analytics',
    version: '1.0.0',
    hooks: {
      onWidgetOpen: () => {
        track('widget_opened');
      },
      onWidgetClose: () => {
        track('widget_closed');
      },
      onAfterMessageSend: (message) => {
        track('message_sent', { type: message.type });
      },
      onMessageReceived: (message) => {
        track('message_received', { type: message.type });
        return message;
      },
      onButtonClick: (buttonId, value) => {
        track('button_clicked', { buttonId, value });
      },
      onRatingSubmit: (rating) => {
        track('rating_submitted', { rating });
      },
      onConnect: () => {
        track('connected');
      },
      onDisconnect: (reason) => {
        track('disconnected', { reason });
      },
    },
    init: () => {
      if (debug) {
        console.log('[Analytics Plugin] Initialized');
      }
    },
    destroy: () => {
      if (debug) {
        console.log('[Analytics Plugin] Destroyed');
      }
    },
  };
};
