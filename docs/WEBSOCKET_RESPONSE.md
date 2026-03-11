# Formato de respuesta WebSocket (Backend → Frontend)

El frontend espera que cada mensaje recibido por el WebSocket sea un **objeto JSON** con un campo `type` que define cómo se renderiza.

---

## 1. Estructura común

Todos los mensajes deben incluir:

| Campo       | Tipo   | Obligatorio | Descripción |
|------------|--------|-------------|-------------|
| `type`     | string | Sí          | `"system"` \| `"message"` \| `"error"` |
| `content`  | string | Sí          | Texto a mostrar (fallback o mensaje principal) |
| `timestamp`| string | No          | ISO 8601, ej. `"2026-02-03T10:54:12.839317"` |

---

## 2. Formato de texto enriquecido (Markdown)

Los campos de texto que el backend envía (`content`, `response_rich.content.text`, `response_rich.content.title`, `response_rich.content.subtitle`, `description` en ítems, etc.) pueden incluir **Markdown** para que el frontend renderice correctamente títulos, negrita, cursiva, listas y enlaces.

| Formato   | Sintaxis Markdown   | Ejemplo de salida |
|-----------|---------------------|-------------------|
| **Negrita** | `**texto**` o `__texto__` | **texto** |
| *Cursiva* | `*texto*` o `_texto_` | *texto* |
| ~~Tachado~~ | `~~texto~~` | ~~texto~~ |
| Título nivel 1 | `# Título` | Título grande (H1) |
| Título nivel 2 | `## Subtítulo` | Subtítulo (H2) |
| Título nivel 3 | `### Sección` | Sección (H3) |
| Lista con viñetas | `- ítem` o `* ítem` | • ítem |
| Lista numerada | `1. ítem` | 1. ítem |
| Enlace | `[texto](url)` | [texto](url) clicable |
| Salto de línea | `\n` | Nueva línea |
| Código inline | `` `código` `` | `código` |

**Reglas:**

- El frontend interpreta estos campos como **Markdown** (compatible con CommonMark / GitHub Flavored Markdown).
- Si el backend envía texto plano sin Markdown, se muestra tal cual.
- Para evitar interpretación como Markdown (caracteres especiales literales), el backend puede escapar o enviar texto sin `*`, `#`, etc., según necesidad.

**Ejemplo en un mensaje:**

```json
{
  "type": "message",
  "content": "## Proceso Electoral 2026\n\n**Requisitos:**\n- Ser mayor de 18 años\n- DNI vigente\n\n_Consulta el cronograma_ en [JNE](https://www.jne.gob.pe).",
  "response_rich": {
    "type": "text",
    "content": {
      "text": "## Proceso Electoral 2026\n\n**Requisitos:**\n- Ser mayor de 18 años\n- DNI vigente\n\n_Consulta el cronograma_ en [JNE](https://www.jne.gob.pe)."
    }
  }
}
```

**Render:** el frontend mostrará el texto con subtítulo (H2), “Requisitos” en negrita, lista con viñetas, “Consulta el cronograma” en cursiva y un enlace clicable a JNE.

---

## 3. Tipos de mensaje

### 3.1 `type: "system"`

Mensaje de sistema (ej. bienvenida al conectar). Solo se muestra el texto.

**Ejemplo:**

```json
{
  "type": "system",
  "content": "Conectado al Chatbot JNE. ¿En qué puedo ayudarte?",
  "timestamp": "2026-02-03T10:00:00.000000"
}
```

**Render:** burbuja del bot con `content` como texto.

---

### 3.2 `type: "error"`

Error procesable (ej. fallo al responder). Se muestra con estilo de error.

**Ejemplo:**

```json
{
  "type": "error",
  "content": "No se pudo procesar tu solicitud. Intenta de nuevo.",
  "timestamp": "2026-02-03T10:00:00.000000"
}
```

**Render:** burbuja del bot con borde/fondo de error y el texto `content`.

---

### 3.3 `type: "message"`

Respuesta del bot. Puede ser solo texto o incluir `response_rich` para menús, listas, tarjetas, etc.

**Campos adicionales opcionales:**

