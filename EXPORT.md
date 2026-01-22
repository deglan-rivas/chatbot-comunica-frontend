# Guia de Integracion

## Generar Bundle

```bash
pnpm build
```

Esto genera en `dist/`:
- `chatbot-widget.umd.js` - Para HTML estatico
- `chatbot-widget.es.js` - Para imports ES modules

## Integracion en HTML Estatico

```html
<!DOCTYPE html>
<html>
<head>
  <title>Mi Sitio</title>
</head>
<body>
  <!-- Contenido de tu pagina -->

  <!-- Cargar widget -->
  <script src="https://tu-cdn.com/chatbot-widget.umd.js"></script>
  <script>
    ChatbotWidget.init({
      projectId: 'mi-proyecto',
      endpoints: {
        websocket: 'wss://api.ejemplo.com/chat',
      },
      bot: {
        name: 'Soporte',
        welcomeMessage: 'Hola! Como puedo ayudarte?',
      },
    });
  </script>
</body>
</html>
```

## Integracion en React SPA (Vite)

### Opcion 1: Importar como modulo

```tsx
// src/App.tsx
import { useEffect } from 'react';
import { ChatbotWidget } from 'ruta/a/chatbot-widget.es.js';

function App() {
  useEffect(() => {
    ChatbotWidget.init({
      projectId: 'mi-proyecto',
      endpoints: {
        websocket: 'wss://api.ejemplo.com/chat',
      },
    });

    return () => {
      ChatbotWidget.destroy();
    };
  }, []);

  return (
    <div>
      {/* Tu aplicacion */}
    </div>
  );
}
```

### Opcion 2: Como paquete local

1. Agregar al `package.json` de tu proyecto:

```json
{
  "dependencies": {
    "chatbot-widget": "file:../ruta/a/chatbot_frontend"
  }
}
```

2. Importar en tu app:

```tsx
import { ChatbotWidget } from 'chatbot-widget';

// Usar igual que Opcion 1
```

### Opcion 3: Script en index.html

```html
<!-- index.html de tu proyecto Vite -->
<!DOCTYPE html>
<html>
<head>
  <title>Mi App React</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>

  <!-- Cargar widget despues -->
  <script src="/chatbot-widget.umd.js"></script>
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      ChatbotWidget.init({
        projectId: 'mi-proyecto',
        endpoints: {
          websocket: 'wss://api.ejemplo.com/chat',
        },
      });
    });
  </script>
</body>
</html>
```

## Control Programatico

```javascript
// Abrir chat
ChatbotWidget.getInstance()?.open();

// Cerrar chat
ChatbotWidget.getInstance()?.close();

// Toggle
ChatbotWidget.getInstance()?.toggle();

// Cambiar tema
ChatbotWidget.getInstance()?.setThemeMode('dark');

// Destruir (limpieza)
ChatbotWidget.destroy();
```

## Callbacks

```javascript
ChatbotWidget.init({
  // ...config
  onReady: () => {
    console.log('Widget listo');
  },
  onError: (error) => {
    console.error('Error:', error);
  },
});
```

## Notas

- El widget usa Shadow DOM, no hay conflictos de estilos con tu sitio
- Se monta automaticamente en un contenedor al final del `<body>`
- Soporta multiples temas: `light`, `dark`, `auto`
- La sesion persiste en localStorage por defecto (`persistSession: true`)
