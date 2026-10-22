const UploadView = {
  uploadSection: document.getElementById('upload-view'),
  chatSection: document.getElementById('chat-view'),
  fileInput: document.getElementById('file-input'),
  browseButton: document.getElementById('browse-btn'),
  progressFill: document.getElementById('upload-progress-fill'),
  buttonLabel: document.getElementById('upload-btn-label'),
  errorMessage: document.getElementById('upload-error'),
  activeDocumentName: document.getElementById('active-doc-name'),

  showError(message) {
    this.errorMessage.textContent = message;
    this.errorMessage.classList.remove('hidden');
    this.resetButton();
  },

  hideError() {
    this.errorMessage.textContent = '';
    this.errorMessage.classList.add('hidden');
  },

  setProgress(percent, label) {
    this.progressFill.style.width = `${percent}%`;
    if (label) this.buttonLabel.textContent = label;
  },

  setLoading() {
    this.browseButton.disabled = true;
    this.setProgress(0, 'Subiendo... 0%');
  },

  showSuccess() {
    this.setProgress(100, '✓ Listo');
    this.browseButton.classList.add('success');
  },

  resetButton() {
    this.browseButton.disabled = false;
    this.browseButton.classList.remove('success');
    this.setProgress(0, 'Explorar archivos');
  },

  showChat(documentName) {
    this.uploadSection.classList.add('hidden');
    this.chatSection.classList.remove('hidden');
    this.activeDocumentName.textContent = documentName;
    document.dispatchEvent(new CustomEvent('documentLoaded'));
  },

  showUpload() {
    this.chatSection.classList.add('hidden');
    this.uploadSection.classList.remove('hidden');
  }
};
