document.addEventListener('DOMContentLoaded', () => {
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-btn');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const chatTab = document.querySelector('[data-tab="chat"]');

  const showHistory = () => {
    ChatView.clear();
    ChatModel.getMessages(DocumentModel.currentDocumentId)
      .forEach(message => ChatView.showMessage(message.role, message.content));
  };

  const loadDocument = () => {
    const documentId = DocumentModel.currentDocumentId;
    if (!documentId) return;
    const history = ChatModel.getMessages(documentId);
    if (!history.length) {
      const welcome = '¡Hola! He procesado tu documento. ¿Qué te gustaría saber sobre él?';
      ChatModel.addMessage(documentId, 'bot', welcome);
    }
    showHistory();
    chatTab?.click();
    chatInput.focus();
  };

  const askQuestion = async (question, saveToHistory = true) => {
    const documentId = DocumentModel.currentDocumentId;
    if (!documentId) return;
    const typingId = ChatView.showTyping();
    try {
      const response = await ApiService.askQuestion(documentId, question);
      ChatView.removeTyping(typingId);
      if (saveToHistory) ChatModel.addMessage(documentId, 'bot', response.answer);
      ChatView.showMessage('bot', response.answer);
    } catch (error) {
      ChatView.removeTyping(typingId);
      const message = saveToHistory
        ? 'Error al obtener respuesta. Por favor, intenta de nuevo.'
        : 'Error al generar resumen.';
      if (saveToHistory) ChatModel.addMessage(documentId, 'bot', message);
      ChatView.showMessage('bot', message);
    }
  };

  const sendQuestion = async (event) => {
    event.preventDefault();
    const question = chatInput.value.trim();
    const documentId = DocumentModel.currentDocumentId;
    if (!question || !documentId) return;

    chatInput.value = '';
    chatInput.disabled = true;
    sendButton.disabled = true;
    ChatModel.addMessage(documentId, 'user', question);
    ChatView.showMessage('user', question);
    await askQuestion(PromptService.conversationalQuestion(ChatModel.getMessages(documentId), question));
    chatInput.disabled = false;
    sendButton.disabled = false;
    chatInput.focus();
  };

  const loadStudy = () => {
    const documentId = DocumentModel.currentDocumentId;
    if (!documentId) return;
    StudyView.show();
    StudyModel.load(documentId);
    StudyView.showIntro(DocumentModel.currentFileName || 'documento.pdf', generateExam);
  };

  const generateExam = async () => {
    const documentId = DocumentModel.currentDocumentId;
    if (!documentId) return;
    StudyView.showLoading();
    try {
      const response = await ApiService.askQuestion(documentId, PromptService.exam(DocumentModel.currentFileName));
      const json = response.answer.trim().replace(/^```json?/, '').replace(/```$/, '').trim();
      StudyModel.save(documentId, JSON.parse(json));
      StudyModel.restart();
      showQuestion();
    } catch (error) {
      console.error(error);
      StudyView.showGenerationError(generateExam);
    }
  };

  const showQuestion = () => {
    const exam = StudyModel.exam;
    if (!exam?.preguntas?.length) return loadStudy();
    const question = exam.preguntas[StudyModel.questionIndex];
    StudyView.showQuestion(question, StudyModel.questionIndex, exam.preguntas.length, answerQuestion, nextQuestion);
  };

  const answerQuestion = (optionIndex, question) => {
    const isCorrect = StudyModel.answer(optionIndex, question.respuesta_correcta);
    StudyView.showAnswer(question.respuesta_correcta, optionIndex, question.explicacion, isCorrect);
  };

  const nextQuestion = () => {
    if (StudyModel.questionIndex + 1 < StudyModel.exam.preguntas.length) {
      StudyModel.nextQuestion();
      showQuestion();
    } else {
      StudyView.showScore(StudyModel.score, StudyModel.exam.preguntas.length, () => {
        StudyModel.restart();
        showQuestion();
      }, () => {
        StudyModel.clear(DocumentModel.currentDocumentId);
        loadStudy();
      });
    }
  };

  const handleTabChange = async (event) => {
    tabButtons.forEach(button => button.classList.remove('active'));
    event.currentTarget.classList.add('active');
    const tab = event.currentTarget.dataset.tab;
    if (tab === 'study') {
      ChatView.hideChat();
      loadStudy();
      return;
    }

    ChatView.showChat();
    StudyView.hide();
    if (tab === 'summary') {
      ChatView.clear();
      ChatView.showMessage('user', PromptService.summary());
      await askQuestion(PromptService.summary(), false);
    } else {
      showHistory();
    }
  };

  const exportChat = () => {
    const documentId = DocumentModel.currentDocumentId;
    const history = ChatModel.getMessages(documentId);
    if (!history.length) return alert('No hay mensajes para exportar.');
    const fileName = DocumentModel.currentFileName || 'documento';
    const content = `# Chat: ${fileName}\n\n${history.map(message => {
      const role = message.role === 'user' ? 'Usuario' : 'Tecnobot';
      return `### ${role} (${new Date(message.timestamp).toLocaleString()})\n${message.content}\n\n---\n\n`;
    }).join('')}`;
    const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `Chat_${fileName.replace(/\.[^/.]+$/, '')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  document.addEventListener('documentLoaded', loadDocument);
  chatForm.addEventListener('submit', sendQuestion);
  tabButtons.forEach(button => button.addEventListener('click', handleTabChange));
  document.getElementById('export-chat-btn')?.addEventListener('click', exportChat);
  chatInput.addEventListener('focus', () => setTimeout(() => window.scrollTo(0, 0), 100));
  chatInput.addEventListener('blur', () => setTimeout(() => window.scrollTo(0, 0), 100));
});
