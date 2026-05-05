document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const browseBtn = document.getElementById('browse-btn');
  const progressFill = document.getElementById('upload-progress-fill');
  const btnLabel = document.getElementById('upload-btn-label');
  const errorMsg = document.getElementById('upload-error');
  
  const uploadView = document.getElementById('upload-view');
  const chatView = document.getElementById('chat-view');
  const activeDocName = document.getElementById('active-doc-name');

  // Load initial history
  renderSidebar();

  // Click on browse button or drop zone triggers file input
  browseBtn.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('click', (e) => {
    if (e.target !== browseBtn && e.target !== btnLabel && e.target !== progressFill) {
      fileInput.click();
    }
  });

  // Drag and Drop
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      handleFile(fileInput.files[0]);
    }
  });

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
    // reset button
    browseBtn.disabled = false;
    btnLabel.textContent = 'Explorar archivos';
    progressFill.style.width = '0%';
  }

  function hideError() {
    errorMsg.classList.add('hidden');
    errorMsg.textContent = '';
  }

  function setProgress(percent, text) {
    progressFill.style.width = `${percent}%`;
    if (text) btnLabel.textContent = text;
  }

  async function handleFile(file) {
    hideError();

    if (file.type !== 'application/pdf') {
      showError('Por favor, selecciona un archivo PDF.');
      return;
    }

    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      showError('El archivo excede el límite de 15MB.');
      return;
    }

    // UI state: loading
    browseBtn.disabled = true;
    setProgress(0, 'Subiendo... 0%');

    try {
      // Simulate initial progress to 60%
      setTimeout(() => setProgress(30, 'Subiendo... 30%'), 300);
      setTimeout(() => setProgress(60, 'Procesando... 60%'), 800);

      const base64Content = await readFileAsBase64(file);
      
      // Llamada real al backend
      const response = await ApiService.uploadDocument(file.name, base64Content);

      setProgress(100, '✓ Listo');
      browseBtn.classList.add('success');

      // Guardar en modelo
      DocumentModel.saveDocument(response.documentId, file.name);
      DocumentModel.setActive(response.documentId, file.name);

      // Renderizar sidebar actualizada
      renderSidebar();

      // Ir al chat
      setTimeout(() => {
        browseBtn.classList.remove('success');
        browseBtn.disabled = false;
        setProgress(0, 'Explorar archivos');
        fileInput.value = '';
        switchToChatView(file.name);
      }, 1500);

    } catch (error) {
      showError(error.message || 'Error al subir el archivo');
    }
  }

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  function switchToChatView(fileName) {
    uploadView.classList.add('hidden');
    chatView.classList.remove('hidden');
    activeDocName.textContent = fileName;
    document.dispatchEvent(new CustomEvent('documentLoaded'));
  }

  // Sidebar functions exposed globally to be called from chatController too
  window.renderSidebar = function() {
    const list = document.getElementById('docs-list');
    list.innerHTML = '';
    const docs = DocumentModel.getDocuments();

    docs.forEach(doc => {
      const isCurrent = doc.documentId === DocumentModel.currentDocumentId;
      
      const item = document.createElement('div');
      item.className = `doc-item ${isCurrent ? 'active' : ''}`;
      
      // Calculate relative time
      const date = new Date(doc.date);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      let relativeTime = '';
      if (diffMins < 60) relativeTime = `Hace ${diffMins} min`;
      else if (diffMins < 1440) relativeTime = `Hace ${Math.floor(diffMins/60)} h`;
      else relativeTime = `Hace ${Math.floor(diffMins/1440)} d`;
      if (diffMins === 0) relativeTime = 'Justo ahora';

      item.innerHTML = `
        <div class="doc-item-top">
          <div class="doc-item-icon" style="background-color: ${doc.bg}; color: ${doc.color}">📄</div>
          <span class="doc-item-title">${doc.fileName}</span>
        </div>
        <div class="doc-item-date">${relativeTime}</div>
      `;

      item.addEventListener('click', () => {
        DocumentModel.setActive(doc.documentId, doc.fileName);
        renderSidebar(); // update active class
        switchToChatView(doc.fileName);
      });

      list.appendChild(item);
    });
  }

  document.getElementById('new-doc-btn').addEventListener('click', () => {
    DocumentModel.clearActive();
    chatView.classList.add('hidden');
    uploadView.classList.remove('hidden');
    renderSidebar(); // remove active class from list
  });
});
