# Tecnobot: contexto para agentes de IA

## Identidad y propósito

Tecnobot es un asistente académico web para estudiar documentos PDF. El usuario
sube un PDF, el backend extrae su texto, lo divide en fragmentos y permite:

- hacer preguntas sobre el documento;
- generar un resumen;
- generar y resolver un examen;
- conservar localmente documentos, categorías e historial de conversación;
- exportar el historial del chat como Markdown.

El objetivo del proyecto es ofrecer una herramienta útil, económica y fácil de
mantener para un proyecto de residencias. La arquitectura es serverless y el
frontend usa JavaScript Vanilla, sin React, TypeScript ni bundler.

## Estado actual

El flujo principal está funcionando en producción:

- Frontend publicado en Netlify: `https://tecno-bot.netlify.app`
- Backend desplegado en AWS, región `us-east-1`
- Stack CloudFormation/SAM: `tecnobot-nueva-cuenta`
- API Gateway:
  `https://t0bzkfsz0e.execute-api.us-east-1.amazonaws.com/prod`
- Modelo de IA: Amazon Bedrock `amazon.nova-lite-v1:0`
- CORS configurado para el dominio de Netlify
- Carga, validación y procesamiento de PDFs funcionando
- Preguntas, resumen y examen funcionando

No usar credenciales, claves API ni secretos en el repositorio. Las credenciales
de AWS se administran fuera del código y no deben solicitarse ni escribirse en
archivos del proyecto.

## Arquitectura

```text
Netlify (frontend)
    |
    v
API Gateway
    |
    +--> Lambda Upload --> S3 (PDF original)
    |                  --> DynamoDB (fragmentos de texto)
    |
    +--> Lambda Ask ----> DynamoDB (fragmentos relevantes)
                       --> Bedrock Nova Lite (respuesta)
```

### Backend

La infraestructura se define en [backend/template.yaml](backend/template.yaml).

- `PDFsBucket`: almacena PDFs y elimina objetos después de 90 días.
- `DocumentsTable`: DynamoDB bajo demanda con clave compuesta
  `documentId` + `chunkIndex`.
- `TecnobotApi`: API Gateway con las rutas `/upload` y `/ask`.
- `UploadFunction`: valida el archivo, extrae texto con `PyPDF2`, crea
  fragmentos, guarda el PDF en S3 y los fragmentos en DynamoDB.
- `AskFunction`: recupera fragmentos por coincidencia léxica y llama a
  Bedrock.

Rutas públicas:

- `POST /upload`: recibe `{ fileName, fileContent }`, donde `fileContent` es
  Base64 o una Data URL.
- `POST /ask`: recibe `{ documentId, question }`.

Los handlers agregan encabezados CORS a respuestas exitosas y de error.
API Gateway genera el preflight `OPTIONS`; conservar ambas capas cuando se
modifique CORS.

La recuperación actual es léxica, no un RAG semántico con embeddings:
`backend/ask/shared/db.py` puntúa fragmentos según coincidencias de palabras.
No describir el sistema como búsqueda vectorial hasta implementar esa capacidad.

### Frontend

El frontend sigue un MVC modular:

- `frontend/js/models/`: estado y persistencia local.
- `frontend/js/services/`: comunicación con API y construcción de prompts.
- `frontend/js/views/`: renderizado y actualización visual.
- `frontend/js/controllers/`: eventos y coordinación entre modelos, vistas y
  servicios.

Archivos principales:

- [frontend/js/services/apiService.js](frontend/js/services/apiService.js):
  URL de API Gateway y solicitudes `fetch`.
- [frontend/js/models/documentModel.js](frontend/js/models/documentModel.js):
  documentos, categorías y documento activo en `localStorage`.
- `frontend/js/models/chatModel.js`: historial por documento.
- `frontend/js/models/studyModel.js`: estado y progreso del examen.
- [frontend/js/controllers/uploadController.js](frontend/js/controllers/uploadController.js):
  selección, validación y carga de archivos.
- [frontend/js/controllers/chatController.js](frontend/js/controllers/chatController.js):
  chat, resumen y examen.
- [frontend/js/views/sidebarView.js](frontend/js/views/sidebarView.js):
  lista de documentos, eliminación y navegación móvil.

