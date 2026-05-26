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

  // Mobile Sidebar Toggle Logic
  const sidebar = document.getElementById('sidebar');
  const mobileOverlay = document.getElementById('mobile-overlay');
  const uploadMenuBtn = document.querySelector('.upload-menu-btn');
  const chatMenuBtn = document.querySelector('.chat-menu-btn');

  function toggleSidebar() {
    sidebar.classList.toggle('open');
    mobileOverlay.classList.toggle('active');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    mobileOverlay.classList.remove('active');
  }

  if (uploadMenuBtn) uploadMenuBtn.addEventListener('click', toggleSidebar);
  if (chatMenuBtn) chatMenuBtn.addEventListener('click', toggleSidebar);
  if (mobileOverlay) mobileOverlay.addEventListener('click', closeSidebar);

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
  function renderSidebar() {
    const list = document.getElementById('docs-list');
    list.innerHTML = '';
    
    const docs = DocumentModel.getDocuments();
    const categories = DocumentModel.getCategories();

    categories.forEach(category => {
      const categoryDocs = docs.filter(doc => doc.category === category);
      
      const categoryGroup = document.createElement('details');
      categoryGroup.className = 'category-group';
      categoryGroup.open = true; // start open

      const summary = document.createElement('summary');
      summary.className = 'category-header';
      
      summary.innerHTML = `
        <div class="category-header-left">
          <svg class="folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          <span class="category-header-title">${category}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="category-count">${categoryDocs.length}</span>
          <svg class="category-header-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      `;

      const docsContainer = document.createElement('div');
      docsContainer.className = 'category-docs';

      if (categoryDocs.length === 0) {
        const emptyLabel = document.createElement('div');
        emptyLabel.style.fontSize = '11px';
        emptyLabel.style.color = 'var(--dim)';
        emptyLabel.style.padding = '8px 12px';
        emptyLabel.style.fontStyle = 'italic';
        emptyLabel.textContent = 'Vacía';
        docsContainer.appendChild(emptyLabel);
      } else {
        categoryDocs.forEach(doc => {
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
            <div class="doc-item-wrapper">
              <div class="doc-item-main">
                <div class="doc-item-top">
                  <div class="doc-item-icon" style="background-color: ${doc.bg}; color: ${doc.color}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                  </div>
                  <span class="doc-item-title" title="${doc.fileName}">${doc.fileName}</span>
                </div>
                <div class="doc-item-date">${relativeTime}</div>
              </div>
              <div class="doc-item-actions-wrapper">
                <select class="category-move-select" title="Mover a materia">
                  ${categories.map(c => `<option value="${c}" ${c === category ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
                <button class="doc-action-btn btn-delete" title="Eliminar PDF">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          `;

          // Event to select document
          item.addEventListener('click', (e) => {
            // Only trigger view shift if the user clicked the main body, not the select or delete button
            if (e.target.tagName !== 'SELECT' && e.target.tagName !== 'OPTION' && !e.target.closest('.doc-action-btn')) {
              DocumentModel.setActive(doc.documentId, doc.fileName);
              renderSidebar(); // update active class
              switchToChatView(doc.fileName);
              closeSidebar(); // hide on mobile
            }
          });

          // Move document category event
          const moveSelect = item.querySelector('.category-move-select');
          moveSelect.addEventListener('change', (e) => {
            const newCat = e.target.value;
            DocumentModel.setDocumentCategory(doc.documentId, newCat);
            renderSidebar();
          });

          // Delete document event
          const deleteBtn = item.querySelector('.btn-delete');
          deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`¿Estás seguro de que deseas eliminar el documento "${doc.fileName}"? Se borrará también todo su historial de chat.`)) {
              DocumentModel.deleteDocument(doc.documentId);
              renderSidebar();
              // If deleted active doc, go to upload view
              if (DocumentModel.currentDocumentId === null) {
                chatView.classList.add('hidden');
                uploadView.classList.remove('hidden');
              }
            }
          });

          docsContainer.appendChild(item);
        });
      }

      categoryGroup.appendChild(summary);
      categoryGroup.appendChild(docsContainer);
      list.appendChild(categoryGroup);
    });
  }
  window.renderSidebar = renderSidebar;

  const addCategoryBtn = document.getElementById('add-category-btn');
  const newCategoryInput = document.getElementById('new-category-input');

  if (addCategoryBtn && newCategoryInput) {
    addCategoryBtn.addEventListener('click', () => {
      const catName = newCategoryInput.value.trim();
      if (catName) {
        const success = DocumentModel.addCategory(catName);
        if (success) {
          newCategoryInput.value = '';
          renderSidebar();
        } else {
          alert('La materia ya existe o no es válida.');
        }
      }
    });

    newCategoryInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addCategoryBtn.click();
      }
    });
  }

  document.getElementById('new-doc-btn').addEventListener('click', () => {
    DocumentModel.clearActive();
    chatView.classList.add('hidden');
    uploadView.classList.remove('hidden');
    renderSidebar(); // remove active class from list
    closeSidebar(); // hide on mobile
  });
});
