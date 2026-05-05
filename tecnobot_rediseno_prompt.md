# TECNOBOT — Prompt de Rediseño Frontend v2

## Contexto
Tecnobot es una app web serverless en AWS que permite subir PDFs y hacer preguntas sobre su contenido usando IA (Amazon Bedrock Nova Lite). El backend ya funciona correctamente con estos endpoints:
- `POST /upload` → recibe `{ fileName, fileContent (base64) }` → retorna `{ documentId, chunks, message }`
- `POST /ask` → recibe `{ documentId, question }` → retorna `{ answer, documentId }`

URL del API Gateway: `https://bdtpazw1ic.execute-api.us-east-1.amazonaws.com/prod`

## Tu tarea
Reescribir completamente los archivos del frontend manteniendo el patrón MVC y la misma estructura de carpetas. El backend NO cambia. Solo tocas archivos dentro de `frontend/`.

---

## Estructura de archivos a entregar

```
frontend/
├── index.html
├── css/
│   ├── main.css
│   └── components.css
├── js/
│   ├── controllers/
│   │   ├── uploadController.js
│   │   └── chatController.js
│   ├── models/
│   │   ├── documentModel.js
│   │   └── chatModel.js
│   └── services/
│       └── apiService.js
```

---

## Diseño visual — especificaciones exactas

### Paleta de colores
```css
:root {
  --bg: #f0f2f7;
  --surface: #ffffff;
  --border: #e4e7ef;
  --text: #1a1d2e;
  --dim: #7a8099;
  --muted: #aab0c8;
  --accent: #3a6ef5;
  --accent-hover: #2952d4;
  --success: #16a34a;
  --error: #dc2626;
  --radius: 12px;
  --radius-lg: 20px;
  --font: system-ui, -apple-system, sans-serif;
}
```

### Tipografía
- Font: `system-ui, -apple-system, sans-serif`
- Tamaños: nav brand 15px/600, títulos 22px/600, subtítulos 14px/400, body 13px/400, hints 11px/400
- Letter-spacing: -0.02em en títulos y brand

### Layout general
La app tiene DOS vistas principales que se alternan:

**Vista A — Upload** (cuando no hay documento activo):
- Sidebar izquierda (240px) + área principal derecha
- La sidebar muestra historial de documentos previos
- El área principal muestra la zona de upload

**Vista B — Chat** (cuando hay documento activo):
- Misma sidebar + área de chat con topbar y input

---

## Componentes detallados

### Sidebar (siempre visible)
```
┌─────────────────────────┐
│ [Logo] Tecnobot         │  ← header: 52px, border-bottom
├─────────────────────────┤
│ [+ Subir nuevo PDF]     │  ← botón llamativo con gradiente
├─────────────────────────┤
│ DOCUMENTOS RECIENTES    │  ← label uppercase 10px muted
│ 📄 nombre-doc.pdf       │  ← item clickable
│    Hace 5 min           │
│ 📄 otro-doc.pdf         │
│    Ayer                 │
└─────────────────────────┘
```

**Botón "Subir nuevo PDF":**
- Background: gradiente `linear-gradient(135deg, #3a6ef5, #7c3aed)`
- Color texto: blanco
- Border-radius: 10px
- Padding: 10px 16px
- Font-size: 13px, font-weight: 500
- Ícono "+" a la izquierda
- Hover: `linear-gradient(135deg, #2952d4, #6d28d9)` + scale(1.01)
- Active: scale(0.98)
- Transition: all 0.2s ease

**Items de documento en sidebar:**
- Ícono de documento (emoji 📄) en badge de color (rojo/azul/verde rotando)
- Nombre del archivo truncado con ellipsis
- Fecha relativa en muted
- Hover: background #f7f8fa
- Active (documento actual): background #eef2ff, texto accent

### Área de upload (Vista A — área principal)
```
┌─────────────────────────────────────┐
│                                     │
│     Sube tu documento PDF           │  ← título 22px
│   Haz preguntas con IA al instante  │  ← subtítulo 13px dim
│                                     │
│  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐  │
│  │                               │  │
│  │    [ícono upload 56x56]       │  │  ← zona drag & drop
│  │   Arrastra tu PDF aquí o      │  │
│  │                               │  │
│  │  [  Explorar archivos  ]      │  │  ← botón con progreso
│  │                               │  │
│  │     Máximo 15MB · PDF         │  │
│  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘  │
└─────────────────────────────────────┘
```

**Zona drag & drop:**
- Border: 2px dashed #c8d0e8
- Border-radius: 16px
- Padding: 40px 24px
- Hover/drag-over: border-color #3a6ef5, background #f7f9ff, transition 0.2s
- Ícono de upload: 56x56px, background #eef2ff, border-radius 16px, stroke #3a6ef5

