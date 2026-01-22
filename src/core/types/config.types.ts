import type { z } from 'zod';
import type { WidgetConfigSchema } from '@/config/schema';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeColors {
  primary?: string;
  botBubble?: string;
  userBubble?: string;
  background?: string;
  text?: string;
}

export interface Theme {
  name: string;
  mode: ThemeMode;
  colors?: ThemeColors;
  borderRadius?: string;
  fontFamily?: string;
}

export interface BotConfig {
  name: string;
  avatar?: string;
  welcomeMessage?: string;
  typingDelay?: number;
}

export interface Endpoints {
  websocket: string;
  api?: string;
  mediaUpload?: string;
}

export interface Features {
  attachments?: boolean;
  voice?: boolean;
  emoji?: boolean;
  darkMode?: boolean;
}

export type WidgetPosition = 'bottom-right' | 'bottom-left';

export type WidgetConfig = z.infer<typeof WidgetConfigSchema>;

export interface PluginConfig {
  name: string;
  options?: Record<string, unknown>;
}
