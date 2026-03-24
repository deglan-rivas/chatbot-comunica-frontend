type ChatbotWidgetGlobal = {
  init: (config: {
    projectId: string;
    endpoints: { websocket: string };
  }) => void;
  getInstance?: () => unknown;
};

type EmbedWindow = Window & {
  ChatbotWidget?: ChatbotWidgetGlobal;
  __chatbotWidgetEmbedInitialized?: boolean;
  __chatbotWidgetAssetBase?: string;
};

const RAW_API_BASE =
  import.meta.env.VITE_EMBED_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_WEBSOCKET_URL ||
  '';

function normalizeApiBase(rawUrl: string): string {
  if (!rawUrl) return '';
  const normalizedProtocol = rawUrl
    .replace(/^ws:\/\//i, 'http://')
    .replace(/^wss:\/\//i, 'https://')
    .replace(/\/+$/, '');
  return normalizedProtocol.replace(/\/ws\/[^/]+$/i, '');
}

const API_BASE_URL = normalizeApiBase(RAW_API_BASE);
const EMBED_SCRIPT = (() => {
  const current = document.currentScript;
  if (current instanceof HTMLScriptElement) return current;

  const scripts = Array.from(document.querySelectorAll('script'));
  const bySrc = scripts.find((script) => /chatbot-widget-embed(\.umd)?\.js/i.test(script.src));
  if (bySrc instanceof HTMLScriptElement) return bySrc;

  const last = scripts[scripts.length - 1];
  return last instanceof HTMLScriptElement ? last : null;
})();

function readDatasetConfig(script: HTMLScriptElement): { projectId: string } {
  return {
    projectId: script.dataset.projectId || 'embedded-chatbot',
  };
}

function getWidgetScriptUrl(currentScript: HTMLScriptElement): string {
  const scriptUrl = new URL(currentScript.src, window.location.href);
  const directOverride = currentScript.dataset.widgetSrc;
  if (directOverride) return new URL(directOverride, scriptUrl).toString();
  return new URL('./chatbot-widget.umd.js', scriptUrl).toString();
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existingScript) {
      // Si el script ya estaba en la pagina pero el global no quedó listo, forzar recarga limpia.
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(script);
  });
}

function resolveWidgetApi(chatbotGlobal: unknown): ChatbotWidgetGlobal | null {
  if (!chatbotGlobal) return null;
  const globalType = typeof chatbotGlobal;
  if (globalType !== 'object' && globalType !== 'function') return null;

  const direct = chatbotGlobal as Partial<ChatbotWidgetGlobal>;
  if (typeof direct.init === 'function') {
    return direct as ChatbotWidgetGlobal;
  }

  const fromNamed = (chatbotGlobal as { ChatbotWidget?: Partial<ChatbotWidgetGlobal> }).ChatbotWidget;
  if (fromNamed && typeof fromNamed.init === 'function') {
    return fromNamed as ChatbotWidgetGlobal;
  }

  const fromDefault = (chatbotGlobal as { default?: Partial<ChatbotWidgetGlobal> }).default;
  if (fromDefault && typeof fromDefault.init === 'function') {
    return fromDefault as ChatbotWidgetGlobal;
  }

  return null;
}

async function bootstrap(): Promise<void> {
  const embedWindow = window as EmbedWindow;
  if (embedWindow.__chatbotWidgetEmbedInitialized) return;
  embedWindow.__chatbotWidgetEmbedInitialized = true;

  const currentScript = EMBED_SCRIPT;
  if (!currentScript) {
    throw new Error('No se pudo resolver el script embebido actual.');
  }

  if (!API_BASE_URL) {
    throw new Error(
      'No se encontró API base para el embed. Define VITE_EMBED_API_BASE_URL o VITE_API_BASE_URL.'
    );
  }

  const { projectId } = readDatasetConfig(currentScript);
  const widgetScriptUrl = getWidgetScriptUrl(currentScript);
  embedWindow.__chatbotWidgetAssetBase = new URL('./', widgetScriptUrl).toString();

  let widgetApi = resolveWidgetApi(embedWindow.ChatbotWidget);
  if (!widgetApi) {
    await loadScript(widgetScriptUrl);
  }

  widgetApi = resolveWidgetApi(embedWindow.ChatbotWidget);
  if (!widgetApi) {
    throw new Error('ChatbotWidget no está disponible después de cargar el script principal.');
  }

  if (!widgetApi.getInstance?.()) {
    widgetApi.init({
      projectId,
      endpoints: { websocket: API_BASE_URL },
    });
  }
}

function onReady(): void {
  void bootstrap().catch((error) => {
    console.error('[ChatbotWidgetEmbed] Error al inicializar:', error);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onReady, { once: true });
} else {
  onReady();
}

