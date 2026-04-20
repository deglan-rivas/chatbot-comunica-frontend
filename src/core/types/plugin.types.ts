import type { Message } from './message.types';
import type { ChatStore } from '@core/store/chat.store';
import type { UIStore } from '@core/store/ui.store';
import type { ConfigStore } from '@core/store/config.store';

export type Unsubscribe = () => void;
export type EventHandler = (payload: unknown) => void;

export interface PluginContext {
  store: {
    chat: ChatStore;
    config: ConfigStore;
    ui: UIStore;
  };
  emit: (event: string, payload: unknown) => void;
  on: (event: string, handler: EventHandler) => Unsubscribe;
}

export interface PluginHooks {
  // Lifecycle
  onInit?: () => void | Promise<void>;
  onDestroy?: () => void;

  // Messages
  onBeforeMessageSend?: (message: Message) => Message | null;
  onAfterMessageSend?: (message: Message) => void;
  onMessageReceived?: (message: Message) => Message | null;

  // Connection
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onReconnect?: (attempt: number) => void;

  // UI
  onWidgetOpen?: () => void;
  onWidgetClose?: () => void;
  onUserTyping?: (isTyping: boolean) => void;

  // Interactions
  onButtonClick?: (buttonId: string, value: unknown) => void;
  onRatingSubmit?: (rating: number) => void;
}

export interface Plugin {
  name: string;
  version: string;
  hooks: PluginHooks;
  init: (context: PluginContext) => void | Promise<void>;
  destroy?: () => void;
}

export type PluginFactory = (options?: Record<string, unknown>) => Plugin;
