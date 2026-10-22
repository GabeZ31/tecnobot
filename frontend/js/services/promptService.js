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
  }
};
