# Build de Imagen Docker - Chatbot Widget Frontend

Esta guía documenta el proceso para construir la imagen Docker del frontend usando variables de entorno configurables.

## Requisitos Previos

- Docker instalado
- Acceso al repositorio `chatbot_frontend`

## Archivos de Configuración

| Archivo | Descripción |
|---------|-------------|
| `.env.template` | Template con las variables de entorno necesarias |
| `.env` | Archivo con valores reales (crear a partir de `.env.template`) |
| `nginx.conf.template` | Template de configuración nginx con placeholders `${PUBLIC_PORT}` y `${CUSTOM_DOMAIN}` |
| `nginx.conf` | Configuración nginx generada por `envsubst` antes del build (no se commitea) |
| `nginx.main.conf` | Configuración global de nginx (worker processes, logs, mime types) |
| `Dockerfile.multi-stage` | Dockerfile de producción: stage builder (Node/pnpm) + stage production (nginx) |
| `public/config.js` | Archivo JS cargado en el navegador antes que la app; expone `window.env` con los valores de las variables `VITE_`. En local tiene valores por defecto; en producción es sobreescrito por `entrypoint.prd.sh` al arrancar el contenedor |
| `entrypoint.prd.sh` | Script de entrada del contenedor. Lee las variables de entorno del sistema y regenera `config.js` en tiempo de ejecución, luego inicia nginx. Esto permite cambiar la configuración sin rebuildar la imagen |
| `public/index.html` | Demo page estática servida por nginx. Carga el bundle compilado (`chatbot-widget.es.js`) y `window.env` |

> **Cómo agregar una nueva variable de entorno:**
> 1. Defínela en `.env` con el nombre `VITE_<NOMBRE>`.
> 2. Agrégala a `public/config.js` con un valor por defecto para que funcione en local (`pnpm dev`).
> 3. Agrégala a `entrypoint.prd.sh` con la sintaxis `"${VITE_<NOMBRE>:-}"` para que se inyecte en tiempo de ejecución.
> 4. Agrégala a la declaración `Window` en `src/vite-env.d.ts`.
> 5. Léela en el código con `window.env?.VITE_<NOMBRE> ?? import.meta.env.VITE_<NOMBRE>`.
>
> **Importante:** Si la variable **no empieza con `VITE_`**, Vite no la expondrá al bundle y **no será accesible desde el navegador**. Las variables sin ese prefijo (`PUBLIC_PORT`, `CUSTOM_DOMAIN`) son exclusivamente de uso en el servidor/contenedor.

## Variables de Entorno

### Variables de infraestructura (solo Docker / nginx)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PUBLIC_PORT` | Puerto donde nginx escuchará dentro del contenedor | `9173` |
| `CUSTOM_DOMAIN` | Dominio para nginx `server_name` (usar `_` para cualquier host) | `chatbot.jne.gob.pe` |

### Variables públicas `VITE_*` (inyectadas en tiempo de ejecución)

> Estas variables **son públicas**: cualquier persona con acceso al navegador puede verlas en `window.env` desde la consola de DevTools (F12). No guardes secretos del servidor aquí; úsalas solo para configuración que el frontend necesita conocer (URLs, flags de feature).
>
> Se inyectan **en tiempo de ejecución** (cuando arranca el contenedor), no en tiempo de compilación, por lo que **no es necesario rebuildar la imagen** para cambiarlas.

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_WEBSOCKET_URL` | URL base del WebSocket del backend | `wss://chatbot.jne.gob.pe/api/v1` |
| `VITE_EMBED_API_BASE_URL` | URL base HTTP del backend para el embed script | `https://chatbot.jne.gob.pe/api/v1` |
| `VITE_APP_ENV` | Ambiente (`DEV` o `PRD`). En DEV con HTTPS redirige el WS al host actual | `PRD` |

---

## Pasos para Build

### Paso 1: Ir al directorio del repositorio

```bash
cd ~/chatbot_frontend
```

### Paso 2: Crear archivo `.env` a partir del template

```bash
cp .env.template .env
```

Editar el archivo `.env` con los valores correspondientes a tu ambiente:

```bash
nano .env
```

Ejemplo de contenido para ambiente **desarrollo (DEV)**:
```env
# Infraestructura
PUBLIC_PORT=9173
CUSTOM_DOMAIN=_

# Variables runtime
VITE_WEBSOCKET_URL=ws://192.168.27.228:9010/api/v1
VITE_EMBED_API_BASE_URL=http://192.168.27.228:9010/api/v1
VITE_APP_ENV=DEV
```

### Paso 3: Generar `nginx.conf` desde el template

Este comando lee las variables del `.env` y genera el archivo `nginx.conf`:

```bash
set -a && source .env && set +a && envsubst '${PUBLIC_PORT} ${CUSTOM_DOMAIN}' < nginx.conf.template > nginx.conf
```

### Paso 4: Verificar que `nginx.conf` se generó correctamente

```bash
cat nginx.conf
```

Debe mostrar los valores reemplazados:
```nginx
server {
    listen 9173;
    server_name _;
    ...
}
```

### Paso 5: Buildear la imagen Docker

```bash
docker build -f Dockerfile.multi-stage -t chatbot_frontend:dev .
```

### Paso 6: Crear contenedor de prueba

El flag `--rm` elimina el contenedor automáticamente al detenerlo.
El flag `--env-file=.env` inyecta las variables de entorno en el contenedor para que `entrypoint.prd.sh` las use al escribir `config.js`.

