const API_BASE_URL = 'https://bdtpazw1ic.execute-api.us-east-1.amazonaws.com/prod';

const ApiService = {
  async uploadDocument(fileName, fileContentBase64) {
    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileName, fileContent: fileContentBase64 })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al procesar el documento');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error (upload):', error);
      throw error;
    }
  },

  async askQuestion(documentId, question) {
    try {
      const response = await fetch(`${API_BASE_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ documentId, question })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al obtener respuesta');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error (ask):', error);
      throw error;
    }
  }
};
