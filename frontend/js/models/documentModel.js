const DocumentModel = {
  currentDocumentId: null,
  currentFileName: null,
  storageKey: 'tecnobot_documents',
  colors: ['#fee2e2', '#dbeafe', '#dcfce7', '#fef3c7', '#f3e8ff'],
  textColors: ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed'],

  saveDocument(documentId, fileName) {
    const docs = this.getDocuments();
    
    // Asignar color aleatorio de la paleta
    const colorIndex = Math.floor(Math.random() * this.colors.length);
    
    const newDoc = {
      documentId,
      fileName,
      date: new Date().toISOString(),
      bg: this.colors[colorIndex],
      color: this.textColors[colorIndex]
    };

    // Agregar al inicio
    docs.unshift(newDoc);

    // Mantener solo los 10 más recientes
    if (docs.length > 10) {
      docs.length = 10;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(docs));
  },

  getDocuments() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  },

  setActive(documentId, fileName) {
    this.currentDocumentId = documentId;
    this.currentFileName = fileName;
  },

  clearActive() {
    this.currentDocumentId = null;
    this.currentFileName = null;
  }
};