| Campo                   | Tipo   | Uso en frontend |
|-------------------------|--------|------------------|
| `response_rich`         | object | Si existe, define el bloque interactivo (menú, lista, card, etc.). Ver sección 3. |
| `state.conversation_id` | string | Se guarda y se envía en los siguientes mensajes para mantener la conversación. |
| `disclaimer`            | string | Pie de mensaje institucional (ej. "Información oficial del JNE"). |
| `confidence_level`     | string | Opcional: "alta" \| "media" \| "baja". |
| `source`                | string | Opcional: fuente de datos. |

**Ejemplo mínimo (solo texto):**

```json
{
  "type": "message",
  "content": "Entendido. ¿En qué más puedo ayudarte?",
  "state": { "conversation_id": "f7be6af3-44f4-4902-a97e-11e4ea68dc94" },
  "timestamp": "2026-02-03T10:54:12.839317"
}
```

**Render:** burbuja del bot con `content`. Si viene `disclaimer`, se muestra debajo en pequeño.

**Ejemplo con `response_rich`:** ver sección 4.

---

## 4. `response_rich` (solo cuando `type === "message"`)

Si el mensaje incluye `response_rich`, el frontend usa su `type` para elegir el componente (texto, menú, botones, lista, tarjeta). Si no hay `response_rich`, se muestra solo `content`.

Estructura base:

```ts
{
  type: "text" | "menu" | "buttons" | "list" | "card";
  content: {
    text?: string;   // texto intro o cuerpo
    title?: string;  // título del bloque
    subtitle?: string;
  };
  actions?: Array<{...}>;   // para menu, buttons, card
  items?: Array<{...}>;      // solo para type === "list"
}
```

---

### 4.1 `response_rich.type: "text"`

Solo texto. Se muestra `content.text` (o el `content` del mensaje).

```json
{
  "type": "message",
  "content": "Aquí tienes la información solicitada.",
  "response_rich": {
    "type": "text",
    "content": { "text": "Aquí tienes la información solicitada." }
  }
}
```

---

### 4.2 `response_rich.type: "menu"`

Menú de opciones (ej. menú principal). Cada opción es un botón; al hacer clic se envía su `value` por WebSocket.

```json
{
  "type": "message",
  "content": "¿En qué más puedo ayudarte?",
  "response_rich": {
    "type": "menu",
    "content": {
      "title": "Menú principal:",
      "text": "¿En qué más puedo ayudarte?"
    },
    "actions": [
      { "type": "button", "label": "1. Procesos Electorales", "value": "1", "style": "primary" },
      { "type": "button", "label": "2. Servicios Digitales", "value": "4", "style": "primary" }
    ]
  }
}
```

**Campos en cada `action`:**

| Campo   | Tipo   | Obligatorio | Descripción |
|---------|--------|-------------|-------------|
| `type`  | string | Sí          | `"button"` \| `"link"` \| `"quick_reply"` |
| `label` | string | Sí          | Texto del botón |
| `value` | string | Sí          | Se envía como `content` al hacer clic (o es URL si `action === "open_link"`) |
| `action`| string | No          | `"open_link"` → abrir `value` en nueva pestaña; si no, enviar `value` |
| `style` | string | No          | `"primary"` \| `"secondary"` |

---

### 4.3 `response_rich.type: "buttons"`

Pocos botones (ej. Sí/No). Misma estructura de `actions` que en `menu`.

```json
{
  "type": "message",
  "content": "¿Deseas realizar otra consulta?",
  "response_rich": {
    "type": "buttons",
    "content": { "text": "¿Deseas realizar otra consulta?" },
    "actions": [
      { "type": "button", "label": "Sí", "value": "si", "style": "primary" },
      { "type": "button", "label": "No", "value": "no", "style": "secondary" }
    ]
  }
}
```

---

### 4.4 `response_rich.type: "list"`

Lista de ítems (ej. varios servicios). Cada ítem puede tener enlace; si tiene `enlace`, al clic se abre en nueva pestaña; si no, se envía `value`.