El orden de scripts en `frontend/index.html` es importante porque los módulos
se cargan como scripts globales, no como módulos ES.

## Reglas para modificar el proyecto

1. Mantener el MVC ultra modular y legible para programadores principiantes.
2. Usar nombres descriptivos en español o inglés consistente con el archivo
   existente; no introducir abreviaturas innecesarias.
3. Mantener controladores pequeños: coordinan, pero no deben contener lógica
   extensa de presentación, persistencia o infraestructura.
4. Reutilizar modelos, vistas y servicios existentes antes de crear helpers
   duplicados.
5. Validar entradas en frontend y backend. No confiar solo en la validación del
   navegador.
6. Conservar los encabezados CORS en respuestas normales y de error.
7. No cambiar el proveedor, modelo, runtime o recursos AWS sin revisar
   consecuencias de costo, permisos y despliegue.
8. No introducir frameworks o dependencias nuevas sin una necesidad clara.
9. No eliminar datos de `localStorage`, S3 o DynamoDB como parte de una prueba.
10. Actualizar este archivo y la documentación relacionada cuando cambie la
    arquitectura, el despliegue o el comportamiento público.

## Validación

Desde `backend\`:

```powershell
sam validate --lint
sam build --no-use-container
```

Para desplegar una modificación del backend:

```powershell
sam deploy `
  --stack-name tecnobot-nueva-cuenta `
  --region us-east-1 `
  --capabilities CAPABILITY_IAM `
  --resolve-s3 `
  --no-confirm-changeset `
  --no-fail-on-empty-changeset `
  --parameter-overrides FrontendOrigin="https://tecno-bot.netlify.app"
```

Antes de informar que CORS funciona, comprobar el preflight:

```powershell
curl.exe -i -X OPTIONS `
  "https://t0bzkfsz0e.execute-api.us-east-1.amazonaws.com/prod/upload" `
  -H "Origin: https://tecno-bot.netlify.app" `
  -H "Access-Control-Request-Method: POST" `
  -H "Access-Control-Request-Headers: content-type"
```

También debe probarse una carga real desde Netlify y una pregunta sobre ese
documento. Un `OPTIONS 200` por sí solo no demuestra que el flujo completo
funcione.

Para cambios de frontend Vanilla:

- comprobar la sintaxis con `node --check` sobre los controladores modificados;
- recargar Netlify con `Ctrl+F5` para evitar caché;
- verificar carga, selección, eliminación, chat, resumen y examen si el cambio
  toca esas áreas.

## Limitaciones conocidas

- Los documentos y conversaciones del frontend se guardan en el navegador del
  usuario mediante `localStorage`; no existe autenticación ni sincronización
  entre dispositivos.
- El frontend conserva como máximo 10 documentos locales recientes.
- El PDF debe ser menor o igual a 15 MB y contener texto extraíble.
- Los PDFs escaneados sin capa de texto son rechazados; no hay OCR.
- La recuperación es por palabras clave, por lo que puede fallar ante
  sinónimos o preguntas que no compartan vocabulario con el documento.
- La eliminación desde la barra lateral limpia el historial local, pero no
  elimina automáticamente el PDF ni los fragmentos del backend.
- La información de los documentos se almacena localmente; DynamoDB conserva
  los fragmentos del backend hasta su limpieza correspondiente.

## Prioridades pendientes

Cuando el usuario no indique otra prioridad, trabajar en este orden:

1. Corregir errores funcionales reproducibles del flujo PDF, chat o examen.
2. Mejorar accesibilidad, mensajes de error y experiencia móvil.
3. Mantener la modularidad del frontend sin aumentar innecesariamente la
   complejidad.
4. Revisar permisos IAM, retención de logs y presupuesto AWS.
5. Actualizar la documentación académica para que describa únicamente la
   arquitectura y funcionalidades realmente implementadas.
6. Considerar OCR o recuperación semántica solo después de evaluar costo,
   complejidad y beneficio académico.

Antes de implementar una mejora de infraestructura, revisar
[MIGRACION_AWS.md](MIGRACION_AWS.md) y [backend/template.yaml](backend/template.yaml).
