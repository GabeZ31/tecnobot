document.addEventListener('DOMContentLoaded', () => {
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const chatMessages = document.getElementById('chat-messages');
  const tabBtns = document.querySelectorAll('.tab-btn');

  // Markdown Parser
  function parseMarkdown(text) {
    let html = text;
    
    // Replace Code Blocks (pre/code)
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    // Replace Inline Code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Replace Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Replace Italic
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Lists (simple approach)
    // Ordered
    html = html.replace(/^\s*\d+\.\s+(.*)$/gm, '<ol><li>$1</li></ol>');
    html = html.replace(/<\/ol>\n<ol>/g, '');
    // Unordered
    html = html.replace(/^\s*[-*]\s+(.*)$/gm, '<ul><li>$1</li></ul>');
    html = html.replace(/<\/ul>\n<ul>/g, '');
    
    // Paragraphs (double line breaks)
    html = html.replace(/\n\n+/g, '</p><p>');
    // Single line breaks inside p
    html = html.replace(/([^>\n])\n([^<\n])/g, '$1<br>$2');

    // Wrap in initial P if it doesn't start with block element
    if (!html.startsWith('<')) {
      html = '<p>' + html + '</p>';
    }
    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    
    return html;
  }

  // Escuchar el evento de carga de documento
  document.addEventListener('documentLoaded', () => {
    chatMessages.innerHTML = '';
    const currentDoc = DocumentModel.currentDocumentId;
    if (!currentDoc) return;

    // Cargar historial de chat para este doc si existe
    const history = ChatModel.getMessages(currentDoc);
    
    if (history.length === 0) {
      // Mensaje de bienvenida inicial
      const welcome = "¡Hola! He procesado tu documento. ¿Qué te gustaría saber sobre él?";
      ChatModel.addMessage(currentDoc, 'bot', welcome);
      renderBubble('bot', welcome);
    } else {
      // Re-renderizar historial
      history.forEach(msg => renderBubble(msg.role, msg.content));
    }
    
    // Activar tab Chat por defecto
    document.querySelector('[data-tab="chat"]').click();
    chatInput.focus();
  });

  function renderBubble(role, content, id = null) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    if (id) msgDiv.id = id;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    
    if (role === 'bot') {
      bubble.innerHTML = parseMarkdown(content);
    } else {
      bubble.textContent = content; // sanitize user input implicitly
    }

    msgDiv.appendChild(bubble);
    chatMessages.appendChild(msgDiv);
    scrollToBottom();
  }

  function showTypingIndicator() {
    const id = 'typing-' + Date.now();
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot';
    msgDiv.id = id;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    
    const dots = document.createElement('div');
    dots.className = 'typing-dots';
    dots.innerHTML = '<span></span><span></span><span></span>';
    
    bubble.appendChild(dots);
    msgDiv.appendChild(bubble);
    chatMessages.appendChild(msgDiv);
    scrollToBottom();
    return id;
  }

  function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Form submit
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = chatInput.value.trim();
    if (!question) return;

    const docId = DocumentModel.currentDocumentId;
    if (!docId) return;

    // UI Updates
    chatInput.value = '';
    chatInput.disabled = true;
    sendBtn.disabled = true;

    // Render user message
    ChatModel.addMessage(docId, 'user', question);
    renderBubble('user', question);

    const typingId = showTypingIndicator();

    try {
      const response = await ApiService.askQuestion(docId, question);
      removeTypingIndicator(typingId);
      
      ChatModel.addMessage(docId, 'bot', response.answer);
      renderBubble('bot', response.answer);
    } catch (error) {
      removeTypingIndicator(typingId);
      const errorMsg = 'Error al obtener respuesta. Por favor, intenta de nuevo.';
      ChatModel.addMessage(docId, 'bot', errorMsg);
      renderBubble('bot', errorMsg);
    } finally {
      chatInput.disabled = false;
      sendBtn.disabled = false;
      chatInput.focus();
    }
  });

  // Handle Tabs
  tabBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      // Quitar active de todos
      tabBtns.forEach(b => b.classList.remove('active'));
      // Poner active al actual
      e.target.classList.add('active');

      const tabId = e.target.getAttribute('data-tab');
      if (tabId === 'summary') {
        const docId = DocumentModel.currentDocumentId;
        if (!docId) return;

        // Limpiar chat actual y pedir resumen automático
        chatMessages.innerHTML = '';
        
        // Simular que el usuario pide el resumen en UI
        renderBubble('user', "Resume los puntos principales de este documento en una lista");
        
        const typingId = showTypingIndicator();
        try {
          // No guardamos el resumen en ChatModel para no ensuciar el historial de chat libre
          const response = await ApiService.askQuestion(docId, "Resume los puntos principales de este documento en una lista");
          removeTypingIndicator(typingId);
          renderBubble('bot', response.answer);
        } catch (error) {
          removeTypingIndicator(typingId);
          renderBubble('bot', 'Error al generar resumen.');
        }
      } else {
        // Volver a Tab Chat, recargar mensajes
        chatMessages.innerHTML = '';
        const history = ChatModel.getMessages(DocumentModel.currentDocumentId);
        history.forEach(msg => renderBubble(msg.role, msg.content));
      }
    });
  });

});
