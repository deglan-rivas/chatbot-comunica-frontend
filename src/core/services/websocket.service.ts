import type { Message } from '@core/types/message.types';
import type {
  BackendRequest,
  BackendResponse,
  ResponseRich,
  BackendAction,
} from '@core/types/backend.types';
import { generateId } from '@core/utils';

export type WebSocketEventHandler<T = unknown> = (data: T) => void;

export interface WebSocketConfig {
  url: string;
  userId?: string;
  autoReconnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

export interface WebSocketEvents {
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
  onMessage?: (message: Message) => void;
  onTyping?: (isTyping: boolean) => void;
  onReconnect?: (attempt: number) => void;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private events: WebSocketEvents;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private userId: string;

  constructor(config: WebSocketConfig, events: WebSocketEvents = {}) {
    this.config = {
      autoReconnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      ...config,
    };
    this.events = events;
    this.userId = config.userId || this.getOrCreateUserId();
  }

  private getOrCreateUserId(): string {
    const storageKey = 'chatbot-user-id';
    let userId = sessionStorage.getItem(storageKey);
    if (!userId) {
      userId = crypto.randomUUID();
      sessionStorage.setItem(storageKey, userId);
    }
    return userId;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(this.config.url);
      this.setupListeners();
    } catch (error) {
      this.events.onError?.(error as Error);
      this.scheduleReconnect();
    }
  }

  private setupListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.events.onConnect?.();
    };

    this.ws.onclose = (event) => {
      this.events.onDisconnect?.(event.reason || 'closed');
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.events.onError?.(new Error('WebSocket connection error'));
    };

    this.ws.onmessage = (event) => {
      try {
        const data: BackendResponse = JSON.parse(event.data);
        console.log('[WebSocket] Raw message received:', data);

        // Ignorar mensajes de sistema del backend (ej: "Conexión restablecida")
        if (data.type === 'system') {
          console.log('[WebSocket] Ignoring system message from backend');
          return;
        }

        // Validate response_rich exists
        if (!data.response_rich) {
          console.warn('[WebSocket] Message without response_rich, using content as fallback');
          const fallbackMessage: Message = {
            id: generateId(),
            type: 'text',
            sender: 'bot',
            content: data.content || 'Mensaje recibido',
            timestamp: new Date(data.timestamp || Date.now()),
            status: 'read',
          };
          this.events.onMessage?.(fallbackMessage);
          return;
        }

        const message = this.transformResponse(data);
        this.events.onMessage?.(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }

  private scheduleReconnect(): void {
    if (
      !this.config.autoReconnect ||
      this.reconnectAttempt >= (this.config.reconnectionAttempts ?? 5)
    ) {
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempt++;
      this.events.onReconnect?.(this.reconnectAttempt);
      this.connect();
    }, this.config.reconnectionDelay);
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendMessage(text: string): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected');
      return;
    }

    const request: BackendRequest = {
      user_id: this.userId,
      message: text,
    };

    this.ws.send(JSON.stringify(request));
  }

  private transformResponse(data: BackendResponse): Message {
    const rich = data.response_rich;
    const baseMessage = {
      id: generateId(),
      sender: 'bot' as const,
      timestamp: new Date(data.timestamp || Date.now()),
      status: 'read' as const,
      metadata: {
        conversationActive: data.conversation_active,
        responseRich: rich,
      },
    };

    // Transform based on response_rich type
    return this.transformRichResponse(rich, baseMessage);
  }

  private transformRichResponse(
    rich: ResponseRich,
    baseMessage: Omit<Message, 'type' | 'content'>
  ): Message {
    const content = rich.content?.text || '';

    switch (rich.type) {
      case 'text':
        return {
          ...baseMessage,
          type: 'text',
          content,
        };

      case 'menu':
      case 'buttons':
        return {
          ...baseMessage,
          type: 'options',
          content,
          options: {
            buttons: (rich.actions || []).map((action: BackendAction, index: number) => ({
              id: `btn-${index}`,
              label: action.label,
              value: action.value,
              variant: this.mapButtonStyle(action.style),
            })),
            columns: 2,
          },
          metadata: {
            ...baseMessage.metadata,
            title: rich.content?.title,
          },
        };

      case 'list':
        return {
          ...baseMessage,
          type: 'options',
          content: rich.content?.title || content,
          options: {
            buttons: (rich.items || []).map((item) => ({
              id: item.id,
              label: item.title,
              value: item.value,
              variant: 'secondary' as const,
            })),
            columns: 1,
          },
          metadata: {
            ...baseMessage.metadata,
            listItems: rich.items,
            subtitle: rich.content?.subtitle,
          },
        };

      case 'card':
        return {
          ...baseMessage,
          type: 'options',
          content: this.formatCardContent(rich),
          options: rich.actions
            ? {
                buttons: rich.actions.map((action: BackendAction, index: number) => ({
                  id: `btn-${index}`,
                  label: action.label,
                  value: action.value,
                  variant: this.mapButtonStyle(action.style),
                })),
                columns: 2,
              }
            : undefined,
        };

      case 'form':
        return {
          ...baseMessage,
          type: 'text',
          content,
          metadata: {
            ...baseMessage.metadata,
            formInput: rich.input,
          },
        };

      default:
        // Fallback to text
        return {
          ...baseMessage,
          type: 'text',
          content: content || 'Mensaje no reconocido',
        };
    }
  }

  private mapButtonStyle(style: string): 'primary' | 'secondary' | 'outline' {
    switch (style) {
      case 'primary':
        return 'primary';
      case 'danger':
        return 'primary'; // Map danger to primary for now
      case 'secondary':
      default:
        return 'secondary';
    }
  }

  private formatCardContent(rich: ResponseRich): string {
    const parts: string[] = [];
    if (rich.content?.title) {
      parts.push(`**${rich.content.title}**`);
    }
    if (rich.content?.subtitle) {
      parts.push(`_${rich.content.subtitle}_`);
    }
    if (rich.content?.text) {
      parts.push(rich.content.text);
    }
    return parts.join('\n\n');
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get reconnectionAttempts(): number {
    return this.reconnectAttempt;
  }

  getUserId(): string {
    return this.userId;
  }

  setEvents(events: WebSocketEvents): void {
    this.events = events;
  }
}

let instance: WebSocketService | null = null;

export const getWebSocketService = (
  config?: WebSocketConfig,
  events?: WebSocketEvents
): WebSocketService => {
  if (!instance && config) {
    instance = new WebSocketService(config, events);
  }
  if (!instance) {
    throw new Error('WebSocketService not initialized');
  }
  return instance;
};

export const destroyWebSocketService = (): void => {
  instance?.disconnect();
  instance = null;
};
