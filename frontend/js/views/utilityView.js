const UtilityView = {
  modal: document.getElementById('utility-modal'),
  title: document.getElementById('utility-modal-title'),
  body: document.getElementById('utility-modal-body'),

  escapeHtml(value) {
    const element = document.createElement('div');
    element.textContent = String(value || '');
    return element.innerHTML;
  },

  open(title) {
    this.title.textContent = title;
    this.modal.showModal();
  },

  close() {
    if (this.modal.open) this.modal.close();
  },

  showStatus(message, isError = false) {
    let status = this.body.querySelector('.utility-status');
    if (!status) {
      status = document.createElement('p');
      status.className = 'utility-status';
      this.body.appendChild(status);
    }
    status.textContent = message;
    status.classList.toggle('error', isError);
  },

  renderMerge() {
    this.body.innerHTML = `
      <p class="utility-description">Combina varios PDFs en un solo archivo directamente en este dispositivo.</p>
      <label class="utility-drop">
        <strong>Seleccionar archivos PDF</strong>
        <span>Puedes elegir dos o más archivos</span>
        <input id="merge-files" type="file" accept="application/pdf" multiple>
      </label>
      <div id="merge-file-list" class="utility-file-list"></div>
      <button id="merge-download" class="utility-primary-button" type="button" disabled>Unir y descargar PDF</button>
    `;
  },

  renderMergeFiles(files) {
    const list = document.getElementById('merge-file-list');
    const button = document.getElementById('merge-download');
    if (!list || !button) return;
    list.innerHTML = files.length
      ? files.map((file, index) => `
          <div class="utility-file-row">
            <span class="utility-file-number">${index + 1}</span>
            <span class="utility-file-name">${this.escapeHtml(file.name)}</span>
          </div>
        `).join('')
      : '<p class="utility-empty">Aún no hay archivos seleccionados.</p>';
    button.disabled = files.length < 2;
  },

  renderImages() {
    this.body.innerHTML = `
      <p class="utility-description">Convierte imágenes JPG o PNG en un PDF descargable.</p>
      <label class="utility-drop">
        <strong>Seleccionar imágenes</strong>
        <span>JPG o PNG, en el orden que las elijas</span>
        <input id="image-files" type="file" accept="image/jpeg,image/png" multiple>
      </label>
      <div id="image-preview-list" class="utility-image-grid"></div>
      <button id="images-download" class="utility-primary-button" type="button" disabled>Convertir y descargar PDF</button>
    `;
  },

  renderImageFiles(files) {
    const list = document.getElementById('image-preview-list');
    const button = document.getElementById('images-download');
    if (!list || !button) return;
    list.innerHTML = files.map(file => {
      const previewUrl = URL.createObjectURL(file);
      return `<img src="${previewUrl}" alt="${this.escapeHtml(file.name)}">`;
    }).join('');
    button.disabled = files.length === 0;
  },

  renderApa(documentName) {
    const title = documentName ? documentName.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ') : '';
    this.body.innerHTML = `
      <p class="utility-description">Genera una referencia desde el PDF o completa los datos manualmente.</p>
      <button id="generate-apa" class="utility-secondary-button" type="button">Extraer datos del PDF con IA</button>
      <div class="utility-form-grid">
        <label class="utility-field utility-field-wide">Autor(es)
          <input id="apa-author" type="text" placeholder="Ej. Pérez, J. M.">
        </label>
        <label class="utility-field">Año
          <input id="apa-year" type="text" inputmode="numeric" placeholder="2026">
        </label>
        <label class="utility-field utility-field-wide">Título
          <input id="apa-title" type="text" value="${this.escapeHtml(title)}" placeholder="Título del documento">
        </label>
        <label class="utility-field">Editorial o institución
          <input id="apa-publisher" type="text" placeholder="Editorial o institución">
        </label>
        <label class="utility-field">URL / DOI
          <input id="apa-url" type="url" placeholder="https://...">
        </label>
      </div>
      <div class="utility-preview">
        <span>Vista previa APA 7</span>
        <p id="apa-preview">Autor desconocido (s. f.). ${this.escapeHtml(title || 'Título del documento')}.</p>
      </div>
      <button id="copy-apa" class="utility-primary-button" type="button">Copiar cita APA 7</button>
    `;
  },

  renderDiagrams() {
    this.body.innerHTML = `
      <p class="utility-description">Genera mapas conceptuales, diagramas de flujo, UML o entidad-relación.</p>
      <button id="generate-diagram-from-pdf" class="utility-secondary-button" type="button">Generar automáticamente desde el PDF</button>
      <div class="diagram-type-list" role="tablist" aria-label="Tipo de diagrama">
        <button type="button" class="diagram-type active" data-diagram-type="mindmap">Mapa conceptual</button>
        <button type="button" class="diagram-type" data-diagram-type="flowchart">Flujo</button>
        <button type="button" class="diagram-type" data-diagram-type="erDiagram">Entidad-relación</button>
        <button type="button" class="diagram-type" data-diagram-type="classDiagram">UML</button>
      </div>
      <label class="utility-field">Código Mermaid
        <textarea id="diagram-source" rows="7" placeholder="Escribe o pega código Mermaid"></textarea>
      </label>
      <div class="diagram-actions">
        <button id="render-diagram" class="utility-secondary-button" type="button">Renderizar</button>
        <button id="download-diagram" class="utility-primary-button" type="button" disabled>Descargar SVG</button>
      </div>
      <div id="diagram-preview" class="diagram-preview">
        <span>El diagrama aparecerá aquí.</span>
      </div>
    `;
  }
};