```json
{
  "type": "message",
  "content": "Encontré 6 servicios que pueden ayudarte. Selecciona uno para más información:",
  "response_rich": {
    "type": "list",
    "content": {
      "title": "📋 Servicios Digitales Encontrados",
      "text": "Encontré 6 servicios que pueden ayudarte. Selecciona uno para más información:"
    },
    "items": [
      {
        "id": "1",
        "title": "Mesa de Partes Virtual",
        "description": "Con la Mesa de Partes Virtual del JNE, puedes realizar trámites y consultas electorales desde tu casa...",
        "value": "Mesa de Partes Virtual",
        "enlace": "https://mesapartesvirtual.jne.gob.pe/principal"
      },
      {
        "id": "2",
        "title": "Estado de la Solicitud de Justificación y/o Dispensa Electoral",
        "description": "¿Solicitaste justificar tu ausencia o pedir dispensa para no votar?",
        "value": "Estado de la Solicitud de Justificación y/o Dispensa Electoral",
        "enlace": "https://portal.jne.gob.pe/portal/Pagina/Ver/215/page/Estado-de-tramite"
      }
    ]
  }
}
```

**Campos en cada ítem de `items`:**

| Campo         | Tipo   | Obligatorio | Descripción |
|---------------|--------|-------------|-------------|
| `id`          | string | Sí          | Identificador único (para keys y clic) |
| `title`       | string | Sí          | Título del ítem |
| `description` | string | No          | Descripción corta (se trunca en UI) |
| `value`       | string | Sí          | Texto que se envía si el ítem no tiene `enlace` |
| `enlace`      | string | No          | Si existe, al clic se abre en nueva pestaña (no se envía mensaje) |

**Render:** título de lista, texto intro, luego tarjetas (una por ítem) con título, descripción y, si hay `enlace`, enlace “Acceder al servicio” al pie.

---

**Texto intro (`content.text`):** Debe ser el texto completo que se muestra arriba de las tarjetas (puede incluir Markdown). Si el backend envía el texto completo en el `content` raíz y en `response_rich.content.text` una versión truncada, el frontend usará el `content` raíz cuando sea más largo. **Recomendación:** enviar el mismo texto completo en ambos para consistencia.

---

### 4.5 `response_rich.type: "card"`

Una sola tarjeta (ej. un servicio o funcionario). Incluye título, subtítulo, texto y botones.

```json
{
  "type": "message",
  "content": "Servicio: Mesa de Partes Virtual",
  "response_rich": {
    "type": "card",
    "content": {
      "title": "👨‍⚖️ Presidente del JNE",
      "subtitle": "Presidente",
      "text": "**Nombre:** Mag. Roberto Rolando Burneo Bermejo\n**Cargo:** Presidente"
    },
    "actions": [
      { "type": "button", "label": "🔗 Acceder al servicio", "value": "https://...", "action": "open_link" },
      { "type": "button", "label": "Volver al menú", "value": "menu", "action": "menu" }
    ]
  }
}
```

**Comportamiento de `actions`:**

- Si `action === "open_link"` o `value` empieza por `http://` o `https://`: se abre `value` en nueva pestaña.
- En caso contrario: se envía `{ "content": value }` por el WebSocket.

---

## 5. Resumen de render por tipo

| `type` (raíz) | `response_rich`      | Qué se muestra |
|---------------|----------------------|----------------|
| `system`      | —                    | Solo `content` como mensaje del bot |
| `error`       | —                    | `content` con estilo de error |
| `message`     | —                    | Solo `content` (+ opcional disclaimer) |
| `message`     | `type: "text"`        | Texto de `response_rich.content` |
| `message`     | `type: "menu"`        | Título + texto + botones (en columna) |
| `message`     | `type: "buttons"`     | Texto + botones |
| `message`     | `type: "list"`        | Título + intro + tarjetas por ítem (título, descripción, enlace si hay) |
| `message`     | `type: "card"`        | Tarjeta con título, subtítulo, texto y botones |

---

## 6. Tipos TypeScript (referencia)

Los contratos están definidos en `src/core/types/backend.types.ts`:

- `BackendResponse`: mensaje completo recibido.
- `ResponseRich`: objeto `response_rich` con `type`, `content`, `actions`, `items`.
- `BackendAction`: elemento de `actions` (label, value, action, style).
- `BackendListItem`: elemento de `items` (id, title, description, value, enlace).

Con este formato, el backend puede enviar mensajes que el frontend renderiza correctamente en cada caso.
