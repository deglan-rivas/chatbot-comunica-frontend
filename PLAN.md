# Plan de Implementacion - Chatbot Widget

## Resumen

Widget de chatbot embebible estilo WhatsApp con arquitectura plugin, separacion UI/logica, comunicacion WebSocket y distribucion como script unico.

## Fases de Implementacion

### Fase 1: Setup del Proyecto
- [x] Inicializar proyecto con Vite + React + TypeScript
- [x] Configurar Tailwind CSS v4
- [x] Configurar vite.config.ts en library mode (UMD + ESM)
- [x] Crear estructura de carpetas (core/ui separation)

### Fase 2: Core (Logica)
- [x] Definir tipos (`message.types.ts`, `config.types.ts`, `plugin.types.ts`)
- [x] Implementar stores Zustand (`chat.store.ts`, `ui.store.ts`, `config.store.ts`)
- [x] Implementar `websocket.service.ts` (estructura base)
- [x] Implementar `plugin-manager.ts`
- [x] Validacion de config con Zod (`schema.ts`)

### Fase 3: Componentes UI
- [x] `FloatingButton` - boton esquina inferior
- [x] `ChatWindow` - modal del chat
- [x] `ChatHeader`, `ChatBody`, `ChatInput`
- [x] `MessageBubble` (bot y user)
- [x] `OptionsMessage` (botones interactivos)
- [x] `RatingMessage` (estrellas de valoracion)
- [x] `TypingIndicator`
- [ ] `ImageMessage` - visualizacion de imagenes
- [ ] `VideoPlayer` - reproductor de video
- [ ] `AttachmentPicker` - selector de archivos

### Fase 4: Integracion
- [x] Entry point (`index.tsx` con Shadow DOM)
- [x] API publica (`init`, `destroy`, `open`, `close`, `toggle`, `setThemeMode`)
- [x] Conectar UI con stores
- [ ] Conectar WebSocket con backend real
- [ ] Hooks personalizados (`useChat`, `useWebSocket`, `useMessages`)

### Fase 5: Optimizacion y Testing
- [ ] Code splitting (lazy load media components)
- [ ] Virtualizacion de lista de mensajes (si > 100)
- [ ] Testing unitario
- [ ] Verificar bundle size < 150KB gzipped
- [x] Demo funcional en `localhost:3000`

## Proximos Pasos Prioritarios

1. **Conectar WebSocket real** - Reemplazar `echo.websocket.org` por endpoint del backend
2. **Componentes multimedia** - `ImageMessage`, `VideoPlayer`
3. **Upload de archivos** - `media.service.ts` + `AttachmentPicker`
4. **Plugins built-in** - Analytics, notificaciones

## Metricas Actuales

| Metrica | Valor |
|---------|-------|
| Bundle UMD | ~765KB |
| Bundle gzipped | ~226KB |
| Dependencias | React 18, Zustand, Socket.io-client, Zod |
