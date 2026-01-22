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

// Initialize widget
try {
  // Clear previous messages to avoid duplicates on hot reload
  useChatStore.getState().clearMessages();

  ChatbotWidget.init({
    projectId: 'demo',
    endpoints: {
      websocket: 'wss://echo.websocket.org',
    },
    bot: {
      name: 'Soporte Cobranzas',
      welcomeMessage: 'Buenos dias. Soy Cobranzas, tu asistente virtual...',
    },
    position: 'bottom-right',
    autoOpen: false,
    onReady: () => {
      console.log('Chatbot Widget ready!');
      setStatus('success', 'Widget cargado. Haz clic en el boton azul de la esquina inferior derecha.');

      // Add demo messages with unique IDs
      setTimeout(() => {
        useChatStore.getState().addMessage({
          id: generateId(),
          type: 'system',
          sender: 'system',
          content: 'Hoy',
          timestamp: new Date(),
          status: 'read',
        });

        useChatStore.getState().addMessage({
          id: generateId(),
          type: 'text',
          sender: 'bot',
          content: 'Buenos dias. Soy Cobranzas, tu asistente virtual...',
          timestamp: new Date(),
          status: 'read',
        });

        useChatStore.getState().addMessage({
          id: generateId(),
          type: 'options',
          sender: 'bot',
          content: '**Escriba** o **seleccione** una de las siguientes opciones:',
          timestamp: new Date(),
          status: 'read',
          options: {
            buttons: [
              { id: 'opt1', label: 'Opcion 1', value: 1 },
              { id: 'opt2', label: 'Opcion 2', value: 2 },
              { id: 'opt3', label: 'Opcion 3', value: 3 },
              { id: 'opt4', label: 'Opcion 4', value: 4 },
            ],
            columns: 2,
          },
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
