const PromptService = {
  summary() {
    return 'Resume los puntos principales de este documento en una lista';
  },

  conversationalQuestion(history, question) {
    if (history.length <= 2) return question;

    const recentMessages = history.slice(-5, -1)
      .map(message => `${message.role === 'user' ? 'Usuario' : 'Asistente'}: ${message.content}`)
      .join('\n');

    return `Historial reciente de la conversación:
${recentMessages}

Nueva pregunta (responde a esta): ${question}

Instrucción de Clarificación: Si la pregunta es ambigua o no se puede contestar basándote en el documento, pídele educadamente una aclaración o pregunta al usuario para refinar el contexto.`;
  },

  exam(fileName) {
    return `
Actúa como un profesor experto y generador de exámenes interactivos. Analiza el documento y extrae los conceptos clave.
Genera un examen de opción múltiple con exactamente 10 preguntas bien distribuidas.
Debes devolver ÚNICAMENTE un objeto JSON válido que cumpla estrictamente con el siguiente formato, sin prefacios, sin explicaciones externas, y sin bloques markdown de código:
{
  "titulo": "Examen: ${fileName || 'Documento sin título'}",
  "preguntas": [
    {
      "id": 1,
      "tema": "Nombre del tema o concepto",
      "pregunta": "¿Texto de la pregunta?",
      "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "respuesta_correcta": 0,
      "explicacion": "Explicación breve y valiosa de por qué esa opción es correcta."
    }
  ]
}
Importante: 'respuesta_correcta' debe ser el índice 0, 1, 2 o 3 de la opción correcta. Evita dobles negaciones y usa opciones incorrectas creíbles.
`;
  },

  flashcards(fileName) {
    return `
Actúa como profesor de repaso activo. Analiza el documento "${fileName || 'Documento'}".
Genera exactamente 8 tarjetas de estudio útiles.
Devuelve ÚNICAMENTE JSON válido, sin bloques markdown y sin texto adicional:
{
  "tarjetas": [
    {
      "pregunta": "Pregunta o concepto breve",
      "respuesta": "Respuesta clara basada en el documento"
    }
  ]
}
Las preguntas deben comprobar comprensión real, no detalles triviales.
`;
  },

  apa(fileName) {
    return `
Analiza este PDF y extrae únicamente los datos bibliográficos necesarios para citar el documento en APA 7.
Devuelve ÚNICAMENTE un objeto JSON válido, sin texto fuera del JSON y sin bloques de código:
{
  "autor": "Apellido, Inicial(es)",
  "ano": "AAAA",
  "titulo": "Título del documento",
  "editorial": "Editorial, institución o nombre del sitio",
  "url": "URL o DOI disponible en el documento",
  "nota": "Información breve sobre la fiabilidad o limitación de los datos extraídos"
}
Si un dato no aparece claramente, usa una cadena vacía. No inventes autores, años, editoriales ni URLs.
Nombre de archivo disponible: "${fileName || 'Documento'}".
`;
  },

  diagram(fileName, diagramType) {
    const names = {
      mindmap: 'mapa conceptual',
      flowchart: 'diagrama de flujo',
      erDiagram: 'diagrama entidad-relación',
      classDiagram: 'diagrama UML'
    };
    return `
Analiza el contenido de este PDF y genera el código Mermaid de un ${names[diagramType] || 'mapa conceptual'} basado exclusivamente en sus conceptos principales.
Devuelve ÚNICAMENTE código Mermaid válido, sin explicaciones, sin comillas externas y sin bloques markdown.
Limita el resultado a entre 8 y 18 conceptos o relaciones.
Usa etiquetas breves y texto plano. Nombre de archivo: "${fileName || 'Documento'}".
`;
  }
};
