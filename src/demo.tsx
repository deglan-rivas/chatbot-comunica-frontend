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

// Get WebSocket URL - use proxy when on HTTPS in DEV to avoid mixed content
function getWebSocketUrl(): string {
  const envUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://192.168.27.228:8001/api/web/chat/ws';
  const appEnv = import.meta.env.VITE_APP_ENV || 'DEV';

  // Use proxy only in DEV environment when on HTTPS (to avoid mixed content)
  // In PRD, the backend should have its own SSL configured
  if (appEnv === 'DEV' && window.location.protocol === 'https:') {
    const wsProtocol = 'wss:';
    return `${wsProtocol}//${window.location.host}/api/web/chat/ws`;
  }

  // In PRD or HTTP local development, use the direct URL from env
  return envUrl;
}

const websocketUrl = getWebSocketUrl();

// Initialize widget
try {
  ChatbotWidget.init({
    projectId: 'demo',
    endpoints: {
      websocket: websocketUrl,
    },
    bot: {
      name: 'Eleccia Comunicaciones',
      welcomeMessage: 'Bienvenido al Jurado Nacional de Elecciones. En que puedo ayudarte?',
    },
    position: 'bottom-right',
    autoOpen: false,
    onReady: () => {
      console.log('Chatbot Widget ready!');
      console.log('WebSocket URL:', websocketUrl);
      setStatus('success', 'Widget cargado. Haz clic en el boton azul de la esquina inferior derecha.');

      // Add initial messages only if there are no previous messages
      const currentMessages = useChatStore.getState().messages;
      if (currentMessages.length === 0) {
        setTimeout(() => {
          const store = useChatStore.getState();

          // 1. Add "Hoy" system message
          store.addMessage({
            id: generateId(),
            type: 'system',
            sender: 'system',
            content: 'Hoy',
            timestamp: new Date(),
            status: 'read',
          });

          // 2. Add welcome message from bot
          store.addMessage({
            id: generateId(),
            type: 'options',
            sender: 'bot',
            content: '🤖 **¡Hola! Soy ELECCIA, tu asistente virtual del JNE**\n\n👋 **Bienvenido/a al Jurado Nacional de Elecciones** ¿En qué puedo ayudarte hoy?\n\n💡 **Comandos útiles:**\n• Escribe **\'menu\'** para volver al menú principal en cualquier momento\n• Escribe **\'adios\'** para cerrar la conversación y finalizar',
            timestamp: new Date(),
            status: 'read',
            options: {
              buttons: [
                { id: 'btn-1', label: '1. Procesos Electorales', value: '1', variant: 'primary' },
                { id: 'btn-2', label: '2. Organizaciones Políticas', value: '2', variant: 'primary' },
                { id: 'btn-3', label: '3. Información Institucional', value: '3', variant: 'primary' },
                { id: 'btn-4', label: '4. Servicios Digitales', value: '4', variant: 'primary' },
              ],
              columns: 1,
            },
            metadata: {
              title: 'Menú principal:',
            },
          });
        }, 300);
      }
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
