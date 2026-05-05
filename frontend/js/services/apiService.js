// Módulo ApiService — todas las llamadas HTTP al backend
const API_BASE_URL = 'https://bdtpazw1ic.execute-api.us-east-1.amazonaws.com/prod'; // URL real del API Gateway

const ApiService = {
  /**
   * Sube un documento PDF al backend para ser procesado
   * @param {string} fileName - Nombre del archivo
   * @param {string} fileContentBase64 - Contenido del archivo en base64
   * @returns {Promise<Object>} Respuesta del backend { documentId, chunks, message }
   */
  async uploadDocument(fileName, fileContentBase64) {
    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName: fileName,
          fileContent: fileContentBase64
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al subir el documento');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en uploadDocument:', error);
      throw error;
    }
  },

  /**
   * Envía una pregunta al backend sobre un documento específico
   * @param {string} documentId - ID del documento
   * @param {string} question - Pregunta del usuario
   * @returns {Promise<Object>} Respuesta del backend { answer, documentId }
   */
  async askQuestion(documentId, question) {
    try {
      const response = await fetch(`${API_BASE_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentId: documentId,
          question: question
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al obtener respuesta');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en askQuestion:', error);
      throw error;
    }
  }
};
