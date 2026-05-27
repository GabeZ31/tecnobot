import zipfile
import xml.etree.ElementTree as ET
import re

def normalize(s):
    # Convert to lowercase
    s = s.lower()
    # Normalize Spanish accents using unicode escapes
    s = s.replace(u"\u00e1", "a").replace(u"\u00e9", "e").replace(u"\u00ed", "i").replace(u"\u00f3", "o").replace(u"\u00fa", "u")
    s = s.replace(u"\u00f1", "n").replace(u"\u00fc", "u")
    # Remove non-alphanumeric characters
    s = re.sub(r'[^a-z0-9 ]', '', s)
    # Collapse multiple spaces
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

def register_all_namespaces(xml_string):
    namespaces = re.findall(r'xmlns:([^=]+)="([^"]+)"', xml_string)
    for prefix, uri in namespaces:
        ET.register_namespace(prefix, uri)
    default = re.search(r'xmlns="([^"]+)"', xml_string)
    if default:
        ET.register_namespace('', default.group(1))

def create_paragraph(text, style_id=None):
    w_ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    p = ET.Element(f"{{{w_ns}}}p")
    if style_id:
        pPr = ET.SubElement(p, f"{{{w_ns}}}pPr")
        pStyle = ET.SubElement(pPr, f"{{{w_ns}}}pStyle")
        pStyle.set(f"{{{w_ns}}}val", style_id)
    r = ET.SubElement(p, f"{{{w_ns}}}r")
    t = ET.SubElement(r, f"{{{w_ns}}}t")
    t.text = text
    return p

