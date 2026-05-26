document.addEventListener('DOMContentLoaded', () => {
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');
  const chatMessages = document.getElementById('chat-messages');
  const tabBtns = document.querySelectorAll('.tab-btn');

  // Markdown Parser
  function parseMarkdown(text) {
    // Helper to escape HTML characters in code blocks
    function escapeHTML(str) {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function parseInline(str) {
      let result = str;
      // Bold: **text**
      result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      // Italic: *text*
      result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      // Inline code: `code`
      result = result.replace(/`([^`]+)`/g, '<code>$1</code>');
      return result;
    }

    const lines = text.split(/\r?\n/);
    let html = '';
    let currentParagraph = '';
    let currentList = [];
    let currentListType = null; // 'ul' or 'ol'
    let inCodeBlock = false;
    let codeLines = [];
    let inTable = false;
    let tableRows = [];

    function flushParagraph() {
      if (currentParagraph) {
        html += `<p>${parseInline(currentParagraph.trim())}</p>`;
        currentParagraph = '';
      }
    }

    function flushList() {
      if (currentList.length > 0) {
        html += `<${currentListType}>`;
        currentList.forEach(item => {
          html += `<li>${parseInline(item)}</li>`;
        });
        html += `</${currentListType}>`;
        currentList = [];
        currentListType = null;
      }
    }

    function flushTable() {
      if (inTable && tableRows.length > 0) {
        html += '<table>';
        tableRows.forEach((row, index) => {
          if (index === 0) html += '<thead>';
          if (index === 1) html += '<tbody>';
          
          html += '<tr>';
          row.forEach(cell => {
            const cellTag = index === 0 ? 'th' : 'td';
            html += `<${cellTag}>${parseInline(cell)}</${cellTag}>`;
          });
          html += '</tr>';
          
          if (index === 0) html += '</thead>';
          if (index === tableRows.length - 1 && index > 0) html += '</tbody>';
        });
        html += '</table>';
        tableRows = [];
        inTable = false;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Code block check
      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          inCodeBlock = false;
          html += `<pre><code>${escapeHTML(codeLines.join('\n'))}</code></pre>`;
          codeLines = [];
        } else {
          flushParagraph();
          flushList();
          flushTable();
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      // Table line check
      const isTableLine = trimmed.startsWith('|') && trimmed.endsWith('|');
      if (isTableLine) {
        flushParagraph();
        flushList();
        const cells = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
        const isDivider = cells.every(cell => /^:?-+:?$/.test(cell));
        if (isDivider) {
          continue;
        }
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        tableRows.push(cells);
        continue;
      } else {
        flushTable();
      }

      // Empty line
      if (trimmed === '') {
        flushParagraph();
        flushList();
        continue;
      }

      // Heading check
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        flushParagraph();
        flushList();
        const level = headingMatch[1].length;
        html += `<h${level}>${parseInline(headingMatch[2])}</h${level}>`;
        continue;
      }

      // List checks
      const ulMatch = line.match(/^\s*[-*]\s+(.*)$/);
      const olMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);

      if (ulMatch) {
        flushParagraph();
        if (currentListType && currentListType !== 'ul') {
          flushList();
        }
        currentListType = 'ul';
        currentList.push(ulMatch[1]);
        continue;
      }

      if (olMatch) {
        flushParagraph();
        if (currentListType && currentListType !== 'ol') {
          flushList();
        }
        currentListType = 'ol';
        currentList.push(olMatch[2]);
        continue;
      }

      // Regular line
      flushList();
      if (currentParagraph) {
        currentParagraph += ' ' + line;
      } else {
        currentParagraph = line;
      }
    }

    // Flush remaining
    flushParagraph();
    flushList();
    flushTable();
    if (inCodeBlock && codeLines.length > 0) {
      html += `<pre><code>${escapeHTML(codeLines.join('\n'))}</code></pre>`;
    }

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
