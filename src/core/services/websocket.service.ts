import { io, type Socket } from 'socket.io-client';
import type { Message } from '@core/types/message.types';

export type WebSocketEventHandler<T = unknown> = (data: T) => void;

export interface WebSocketConfig {
  url: string;
  sessionToken?: string | null;
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
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private events: WebSocketEvents;
  private reconnectAttempt = 0;

  constructor(config: WebSocketConfig, events: WebSocketEvents = {}) {
    this.config = {
      autoReconnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      ...config,
    };
    this.events = events;
  }

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(this.config.url, {
      transports: ['websocket', 'polling'],
      auth: {
        sessionToken: this.config.sessionToken,
      },
      reconnection: this.config.autoReconnect,
      reconnectionAttempts: this.config.reconnectionAttempts,
      reconnectionDelay: this.config.reconnectionDelay,
    });

    this.setupListeners();
  }

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.reconnectAttempt = 0;
      this.events.onConnect?.();
    });

    this.socket.on('disconnect', (reason) => {
      this.events.onDisconnect?.(reason);
    });

    this.socket.on('connect_error', (error) => {
      this.events.onError?.(error);
    });

    this.socket.on('message', (message: Message) => {
      this.events.onMessage?.(message);
    });

    this.socket.on('typing', (isTyping: boolean) => {
      this.events.onTyping?.(isTyping);
    });

    this.socket.io.on('reconnect_attempt', (attempt) => {
      this.reconnectAttempt = attempt;
      this.events.onReconnect?.(attempt);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(message: Partial<Message>): void {
    this.socket?.emit('message', message);
  }

  sendTyping(isTyping: boolean): void {
    this.socket?.emit('typing', isTyping);
  }

  emit(event: string, data: unknown): void {
    this.socket?.emit(event, data);
  }

  on<T>(event: string, handler: WebSocketEventHandler<T>): () => void {
    this.socket?.on(event, handler);
    return () => {
      this.socket?.off(event, handler);
    };
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  get reconnectionAttempts(): number {
    return this.reconnectAttempt;
  }

  updateSessionToken(token: string): void {
    this.config.sessionToken = token;
    if (this.socket) {
      this.socket.auth = { sessionToken: token };
    }
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
