const ChatModel = {
  storageKey: 'tecnobot_chats',
  retentionDays: 30,
  maxMessagesPerDocument: 50,

  // Carga todo el historial del storage (diccionario { docId: [messages] })
  _getAllChats() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      const chats = stored ? JSON.parse(stored) : {};
      return this._pruneOldChats(chats);
    } catch (e) {
      return {};
    }
  },

  // Guarda todo el historial en storage
  _saveAllChats(chats) {
    localStorage.setItem(this.storageKey, JSON.stringify(this._pruneOldChats(chats)));
  },

  _pruneOldChats(chats) {
    const oldestTimestamp = Date.now() - (this.retentionDays * 24 * 60 * 60 * 1000);
    const prunedChats = {};

    Object.entries(chats || {}).forEach(([documentId, messages]) => {
      if (!Array.isArray(messages)) return;
      const recentMessages = messages
        .filter(message => {
          const timestamp = new Date(message.timestamp).getTime();
          return !Number.isFinite(timestamp) || timestamp >= oldestTimestamp;
        })
        .slice(-this.maxMessagesPerDocument);
      if (recentMessages.length) prunedChats[documentId] = recentMessages;
    });

    return prunedChats;
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
