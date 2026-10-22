# Migración de Tecnobot a una nueva cuenta de AWS

Esta guía describe la migración de Tecnobot desde la cuenta de AWS actual hacia una cuenta nueva. La migración se hará en dos partes:

- **Tu parte:** preparar la nueva cuenta y proporcionar información no sensible.
- **Nuestra parte aquí:** ajustar la configuración del proyecto, desplegar la infraestructura, publicar el frontend y verificar el funcionamiento.

> **Seguridad:** nunca compartas contraseñas, claves secretas, tokens, archivos `.pem`, códigos MFA ni credenciales IAM por el chat. Para trabajar con AWS, configura las credenciales localmente en tu equipo mediante AWS CLI.

## 1. Decidir qué se conservará

Antes de comenzar, confirma si necesitas conservar los documentos que ya fueron cargados en la cuenta anterior.

### Opción A: comenzar desde cero

Es la opción más sencilla:

- Se crea infraestructura nueva.
- Los PDFs se vuelven a subir en la nueva cuenta.
- Los chats antiguos no se reutilizan automáticamente.
- No se requiere acceso a los datos de la cuenta anterior.

### Opción B: conservar documentos y datos

Además de la infraestructura, se deben migrar:

- Los PDFs almacenados en S3.
- Los fragmentos de texto almacenados en DynamoDB.
- La relación entre cada `documentId`, sus PDFs y sus fragmentos.

Para esta opción todavía debes conservar acceso a la cuenta anterior hasta terminar la migración.

## 2. Lo que debes preparar tú en la nueva cuenta

### 2.1 Crear o seleccionar la cuenta de AWS

Debes contar con:

- Acceso a la nueva cuenta.
- Método de pago activo.
- Usuario IAM o rol con permisos administrativos temporales para el despliegue.
- MFA habilitado, preferentemente.
- Una región AWS para el proyecto.

Recomendación inicial: utilizar `us-east-1`, porque es la región configurada actualmente y normalmente ofrece amplia disponibilidad de servicios.

### 2.2 Instalar herramientas localmente

Instala en tu computadora:

- AWS CLI.
- AWS SAM CLI.
- Docker Desktop, si SAM lo solicita durante el empaquetado.
- Git.
- Python compatible con las dependencias del backend.

Verifica las instalaciones con:

```powershell
aws --version
sam --version
docker --version
git --version
python --version
```

### 2.3 Configurar AWS CLI

Configura las credenciales localmente:

```powershell
aws configure
```

Proporciona únicamente en tu computadora:

- AWS Access Key ID.
- AWS Secret Access Key.
- Región predeterminada.
- Formato de salida, por ejemplo `json`.

Comprueba que la sesión funciona:

```powershell
aws sts get-caller-identity
```

No pegues aquí las claves. Solo comparte el resultado no sensible si necesitas que revisemos la cuenta, ocultando cualquier dato que prefieras no mostrar.

## 3. Verificar Amazon Bedrock

En las cuentas comerciales de AWS, los modelos fundacionales serverless se habilitan automáticamente al invocarlos por primera vez. Ya no es necesario activar manualmente el acceso desde la página anterior de Model access.

Verifica lo siguiente en la región elegida:

```text
amazon.nova-lite-v1:0
```

Tecnobot utiliza este modelo en `backend/ask/handler.py`. Para la primera prueba puedes abrir el modelo desde el catálogo o ejecutar una pregunta desde la aplicación. La función Lambda necesita el permiso IAM:

```text
bedrock:InvokeModel
```

La plantilla ya declara este permiso para `AskFunction`. Si la primera invocación falla, revisaremos la región, el nombre del modelo y los permisos IAM. Los modelos de Anthropic, Marketplace o cuentas con políticas restrictivas pueden requerir pasos adicionales, pero no aplican al modelo Nova Lite usado actualmente.

## 4. Información que debes proporcionarme

Cuando completes la preparación, envíame estos datos:

