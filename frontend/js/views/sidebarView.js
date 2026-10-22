const SidebarView = {
  list: document.getElementById('docs-list'),
  sidebar: document.getElementById('sidebar'),
  overlay: document.getElementById('mobile-overlay'),

  toggleMobile() {
    this.sidebar.classList.toggle('open');
    this.overlay.classList.toggle('active');
  },

  closeMobile() {
    this.sidebar.classList.remove('open');
    this.overlay.classList.remove('active');
  },

  render(documents, activeDocumentId, onSelect, onDelete) {
    this.list.innerHTML = '';
    if (!documents.length) {
      this.list.appendChild(this.createEmptyMessage());
      return;
    }
    documents.forEach(documentData => {
      this.list.appendChild(this.createDocumentItem(
        documentData,
        documentData.documentId === activeDocumentId,
        onSelect,
        onDelete
      ));
    });
  },

  createEmptyMessage() {
    const message = document.createElement('div');
    message.textContent = 'No hay documentos subidos';
    message.style.cssText = 'font-size:12px;color:var(--dim);padding:12px;text-align:center;font-style:italic';
    return message;
  },

  createDocumentItem(documentData, isActive, onSelect, onDelete) {
    const item = document.createElement('div');
    item.className = `doc-item ${isActive ? 'active' : ''}`;
    item.innerHTML = `
      <div class="doc-item-wrapper">
        <div class="doc-item-main">
          <div class="doc-item-top">
            <div class="doc-item-icon" style="background-color:${documentData.bg};color:${documentData.color}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </div>
            <span class="doc-item-title" title="${documentData.fileName}">${documentData.fileName}</span>
          </div>
          <div class="doc-item-date">${this.relativeTime(documentData.date)}</div>
        </div>
        <div class="doc-item-actions-wrapper">
          <button class="doc-action-btn btn-delete" title="Eliminar PDF">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>`;

    item.addEventListener('click', event => {
      if (!event.target.closest('.doc-action-btn')) onSelect(documentData);
    });
    item.querySelector('.btn-delete').addEventListener('click', event => {
      event.stopPropagation();
      onDelete(documentData);
    });
    return item;
  },

  relativeTime(dateValue) {
    const minutes = Math.floor((Date.now() - new Date(dateValue).getTime()) / 60000);
    if (minutes <= 0) return 'Justo ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (minutes < 1440) return `Hace ${Math.floor(minutes / 60)} h`;
    return `Hace ${Math.floor(minutes / 1440)} d`;
  }
};
