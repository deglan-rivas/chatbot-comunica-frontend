# Integracion para Sitios de Terceros (1 Script)

Este documento explica como integrar el chatbot JNE en cualquier sitio web externo (Angular, React, ASP.NET, HTML estatico, etc.) usando **solo 1 script**.

> No es necesario conocer la IP final. La integracion se hace con un **dominio URL** que sera proporcionado por el equipo JNE al momento del despliegue.

---

## 1. Requisitos minimos

- Tener acceso para editar el HTML base del sitio (por ejemplo `index.html`).
- Permitir cargar un script externo desde el dominio del chatbot (CDN/JNE).
- Permitir conexion WebSocket saliente hacia el dominio del chatbot.

---

## 2. Snippet de integracion (copiar y pegar)

Insertar este script antes de cerrar `</body>`:

```html
<script
  src="https://<DOMINIO-CHATBOT>/chatbot-widget-embed.umd.js"
  data-project-id="mi-proyecto">
</script>
```

### Parametros del snippet

- `src`: URL publica del loader embebido (la entrega JNE).
- `data-project-id`: identificador del proyecto/cliente en frontend.

> No se requiere llamar a `ChatbotWidget.init(...)` manualmente.

---

## 3. Que hace el script internamente

Al cargarse, el script:

1. Crea sesion en backend (`POST /api/v1/session`).
2. Obtiene `session_id`.
3. Abre WebSocket en `/api/v1/ws/{session_id}`.
4. Carga el widget principal y lo inicializa automaticamente.
5. Muestra el boton flotante de chat en la esquina inferior.

---

## 4. Ejemplos por tipo de sitio

## 4.1 Angular

Agregar el snippet en `src/index.html` dentro de `<body>`.

```html
<body>
  <app-root></app-root>

  <script
    src="https://<DOMINIO-CHATBOT>/chatbot-widget-embed.umd.js"
    data-project-id="mi-proyecto">
  </script>
</body>
```

## 4.2 HTML estatico

Mismo enfoque: pegar el script antes de `</body>`.

---

## 5. Requisitos de red / seguridad (CSP)

Si el sitio usa politicas CSP, habilitar al menos:

- `script-src` para `https://<DOMINIO-CHATBOT>`
- `connect-src` para:
  - `https://<DOMINIO-CHATBOT>` (sesion REST)
  - `wss://<DOMINIO-CHATBOT>` (WebSocket)
- (Opcional segun politica) fuentes externas usadas por el widget:
  - `https://fonts.googleapis.com`
  - `https://fonts.gstatic.com`

Ejemplo referencial:

```text
Content-Security-Policy:
  script-src 'self' https://<DOMINIO-CHATBOT>;
  connect-src 'self' https://<DOMINIO-CHATBOT> wss://<DOMINIO-CHATBOT>;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
```

> Ajustar la CSP segun la politica de seguridad del sitio tercero.

---

## 6. Checklist de validacion

- [ ] El script carga sin errores 404/403.
- [ ] Aparece el boton flotante del chat.
- [ ] Se puede abrir/cerrar la ventana del chat.
- [ ] El chat responde mensajes correctamente.
- [ ] Los enlaces de tarjetas/listas abren en nueva pestana.
- [ ] No hay bloqueos CSP/CORS en consola.

---

## 7. Eventos de analitica (opcional)

El widget despacha en `window` un `CustomEvent` para que el sitio tercero registre metricas sin acoplarse al codigo interno.

- **Nombre del evento:** `chatbot-widget-analytics`
- **`event.detail`:** objeto con al menos `event` (string), `timestamp` (number) y campos adicionales segun el caso.

Ejemplo de escucha:

```js
window.addEventListener('chatbot-widget-analytics', (e) => {
  console.log(e.detail.event, e.detail);
});
```

**Valores tipicos de `detail.event`:** `fab_mounted`, `onboarding_banner_shown`, `onboarding_banner_dismissed`, `fab_toggle`, `chat_opened`, `chat_closed`, `message_sent`.

---

## 8. Problemas comunes y solucion rapida

### 8.1 No aparece el widget

- Verificar que la URL de `src` sea correcta.
- Revisar consola del navegador por errores de carga.
- Confirmar que no haya bloqueo CSP de `script-src`.

### 8.2 El widget aparece pero no responde

- Revisar en consola errores de `connect-src` o WebSocket.
- Confirmar que el dominio permita `POST /session` y `wss`.
- Verificar si existe firewall/proxy corporativo bloqueando WSS.

### 8.3 Se ve pero sin iconos/fuentes

- Permitir dominios de Google Fonts en CSP (si aplica).

