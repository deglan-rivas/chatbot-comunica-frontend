# Chatbot Widget

Widget de chatbot embebible estilo WhatsApp para integracion en cualquier sitio web.

## Stack Tecnologico

| Tecnologia | Proposito |
|------------|-----------|
| React 18 + Vite 5 | Framework y bundler (library mode) |
| TypeScript 5 | Type safety |
| Zustand | State management (~1KB) |
| Socket.io-client | WebSocket con reconexion |
| Tailwind CSS v4 | Estilos |
| Shadow DOM | Encapsulacion de estilos |
| Zod | Validacion de configuracion |

## Decisiones Tecnicas

### Por que React + Vite y no Next.js?
- No se requiere SSR
- Bundle mas ligero para widget embebible
- Vite library mode genera UMD/ESM directamente

### Por que Zustand?
- ~1KB vs Redux (~7KB)
- Sin boilerplate
- Soporte nativo para persist middleware

### Por que Shadow DOM?
- Aislamiento total de estilos CSS
- Evita conflictos con estilos del sitio host

## Estructura

```
src/
├── index.tsx           # Entry point, API publica
├── demo.tsx            # Demo de desarrollo
├── config/
│   └── schema.ts       # Validacion Zod
├── core/               # LOGICA (sin React)
│   ├── types/          # Interfaces y tipos
│   ├── store/          # Zustand stores
│   ├── services/       # WebSocket, media
│   ├── plugins/        # Sistema de plugins
│   └── utils/          # Helpers
└── ui/                 # COMPONENTES REACT
    ├── components/     # Componentes visuales
    └── hooks/          # Custom hooks
```

## Documentacion

| Documento | Descripcion |
|-----------|-------------|
| [docs/SETUP.md](./docs/SETUP.md) | Instrucciones para levantar el proyecto en desarrollo |
| [docs/EXPORT.md](./docs/EXPORT.md) | Guia para integrar el widget en otro proyecto (React SPA o HTML vanilla) |

## Comandos

```bash
pnpm install    # Instalar dependencias
pnpm dev        # Servidor desarrollo (localhost:3000)
pnpm build      # Generar bundle en dist/
pnpm preview    # Preview del build
```

## Configuracion

```typescript
ChatbotWidget.init({
  projectId: 'mi-proyecto',
  endpoints: {
    websocket: 'wss://api.ejemplo.com/chat',
  },
  bot: {
    name: 'Asistente',
    welcomeMessage: 'Hola, en que puedo ayudarte?',
  },
  theme: {
    mode: 'auto', // 'light' | 'dark' | 'auto'
    colors: { primary: '#be1717' },
  },
  position: 'bottom-right',
  autoOpen: false,
});
```

## API Publica

```typescript
ChatbotWidget.init(config)      // Inicializar widget
ChatbotWidget.getInstance()     // Obtener instancia
  .open()                       // Abrir chat
  .close()                      // Cerrar chat
  .toggle()                     // Alternar estado
  .setThemeMode('dark')         // Cambiar tema
ChatbotWidget.destroy()         // Destruir widget
```

## Proximos Pasos

1. Conectar con endpoint WebSocket real del backend
2. Implementar componentes multimedia (imagen, video)
3. Implementar upload de archivos
4. Agregar plugins built-in (analytics, notificaciones)
5. Optimizar bundle size (objetivo: <150KB gzipped)
