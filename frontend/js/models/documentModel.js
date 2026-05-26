const DocumentModel = {
  currentDocumentId: null,
  currentFileName: null,
  storageKey: 'tecnobot_documents',
  categoriesKey: 'tecnobot_categories',
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
      color: this.textColors[colorIndex],
      category: 'General'
    };

    // Agregar al inicio
    docs.unshift(newDoc);

    // Mantener solo los 10 más recientes
    if (docs.length > 10) {
      const toRemove = docs.pop();
      this.deleteAssociatedData(toRemove.documentId);
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

  deleteDocument(documentId) {
    let docs = this.getDocuments();
    docs = docs.filter(doc => doc.documentId !== documentId);
    localStorage.setItem(this.storageKey, JSON.stringify(docs));
    this.deleteAssociatedData(documentId);
    
    if (this.currentDocumentId === documentId) {
      this.clearActive();
    }
  },

  deleteAssociatedData(documentId) {
    // Limpiar chat
    if (window.ChatModel && typeof window.ChatModel.clearMessages === 'function') {
      window.ChatModel.clearMessages(documentId);
    } else {
      localStorage.removeItem('tecnobot_chat_' + documentId);
    }
    // Limpiar cache de examen si la hay
    localStorage.removeItem('tecnobot_exam_' + documentId);
  },

  getCategories() {
    try {
      const stored = localStorage.getItem(this.categoriesKey);
      if (!stored) {
        const defaultCats = ['General'];
        localStorage.setItem(this.categoriesKey, JSON.stringify(defaultCats));
        return defaultCats;
      }
      return JSON.parse(stored);
    } catch (e) {
      return ['General'];
    }
  },

  addCategory(name) {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const cats = this.getCategories();
    if (cats.includes(trimmed)) return false;
    
    cats.push(trimmed);
    localStorage.setItem(this.categoriesKey, JSON.stringify(cats));
    return true;
  },

  deleteCategory(name) {
    if (name === 'General') return;
    let cats = this.getCategories();
    cats = cats.filter(c => c !== name);
    localStorage.setItem(this.categoriesKey, JSON.stringify(cats));

    // Mover todos los documentos de esta categoría a 'General'
    const docs = this.getDocuments();
    docs.forEach(doc => {
      if (doc.category === name) {
        doc.category = 'General';
      }
    });
    localStorage.setItem(this.storageKey, JSON.stringify(docs));
  },

  setDocumentCategory(documentId, categoryName) {
    const docs = this.getDocuments();
    const doc = docs.find(d => d.documentId === documentId);
    if (doc) {
      doc.category = categoryName;
      localStorage.setItem(this.storageKey, JSON.stringify(docs));
      return true;
    }
    return false;
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
