#!/bin/sh

# NOTE: usar "LF" en linux o mac y "CRLF" en windows como saltos de línea y validar esos caracteres ingresando dentro del contenedor con el editor vim o vi o nano
# Reemplazar el archivo JS con variables reales de entorno
echo "window.env = {
  VITE_WEBSOCKET_URL: \"${VITE_WEBSOCKET_URL:-}\",
  VITE_EMBED_API_BASE_URL: \"${VITE_EMBED_API_BASE_URL:-}\",
  VITE_APP_ENV: \"${VITE_APP_ENV:-PRD}\",
  VITE_CHAT_NAME: \"${VITE_CHAT_NAME:-Asistente}\"
};" > /usr/share/nginx/html/config.js
chmod 644 /usr/share/nginx/html/config.js

# Iniciar nginx
nginx -g "daemon off;"
