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

  const studyMessages = document.getElementById('study-messages');
  const chatInputArea = document.querySelector('.chat-input-area');

  // Escuchar el evento de carga de documento
  document.addEventListener('documentLoaded', () => {
    chatMessages.innerHTML = '';
    studyMessages.innerHTML = '';
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
    const chatTab = document.querySelector('[data-tab="chat"]');
    if (chatTab) chatTab.click();
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

  // Form submit (Chat)
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
      // MEMORIA CONVERSACIONAL (Context Packing)
      const history = ChatModel.getMessages(docId);
      let contextualQuestion = "";
      if (history.length > 2) {
        // Enviar los últimos 4 mensajes del historial (excluyendo el recién añadido del usuario)
        const recent = history.slice(-5, -1);
        contextualQuestion = "Historial reciente de la conversación:\n";
        recent.forEach(msg => {
          contextualQuestion += `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}\n`;
        });
        contextualQuestion += `\nNueva pregunta (responde a esta): ${question}\n\n`;
        contextualQuestion += "Instrucción de Clarificación: Si la pregunta es ambigua o no se puede contestar basándote en el documento, pídele educadamente una aclaración o pregunta al usuario para refinar el contexto.";
      } else {
        contextualQuestion = question;
      }

      const response = await ApiService.askQuestion(docId, contextualQuestion);
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
      e.currentTarget.classList.add('active');

      const tabId = e.currentTarget.getAttribute('data-tab');
      
      // Controlar visibilidad de contenedores
      if (tabId === 'study') {
        chatMessages.classList.add('hidden');
        chatInputArea.classList.add('hidden');
        studyMessages.classList.remove('hidden');
        
        // Cargar el motor de estudio
        initStudyQuiz();
      } else {
        chatMessages.classList.remove('hidden');
        chatInputArea.classList.remove('hidden');
        studyMessages.classList.add('hidden');
        
        if (tabId === 'summary') {
          const docId = DocumentModel.currentDocumentId;
          if (!docId) return;

          chatMessages.innerHTML = '';
          renderBubble('user', "Resume los puntos principales de este documento en una lista");
          
          const typingId = showTypingIndicator();
          try {
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
      }
    });
  });

  // --- MOTOR DE ESTUDIO (QUIZ INTERACTIVO) ---
  let quizData = null;
  let quizCurrentIndex = 0;
  let quizScore = 0;
  let quizSelectedOptionIndex = null;

  function initStudyQuiz() {
    const docId = DocumentModel.currentDocumentId;
    if (!docId) return;

    studyMessages.innerHTML = '';

    // Intentar cargar examen guardado en localStorage
    const savedExam = localStorage.getItem('tecnobot_exam_' + docId);
    if (savedExam) {
      try {
        quizData = JSON.parse(savedExam);
        renderQuizIntro();
        return;
      } catch (e) {
        localStorage.removeItem('tecnobot_exam_' + docId);
      }
    }

    // Si no hay examen guardado, mostrar pantalla de bienvenida para generarlo
    renderQuizIntro();
  }

  function renderQuizIntro() {
    const docName = DocumentModel.currentFileName || 'documento.pdf';
    
    studyMessages.innerHTML = `
      <div class="quiz-container">
        <div class="quiz-intro-card">
          <div class="score-circle">🎓</div>
          <h2 class="quiz-title">Apartado de Estudio</h2>
          <p class="quiz-subtitle">Genera un cuestionario de opción múltiple interactivo de 10 preguntas basado en <strong>${docName}</strong> para evaluar tus conocimientos de forma activa.</p>
          <button id="start-quiz-generation" class="btn-start-quiz">
            Generar Examen con IA
          </button>
        </div>
      </div>
    `;

    document.getElementById('start-quiz-generation').addEventListener('click', generateExamWithIA);
  }

  async function generateExamWithIA() {
    const docId = DocumentModel.currentDocumentId;
    if (!docId) return;

    const startBtn = document.getElementById('start-quiz-generation');
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.textContent = 'Generando preguntas con IA...';
    }

    studyMessages.innerHTML = `
      <div class="quiz-container">
        <div class="quiz-intro-card">
          <div class="typing-dots" style="justify-content: center; margin-bottom: 20px;">
            <span></span><span></span><span></span>
          </div>
          <h2 class="quiz-title">Analizando el PDF</h2>
          <p class="quiz-subtitle">Bedrock está formulando preguntas con respuestas y explicaciones estructuradas. Esto tardará unos segundos...</p>
        </div>
      </div>
    `;

    const promptExamen = `
Actúa como un profesor experto y generador de exámenes interactivos. Analiza el documento y extrae los conceptos clave.
Genera un examen de opción múltiple con exactamente 10 preguntas bien distribuidas.
Debes devolver ÚNICAMENTE un objeto JSON válido que cumpla estrictamente con el siguiente formato, sin prefacios, sin explicaciones externas, y sin bloques markdown de código (no envuelvas el texto en \`\`\`json ni \`\`\`):
{
  "titulo": "Examen: ${DocumentModel.currentFileName || 'Documento sin título'}",
  "preguntas": [
    {
      "id": 1,
      "tema": "Nombre del tema o concepto",
      "pregunta": "¿Texto de la pregunta?",
      "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "respuesta_correcta": 0,
      "explicacion": "Explicación breve y valiosa de por qué esa opción es correcta."
    }
  ]
}
Importante: La propiedad 'respuesta_correcta' debe ser el índice (0, 1, 2 o 3) de la opción correcta. Evita dobles negaciones en las preguntas. Asegúrate de que las opciones incorrectas sean creíbles.
`;

    try {
      const response = await ApiService.askQuestion(docId, promptExamen);
      
      let cleanJsonText = response.answer.trim();
      if (cleanJsonText.startsWith('```')) {
        cleanJsonText = cleanJsonText.replace(/^```(json)?/, '').replace(/```$/, '').trim();
      }

      const examData = JSON.parse(cleanJsonText);
      
      localStorage.setItem('tecnobot_exam_' + docId, JSON.stringify(examData));
      quizData = examData;
      
      quizCurrentIndex = 0;
      quizScore = 0;
      renderQuestion();

    } catch (error) {
      console.error(error);
      studyMessages.innerHTML = `
        <div class="quiz-container">
          <div class="quiz-intro-card">
            <div class="score-circle" style="background-color:#fee2e2; color:var(--error)">⚠️</div>
            <h2 class="quiz-title">Error al generar examen</h2>
            <p class="quiz-subtitle">No pudimos procesar las preguntas. Asegúrate de que el documento tenga suficiente texto y vuelve a intentarlo.</p>
            <button id="retry-quiz-generation" class="btn-start-quiz" style="background-color: var(--error)">
              Reintentar generación
            </button>
          </div>
        </div>
      `;
      document.getElementById('retry-quiz-generation').addEventListener('click', generateExamWithIA);
    }
  }

  function renderQuestion() {
    if (!quizData || !quizData.preguntas || quizData.preguntas.length === 0) {
      renderQuizIntro();
      return;
    }

    quizSelectedOptionIndex = null;
    const q = quizData.preguntas[quizCurrentIndex];
    const totalQuestions = quizData.preguntas.length;

    studyMessages.innerHTML = `
      <div class="quiz-container">
        <div class="quiz-card">
          <div class="quiz-header">
            <span class="quiz-topic">${q.tema || 'Evaluación'}</span>
            <span class="quiz-progress">Pregunta ${quizCurrentIndex + 1} de ${totalQuestions}</span>
          </div>
          <h3 class="quiz-question">${q.pregunta}</h3>
          
          <div class="quiz-options">
            ${q.opciones.map((option, idx) => `
              <button class="option-btn" data-index="${idx}">
                <span class="option-badge">${String.fromCharCode(65 + idx)}</span>
                <span class="option-text">${option}</span>
              </button>
            `).join('')}
          </div>

          <div id="explanation-container"></div>
          
          <div class="quiz-footer">
            <button id="next-question-btn" class="btn-next-question hidden">
              ${quizCurrentIndex + 1 === totalQuestions ? 'Ver Resultados' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    `;

    const optionBtns = studyMessages.querySelectorAll('.option-btn');
    optionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clickedIdx = parseInt(e.currentTarget.getAttribute('data-index'));
        handleOptionSelected(clickedIdx, q);
      });
    });

    const nextBtn = document.getElementById('next-question-btn');
    nextBtn.addEventListener('click', () => {
      quizCurrentIndex++;
      if (quizCurrentIndex < totalQuestions) {
        renderQuestion();
      } else {
        renderScoreScreen();
      }
    });
  }

  function handleOptionSelected(idx, question) {
    if (quizSelectedOptionIndex !== null) return;
    quizSelectedOptionIndex = idx;

    const optionBtns = studyMessages.querySelectorAll('.option-btn');
    const correctIdx = question.respuesta_correcta;
    const isCorrect = idx === correctIdx;

    if (isCorrect) {
      quizScore++;
    }

    optionBtns.forEach((btn, optionIdx) => {
      btn.disabled = true;
      if (optionIdx === correctIdx) {
        btn.classList.add('correct');
      } else if (optionIdx === idx) {
        btn.classList.add('incorrect');
      }
    });

    const explanationContainer = document.getElementById('explanation-container');
    explanationContainer.innerHTML = `
      <div class="explanation-box ${isCorrect ? 'success' : 'error'}">
        <div class="explanation-title">${isCorrect ? '¡Correcto!' : 'Incorrecto'}</div>
        <div class="explanation-text">${question.explicacion}</div>
      </div>
    `;

    const nextBtn = document.getElementById('next-question-btn');
    nextBtn.classList.remove('hidden');
  }

  function renderScoreScreen() {
    const totalQuestions = quizData.preguntas.length;
    const percent = Math.round((quizScore / totalQuestions) * 100);
    
    let msgTitle = "Sigue practicando";
    let msgDesc = "Te sugerimos repasar el documento y volver a realizar la prueba para reforzar conceptos.";
    let icon = "📚";

    if (percent >= 90) {
      msgTitle = "¡Excelente!";
      msgDesc = "¡Espectacular! Tienes un dominio sobresaliente de los conceptos de este documento.";
      icon = "🏆";
    } else if (percent >= 70) {
      msgTitle = "¡Buen trabajo!";
      msgDesc = "Tienes bases sólidas pero puedes volver a repasar los puntos en los que te equivocaste.";
      icon = "🌟";
    }

    studyMessages.innerHTML = `
      <div class="quiz-container">
        <div class="quiz-score-screen">
          <div class="score-circle">${icon}</div>
          <h2 class="quiz-title">Resultado de la Prueba</h2>
          <p class="quiz-subtitle" style="font-size:16px; font-weight:600; color:var(--accent); margin-bottom:8px;">
            Aciertos: ${quizScore} de ${totalQuestions} (${percent}%)
          </p>
          <p class="quiz-subtitle" style="font-weight:600; margin-bottom:4px;">${msgTitle}</p>
          <p class="quiz-subtitle">${msgDesc}</p>
          
          <div style="margin-top:24px; display:flex; gap:12px; justify-content:center;">
            <button id="restart-quiz-btn" class="btn-restart-quiz">
              Reintentar Examen
            </button>
            <button id="new-exam-btn" class="btn-outline-sm" style="padding:12px 24px; border-radius:10px; font-weight:600;">
              Generar otro examen
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('restart-quiz-btn').addEventListener('click', () => {
      quizCurrentIndex = 0;
      quizScore = 0;
      renderQuestion();
    });

    document.getElementById('new-exam-btn').addEventListener('click', () => {
      const docId = DocumentModel.currentDocumentId;
      localStorage.removeItem('tecnobot_exam_' + docId);
      renderQuizIntro();
    });
  }

  // Export Chat
  const exportChatBtn = document.getElementById('export-chat-btn');
  if (exportChatBtn) {
    exportChatBtn.addEventListener('click', () => {
      const docId = DocumentModel.currentDocumentId;
      if (!docId) return;

      const history = ChatModel.getMessages(docId);
      if (history.length === 0) {
        alert('No hay mensajes para exportar.');
        return;
      }

      const docName = DocumentModel.currentFileName || 'documento';
      let content = `# Chat: ${docName}\n\n`;
      history.forEach(msg => {
        const role = msg.role === 'user' ? 'Usuario' : 'Tecnobot';
        content += `### ${role} (${new Date(msg.timestamp).toLocaleString()})\n${msg.content}\n\n---\n\n`;
      });

      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Chat_${docName.replace(/\.[^/.]+$/, "")}.md`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  }

});
