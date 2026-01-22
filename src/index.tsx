import { createRoot, type Root } from 'react-dom/client';
import { Widget } from '@ui/components/Widget/Widget';
import { WidgetConfigSchema, type WidgetConfig, type WidgetConfigInput } from '@/config/schema';
import { useConfigStore } from '@core/store/config.store';
import { useChatStore } from '@core/store/chat.store';
import { useUIStore } from '@core/store/ui.store';
import {
  WebSocketService,
  destroyWebSocketService,
} from '@core/services/websocket.service';
import {
  PluginManager,
  destroyPluginManager,
} from '@core/plugins/plugin-manager';
import './styles/global.css';

declare global {
  interface Window {
    ChatbotWidget: typeof ChatbotWidget;
  }
}

class ChatbotWidget {
  private static instance: ChatbotWidget | null = null;
  private root: Root | null = null;
  private container: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private websocketService: WebSocketService | null = null;
  private pluginManager: PluginManager | null = null;
  private config: WidgetConfig | null = null;

  static init(userConfig: WidgetConfigInput): ChatbotWidget {
    if (ChatbotWidget.instance) {
      console.warn('ChatbotWidget already initialized. Call destroy() first.');
      return ChatbotWidget.instance;
    }

    const parseResult = WidgetConfigSchema.safeParse(userConfig);
    if (!parseResult.success) {
      console.error('Invalid ChatbotWidget config:', parseResult.error);
      throw new Error('Invalid configuration');
    }

    const config = parseResult.data;
    const widget = new ChatbotWidget();
    widget.mount(config);

    ChatbotWidget.instance = widget;
    return widget;
  }

  static destroy(): void {
    if (ChatbotWidget.instance) {
      ChatbotWidget.instance.unmount();
      ChatbotWidget.instance = null;
    }
  }

  static getInstance(): ChatbotWidget | null {
    return ChatbotWidget.instance;
  }