```text
Tipo de migración: desde cero / conservar datos
Región AWS:
¿AWS CLI funciona?: sí / no
¿SAM CLI funciona?: sí / no
¿Docker funciona?: sí / no / no fue necesario
¿Bedrock Nova Lite está habilitado?: sí / no
Nombre deseado para el bucket de PDFs:
Nombre deseado para el bucket del frontend:
Nombre deseado para el stack de CloudFormation: 
```

También puedes enviar las salidas de estos comandos, sin compartir credenciales:

```powershell
aws sts get-caller-identity
aws configure get region
sam --version
```

El resultado de `aws sts get-caller-identity` debe contener únicamente información de identidad de la cuenta/rol. No envíes archivos de credenciales ni la salida de comandos que impriman secretos.

## 5. Lo que haré de este lado

Después de recibir la información anterior, realizaré estas tareas en el repositorio:

1. Revisar la plantilla de infraestructura en `backend/template.yaml`.
2. Cambiar nombres de buckets si los actuales no se usarán.
3. Revisar región, permisos y variables de entorno.
4. Evitar nombres rígidos que puedan provocar conflictos entre cuentas.
5. Preparar el despliegue del backend mediante AWS SAM.
6. Obtener la nueva URL de API Gateway.
7. Actualizar `frontend/js/services/apiService.js` con la URL nueva.
8. Publicar el frontend en el bucket nuevo.
9. Verificar la distribución de CloudFront.
10. Probar la carga de un PDF.
11. Probar una pregunta al documento.
12. Probar el resumen y el examen interactivo.
13. Revisar errores de permisos, CORS, Lambda, DynamoDB, S3 y Bedrock.
14. Dejar anotados los identificadores y URLs del nuevo entorno.

Las modificaciones principales estarán relacionadas con:

- `backend/template.yaml`
- `frontend/js/services/apiService.js`

No será necesario cambiar la lógica principal de extracción de PDF o de conversación, salvo que una prueba revele un problema específico.

## 6. Despliegue inicial que realizaremos

Desde la raíz del proyecto:

```powershell
Set-Location C:\Users\Cesar\Desktop\Residencias\backend
sam build
sam deploy --guided
```

Durante el despliegue se solicitarán datos como:

- Nombre del stack.
- Región.
- Bucket de artefactos de SAM.
- Confirmación para crear roles IAM.
- Permiso para guardar la configuración del despliegue.

La opción para autorizar la creación de roles IAM debe aceptarse, porque las funciones Lambda necesitan permisos para acceder a S3, DynamoDB y Bedrock.

## 7. Datos que se generarán en la nueva cuenta

El despliegue creará nuevos recursos, entre ellos:

- Bucket de PDFs.
- Bucket del frontend.
- Tabla DynamoDB.
- Función Lambda de carga.
- Función Lambda de preguntas.
- API Gateway.
- Roles IAM.
- Distribución CloudFront.

La URL de API Gateway será diferente de la actual. Por eso se actualizará:

```text
frontend/js/services/apiService.js
```

## 8. Pruebas de aceptación

La migración se considerará funcional cuando se compruebe lo siguiente:

- La página carga desde el nuevo frontend.
- Se puede seleccionar un PDF válido.
- Un PDF de hasta 15 MB se procesa correctamente.
- Se obtiene un `documentId`.
- El PDF aparece en el nuevo bucket S3.
- Los fragmentos aparecen en la nueva tabla DynamoDB.
- `/ask` devuelve una respuesta de Bedrock.
- El resumen funciona.
- El examen interactivo funciona.
- El historial local funciona en el navegador.
- No aparecen errores de CORS en el navegador.

## 9. Migración de datos existentes

Si eliges conservar datos, no cierres la cuenta anterior todavía.

El orden recomendado será:

