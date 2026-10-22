document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = UploadView.fileInput;
  const newDocumentButton = document.getElementById('new-doc-btn');
  const addCategoryButton = document.getElementById('add-category-btn');
  const categoryInput = document.getElementById('new-category-input');

  const renderSidebar = () => {
    SidebarView.render(
      DocumentModel.getDocuments(),
      DocumentModel.currentDocumentId,
      selectDocument,
      deleteDocument
    );
  };

  const selectDocument = documentData => {
    DocumentModel.setActive(documentData.documentId, documentData.fileName);
    renderSidebar();
    UploadView.showChat(documentData.fileName);
    SidebarView.closeMobile();
  };

  const deleteDocument = documentData => {
    const confirmed = confirm(`¿Estás seguro de que deseas eliminar el documento "${documentData.fileName}"? Se borrará también todo su historial de chat.`);
    if (!confirmed) return;
    DocumentModel.deleteDocument(documentData.documentId);
    renderSidebar();
    if (!DocumentModel.currentDocumentId) UploadView.showUpload();
  };

  const readFileAsBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });

  const uploadFile = async file => {
    UploadView.hideError();
    if (file.type !== 'application/pdf') {
      UploadView.showError('Por favor, selecciona un archivo PDF.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      UploadView.showError('El archivo excede el límite de 15MB.');
      return;
    }

    UploadView.setLoading();
    try {
      setTimeout(() => UploadView.setProgress(30, 'Subiendo... 30%'), 300);
      setTimeout(() => UploadView.setProgress(60, 'Procesando... 60%'), 800);
      const response = await ApiService.uploadDocument(file.name, await readFileAsBase64(file));
      DocumentModel.saveDocument(response.documentId, file.name);
      DocumentModel.setActive(response.documentId, file.name);
      renderSidebar();
      UploadView.showSuccess();
      setTimeout(() => {
        UploadView.resetButton();
        fileInput.value = '';
        UploadView.showChat(file.name);
      }, 1500);
    } catch (error) {
      UploadView.showError(error.message || 'Error al subir el archivo.');
    }
  };

  const openFilePicker = event => {
    if (event.target !== UploadView.browseButton &&
        event.target !== UploadView.buttonLabel &&
        event.target !== UploadView.progressFill) {
      fileInput.click();
    }
  };

  UploadView.browseButton.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('click', openFilePicker);
  dropZone.addEventListener('dragover', event => {
    event.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', event => {
    event.preventDefault();
    dropZone.classList.remove('dragover');
    if (event.dataTransfer.files.length) uploadFile(event.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) uploadFile(fileInput.files[0]);
  });

  document.querySelector('.upload-menu-btn')?.addEventListener('click', () => SidebarView.toggleMobile());
  document.querySelector('.chat-menu-btn')?.addEventListener('click', () => SidebarView.toggleMobile());
  document.getElementById('sidebar-close-btn')?.addEventListener('click', () => SidebarView.closeMobile());
  SidebarView.overlay?.addEventListener('click', () => SidebarView.closeMobile());

  addCategoryButton?.addEventListener('click', () => {
    const categoryName = categoryInput.value.trim();
    if (!categoryName) return;
    if (DocumentModel.addCategory(categoryName)) {
      categoryInput.value = '';
      renderSidebar();
    } else {
      alert('La materia ya existe o no es válida.');
    }
  });
  categoryInput?.addEventListener('keypress', event => {
    if (event.key === 'Enter') addCategoryButton.click();
  });

  newDocumentButton.addEventListener('click', () => {
    DocumentModel.clearActive();
    UploadView.showUpload();
    renderSidebar();
    SidebarView.closeMobile();
  });

  window.renderSidebar = renderSidebar;
  renderSidebar();
});
