import { ChatbotWidget } from './index';
import { useChatStore } from './core/store/chat.store';

const statusEl = document.getElementById('status');

function setStatus(type: string, message: string) {
  if (statusEl) {
    statusEl.className = 'status ' + type;
    statusEl.textContent = message;
  }
}

// URL base del WebSocket (solo protocolo + host + puerto). El path /ws/{user_id} se construye aquí.
// Lee de window.env (inyectado en runtime por entrypoint.prd.sh) con fallback a import.meta.env (build time).
function getWebSocketBase(): string {
  const base =
    window.env?.VITE_WEBSOCKET_URL ||
    import.meta.env.VITE_WEBSOCKET_URL ||
    'ws://localhost:5010/api/v1';
  const appEnv =
    window.env?.VITE_APP_ENV ||
    import.meta.env.VITE_APP_ENV ||
    'DEV';

  if (appEnv === 'DEV' && window.location.protocol === 'https:') {
    return `wss://${window.location.host}`;
  }
  return base.replace(/\/$/, '');
}

function getWebSocketUrl(): string {
  const base = getWebSocketBase();
  const userId = useChatStore.getState().userId;
  return `${base}/ws/${userId}`;
}

function getChatName(): string {
  return window.env?.VITE_CHAT_NAME || import.meta.env.VITE_CHAT_NAME || 'Asistente';
}

const websocketUrl = getWebSocketUrl();
const chatName = getChatName();

// Initialize widget
try {
  ChatbotWidget.init({
    projectId: 'demo',
    endpoints: {
      websocket: websocketUrl,
    },
    bot: {
      name: chatName,
      welcomeMessage: 'Bienvenido al Jurado Nacional de Elecciones. En que puedo ayudarte?',
    },
    position: 'bottom-right',
    autoOpen: false,
    onReady: () => {
      console.log('Chatbot Widget ready!');
      console.log('WebSocket URL:', websocketUrl);
      setStatus('success', 'Widget cargado. Haz clic en el botón de la esquina inferior derecha.');
      // El mensaje de bienvenida y menú lo envía el backend por WebSocket (type: system o message).
    },
    onError: (error: Error) => {
      console.error('Chatbot Widget error:', error);
      setStatus('error', 'Error: ' + error.message);
    },
  });

  // Button handlers
  document.getElementById('btn-open')?.addEventListener('click', () => {
    ChatbotWidget.getInstance()?.open();
  });

  document.getElementById('btn-close')?.addEventListener('click', () => {
    ChatbotWidget.getInstance()?.close();
  });

  document.getElementById('btn-toggle')?.addEventListener('click', () => {
    ChatbotWidget.getInstance()?.toggle();
  });

  let isDark = false;
  document.getElementById('btn-theme')?.addEventListener('click', () => {
    isDark = !isDark;
    ChatbotWidget.getInstance()?.setThemeMode(isDark ? 'dark' : 'light');
  });

} catch (error) {
  console.error('Failed to initialize widget:', error);
  setStatus('error', 'Error al cargar: ' + (error as Error).message);
}