# Structured content for each section
content_map = {
    normalize("2. Agradecimientos"): [
        "Quiero expresar mi m\u00e1s sincero agradecimiento al Instituto Tecnol\u00f3gico de Ciudad Victoria por brindarme el espacio y los recursos necesarios para mi formaci\u00f3n como Ingeniero en Sistemas Computacionales. Agradezco especialmente al docente de la materia \"Plataforma de Desarrollo en la Nube\", M.C. [Nombre del Profesor], por su gu\u00eda constante, paciencia y retroalimentaci\u00f3n invaluable durante el dise\u00f1o y la implementaci\u00f3n de este proyecto. Asimismo, extiendo mi gratitud a mis compa\u00f1eros de equipo y de clase por el apoyo colaborativo y la retroalimentaci\u00f3n constructiva que permitieron refinar y perfeccionar la experiencia de usuario y la arquitectura de esta aplicación."
    ],
    normalize("3. Resumen"): [
        "El presente proyecto documenta el dise\u00f1o, desarrollo e implementaci\u00f3n de un asistente acad\u00e9mico interactivo de alto rendimiento que opera bajo una arquitectura completamente serverless en la nube de Amazon Web Services (AWS) y utiliza inteligencia artificial generativa a través del modelo Amazon Bedrock Nova Lite. La plataforma fue concebida para solventar la problem\u00e1tica de la sobrecarga de informaci\u00f3n y lecturas acad\u00e9micas a las que se enfrentan los estudiantes universitarios.",
        "Tecnobot se estructura en base al patr\u00f3n de dise\u00f1o de software Modelo-Vista-Controlador (MVC) en el lado del cliente (Frontend) utilizando tecnolog\u00edas web nativas (HTML5, CSS3, JavaScript Vanilla). Sus caracter\u00edsticas principales incluyen un m\u00f3dulo de biblioteca y organizaci\u00f3n por materias que permite crear carpetas colapsables e interactivas para clasificar documentos PDF en tiempo real, un canal de chat interactivo con memoria conversacional (context-packing) y un m\u00f3dulo de autoevaluaci\u00f3n interactiva (Quiz Studio) que genera ex\u00e1menes de opci\u00f3n m\u00faltiple estructurados en JSON con retroalimentaci\u00f3n correctiva inmediata e informes de rendimiento. Toda la persistencia de chats, materias y archivos indexados se almacena en el cliente a trav\u00e9s de LocalStorage, asegurando privacidad total y eliminando los costos de bases de datos persistentes remotas."
    ],
    normalize("5. Introduccion"): [
        "En la actualidad, los estudiantes y profesionales de \u00e1reas tecnol\u00f3gicas y cient\u00edficas se enfrentan a un volumen masivo de lecturas digitales. Manuales t\u00e9cnicos, art\u00edculos cient\u00edficos y normativas en formato PDF saturan los repositorios de aprendizaje, dificultando la retenci\u00f3n activa de conceptos clave. La lectura pasiva ha demostrado ser un m\u00e9todo de estudio ineficiente en comparaci\u00f3n con las metodolog\u00edas de autoevaluaci\u00f3n (Active Recall).",
        "Tecnobot nace como un asistente escolar inteligente de tipo Serverless que facilita la interacci\u00f3n directa, la extracci\u00f3n \u00e1gil de conceptos y la autoevaluaci\u00f3n inmediata de documentos cargados por el usuario. Integrando interfaces fluidas en el cliente con modelos de lenguaje de \u00faltima generaci\u00f3n en la nube de Amazon Web Services, el sistema proporciona una experiencia de aprendizaje personalizada de bajo coste y alta velocidad."
    ],
    normalize("6. Descripcion de la empresa u organizacion y del puesto o area del trabajo del estudiante"): [
        "La documentaci\u00f3n y desarrollo de este proyecto se sit\u00faan en el \u00e1mbito acad\u00e9mico del Instituto Tecnol\u00f3gico de Ciudad Victoria, en la carrera de Ingenier\u00eda en Sistemas Computacionales. Espec\u00edficamente, el proyecto se encuadra en la asignatura \"Plataforma de Desarrollo en la Nube\". El estudiante asume el rol de Arquitecto y Desarrollador Full-Stack, encargado del modelado de la arquitectura de la nube, la programaci\u00f3n del backend serverless en AWS, la implementaci\u00f3n del dise\u00f1o del frontend bajo la metodolog\u00eda MVC, y la auditor\u00eda de seguridad y persistencia de la informaci\u00f3n en el navegador."
    ],
    normalize("6.1 Antecedentes del Proyecto"): [
        "Hist\u00f3ricamente, el estudio de documentos digitales en el aula de clase requer\u00eda de software lector de PDFs est\u00e1tico (como Adobe Reader), donde el estudiante deb\u00eda subrayar y transcribir notas manualmente. Con la irrupci\u00f3n de las Inteligencias Artificiales Generativas y los modelos fundacionales de lenguaje (LLMs), surgieron plataformas comerciales que permiten interactuar con documentos (por ejemplo, ChatPDF o Claude.ai).",
        "No obstante, la mayor\u00eda de estas plataformas comerciales plantean inconvenientes severos de privacidad de los datos al almacenarse en servidores centralizados, costos operativos altos mediante suscripciones de pago y falta de herramientas de autoevaluaci\u00f3n activa interactiva enfocadas en la educaci\u00f3n. Tecnobot se desarroll\u00f3 para proveer una alternativa serverless, de c\u00f3digo abierto, econ\u00f3mica y que priorice la autoevaluaci\u00f3n activa y la privacidad absoluta."
    ],
    normalize("6.2 Alcance del Proyecto"): [
        "El proyecto Tecnobot comprende el desarrollo de una interfaz SPA responsiva utilizando Vanilla HTML5, CSS3 y JavaScript, implementando el patr\u00f3n MVC. Integra un sistema de carpetas colapsables e interactivas para ordenar PDFs, codificaci\u00f3n en Base64 para archivos de hasta 15MB y un motor de consultas con AWS Lambda y Amazon Bedrock (Nova Lite). El m\u00f3dulo de estudio activo genera cuestionarios JSON para ex\u00e1menes de opci\u00f3n m\u00faltiple, con persistencia privada mediante LocalStorage del navegador del cliente."
    ],
    normalize("6.3 Limitaciones"): [
        "Las limitaciones principales radican en la capacidad de almacenamiento local de LocalStorage (limitado a 5MB por dominio en la mayor\u00eda de navegadores), la dependencia obligatoria de conexi\u00f3n a Internet para invocar la API Gateway de AWS, las cuotas de procesamiento y tokens del modelo de Amazon Bedrock, y la falta de un renderizador de PDF integrado de manera nativa, limit\u00e1ndose al an\u00e1lisis y consultas textuales."
    ],
    normalize("7. Problemas a resolver, priorizandolos"): [
        "1. Sobrecarga de informaci\u00f3n y digesti\u00f3n lenta de manuales t\u00e9cnicos y lecturas extensas de ingenier\u00eda.",
        "2. Inexistencia de herramientas automatizadas y \u00e1giles de autoevaluaci\u00f3n activa estructurada sobre los documentos.",
        "3. Vulnerabilidad a la privacidad del estudiante al subir informaci\u00f3n escolar o institucional sensible a la nube.",
        "4. Altos costos fijos de mantenimiento en servidores dedicados tradicionales de TI en aplicaciones escolares."
    ],
    normalize("7.1 Analisis de Necesidades"): [
        "Se requiere una plataforma web accesible que procese el contenido textual de archivos PDFs acad\u00e9micos de manera r\u00e1pida, traduzca dicho texto a vectores de consulta interactivos y genere una experiencia de usuario orientada al aprendizaje din\u00e1mico. Asimismo, se necesita categorizar las lecturas por materias escolares y resguardar el historial conversacional de los chats y los resultados de ex\u00e1menes en el propio entorno del navegador del usuario."
    ],
    normalize("8. Objetivos (General y Especificos)"): [
        "Para guiar el desarrollo ordenado de Tecnobot, se definen un objetivo general enfocado en el valor educativo del proyecto, as\u00ed como una serie de metas espec\u00edficas de ingenier\u00eda de software."
    ],
    normalize("8.1. Objetivo General"): [
        "Desarrollar e implementar una plataforma web acad\u00e9mica de arquitectura serverless (Tecnobot) en la nube de Amazon Web Services, que organice de forma local documentos PDF y genere un entorno de estudio din\u00e1mico a trav\u00e9s de un chat contextual inteligente y ex\u00e1menes interactivos de autoevaluaci\u00f3n (Active Recall) utilizando el modelo de IA Amazon Bedrock Nova Lite."
    ],
    normalize("8.2. Objetivos Especificos"): [
        "1. Dise\u00f1ar e implementar una interfaz de usuario responsiva utilizando variables CSS y animaciones fluidas, con pantalla de cover page de entrada.",
        "2. Programar la l\u00f3gica del cliente bajo el patr\u00f3n MVC (Model-View-Controller) en Vanilla JavaScript puro, aislando el DOM de la persistencia de datos.",
        "3. Estructurar endpoints REST en AWS API Gateway y Lambdas para procesamiento ef\u00edmero de PDF e inferencias as\u00edncronas con Amazon Bedrock.",
        "4. Construir un organizador din\u00e1mico de carpetas de materias colapsables en el sidebar.",
        "5. Desarrollar la l\u00f3gica de ex\u00e1menes interactivos a partir del parseo y validaci\u00f3n de estructuras JSON provistas por Bedrock Nova Lite.",
        "6. Configurar la base de datos local en LocalStorage de manera que mantenga el historial conversacional y estados de materias de forma aislada y privada."
    ],
    normalize("9. Justificacion"): [
        "Tecnobot se justifica al optimizar el tiempo de estudio de los estudiantes (fomentando t\u00e9cnicas de aprendizaje activo) y reducir a cero los costos de servidores dedicados (pago bajo demanda serverless), protegiendo la confidencialidad de la informaci\u00f3n de los usuarios al delegar el almacenamiento a la base de datos local de su navegador."
    ],
    normalize("9.1 Impacto Social y Tecnologico"): [
        "Impacto Social: Democratiza las herramientas de tutor\u00eda digital inteligente, ofreciendo igualdad de oportunidades a estudiantes universitarios sin requerir suscripciones costosas ni registros obligatorios.",
        "Impacto Tecnol\u00f3gico: Fomenta el desarrollo \u00e1gil de software ecol\u00f3gico y privado al utilizar recursos locales de c\u00f3mputo del cliente y servicios de nube serverless de consumo granular."
    ],
    normalize("10. Marco Teorico (fundamentos teoricos)"): [
        "El marco te\u00f3rico proporciona las bases conceptuales para entender el procesamiento de lenguaje natural (NLP), arquitecturas en la nube serverless, patrones de dise\u00f1o de software y normativas asociadas."
    ],
    normalize("10.1 Tecnologia y Agricultura de Precision (Agricultura 3.0)"): [
        "Aunque Tecnobot es un asistente de estudio gen\u00e9rico, su aplicaci\u00f3n en la Agricultura de Precisi\u00f3n o Agricultura 3.0 es altamente beneficiosa. Permite cargar manuales t\u00e9cnicos, vadem\u00e9cums agr\u00edcolas y gu\u00edas bot\u00e1nicas de control de plagas en su biblioteca. Al interrogar a la IA de Tecnobot en lenguaje natural, se reduce dr\u00e1sticamente el tiempo necesario para consultar especificaciones t\u00e9cnicas complejas de riego o dosificación, facilitando la toma de decisiones en el campo basadas en datos cient\u00edficos."
    ],
    normalize("10.2 Internet de las Cosas (IoT) y Microcontroladores"): [
        "El Internet de las Cosas (IoT) se compone de sensores y microcontroladores (como el ESP32) que transmiten datos como humedad o temperatura (v\u00eda DHT11). Las bit\u00e1coras de estos sensores suelen exportarse en reportes PDF estructurados de telemetr\u00eda mensual. Tecnobot actúa como el cerebro de an\u00e1lisis inteligente: al importar las bit\u00e1coras, el usuario puede pedir al chat interactivo an\u00e1lisis avanzados de telemetr\u00eda sin requerir complejas bases de datos relacionales, traduciendo datos de IoT en conocimientos l\u00f3gicos."
    ],
    normalize("10.3 Computacion en la Nube y Arquitectura MVC"): [
        "La arquitectura del backend se sustenta en AWS API Gateway (administraci\u00f3n de endpoints HTTP), AWS Lambda (Function-as-a-Service stateless para procesamiento ef\u00edmero) y Amazon Bedrock (para el modelo de inferencias de lenguaje Nova Lite). En el frontend, el patr\u00f3n MVC se desglosa en: Modelo (documentModel.js y chatModel.js controlando LocalStorage), Vista (index.html, main.css y components.css definiendo el DOM) y Controlador (uploadController.js y chatController.js escuchando eventos y coordinando flujos de datos)."
    ],
    normalize("10.4 Normativa de Inocuidad y Calidad en la Produccion Agricola"): [
        "El cumplimiento de normativas de inocuidad (control de plagas, uso de agroqu\u00edmicos, etc.) requiere que los productores agr\u00edcolas conozcan manuales regulatorios densos. La carga de estas normativas en Tecnobot permite realizar consultas y auditor\u00edas r\u00e1pidas en lenguaje natural, garantizando que los procedimientos del rancho cumplan con los est\u00e1ndares exigidos."
    ],
    normalize("10.5 Gestion de la Calidad y Seguridad Alimentaria (Certificaciones ISO)"): [
        "Las certificaciones internacionales como ISO 9001 (Calidad) e ISO 22000 (Seguridad Alimentaria) exigen documentaci\u00f3n exhaustiva de procesos. Tecnobot sirve como herramienta de auditor\u00eda interactiva: los auditores o personal de calidad pueden cargar el manual de procedimientos interno y contrastarlo mediante el chat de IA con los requisitos espec\u00edficos de las normas ISO, asegurando la conformidad e identificando brechas de cumplimiento de forma autom\u00e1tica."
    ],
    normalize("11. Procedimiento y descripcion de las actividades realizadas"): [
        "El proceso de desarrollo se dividi\u00f3 en fases ordenadas de dise\u00f1o de la interfaz web, implementaci\u00f3n del patr\u00f3n MVC, despliegue del backend serverless en AWS y la estructuraci\u00f3n del almacenamiento en el cliente."
    ],
    normalize("11.1 Configuracion de Infraestructura y Persistencia de Datos"): [
        "El backend serverless se configur\u00f3 en AWS mediante SAM. Se definieron dos Lambdas conectadas a API Gateway (/upload y /ask). Toda la persistencia reside en LocalStorage mediante claves estruturadas: tecnobot_documents (lista de archivos y categor\u00edas), tecnobot_categories (lista de materias) y tecnobot_chat_[documentId] (historial de mensajes de chat)."
    ],
    normalize("11.2.1 Directorio Raiz y Entorno Publico"): [
        "El directorio ra\u00edz de la aplicaci\u00f3n distribuye las responsabilidades en dos \u00e1reas: backend/ (contiene la definici\u00f3n serverless de AWS Lambda y plantillas CloudFormation) y frontend/ (contiene los activos est\u00e1ticos p\u00fablicos, estilos de dise\u00f1o y l\u00f3gica MVC)."
    ],
    normalize("Figura 2: Directorio Raiz"): [
        "[Estructura del Proyecto en el Workspace: /backend/template.yaml, /backend/shared/, /backend/ask/, /backend/upload/, /frontend/index.html, /frontend/css/main.css, /frontend/css/components.css, /frontend/js/models/, /frontend/js/controllers/, /frontend/js/services/]"
    ],
    normalize("11.2.2 Nucleo de la Aplicacion (src/)"): [
        "El n\u00facleo reside en frontend/js/. Incluye services/apiService.js para peticiones de red as\u00edncronas, models/documentModel.js y chatModel.js para reglas de negocio y base de datos local, y controllers/uploadController.js y chatController.js para flujos interactivos y eventos del DOM."
    ],
    normalize("Figura 3. Nucleo"): [
        "[Ubicación f\u00edsica del c\u00f3digo fuente JavaScript en frontend/js/ estructurado en subcarpetas /models, /controllers y /services]"
    ],
    normalize("11.2.3 Sistema de Plantillas y Vistas"): [
        "La interfaz es de tipo Single Page Application (SPA). El archivo index.html contiene el esqueleto de las vistas de carga y chat. Los estilos css/main.css y css/components.css definen el dise\u00f1o visual premium y responsivo de componentes."
    ],
    normalize("Figura 4. Plantillas"): [
        "[Archivo frontend/index.html que declara las plantillas HTML del chat, resumen, barra lateral e intro-cover]"
    ],
    normalize("11.3 Diagramacion UML y Modelado del Sistema"): [
        "Se model\u00f3 la l\u00f3gica operacional mediante diagramas UML y flujos secuenciales para garantizar el correcto flujo de datos as\u00edncronos y asilados."
    ],
    normalize("11.3.1 Diagrama de Flujo de Modulos"): [
        "El diagrama muestra el camino de un PDF desde su carga drag & drop en el cliente, codificaci\u00f3n Base64, env\u00edo as\u00edncrono a AWS, respuesta, y las opciones posteriores de chatear, resumir o iniciar autoevaluaci\u00f3n."
    ],
    normalize("Figura 5. Diagrama de Flujo"): [
        "[Diagrama de flujo detallando carga, indexaci\u00f3n en backend, almacenamiento de materias en LocalStorage, y bifurcaci\u00f3n de flujos de chat y cuestionario JSON interactivo]"
    ],
    normalize("11.3.2 Diagrama de Despliegue"): [
        "El diagrama de despliegue detalla la topología de la nube serverless. Las llamadas HTTPS conectan el cliente (navegador del usuario con base de datos LocalStorage) con los endpoints de API Gateway, las funciones Lambda y los modelos fundacionales de Amazon Bedrock."
    ],
    normalize("Figura 6. Diagrama de Despliegue"): [
        "[Estructura de Despliegue: Dispositivo Cliente -> HTTPS -> Amazon API Gateway -> Lambda Functions (Upload/Ask) -> IAM Roles -> Amazon Bedrock Nova Lite]"
    ],
    normalize("11.3.3 Diagrama de Actividad"): [
        "Mapea el comportamiento din\u00e1mico del Quiz Studio: solicitud del JSON del cuestionario, parseo en el controlador, presentaci\u00f3n de preguntas secuenciales, captura de eventos click en opciones, comparaci\u00f3n l\u00f3gica con la respuesta correcta, renderizado de colores verde/rojo con justificaci\u00f3n detallada y presentaci\u00f3n final de puntajes."
    ],
    normalize("Figura 7. Diagrama de Actividad"): [
        "[Diagrama de actividad que modela el ciclo de vida del examen: Cargar -> Parsear -> Renderizar -> Validar -> Mostrar Justificación -> Siguiente -> Mostrar Score]"
    ],
    normalize("11.3.4 Diagrama de Estados"): [
        "Define los estados de la interfaz de usuario: Cover (intro) -> Uploading (barra de progreso activa) -> Chat (interacci\u00f3n conversacional) -> Quiz Generando -> Quiz Pregunta -> Quiz Retroalimentaci\u00f3n -> Resultados."
    ],
    normalize("Figura 8. Diagrama de Estados"): [
        "[Definición de estados de la interfaz web controlada mediante clases CSS .hidden e inyección dinámica del DOM]"
    ],
    normalize("12. Resultados, prototipos y manuales"): [
        "Los resultados de la ejecuci\u00f3n e integraci\u00f3n de Tecnobot reflejan un sistema premium de gran fluidez visual y alta fiabilidad operacional."
    ],
    normalize("12.1 Modulo de Seguridad"): [
        "La seguridad en Tecnobot elimina bases de datos persistentes en la nube. Las consultas se transmiten por t\u00faneles seguros HTTPS, las APIs del backend est\u00e1n resguardadas mediante roles IAM de AWS y las claves de Bedrock nunca se exponen al cliente."
    ],
    normalize("Figura 9. Inicio de sesion"): [
        "[Prototipo de pantalla de presentación (intro-cover) con animaciones de orbes de luz HSL interactivos y entrada al espacio local seguro]"
    ],
    normalize("12.1.1 Modulo de Gestion de Usuarios"): [
        "No existe registro en la base de datos remota; la sesi\u00f3n se inicializa localmente en el almacenamiento web de cada navegador, ofreciendo aislamiento total de documentos y resguardo de la privacidad del estudiante de forma instant\u00e1nea."
    ],
    normalize("Figura 10. Registro de usuarios"): [
        "[Representación visual de la inicialización de LocalStorage con la llave tecnobot_documents al ingresar a la plataforma]"
    ],
    normalize("12.2 Panel de Control y Analitica General"): [
        "El dashboard est\u00e1 estructurado de manera que el estudiante visualice el listado de materias, acceda a los PDFs con un click, escriba preguntas en una caja limpia e inicie ex\u00e1menes interactivos desde el men\u00fa de pesta\u00f1as superior."
    ],
    normalize("Figura 11: Dashboard principal"): [
        "[Prototipo de la interfaz principal en Vista B que muestra la sidebar de carpetas colapsables y la pantalla del chat con el archivo activo]"
    ],
    normalize("12.3 Modulo Diccionario de Cultivos e Informacion Botanica"): [
        "Mapeado a la Biblioteca local de PDFs de Tecnobot: permite agrupar archivos por materias de estudio, subir nuevos documentos y organizar la información."
    ],
    normalize("Figura 12. Diccionario de cultivos"): [
        "[Prototipo del menú de la biblioteca de materias colapsables (Matemáticas, General, Proyectos) en la barra lateral]"
    ],
    normalize("Figura 13. Registro de Cultivos"): [
        "[Prototipo de la zona de subida drag & drop con barra de progreso interior que parpadea y simula la carga asíncrona exitosa]"
    ],
    normalize("Figura 14. Edicion de cultivos"): [
        "[Prototipo del menú de selección select en la sidebar para mover un PDF de una materia a otra de manera dinámica e interactiva]"
    ],
    normalize("Figura 15. Ficha Tecnica"): [
        "[Detalle de la cabecera del chat con el badge de archivo activo mostrando ícono SVG y nombre del documento]"
    ],
    normalize("12.4 Modulo de Interaccion Comunitaria (Feed Social)"): [
        "Corresponde al feed conversacional del chat. Permite el env\u00edo de preguntas y renderiza burbujas de conversaci\u00f3n con soporte Markdown para listas, c\u00f3digo y textos en negrita."
    ],
    normalize("Figura 16. Feed Social"): [
        "[Prototipo de las burbujas de diálogo del chat con color de acento azul para usuario y color blanco con bordes grises para el bot]"
    ],
    normalize("12.5 Modulo de Creacion de Contenido (Publicar)"): [
        "Formulario drag & drop con bordes discontinuados reactivos y bot\u00f3n explorar. El bot\u00f3n cambia de color y contiene un llenado animado interior as\u00edncrono que indica el progreso de procesamiento."
    ],
    normalize("Figura 17. Publicar"): [
        "[Visualización del botón Explorar archivos mostrando la barra de progreso interior Procesando... 60%]"
    ],
    normalize("12.6 Modulo de Monitoreo IoT y Telemetria Ambiental"): [
        "Mapeado al Active Recall Quiz Studio: monitorea las respuestas del estudiante en ex\u00e1menes interactivos generados por Bedrock, calculando porcentajes de aciertos y desplegando retroalimentaci\u00f3n correctiva."
    ],
    normalize("Figura 18: Modulo de Monitoreo"): [
        "[Prototipo de la pantalla de bienvenida al examen interactiva en la pestaña Estudiar]"
    ],
    normalize("Figura 19. Registro de Sensores"): [
        "[Prototipo del examen mostrando una pregunta, las opciones inhabilitadas tras el clic, y la caja verde/roja de justificación teórica]"
    ],
    normalize("Figura 20. El Dashboard de Monitoreo"): [
        "[Prototipo de la pantalla de resultados del examen mostrando el porcentaje final de aciertos, calificación y botón Reintentar]"
    ],
    normalize("13. Actividades Sociales realizadas en la empresa u organizacion"): [
        "El desarrollo del software integr\u00f3 un equipo enfocado en el dise\u00f1o \u00f3ptimo de la nube, la programaci\u00f3n modular y la auditor\u00eda de seguridad inform\u00e1tica."
    ],
    normalize("13.1 Colaboracion en Programacion Web y Patrones de Diseno"): [
        "Se colabor\u00f3 activamente en la implementaci\u00f3n del patr\u00f3n MVC y la creaci\u00f3n de una hoja de estilos CSS limpia basada en variables personalizadas HSL para mejorar la mantenibilidad y visualizaci\u00f3n premium."
    ],
    normalize("13.2 Diseno y Administracion Colaborativa de Base de Datos"): [
        "Se defini\u00f3 la estructura de datos JSON en LocalStorage, administrando cascadas de borrado en los chats asociados para no saturar los 5MB de espacio local permitidos por el explorador."
    ],
    normalize("13.3 Auditoria de Seguridad e Integridad de la Informacion"): [
        "Se audit\u00f3 la integridad de la API asegurando que las llaves de AWS no viajen al cliente, que los PDFs no queden guardados temporalmente en la Lambda (procesamiento ef\u00edmero) y sanitizando textos contra inyecciones XSS."
    ],
    normalize("13.4 Despliegue y Sincronizacion en la Nube"): [
        "Se empaquet\u00f3 la infraestructura serverless con AWS SAM y se enrutaron los endpoints CORS a producci\u00f3n, garantizando disponibilidad y escalabilidad autom\u00e1tica sin costes fijos de hosting."
    ],
    normalize("Capitulo VI: Conclusiones"): [
        "1. La arquitectura Serverless en AWS (API Gateway, Lambda, Bedrock Nova Lite) permite crear plataformas inteligentes a un coste operativo de cero d\u00f3lares mensuales bajo el consumo granular FaaS.",
        "2. El patr\u00f3n MVC en el frontend independiza el estado y facilita la adici\u00f3n de nuevas caracter\u00edsticas interactivas en JavaScript Vanilla sin frameworks pesados.",
        "3. La persistencia en LocalStorage del cliente resguarda la privacidad absoluta del estudiante, eliminando la filtraci\u00f3n de documentos o chats.",
        "4. La metodolog\u00eda de Active Recall integrada a trav\u00e9s de cuestionarios interactivos mejora de forma dr\u00e1stica la retención de conocimientos te\u00f3ricos y t\u00e9cnicos de los estudiantes."
    ]
}

