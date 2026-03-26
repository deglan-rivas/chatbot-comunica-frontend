# Setup del Proyecto

Guia para levantar el frontend del chatbot en desarrollo.

## Requisitos Previos

- Node.js 18+
- pnpm (gestor de dependencias)

### Instalar pnpm

Si no tienes pnpm instalado:

```bash
# Con npm
npm install -g pnpm

# O con corepack (Node.js 16.10+)
corepack enable
corepack prepare pnpm@latest --activate
```

## Instalacion

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd chatbot_frontend
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar variables de entorno

```bash
cp .env.template .env
```

Editar el archivo `.env` con los valores correspondientes:

```env
# URL del WebSocket del backend
VITE_WEBSOCKET_URL=ws://192.168.27.228:8001/api/web/chat/ws

# API base para el script embebido (opcional, recomendado para build de embed)
VITE_EMBED_API_BASE_URL=https://chatbot.midominio.pe/api/v1

# Ambiente: DEV o PRD
VITE_APP_ENV=DEV
```

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `VITE_WEBSOCKET_URL` | URL del WebSocket del backend | `ws://localhost:8001/api/web/chat/ws` |
| `VITE_EMBED_API_BASE_URL` | API base usada por el loader embebido (`/session` y `/ws/{session_id}`) | `https://chatbot.midominio.pe/api/v1` |
| `VITE_APP_ENV` | Ambiente de ejecucion (`DEV` o `PRD`) | `DEV` |

### 4. Ejecutar en desarrollo

```bash
pnpm dev
```

El servidor estara disponible en `http://localhost:3000`

## Exponer con Cloudflare Tunnel (HTTPS)

Si necesitas exponer el frontend con HTTPS para pruebas (ej: para que lo pruebe un disenador UX), puedes usar Cloudflare Tunnel.

### Instalar cloudflared

```bash
# En Ubuntu/Debian
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb

# En macOS
brew install cloudflared
```

### Ejecutar el tunnel

```bash
# En una terminal, levantar el frontend
pnpm dev

# En otra terminal, crear el tunnel
cloudflared tunnel --url http://localhost:3000
```

Cloudflare te dara una URL como `https://xxx.trycloudflare.com`

### Proxy para evitar Mixed Content

Cuando accedes via HTTPS pero el backend usa HTTP/WS, los navegadores bloquean la conexion (mixed content).

El archivo `vite.config.ts` tiene configurado un proxy que soluciona esto automaticamente:

```typescript
proxy: {
  '/api/web/chat/ws': {
    target: 'ws://192.168.27.228:8001',
    ws: true,
    changeOrigin: true,
  },
},
```

#### Comportamiento del proxy

| Ambiente (`VITE_APP_ENV`) | Protocolo | Usa proxy | URL WebSocket |
|---------------------------|-----------|-----------|---------------|
| `DEV` | HTTP | No | URL directa del `.env` |
| `DEV` | HTTPS | Si | `wss://host/api/web/chat/ws` (proxy) |
| `PRD` | HTTP | No | URL directa del `.env` |
| `PRD` | HTTPS | No | URL directa del `.env` |

> **Nota:** El proxy solo aplica en `DEV` + `HTTPS`. En produccion (`PRD`), se asume que el backend tiene su propio certificado SSL configurado.

## Otros Comandos

```bash
pnpm build      # Generar bundle para produccion en dist/
pnpm preview    # Preview del build de produccion
pnpm lint       # Ejecutar linter
```

## Siguiente Paso

Para integrar el widget en otro proyecto, ver [docs/EXPORT.md](./EXPORT.md).
