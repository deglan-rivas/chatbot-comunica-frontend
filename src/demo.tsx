import { ChatbotWidget } from './index';
import { useChatStore } from './core/store/chat.store';
import { generateId } from './core/utils/formatters';

const statusEl = document.getElementById('status');

function setStatus(type: string, message: string) {
  if (statusEl) {
    statusEl.className = 'status ' + type;
    statusEl.textContent = message;
  }
}

// Get WebSocket URL from environment variable
const websocketUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://192.168.27.228:8001/api/web/chat/ws';

// Initialize widget
try {
  // Clear previous messages to avoid duplicates on hot reload
  useChatStore.getState().clearMessages();

  ChatbotWidget.init({
    projectId: 'demo',
    endpoints: {
      websocket: websocketUrl,
    },
    bot: {
      name: 'Asistente JNE',
      welcomeMessage: 'Bienvenido al Jurado Nacional de Elecciones. En que puedo ayudarte?',
    },
    position: 'bottom-right',
    autoOpen: false,
    onReady: () => {
      console.log('Chatbot Widget ready!');
      console.log('WebSocket URL:', websocketUrl);
      setStatus('success', 'Widget cargado. Haz clic en el boton azul de la esquina inferior derecha.');

      // Add initial system message
      setTimeout(() => {
        useChatStore.getState().addMessage({
          id: generateId(),
          type: 'system',
          sender: 'system',
          content: 'Hoy',
          timestamp: new Date(),
          status: 'read',
        });
      }, 300);
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
