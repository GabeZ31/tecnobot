// Controla la sección de chat
document.addEventListener('DOMContentLoaded', () => {
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatContainer = document.getElementById('chat-container');
  const newDocBtn = document.getElementById('new-doc-btn');
  const sendBtn = document.getElementById('send-btn');
  
  const uploadSection = document.getElementById('upload-section');
  const chatSection = document.getElementById('chat-section');

  // Inicializa el chat cuando se carga un documento
  document.addEventListener('documentLoaded', () => {
    ChatModel.clear();
    // Limpiar contenedor excepto el mensaje inicial del bot
    const initialMessage = chatContainer.firstElementChild;
    chatContainer.innerHTML = '';
    if (initialMessage) {
      chatContainer.appendChild(initialMessage);
      ChatModel.addMessage('bot', initialMessage.querySelector('.message-content').textContent.trim());
    }
    chatInput.focus();
  });

  // Manejar el envío de preguntas
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const question = chatInput.value.trim();
    if (!question) return;

    // Obtener documento actual
    const currentDoc = DocumentModel.getDocument();
    if (!currentDoc.documentId) {
      console.error('No hay documento activo');
      return;
    }

    // 1. Mostrar pregunta del usuario
    chatInput.value = '';
    chatInput.disabled = true;
    sendBtn.disabled = true;
    
    ChatModel.addMessage('user', question);
    renderMessage('user', question);
    
    // 2. Mostrar indicador de "escribiendo..."
    const typingId = showTypingIndicator();
    scrollToBottom();

    try {
      // 3. Llamar a la API
      const response = await ApiService.askQuestion(currentDoc.documentId, question);
      
      // 4. Remover indicador y mostrar respuesta
      removeTypingIndicator(typingId);
      ChatModel.addMessage('bot', response.answer);
      renderMessage('bot', response.answer);

    } catch (error) {
      // Manejar error
      removeTypingIndicator(typingId);
      const errorMsg = 'Lo siento, ocurrió un error al obtener la respuesta. Intenta de nuevo.';
      ChatModel.addMessage('bot', errorMsg);
      renderMessage('bot', errorMsg);
      console.error(error);
    } finally {
      // Habilitar input
      chatInput.disabled = false;
      sendBtn.disabled = false;
      chatInput.focus();
      scrollToBottom();
    }
  });

  // Botón para subir nuevo documento
  newDocBtn.addEventListener('click', () => {
    DocumentModel.clear();
    ChatModel.clear();
    chatSection.classList.add('hidden');
    uploadSection.classList.remove('hidden');
  });

  /**
   * Renderiza un mensaje en el DOM
   * @param {string} role - 'user' o 'bot'
   * @param {string} text - Contenido del mensaje
   */
  function renderMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message message--${role}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    msgDiv.appendChild(contentDiv);
    chatContainer.appendChild(msgDiv);
  }

  /**
   * Muestra el indicador de "escribiendo" del bot
   * @returns {string} ID del elemento para luego removerlo
   */
  function showTypingIndicator() {
    const id = 'typing-' + Date.now();
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message message--bot';
    msgDiv.id = id;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const indicatorDiv = document.createElement('div');
    indicatorDiv.className = 'typing-indicator';
    indicatorDiv.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    
    contentDiv.appendChild(indicatorDiv);
    msgDiv.appendChild(contentDiv);
    chatContainer.appendChild(msgDiv);
    
    return id;
  }

  /**
   * Remueve el indicador de "escribiendo"
   * @param {string} id - ID del elemento
   */
  function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) {
      el.remove();
    }
  }

  /**
   * Hace scroll automático hacia el final del chat
   */
  function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
});
