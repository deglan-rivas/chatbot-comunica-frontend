/**
 * Tipos para la comunicación con el backend JNE
 */

// Request: Frontend → Backend
export interface BackendRequest {
  user_id: string;
  message: string;
}

// Response: Backend → Frontend
export interface BackendResponse {
  type: string;
  content: string;
  response_rich: ResponseRich;
  conversation_active: boolean;
  timestamp: string;
}

// Estructura de response_rich
export interface ResponseRich {
  type: ResponseRichType;
  content: ResponseRichContent;
  actions?: BackendAction[];
  items?: BackendListItem[];
  input?: BackendFormInput;
  metadata?: ResponseRichMetadata;
}

export type ResponseRichType = 'text' | 'menu' | 'buttons' | 'list' | 'card' | 'form';

export interface ResponseRichContent {
  text: string;
  title?: string;
  subtitle?: string;
}

export interface BackendAction {
  type: 'button';
  label: string;
  value: string;
  style: 'primary' | 'secondary' | 'danger';
}

export interface BackendListItem {
  id: string;
  title: string;
  description?: string;
  value: string;
  icon?: string;
}

export interface BackendFormInput {
  type: 'text' | 'email' | 'number' | 'tel';
  placeholder?: string;
  label?: string;
  required?: boolean;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

export interface ResponseRichMetadata {
  show_typing?: boolean;
  delay?: number;
}
