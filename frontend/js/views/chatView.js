const ChatView = {
  container: document.getElementById('chat-messages'),
  inputArea: document.querySelector('.chat-input-area'),
  quickPrompts: document.getElementById('quick-prompts'),

  clear() {
    this.container.innerHTML = '';
  },

  showMessage(role, content) {
    const message = document.createElement('div');
    message.className = `message ${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    if (role === 'bot') {
      bubble.innerHTML = MarkdownRenderer.render(content);
    } else {
      bubble.textContent = content;
    }

    message.appendChild(bubble);
    this.container.appendChild(message);
    this.scrollToBottom();
  },

  showTyping() {
    const id = `typing-${Date.now()}`;
    const message = document.createElement('div');
    message.id = id;
    message.className = 'message bot';
    message.innerHTML = '<div class="bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>';
    this.container.appendChild(message);
    this.scrollToBottom();
    return id;
  },

  removeTyping(id) {
    document.getElementById(id)?.remove();
  },

  showChat() {
    this.container.classList.remove('hidden');
    this.inputArea.classList.remove('hidden');
    if (this.quickPrompts) this.quickPrompts.classList.remove('hidden');
  },

  hideChat() {
    this.container.classList.add('hidden');
    this.inputArea.classList.add('hidden');
    if (this.quickPrompts) this.quickPrompts.classList.add('hidden');
  },

  showQuickPrompts(onSelect) {
    if (!this.quickPrompts) return;
    this.quickPrompts.classList.remove('hidden');
    const prompts = [
      'Resume los puntos clave',
      'Explica los conceptos principales',
      'Genera preguntas de repaso'
    ];
    this.quickPrompts.innerHTML = '';
    prompts.forEach(prompt => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'quick-prompt';
      button.textContent = prompt;
      button.addEventListener('click', () => onSelect(prompt));
      this.quickPrompts.appendChild(button);
    });
  },

  scrollToBottom() {
    this.container.scrollTop = this.container.scrollHeight;
  }
};
