// Modelo que gestiona el historial de mensajes
const ChatModel = {
  messages: [],

  /**
   * Añade un mensaje al historial
   * @param {string} role - 'user' o 'bot'
   * @param {string} content - Contenido del mensaje
   */
  addMessage(role, content) {
    this.messages.push({
      role: role,
      content: content,
      timestamp: new Date()
    });
  },

  /**
   * Obtiene todos los mensajes del historial
   * @returns {Array} Lista de mensajes
   */
  getMessages() {
    return this.messages;
  },

  /**
   * Limpia el historial de mensajes
   */
  clear() {
    this.messages = [];
  }
};
