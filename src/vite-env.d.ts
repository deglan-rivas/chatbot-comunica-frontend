/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WEBSOCKET_URL: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_EMBED_API_BASE_URL?: string;
  readonly VITE_APP_ENV?: string;
  readonly VITE_CHAT_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  env?: {
    VITE_WEBSOCKET_URL?: string;
    VITE_EMBED_API_BASE_URL?: string;
    VITE_APP_ENV?: string;
    VITE_CHAT_NAME?: string;
  };
}
