const ChatModel = {
  storageKey: 'tecnobot_chats',

  // Carga todo el historial del storage (diccionario { docId: [messages] })
  _getAllChats() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  },

  // Guarda todo el historial en storage
  _saveAllChats(chats) {
    localStorage.setItem(this.storageKey, JSON.stringify(chats));
  },

  addMessage(documentId, role, content) {
    if (!documentId) return;
    
    const chats = this._getAllChats();
    if (!chats[documentId]) {
      chats[documentId] = [];
    }

    chats[documentId].push({
      role,
      content,
      timestamp: new Date().toISOString()
    });

    this._saveAllChats(chats);
  },

  getMessages(documentId) {
    if (!documentId) return [];
    const chats = this._getAllChats();
    return chats[documentId] || [];
  },

  clearMessages(documentId) {
    if (!documentId) return;
    const chats = this._getAllChats();
    delete chats[documentId];
    this._saveAllChats(chats);
  }
};