```bash
docker run -d --rm \
  --name chatbot-frontend-test \
  --env-file=.env \
  -p 9173:9173 \
  chatbot_frontend:dev
```

### Paso 7: Verificar el build

```bash
# Ver configuración de nginx dentro del contenedor
docker exec -it chatbot-frontend-test cat /etc/nginx/conf.d/default.conf

# Ver config.js con las variables de entorno
docker exec -it chatbot-frontend-test cat /usr/share/nginx/html/config.js

# Probar respuesta HTTP
curl http://localhost:9173/
```

### Paso 8: Limpiar recursos de prueba

```bash
# Detener contenedor (se elimina automáticamente por --rm)
docker stop chatbot-frontend-test

# Eliminar imagen de test
docker rmi chatbot_frontend:dev
```

---

## Comando Rápido (Todo en Uno)

Para generar `nginx.conf` y buildear en un solo comando:

```bash
set -a && source .env && set +a && envsubst '${PUBLIC_PORT} ${CUSTOM_DOMAIN}' < nginx.conf.template > nginx.conf && docker build -f Dockerfile.multi-stage -t chatbot_frontend:dev .
```

---

## Build para Diferentes Ambientes

### Ambiente DEV
```env
PUBLIC_PORT=9173
CUSTOM_DOMAIN=_
VITE_WEBSOCKET_URL=ws://192.168.27.228:9010/api/v1
VITE_EMBED_API_BASE_URL=http://192.168.27.228:9010/api/v1
VITE_APP_ENV=DEV
```

### Ambiente QA
```env
PUBLIC_PORT=9273
CUSTOM_DOMAIN=chatbot-qa.jne.gob.pe
VITE_WEBSOCKET_URL=wss://chatbot-qa.jne.gob.pe/api/v1
VITE_EMBED_API_BASE_URL=https://chatbot-qa.jne.gob.pe/api/v1
VITE_APP_ENV=PRD
```

### Ambiente PRD
```env
PUBLIC_PORT=9373
CUSTOM_DOMAIN=chatbot.jne.gob.pe
VITE_WEBSOCKET_URL=wss://chatbot.jne.gob.pe/api/v1
VITE_EMBED_API_BASE_URL=https://chatbot.jne.gob.pe/api/v1
VITE_APP_ENV=PRD
```

---

## Diferencia con eleccia_frontend (SPA vs Widget Library)

El chatbot frontend se compila en **modo librería** (Vite lib mode), no como SPA. Esto implica una diferencia clave:

| | eleccia_frontend (SPA) | chatbot_frontend (Widget Library) |
|--|--|--|
| Build output | `dist/index.html` + chunks JS | Solo bundles JS (`chatbot-widget.es.js`, etc.) |
| Demo page nginx | `dist/index.html` (generado por Vite) | `public/index.html` → `dist/index.html` (estático, carga el bundle) |
| `index.html` raíz | Procesado por Vite en build | Solo para Vite dev server (no va al `dist/`) |
| Modo uso | App standalone | Widget embebible en páginas de terceros |

Por eso existe `public/index.html`: es la demo page estática que nginx sirve como raíz y que carga el bundle `chatbot-widget.es.js` ya compilado.

---

## Notas Importantes

1. **No commitear `.env`**: Contiene configuración específica del ambiente.

2. **No commitear `nginx.conf`**: Es un archivo generado por `envsubst`. Está en `.gitignore`.

3. **`envsubst` y variables de nginx**: El comando `envsubst '${PUBLIC_PORT} ${CUSTOM_DOMAIN}'` solo reemplaza esas dos variables, dejando intactas las variables de nginx como `$uri`.

4. **Puerto interno vs externo**: `PUBLIC_PORT` define el puerto donde nginx escucha DENTRO del contenedor. El mapeo externo (`-p HOST:CONTAINER`) debe coincidir.

5. **Variables en runtime**: Todas las variables `VITE_*` se inyectan en runtime a través del `entrypoint.prd.sh`, no en build time. Cambiarlas solo requiere reiniciar el contenedor, no rebuildar la imagen.

---

## Troubleshooting

### Error: nginx.conf vacío o con placeholders sin reemplazar
**Causa**: Las variables no se exportaron correctamente.
**Solución**: Usar `set -a` antes de `source`:
```bash
set -a && source .env && set +a && envsubst '${PUBLIC_PORT} ${CUSTOM_DOMAIN}' < nginx.conf.template > nginx.conf
```

### Error: Puerto ya en uso
```bash
sudo netstat -tlnp | grep 9173
docker ps | grep 9173
```

### Error: El widget no carga o la URL del WebSocket está vacía
```bash
# Verificar que config.js tiene las variables correctas
docker exec -it chatbot-frontend-test cat /usr/share/nginx/html/config.js

# Verificar que el contenedor recibe las variables de entorno
docker exec -it chatbot-frontend-test printenv VITE_WEBSOCKET_URL
```

### Cambios en variables no se reflejan en el navegador

**Paso 1 — Reiniciar el contenedor** (suficiente en la mayoría de casos):
```bash
docker stop chatbot-frontend-test
docker run -d --rm --name chatbot-frontend-test --env-file=.env -p 9173:9173 chatbot_frontend:dev
```

**Paso 2 — Rebuildar sin caché** (si el paso 1 no fue suficiente):
```bash
docker build --no-cache -f Dockerfile.multi-stage -t chatbot_frontend:dev .
```

**Paso 3 — Vaciar caché del navegador**:
En Chrome/Edge con DevTools abierto (F12): clic derecho en el botón recargar → **"Vaciar la caché y volver a cargar de manera forzada"**.
