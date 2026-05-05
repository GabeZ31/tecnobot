// Modelo que gestiona el estado del documento activo
const DocumentModel = {
  currentDocumentId: null,
  currentFileName: null,

  /**
   * Guarda los datos del documento actual
   * @param {string} documentId - ID del documento generado por el backend
   * @param {string} fileName - Nombre del archivo original
   */
  setDocument(documentId, fileName) {
    this.currentDocumentId = documentId;
    this.currentFileName = fileName;
  },

  /**
   * Obtiene los datos del documento actual
   * @returns {Object} Objeto con documentId y fileName
   */
  getDocument() {
    return {
      documentId: this.currentDocumentId,
      fileName: this.currentFileName
    };
  },

  /**
   * Limpia el estado del documento activo
   */
  clear() {
    this.currentDocumentId = null;
    this.currentFileName = null;
  }
};