  private mount(config: WidgetConfig): void {
    this.config = config;

    // Initialize config store
    useConfigStore.getState().initialize(config);

    // Create container
    this.container = document.createElement('div');
    this.container.id = 'chatbot-widget-container';
    this.container.style.cssText = `
      position: fixed;
      z-index: ${config.zIndex};
      ${config.position === 'bottom-right' ? 'right: 0; bottom: 0;' : 'left: 0; bottom: 0;'}
      pointer-events: none;
    `;

    // Create Shadow DOM for style isolation
    this.shadowRoot = this.container.attachShadow({ mode: 'open' });

    // Inject styles
    const styleEl = document.createElement('style');
    styleEl.textContent = this.getStyles(config);
    this.shadowRoot.appendChild(styleEl);

    // Load Material Icons
    const iconLink = document.createElement('link');
    iconLink.rel = 'stylesheet';
    iconLink.href =
      'https://fonts.googleapis.com/icon?family=Material+Icons+Round';
    this.shadowRoot.appendChild(iconLink);

    // Load Inter font
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href =
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    this.shadowRoot.appendChild(fontLink);

    // React container
    const reactContainer = document.createElement('div');
    reactContainer.id = 'chatbot-react-root';
    reactContainer.className = 'chatbot-widget';
    reactContainer.style.pointerEvents = 'auto';

    // Apply theme mode
    if (config.theme?.mode === 'dark') {
      reactContainer.classList.add('dark');
    } else if (config.theme?.mode === 'auto') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        reactContainer.classList.add('dark');
      }
    }

    this.shadowRoot.appendChild(reactContainer);
    document.body.appendChild(this.container);

    // Initialize WebSocket service
    this.websocketService = new WebSocketService(
      {
        url: config.endpoints.websocket,
        userId: useChatStore.getState().userId,
      },
      {
        onConnect: () => useChatStore.getState().setConnectionStatus('connected'),
        onDisconnect: () =>
          useChatStore.getState().setConnectionStatus('disconnected'),
        onError: () => useChatStore.getState().setConnectionStatus('error'),
        onMessage: (message) => {
          useChatStore.getState().setTyping(false);
          useChatStore.getState().addMessage(message);
          if (!useUIStore.getState().isOpen) {
            useUIStore.getState().setHasUnread(true);
          }
        },
        onTyping: (isTyping) => useChatStore.getState().setTyping(isTyping),
      }
    );

    // Initialize Plugin Manager (WebSocket emit/on not supported with native WebSocket)
    this.pluginManager = new PluginManager({
      store: {
        chat: useChatStore.getState(),
        config: useConfigStore.getState(),
        ui: useUIStore.getState(),
      },
      emit: () => {}, // Not supported with native WebSocket
      on: () => () => {}, // Not supported with native WebSocket
    });

    // Mount React
    this.root = createRoot(reactContainer);
    this.root.render(<Widget websocketService={this.websocketService} />);

    // Callback
    config.onReady?.();
  }

  private unmount(): void {
    // Disconnect WebSocket
    destroyWebSocketService();
    this.websocketService = null;

    // Destroy plugins
    destroyPluginManager();
    this.pluginManager = null;

    // Unmount React
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }

    // Remove container
    if (this.container) {
      this.container.remove();
      this.container = null;
    }

    // Reset stores
    useConfigStore.getState().reset();
    useChatStore.getState().reset();
    useUIStore.getState().reset();

    this.shadowRoot = null;
    this.config = null;
  }

  private getStyles(config: WidgetConfig): string {
    const colors = config.theme?.colors ?? {};

    return `
      :host {
        --chatbot-primary: ${colors.primary ?? '#0056b3'};
        --chatbot-bg-light: #F3F4F6;
        --chatbot-bg-dark: #111827;
        --chatbot-chat-bg-light: ${colors.background ?? '#E5DDD5'};
        --chatbot-chat-bg-dark: #0B141A;
        --chatbot-bot-bubble-light: ${colors.botBubble ?? '#FFFFFF'};
        --chatbot-bot-bubble-dark: #202C33;
        --chatbot-user-bubble-light: ${colors.userBubble ?? '#D9FDD3'};
        --chatbot-user-bubble-dark: #005C4B;
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      .chatbot-widget {
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        -webkit-font-smoothing: antialiased;
      }

      /* Tailwind Reset */
      button, input {
        font-family: inherit;
        font-size: 100%;
        line-height: inherit;
        color: inherit;
        margin: 0;
        padding: 0;
      }

      button {
        background-color: transparent;
        background-image: none;
        cursor: pointer;
        border: none;
      }

      /* Colors */
      .bg-primary { background-color: var(--chatbot-primary); }
      .text-primary { color: var(--chatbot-primary); }
      .border-primary { border-color: var(--chatbot-primary); }
      .bg-primary\\/10 { background-color: color-mix(in srgb, var(--chatbot-primary) 10%, transparent); }
      .bg-primary\\/20 { background-color: color-mix(in srgb, var(--chatbot-primary) 20%, transparent); }
      .bg-primary\\/50 { background-color: color-mix(in srgb, var(--chatbot-primary) 50%, transparent); }
      .border-primary\\/20 { border-color: color-mix(in srgb, var(--chatbot-primary) 20%, transparent); }
      .hover\\:bg-primary:hover { background-color: var(--chatbot-primary); }
      .hover\\:bg-primary\\/20:hover { background-color: color-mix(in srgb, var(--chatbot-primary) 20%, transparent); }
      .hover\\:bg-primary\\/90:hover { background-color: color-mix(in srgb, var(--chatbot-primary) 90%, black); }

      .bg-chat-bg-light { background-color: var(--chatbot-chat-bg-light); }
      .bg-bot-bubble-light { background-color: var(--chatbot-bot-bubble-light); }
      .bg-user-bubble-light { background-color: var(--chatbot-user-bubble-light); }

      .dark .bg-chat-bg-dark { background-color: var(--chatbot-chat-bg-dark); }
      .dark .bg-bot-bubble-dark { background-color: var(--chatbot-bot-bubble-dark); }
      .dark .bg-user-bubble-dark { background-color: var(--chatbot-user-bubble-dark); }

      /* Layout */
      .fixed { position: fixed; }
      .absolute { position: absolute; }
      .relative { position: relative; }
      .z-40 { z-index: 40; }
      .z-50 { z-index: 50; }

      .flex { display: flex; }
      .grid { display: grid; }
      .hidden { display: none; }

      .flex-col { flex-direction: column; }
      .flex-1 { flex: 1 1 0%; }
      .items-center { align-items: center; }
      .items-end { align-items: flex-end; }
      .justify-center { justify-content: center; }
      .justify-end { justify-content: flex-end; }
      .justify-between { justify-content: space-between; }

      .gap-1 { gap: 0.25rem; }
      .gap-2 { gap: 0.5rem; }
      .gap-3 { gap: 0.75rem; }

      .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
      .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }

      /* Spacing */
      .p-1 { padding: 0.25rem; }
      .p-3 { padding: 0.75rem; }
      .p-4 { padding: 1rem; }
      .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
      .px-4 { padding-left: 1rem; padding-right: 1rem; }
      .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
      .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
      .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
      .pt-3 { padding-top: 0.75rem; }
      .pb-4 { padding-bottom: 1rem; }
      .mt-1 { margin-top: 0.25rem; }
      .mt-2 { margin-top: 0.5rem; }
      .mt-3 { margin-top: 0.75rem; }
      .mb-1 { margin-top: 0.25rem; }
      .ml-auto { margin-left: auto; }

      /* Sizing */
      .w-2 { width: 0.5rem; }
      .w-3 { width: 0.75rem; }
      .w-5 { width: 1.25rem; }
      .w-6 { width: 1.5rem; }
      .w-8 { width: 2rem; }
      .w-10 { width: 2.5rem; }
      .w-14 { width: 3.5rem; }
      .w-full { width: 100%; }
      .h-2 { height: 0.5rem; }
      .h-3 { height: 0.75rem; }
      .h-4 { height: 1rem; }
      .h-5 { height: 1.25rem; }
      .h-6 { height: 1.5rem; }
      .h-8 { height: 2rem; }
      .h-10 { height: 2.5rem; }
      .h-14 { height: 3.5rem; }
      .h-auto { height: auto; }
      .min-w-0 { min-width: 0; }
      .max-w-\\[250px\\] { max-width: 250px; }
      .max-w-\\[400px\\] { max-width: 400px; }
      .max-w-\\[85\\%\\] { max-width: 85%; }
      .h-\\[600px\\] { height: 600px; }
      .max-h-\\[80vh\\] { max-height: 80vh; }
      .aspect-video { aspect-ratio: 16 / 9; }

      /* Position */
      .inset-0 { inset: 0; }
      .right-4 { right: 1rem; }
      .left-4 { left: 1rem; }
      .bottom-4 { bottom: 1rem; }
      .bottom-0 { bottom: 0; }
      .bottom-20 { bottom: 5rem; }
      .-top-1 { top: -0.25rem; }
      .-right-1 { right: -0.25rem; }

      /* Typography */
      .text-\\[10px\\] { font-size: 10px; }
      .text-\\[11px\\] { font-size: 11px; }
      .text-\\[14px\\] { font-size: 14px; }
      .text-xs { font-size: 0.75rem; line-height: 1rem; }
      .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
      .text-2xl { font-size: 1.5rem; line-height: 2rem; }
      .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
      .font-medium { font-weight: 500; }
      .font-semibold { font-weight: 600; }
      .font-bold { font-weight: 700; }
      .uppercase { text-transform: uppercase; }
      .tracking-wider { letter-spacing: 0.05em; }
      .leading-tight { line-height: 1.25; }
      .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .underline { text-decoration: underline; }
      .text-right { text-align: right; }

      /* Colors */
      .text-white { color: white; }
      .text-black { color: black; }
      .text-gray-400 { color: #9CA3AF; }
      .text-gray-500 { color: #6B7280; }
      .text-gray-600 { color: #4B5563; }
      .text-gray-800 { color: #1F2937; }
      .text-gray-900 { color: #111827; }
      .text-green-500 { color: #22C55E; }
      .text-green-600 { color: #16A34A; }
      .text-blue-500 { color: #3B82F6; }
      .text-red-500 { color: #EF4444; }

      .dark .text-gray-100 { color: #F3F4F6; }
      .dark .text-gray-300 { color: #D1D5DB; }
      .dark .text-gray-400 { color: #9CA3AF; }
      .dark .text-gray-500 { color: #6B7280; }
      .dark .text-white { color: white; }
      .dark .text-green-400 { color: #4ADE80; }
      .dark .text-blue-300 { color: #93C5FD; }

      .bg-white { background-color: white; }
      .bg-black { background-color: black; }
      .bg-gray-100 { background-color: #F3F4F6; }
      .bg-gray-200 { background-color: #E5E7EB; }
      .bg-gray-300 { background-color: #D1D5DB; }
      .bg-green-500 { background-color: #22C55E; }
      .bg-red-500 { background-color: #EF4444; }
      .bg-white\\/50 { background-color: rgba(255, 255, 255, 0.5); }

      .dark .bg-gray-700 { background-color: #374151; }
      .dark .bg-gray-800 { background-color: #1F2937; }
      .dark .bg-gray-900 { background-color: #111827; }
      .dark .bg-gray-800\\/50 { background-color: rgba(31, 41, 55, 0.5); }

      .hover\\:bg-gray-100:hover { background-color: #F3F4F6; }
      .dark .hover\\:bg-gray-800:hover { background-color: #1F2937; }

      /* Borders */
      .border { border-width: 1px; }
      .border-2 { border-width: 2px; }
      .border-t { border-top-width: 1px; }
      .border-b { border-bottom-width: 1px; }
      .border-gray-200 { border-color: #E5E7EB; }
      .border-white { border-color: white; }
      .dark .border-gray-700 { border-color: #374151; }
      .dark .border-gray-800 { border-color: #1F2937; }
      .dark .border-gray-900 { border-color: #111827; }

      /* Border Radius */
      .rounded-full { border-radius: 9999px; }
      .rounded-lg { border-radius: 0.5rem; }
      .rounded-2xl { border-radius: 1rem; }
      .rounded-bl-none { border-bottom-left-radius: 0; }
      .rounded-br-none { border-bottom-right-radius: 0; }

      /* Effects */
      .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
      .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
      .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
      .shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
      .opacity-0 { opacity: 0; }
      .opacity-50 { opacity: 0.5; }
      .opacity-100 { opacity: 1; }

      .hover\\:opacity-70:hover { opacity: 0.7; }
      .hover\\:scale-110:hover { transform: scale(1.1); }
      .active\\:scale-95:active { transform: scale(0.95); }

      /* Overflow */
      .overflow-hidden { overflow: hidden; }
      .overflow-y-auto { overflow-y: auto; }

      /* Transitions */
      .transition-all { transition-property: all; transition-timing-function: ease; transition-duration: 150ms; }
      .transition-colors { transition-property: color, background-color, border-color; transition-timing-function: ease; transition-duration: 150ms; }
      .transition-opacity { transition-property: opacity; transition-timing-function: ease; transition-duration: 150ms; }
      .duration-200 { transition-duration: 200ms; }
      .duration-300 { transition-duration: 300ms; }
      .ease-in-out { transition-timing-function: ease-in-out; }

      /* Animations */
      @keyframes slideUp {
        0% { transform: translateY(20px); opacity: 0; }
        100% { transform: translateY(0); opacity: 1; }
      }
      @keyframes fadeIn {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
      @keyframes bounceIn {
        0% { transform: scale(0.9); opacity: 0; }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes bounce {
        0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
        50% { transform: translateY(0); animation-timing-function: cubic-bezier(0,0,0.2,1); }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      .animate-slide-up { animation: slideUp 0.3s ease-out; }
      .animate-fade-in { animation: fadeIn 0.2s ease-out; }
      .animate-bounce-in { animation: bounceIn 0.3s ease-out; }
      .animate-bounce { animation: bounce 1s infinite; }
      .animate-spin { animation: spin 1s linear infinite; }
      .animate-pulse { animation: pulse 2s ease-in-out infinite; }

      /* States */
      .cursor-pointer { cursor: pointer; }
      .disabled\\:opacity-50:disabled { opacity: 0.5; }
      .disabled\\:cursor-not-allowed:disabled { cursor: not-allowed; }
      .disabled\\:cursor-default:disabled { cursor: default; }

      /* Forms */
      input:focus { outline: none; }
      .focus\\:ring-0:focus { box-shadow: none; }
      .outline-none { outline: none; }
      .border-none { border: none; }

      /* Object */
      .object-cover { object-fit: cover; }
      .object-contain { object-fit: contain; }

      /* Rotate */
      .rotate-90 { transform: rotate(90deg); }

      /* Pointer Events */
      .pointer-events-none { pointer-events: none; }
      .pointer-events-auto { pointer-events: auto; }
    `;
  }

  // Public API
  open(): void {
    useUIStore.getState().setIsOpen(true);
  }

  close(): void {
    useUIStore.getState().setIsOpen(false);
  }

  toggle(): void {
    useUIStore.getState().toggleOpen();
  }

  sendMessage(text: string): void {
    // TODO: Implement programmatic message sending
    console.log('sendMessage:', text);
  }

  setThemeMode(mode: 'light' | 'dark'): void {
    useConfigStore.getState().setThemeMode(mode);
    const root = this.shadowRoot?.getElementById('chatbot-react-root');
    if (root) {
      root.classList.toggle('dark', mode === 'dark');
    }
  }

  getConfig(): WidgetConfig | null {
    return this.config;
  }

  getPluginManager(): PluginManager | null {
    return this.pluginManager;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.ChatbotWidget = ChatbotWidget;
}

export default ChatbotWidget;
export { ChatbotWidget };
export type { WidgetConfig };