# Open original docx
with zipfile.ZipFile('Plantilla_Documentacion_Proyecto (1).docx', 'r') as yin:
    with zipfile.ZipFile('Documentacion_Proyecto_Tecnobot_Final_v2.docx', 'w') as yout:
        for item in yin.infolist():
            data = yin.read(item.filename)
            if item.filename == 'word/document.xml':
                # Process the XML
                xml_str_original = data.decode('utf-8')
                
                # Get the original header up to <w:body>
                original_header_split = xml_str_original.split("<w:body>")
                original_header = original_header_split[0] + "<w:body>"
                
                register_all_namespaces(xml_str_original)
                root = ET.fromstring(data)
                
                w_ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                body = root.find(f".//{{{w_ns}}}body")
                
                new_children = []
                author_count = 0
                
                # Iterate and inject
                for child in list(body):
                    if child.tag == f"{{{w_ns}}}p":
                        # Get full text
                        t_elements = child.findall(f".//{{{w_ns}}}t")
                        text = "".join(t.text for t in t_elements if t.text).strip()
                        
                        # Cover page replacements
                        if "[Nombre del Proyecto]" in text:
                            for t in t_elements:
                                if t.text and "[Nombre del Proyecto]" in t.text:
                                    t.text = t.text.replace("[Nombre del Proyecto]", "Tecnobot")
                            text = text.replace("[Nombre del Proyecto]", "Tecnobot")
                            
                        if "[Nombre Completo]" in text:
                            if author_count == 0:
                                # Replace first one with Cesar
                                for t in t_elements:
                                    if t.text and "[Nombre Completo]" in t.text:
                                        t.text = t.text.replace("[Nombre Completo]", "Cesar").replace("[N\u00famero de Control]", "").replace("[Nmero de Control]", "")
                                    elif t.text:
                                        t.text = t.text.replace("[N\u00famero de Control]", "").replace("[Nmero de Control]", "")
                                author_count += 1
                            else:
                                # Clear other slots
                                for t in t_elements:
                                    t.text = ""
                                author_count += 1
                                
                        if "[mes] de [a\u00f1o]" in text or "[mes] de [ao]" in text or "[mes]" in text or "[ao]" in text or "[a\u00f1o]" in text:
                            for t in t_elements:
                                if t.text and ("[mes]" in t.text or "[ao]" in t.text or "[a\u00f1o]" in t.text or "de" in t.text):
                                    t.text = "Mayo de 2026"
                                    break
                            for t in t_elements:
                                if t.text and t.text != "Mayo de 2026" and ("[mes]" in t.text or "[ao]" in t.text or "[a\u00f1o]" in t.text):
                                    t.text = ""
                            text = "Mayo de 2026"
                        
                        # Add the original paragraph
                        new_children.append(child)
                        
                        # Clean and normalize text
                        norm_text = normalize(text)
                        
                        # Find matches in content map
                        matched_key = None
                        for key in content_map:
                            if norm_text == key or norm_text.endswith(key) or key in norm_text:
                                matched_key = key
                                break
                        
                        if matched_key:
                            print(f"Matched and injecting for heading: {text}")
                            # Inject paragraphs
                            for para_text in content_map[matched_key]:
                                new_p = create_paragraph(para_text)
                                new_children.append(new_p)
                    else:
                        new_children.append(child)
                
                # Clear and append
                body.clear()
                for c in new_children:
                    body.append(c)
                
                # Serialize the XML tree
                serialized_xml = ET.tostring(root, encoding='utf-8').decode('utf-8')
                
                # Extract body text from serialized XML
                serialized_body = serialized_xml.split("<w:body>")[1]
                
                # Stitch the original header (containing all namespace declarations) with the new body
                final_xml_str = original_header + serialized_body
                data = final_xml_str.encode('utf-8')
            
            yout.writestr(item, data)

print("Documentación generada con \u00e9xito en Documentacion_Proyecto_Tecnobot_Final_v2.docx!")
