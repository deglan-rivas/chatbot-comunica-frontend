import { create } from 'zustand';
import type { WidgetConfig, Theme, BotConfig, Endpoints, Features } from '@/config/schema';

export interface ConfigState {
  projectId: string;
  theme: Theme;
  position: 'bottom-right' | 'bottom-left';
  zIndex: number;
  bot: BotConfig;
  endpoints: Endpoints;
  features: Features;
  autoOpen: boolean;
  autoOpenDelay: number;
  persistSession: boolean;
  showBranding: boolean;
  initialized: boolean;
}

export interface ConfigActions {
  initialize: (config: WidgetConfig) => void;
  setTheme: (theme: Partial<Theme>) => void;
  setThemeMode: (mode: 'light' | 'dark' | 'auto') => void;
  reset: () => void;
}

export type ConfigStore = ConfigState & ConfigActions;

const defaultTheme: Theme = {
  name: 'whatsapp',
  mode: 'auto',
  borderRadius: '12px',
  fontFamily: 'Inter, sans-serif',
};

const defaultBot: BotConfig = {
  name: 'Asistente',
  typingDelay: 1000,
};

const defaultFeatures: Features = {
  voice: false,
  emoji: true,
  darkMode: true,
};

const initialState: ConfigState = {
  projectId: '',
  theme: defaultTheme,
  position: 'bottom-right',
  zIndex: 9999,
  bot: defaultBot,
  endpoints: { websocket: '' },
  features: defaultFeatures,
  autoOpen: false,
  autoOpenDelay: 3000,
  persistSession: true,
  showBranding: true,
  initialized: false,
};

export const useConfigStore = create<ConfigStore>((set) => ({
  ...initialState,

  initialize: (config) => {
    set({
      projectId: config.projectId,
      theme: { ...defaultTheme, ...config.theme },
      position: config.position ?? 'bottom-right',
      zIndex: config.zIndex ?? 9999,
      bot: { ...defaultBot, ...config.bot },
      endpoints: config.endpoints,
      features: { ...defaultFeatures, ...config.features },
      autoOpen: config.autoOpen ?? false,
      autoOpenDelay: config.autoOpenDelay ?? 3000,
      persistSession: config.persistSession ?? true,
      showBranding: config.showBranding ?? true,
      initialized: true,
    });
  },

  setTheme: (theme) => {
    set((state) => ({
      theme: { ...state.theme, ...theme },
    }));
  },

  setThemeMode: (mode) => {
    set((state) => ({
      theme: { ...state.theme, mode },
    }));
  },

  reset: () => set(initialState),
}));