**Botón "Explorar archivos" con progreso integrado:**
- Estado normal: background #3a6ef5, color blanco, border-radius 10px, padding 10px 24px
- Estado cargando: el botón mismo muestra una barra de progreso interior
  - El texto cambia a "Procesando... X%"
  - Un fill animado crece de izquierda a derecha dentro del botón
  - Color del fill: rgba(255,255,255,0.25) sobre el fondo azul
  - El botón se deshabilita y no se puede clickear
  - Al completarse: cambia a verde con checkmark por 1.5 segundos antes de ir al chat
- Transition suave entre estados

Implementación del progreso dentro del botón:
```css
.btn-upload {
  position: relative;
  overflow: hidden;
}
.btn-upload .btn-progress-fill {
  position: absolute;
  left: 0; top: 0; height: 100%;
  background: rgba(255,255,255,0.25);
  transition: width 0.3s ease;
  border-radius: inherit;
}
.btn-upload .btn-label {
  position: relative;
  z-index: 1;
}
```

### Área de chat (Vista B)

**Topbar (52px):**
- Izquierda: badge con nombre del documento activo (ícono 📄 + nombre, background #eef2ff, color accent, border-radius 20px)
- Derecha: botón "Exportar chat" (pequeño, outline)

**Tabs debajo del topbar:**
- "💬 Chat" y "📋 Resumen"
- Tab activo: border-bottom 2px solid accent, color accent
- Tab inactivo: color dim
- Al clickear "Resumen": mostrar un mensaje generado automáticamente con los puntos clave del documento (llamar a /ask con pregunta predefinida "Resume los puntos principales de este documento en una lista")

**Área de mensajes:**
- Background: var(--bg) #f0f2f7
- Padding: 20px
- Scroll automático al último mensaje
- Gap entre mensajes: 16px
- Sin avatares

**Burbuja del bot:**
- Background: #ffffff
- Border: 0.5px solid #e4e7ef
- Border-radius: 4px 14px 14px 14px
- Padding: 12px 16px
- Font-size: 13px, line-height: 1.7
- Color: #1a1d2e
- Renderiza markdown: **negrita**, *cursiva*, listas ul/ol, `código inline`, bloques de código con background #f0f2f7

**Burbuja del usuario:**
- Background: #3a6ef5
- Color: #ffffff
- Border-radius: 14px 4px 14px 14px
- Padding: 10px 14px
- Alineada a la derecha

**Indicador de "escribiendo..." (typing):**
- Burbuja de bot con 3 puntos que rebotan
- Animación: cada punto sube 6px con delay de 0.2s entre sí
- Se muestra mientras espera respuesta del API
- Se elimina cuando llega la respuesta

**Área de input:**
- Background: #ffffff, border-top 0.5px solid #e4e7ef
- Padding: 14px 20px
- Input: background #f7f8fa, border 1px solid #e4e7ef, border-radius 12px, padding 10px 14px
- Focus: border-color #3a6ef5, background #fff
- Botón enviar: 36x36px, background #3a6ef5, border-radius 10px, ícono de avión de papel (SVG)
- Hover botón: scale(1.05), background #2952d4
- Enter también envía

---

## Animaciones de entrada

Al cargar la página por primera vez aplicar estas animaciones con CSS:

```css
/* Sidebar entra desde la izquierda */
@keyframes slideInLeft {
  from { transform: translateX(-20px); opacity: 0; }
  to   { transform: translateX(0);     opacity: 1; }
}

/* Área principal sube con fade */
@keyframes fadeUp {
  from { transform: translateY(16px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

/* Elementos en cascada (staggered) */
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

Aplicar:
- `.sidebar` → `animation: slideInLeft 0.4s ease forwards`
- `.main` → `animation: fadeUp 0.4s ease 0.1s forwards; opacity: 0`
- Elementos del upload card (título, zona drop, hint) → animación staggered con delays de 0.1s, 0.2s, 0.3s

Duración total de entrada: menos de 500ms. Nada se mueve después de cargar.

---

## Funcionalidades JavaScript (MVC)

### `frontend/js/services/apiService.js`
```javascript
const API_BASE_URL = 'https://bdtpazw1ic.execute-api.us-east-1.amazonaws.com/prod';

const ApiService = {
  // Sube un PDF y retorna { documentId, chunks, message }
  async uploadDocument(fileName, fileContentBase64) { ... },

  // Hace una pregunta y retorna { answer, documentId }
  async askQuestion(documentId, question) { ... }
};
```

### `frontend/js/models/documentModel.js`
Gestiona el estado de documentos usando localStorage para persistencia:
```javascript
const DocumentModel = {
  // Documento activo en la sesión actual
  currentDocumentId: null,
  currentFileName: null,

  // Guarda documento en localStorage
  // estructura: { documentId, fileName, date, color }
  saveDocument(documentId, fileName) { ... },

  // Retorna lista de documentos guardados (máximo 10 más recientes)
  getDocuments() { ... },

  // Establece documento activo
  setActive(documentId, fileName) { ... },

  // Limpia documento activo (vuelve a upload)
  clearActive() { ... }
};
```

Colores de ícono rotando para documentos: `['#fee2e2', '#dbeafe', '#dcfce7', '#fef3c7', '#f3e8ff']` con textos `['#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed']`

### `frontend/js/models/chatModel.js`
```javascript
const ChatModel = {
  // mensajes: [{ role: 'user'|'bot', content: string, timestamp }]
  messages: {},  // keyed by documentId

  addMessage(documentId, role, content) { ... },
  getMessages(documentId) { ... },
  clearMessages(documentId) { ... }
};
```

Los mensajes se guardan en memoria (no en localStorage — se pierden al recargar, igual que cualquier chatbot).

### `frontend/js/controllers/uploadController.js`
Responsabilidades:
- Inicializar zona drag & drop
- Manejar dragover, dragleave, drop
- Manejar click en input file
- Validar: solo PDF, máximo 15MB (mostrar error si excede)
- Convertir a base64 con FileReader
- Llamar a ApiService.uploadDocument()
- Actualizar el botón con el progreso animado:
  1. Deshabilitar botón
  2. Mostrar "Subiendo... 0%"
  3. Simular progreso: 0→60% en 1s, luego esperar respuesta real, luego 60→100% cuando llega
  4. Al éxito: mostrar "✓ Listo" en verde por 1.5s
  5. Llamar a DocumentModel.saveDocument() y DocumentModel.setActive()
  6. Mostrar Vista B (chat)
- Mostrar errores en rojo dentro de la zona de drop

### `frontend/js/controllers/chatController.js`
Responsabilidades:
- Renderizar mensajes del ChatModel en el DOM
- Convertir markdown a HTML antes de insertar en el DOM:
  - `**texto**` → `<strong>texto</strong>`
  - `*texto*` → `<em>texto</em>`
  - `` `código` `` → `<code>código</code>`
  - Líneas que empiezan con `- ` o `* ` → `<ul><li>...</li></ul>`
  - Líneas que empiezan con número+punto → `<ol><li>...</li></ol>`
  - Doble salto de línea → `<p>`
  - Bloques ``` → `<pre><code>...</code></pre>`
- Manejar submit del formulario (Enter o botón)
- Mostrar typing indicator mientras espera
- Scroll automático al último mensaje
- Manejar tab "Resumen": llamar a /ask con pregunta fija y renderizar respuesta
- Manejar click en "Subir otro documento": llamar a DocumentModel.clearActive() y volver a Vista A
- Manejar click en item de sidebar: cambiar documento activo y cargar su historial de chat

### `frontend/index.html`
Estructura completa con ambas vistas en el DOM (usar clase `.hidden` para alternar):

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tecnobot</title>
  <link rel="stylesheet" href="css/main.css">
  <link rel="stylesheet" href="css/components.css">
</head>
<body>
  <div class="app">
    <aside class="sidebar"> ... </aside>
    <main class="main">
      <!-- Vista A: Upload -->
      <section id="upload-view"> ... </section>
      <!-- Vista B: Chat -->
      <section id="chat-view" class="hidden"> ... </section>
    </main>
  </div>

  <!-- JS en orden de dependencia -->
  <script src="js/services/apiService.js"></script>
  <script src="js/models/documentModel.js"></script>
  <script src="js/models/chatModel.js"></script>
  <script src="js/controllers/uploadController.js"></script>
  <script src="js/controllers/chatController.js"></script>
</body>
</html>
```

---

## Restricciones importantes
- Sin frameworks: vanilla JS, CSS puro, HTML semántico
- Sin librerías externas excepto ionicons para íconos si se necesitan:
  `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/ionicons/2.0.1/css/ionicons.min.css">`
- CORS: el apiService ya maneja los headers, no agregar nada extra
- El markdown renderer debe ser una función pura en chatController.js, sin librerías
- localStorage keys: `tecnobot_documents` para el historial
- Máximo 10 documentos en el historial (eliminar el más antiguo si se excede)
- El input de pregunta debe tener `minlength` implícito: no enviar si está vacío o solo espacios
- Todos los errores deben mostrarse en la UI, nunca solo en consola

---

## Orden de entrega
Entrega los archivos en este orden, con el path completo como título y el código completo:

1. `frontend/index.html`
2. `frontend/css/main.css`
3. `frontend/css/components.css`
4. `frontend/js/services/apiService.js`
5. `frontend/js/models/documentModel.js`
6. `frontend/js/models/chatModel.js`
7. `frontend/js/controllers/uploadController.js`
8. `frontend/js/controllers/chatController.js`

Sin explicaciones entre archivos. Solo código completo y funcional.
