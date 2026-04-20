export type MessageType =
  | 'text'
  | 'options'
  | 'rating'
  | 'system';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'error';
export type MessageSender = 'user' | 'bot' | 'system';

export interface MessageButton {
  id: string;
  label: string;
  value: string | number;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  /** Ej: "open_link" | "menu" – si es "open_link" o value es URL, abrir enlace en vez de enviar mensaje */
  action?: string | null;
}

export interface MessageOptions {
  buttons: MessageButton[];
  columns?: 1 | 2 | 3;
  allowMultiple?: boolean;
}

export interface MessageRating {
  min: number;
  max: number;
  selectedValue?: number;
}

export interface Message {
  id: string;
  type: MessageType;
  sender: MessageSender;
  content: string;
  timestamp: Date;
  status: MessageStatus;
  options?: MessageOptions;
  rating?: MessageRating;
  metadata?: Record<string, unknown>;
  replyTo?: string;
}

export interface TypingIndicator {
  isTyping: boolean;
  sender: MessageSender;
}
