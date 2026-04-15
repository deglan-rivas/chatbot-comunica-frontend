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
  reconnectionAttempts?: number | null;
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
  private readonly sessionStorageKey = 'chatbot-session-id';
  private isManuallyDisconnected = false;
  private isConnecting = false;

  constructor(config: WebSocketConfig, events: WebSocketEvents = {}) {
    this.config = {
      autoReconnect: true,
      reconnectionAttempts: null,
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
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) return;
    if (this.isConnecting) return;

    this.isManuallyDisconnected = false;
    this.isConnecting = true;

    void this.openConnection();
  }

  private async openConnection(forceNewSession = false): Promise<void> {
    try {
      const wsUrl = await this.resolveWebSocketUrl(forceNewSession);
      this.ws = new WebSocket(wsUrl);
      this.setupListeners();
    } catch (error) {
      this.events.onError?.(error as Error);
      this.scheduleReconnect();
    } finally {
      this.isConnecting = false;
    }
  }

  private isDirectWebSocketUrl(url: string): boolean {
    return /^wss?:\/\//i.test(url) && /\/ws\/[^/]+$/i.test(url);
  }

  private getApiBaseUrl(): string {
    return this.config.url.replace(/\/+$/, '');
  }

  private getSessionIdFromStorage(): string | null {
    return sessionStorage.getItem(this.sessionStorageKey);
  }

  private setSessionId(sessionId: string): void {
    sessionStorage.setItem(this.sessionStorageKey, sessionId);
  }

  private clearSessionId(): void {
    sessionStorage.removeItem(this.sessionStorageKey);
  }

  private async createSession(): Promise<string> {
    const apiBase = this.getApiBaseUrl();
    const response = await fetch(`${apiBase}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`No se pudo crear la sesión (${response.status})`);
    }

    const data = (await response.json()) as { session_id?: string };
    if (!data.session_id) {
      throw new Error('Respuesta inválida al crear sesión');
    }

    this.setSessionId(data.session_id);
    return data.session_id;
  }

  private toWebSocketBase(apiBase: string): string {
    return apiBase.replace(/^http:\/\//i, 'ws://').replace(/^https:\/\//i, 'wss://');
  }

  private async resolveWebSocketUrl(forceNewSession = false): Promise<string> {
    if (this.isDirectWebSocketUrl(this.config.url)) {
      return this.config.url;
    }

    const apiBase = this.getApiBaseUrl();
    let sessionId = forceNewSession ? null : this.getSessionIdFromStorage();
    if (!sessionId) {
      sessionId = await this.createSession();
    }

    const wsBase = this.toWebSocketBase(apiBase);
    return `${wsBase}/ws/${sessionId}`;
  }

  private setupListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.events.onConnect?.();
    };

    this.ws.onclose = (event: CloseEvent) => {
      this.events.onDisconnect?.(event.reason || 'closed');
      this.ws = null;
      if (this.isManuallyDisconnected) return;

      if (event.code === 4000) {
        this.clearSessionId();
        void this.openConnection(true);
        return;
      }

      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.events.onError?.(new Error('WebSocket connection error'));
    };

    this.ws.onmessage = (event) => {
      try {
        const data: BackendResponse = JSON.parse(event.data);

        if (data.type === 'system') {
          const systemMessage: Message = {
            id: generateId(),
            type: 'text',
            sender: 'bot',
            content: data.content || 'Conectado.',
            timestamp: new Date(data.timestamp || Date.now()),
            status: 'read',
            metadata: { feedbackEnabled: false },
          };
          this.events.onMessage?.(systemMessage);
          return;
        }

        if (data.type === 'error') {
          const errorMessage: Message = {
            id: generateId(),
            type: 'text',
            sender: 'bot',
            content: data.content || 'Ha ocurrido un error.',
            timestamp: new Date(data.timestamp || Date.now()),
            status: 'read',
            metadata: {
              isError: true,
              conversationId: data.state?.conversation_id,
              feedbackEnabled: false,
            },
          };
          this.events.onMessage?.(errorMessage);
          return;
        }

        // type === 'message'
        if (!data.response_rich) {
          const fallbackMessage: Message = {
            id: generateId(),
            type: 'text',
            sender: 'bot',
            content: data.content || 'Mensaje recibido',
            timestamp: new Date(data.timestamp || Date.now()),
            status: 'read',
            metadata: {
              conversationId: data.state?.conversation_id,
              confidence_level: data.confidence_level,
              source: data.source,
              disclaimer: data.disclaimer,
              feedbackEnabled: data.feedback_enabled === true,
            },
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
    if (this.isManuallyDisconnected) return;
    if (
      !this.config.autoReconnect ||
      (this.config.reconnectionAttempts != null &&
        this.reconnectAttempt >= this.config.reconnectionAttempts)
    ) {
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const baseDelay = this.config.reconnectionDelay ?? 1000;
    const delay = Math.min(baseDelay * Math.pow(2, this.reconnectAttempt), 20000);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempt++;
      this.events.onReconnect?.(this.reconnectAttempt);
      this.connect();
    }, delay);
  }

  disconnect(): void {
    this.isManuallyDisconnected = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendMessage(text: string, opts?: { conversationId?: string; message_id?: string }): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected');
      return;
    }

    const request: BackendRequest = {
      content: text,
      conversation_id: opts?.conversationId,
      message_id: opts?.message_id,
      metadata: {},
    };

    this.ws.send(JSON.stringify(request));
  }

  private transformResponse(data: BackendResponse): Message {
    const rich = data.response_rich!;
    const baseMessage = {
      id: generateId(),
      sender: 'bot' as const,
      timestamp: new Date(data.timestamp || Date.now()),
      status: 'read' as const,
      metadata: {
        conversationId: data.state?.conversation_id,
        conversationActive: data.conversation_active,
        responseRich: rich,
        confidence_level: data.confidence_level,
        source: data.source,
        disclaimer: data.disclaimer,
        feedbackEnabled: data.feedback_enabled === true,
      },
    };

    return this.transformRichResponse(rich, baseMessage, data);
  }

  private transformRichResponse(
    rich: ResponseRich,
    baseMessage: Omit<Message, 'type' | 'content'>,
    data: BackendResponse
  ): Message {
    // Para listas: si el content raíz es más largo, usarlo como intro (evita texto truncado en response_rich.content.text)
    const rootContent = data.content?.trim() || '';
    const richText = rich.content?.text?.trim() || '';
    const content =
      rich.type === 'list' && rootContent.length > richText.length ? rootContent : richText || rootContent;

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
              action: action.action ?? undefined,
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
          content,
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
            listTitle: rich.content?.title,
            listItems: rich.items,
            listIntroText: content,
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
                  action: action.action ?? undefined,
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

  private mapButtonStyle(style?: string): 'primary' | 'secondary' | 'outline' {
    switch (style) {
      case 'primary':
        return 'primary';
      case 'danger':
        return 'primary';
      case 'secondary':
        return 'secondary';
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

  getSessionId(): string | null {
    return this.getSessionIdFromStorage();
  }

  clearStoredSessionId(): void {
    this.clearSessionId();
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
