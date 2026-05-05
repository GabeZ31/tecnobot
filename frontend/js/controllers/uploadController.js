// Controla la sección de upload
document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const browseBtn = document.getElementById('browse-btn');
  const progressContainer = document.getElementById('upload-progress-container');
  const progressBar = document.getElementById('upload-progress');
  const statusMsg = document.getElementById('upload-status');
  
  const uploadSection = document.getElementById('upload-section');
  const chatSection = document.getElementById('chat-section');
  const activeDocName = document.getElementById('active-doc-name');

  // Abre el selector de archivos al hacer clic en el botón o zona
  browseBtn.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('click', (e) => {
    if (e.target !== browseBtn) fileInput.click();
  });

  // Eventos de Drag & Drop
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

  // Evento de selección de archivo manual
  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      handleFile(fileInput.files[0]);
    }
  });

  /**
   * Procesa el archivo seleccionado
   * @param {File} file 
   */
  async function handleFile(file) {
    // Validar tipo
    if (file.type !== 'application/pdf') {
      showStatus('Por favor, selecciona un archivo PDF válido.', 'error');
      return;
    }

    // Validar tamaño (Max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showStatus('El archivo excede el límite de 5MB.', 'error');
      return;
    }

    hideStatus();
    showProgress(0);

    try {
      // Simular progreso de lectura local
      showProgress(30);
      const base64Content = await readFileAsBase64(file);
      
      showProgress(60);
      // Enviar al backend
      const response = await ApiService.uploadDocument(file.name, base64Content);
      
      showProgress(100);
      showStatus('Documento procesado con éxito.', 'success');
      
      // Guardar en modelo
      DocumentModel.setDocument(response.documentId, file.name);
      
      // Esperar un momento para mostrar el 100% y luego cambiar de vista
      setTimeout(() => {
        switchToChatView(file.name);
      }, 1000);

    } catch (error) {
      showProgress(0);
      showStatus(error.message || 'Ocurrió un error al procesar el documento.', 'error');
    }
  }

  /**
   * Convierte un archivo a base64
   * @param {File} file 
   * @returns {Promise<string>}
   */
  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Muestra mensaje de estado
   * @param {string} msg 
   * @param {string} type - 'error' | 'success'
   */
  function showStatus(msg, type) {
    statusMsg.textContent = msg;
    statusMsg.className = `status-msg status--${type}`;
    statusMsg.classList.remove('hidden');
  }

  /**
   * Oculta mensaje de estado
   */
  function hideStatus() {
    statusMsg.classList.add('hidden');
    statusMsg.className = 'status-msg';
  }

  /**
   * Muestra barra de progreso
   * @param {number} percent 
   */
  function showProgress(percent) {
    progressContainer.classList.remove('hidden');
    progressBar.style.width = `${percent}%`;
    if (percent === 0) {
      setTimeout(() => progressContainer.classList.add('hidden'), 300);
    }
  }

  /**
   * Cambia a la vista de chat
   * @param {string} fileName 
   */
  function switchToChatView(fileName) {
    uploadSection.classList.add('hidden');
    chatSection.classList.remove('hidden');
    activeDocName.textContent = fileName;
    
    // Resetear formulario para futuras subidas
    fileInput.value = '';
    showProgress(0);
    hideStatus();
    
    // Disparar evento para que el controlador de chat se prepare
    document.dispatchEvent(new CustomEvent('documentLoaded'));
  }
});
