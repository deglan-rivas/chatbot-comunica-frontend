import { z } from 'zod';

export const ThemeSchema = z.object({
  name: z.string().optional().default('whatsapp'),
  mode: z.enum(['light', 'dark', 'auto']).optional().default('auto'),
  colors: z
    .object({
      primary: z.string().optional(),
      botBubble: z.string().optional(),
      userBubble: z.string().optional(),
      background: z.string().optional(),
      text: z.string().optional(),
    })
    .optional(),
  borderRadius: z.string().optional().default('12px'),
  fontFamily: z.string().optional().default('Inter, sans-serif'),
});

export const BotConfigSchema = z.object({
  name: z.string().optional().default('Asistente'),
  avatar: z.string().url().optional(),
  welcomeMessage: z.string().optional(),
  typingDelay: z.number().min(0).max(5000).optional().default(1000),
});

export const EndpointsSchema = z.object({
  websocket: z.string().url(),
  api: z.string().url().optional(),
});

export const FeaturesSchema = z.object({
  voice: z.boolean().optional().default(false),
  emoji: z.boolean().optional().default(true),
  darkMode: z.boolean().optional().default(true),
});

export const PluginConfigSchema = z.object({
  name: z.string(),
  options: z.record(z.string(), z.unknown()).optional(),
});

export const WidgetConfigSchema = z.object({
  projectId: z.string(),
  theme: ThemeSchema.optional(),
  position: z.enum(['bottom-right', 'bottom-left']).optional().default('bottom-right'),
  zIndex: z.number().optional().default(9999),
  bot: BotConfigSchema.optional(),
  endpoints: EndpointsSchema,
  autoOpen: z.boolean().optional().default(false),
  autoOpenDelay: z.number().optional().default(3000),
  persistSession: z.boolean().optional().default(true),
  showBranding: z.boolean().optional().default(true),
  plugins: z.array(PluginConfigSchema).optional(),
  features: FeaturesSchema.optional(),
  onReady: z.function().optional(),
  onError: z.function().optional(),
});

// Input type (what user passes)
export type WidgetConfigInput = z.input<typeof WidgetConfigSchema>;

// Output type (after parsing with defaults applied)
export type WidgetConfig = z.output<typeof WidgetConfigSchema>;

export type Theme = z.output<typeof ThemeSchema>;
export type BotConfig = z.output<typeof BotConfigSchema>;
export type Endpoints = z.output<typeof EndpointsSchema>;
export type Features = z.output<typeof FeaturesSchema>;
