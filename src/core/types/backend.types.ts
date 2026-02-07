/**
 * Tipos para la comunicación con el backend JNE (Chat)
 */

// Request: Frontend → Backend (WebSocket send)
export interface BackendRequest {
  content: string;
  conversation_id?: string;
  message_id?: string;
  metadata?: Record<string, unknown>;
}

// Response: Backend → Frontend (WebSocket onmessage)
export interface BackendResponse {
  type: 'system' | 'message' | 'error';
  content: string;
  timestamp?: string;
  // Solo en type === 'message'
  response_rich?: ResponseRich;
  disclaimer?: string;
  confidence_level?: 'alta' | 'media' | 'baja';
  source?: string;
  data_sources_used?: string[];
  can_escalate?: boolean;
  escalation_reason?: string | null;
  escalation_ticket?: string | null;
  state?: {
    user_id?: string;
    conversation_id?: string;
    current_flow?: string;
    current_menu?: string;
    context?: Record<string, unknown>;
    history?: unknown[];
    metadata?: Record<string, unknown>;
    reading_level?: string;
  };
  menu_actual?: string;
  conversation_active?: boolean;
  should_finalize?: boolean;
  event_id?: string | null;
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
  text?: string;
  title?: string;
  subtitle?: string;
}

export interface BackendAction {
  type: 'button' | 'link' | 'quick_reply';
  label: string;
  value: string;
  /** Ej. "menu", "open_link" – si es "open_link" o value es URL, abrir en nueva pestaña */
  action?: string | null;
  style?: 'primary' | 'secondary' | string;
}

export interface BackendListItem {
  id: string;
  title: string;
  description?: string;
  value: string;
  icon?: string;
  /** Si existe, al hacer clic abrir en nueva pestaña en vez de enviar value */
  enlace?: string;
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