1. Desplegar y probar la infraestructura nueva.
2. Inventariar los objetos del bucket anterior.
3. Copiar los PDFs al bucket nuevo.
4. Exportar o leer los registros de DynamoDB anterior.
5. Importar los registros a la tabla nueva.
6. Verificar que los `documentId` coincidan.
7. Probar preguntas sobre documentos migrados.
8. Mantener ambas cuentas disponibles durante la validación.
9. Retirar la infraestructura anterior solo después de confirmar que todo funciona.

Los chats del navegador están en `localStorage`. Copiar el frontend no copia automáticamente los datos del navegador ni hace que los `documentId` antiguos apunten a los datos nuevos.

## 10. Costos y limpieza de la cuenta anterior

Antes de retirar la cuenta anterior:

- Revisa costos de S3, DynamoDB, Lambda, API Gateway, Bedrock y CloudFront.
- Confirma que no existan otros proyectos importantes en esa cuenta.
- Conserva un respaldo de los datos necesarios.
- Elimina recursos antiguos solo después de validar la nueva instalación.
- Revisa especialmente buckets S3, distribuciones CloudFront y tablas DynamoDB.

## 11. Entorno recomendado para ejecutar el despliegue

Para esta migración se recomienda ejecutar AWS CLI y AWS SAM desde tu **PC Windows**, no desde una instancia EC2.

La instancia EC2 no es necesaria porque Tecnobot no se despliega como un servidor tradicional. La plantilla crea servicios administrados y serverless:

- Lambda.
- API Gateway.
- S3.
- DynamoDB.
- CloudFront.

La EC2 solo sería útil para un caso especial, como ejecutar un servidor permanente, compilar herramientas específicas o alojar otro componente. Mantenerla encendida también puede generar costos innecesarios.

La ruta recomendada es:

```text
PC Windows
  ↓ AWS CLI / AWS SAM
Cuenta nueva de AWS
  ↓
Lambda + API Gateway + S3 + DynamoDB + CloudFront + Bedrock
```

## 12. Primer paso pendiente

Para iniciar la migración, prepara tu PC y ejecuta los comandos de la sección siguiente. Después responde con la información de la sección **4. Información que debes proporcionarme**. No incluyas credenciales ni secretos.

### Comandos iniciales en Windows

Abre PowerShell en tu PC y comprueba si las herramientas ya están instaladas:

```powershell
aws --version
sam --version
docker --version
git --version
python --version
```

Si falta AWS CLI, puedes instalarlo con:

```powershell
winget install -e --id Amazon.AWSCLI
```

Si falta AWS SAM CLI:

```powershell
winget install -e --id Amazon.SAM-CLI
```

Después de instalar una herramienta, cierra y vuelve a abrir PowerShell.

Configura las credenciales en tu propia computadora:

```powershell
aws configure
```

Después valida el acceso sin mostrar claves:

```powershell
aws sts get-caller-identity
aws configure get region
sam --version
```

Puedes compartir la salida de esos comandos, pero nunca compartas el contenido de `~/.aws/credentials`, claves secretas, tokens ni códigos MFA.

## 13. Ruta alternativa: Netlify para el frontend

Si el frontend se alojará en Netlify, no será necesario crear el bucket S3 del frontend ni la distribución CloudFront. AWS seguirá alojando:

- Lambda.
- API Gateway.
- S3 para PDFs.
- DynamoDB.
- IAM.
- Amazon Bedrock.

La secuencia específica será:

1. Verificar que `amazon.nova-lite-v1:0` esté disponible en Bedrock.
2. Desplegar el backend con SAM.
3. Obtener la URL de API Gateway.
4. Configurar esa URL en `frontend/js/services/apiService.js`.
5. Configurar CORS para el dominio de Netlify.
6. Publicar `frontend/` en Netlify.
7. Probar carga, preguntas, resumen y examen.

Antes del primer despliegue se deberá ajustar `backend/template.yaml` para no crear `FrontendBucket`, `FrontendBucketPolicy` ni `CloudFrontDistribution`.

Con esos datos prepararé los cambios necesarios y te indicaré el siguiente comando seguro que debes ejecutar.
