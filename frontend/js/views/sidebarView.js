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

  render(documents, categories, activeDocumentId, onSelect, onDelete, onMove, onDeleteCategory) {
    this.list.innerHTML = '';
    if (!documents.length) {
      this.list.appendChild(this.createEmptyMessage());
      return;
    }

    const categoryNames = Array.isArray(categories) ? categories : ['General'];
    const documentCategoryNames = documents
      .map(documentData => documentData.category || 'General')
      .filter((categoryName, index, allNames) =>
        allNames.indexOf(categoryName) === index
      );
    const normalizedCategoryNames = ['General', ...categoryNames, ...documentCategoryNames]
      .filter((categoryName, index, allNames) =>
        allNames.indexOf(categoryName) === index
      );

    normalizedCategoryNames.forEach(categoryName => {
      const categoryDocuments = documents.filter(documentData =>
        (documentData.category || 'General') === categoryName
      );
      this.list.appendChild(this.createCategoryGroup(
        categoryName,
        categoryDocuments,
        activeDocumentId,
        onSelect,
        onDelete,
        onMove,
        onDeleteCategory
      ));
    });
  },

  createCategoryGroup(categoryName, documents, activeDocumentId, onSelect, onDelete, onMove, onDeleteCategory) {
    const group = document.createElement('details');
    group.className = 'category-group';
    group.open = true;

    const header = document.createElement('summary');
    header.className = 'category-header';
    header.innerHTML = `
      <span class="category-header-left">
        <svg class="folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        </svg>
        <span class="category-name"></span>
        <span class="category-count"></span>
      </span>
      <svg class="category-header-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>`;
    header.querySelector('.category-name').textContent = categoryName;
    header.querySelector('.category-count').textContent = documents.length;

    if (categoryName !== 'General' && typeof onDeleteCategory === 'function') {
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'doc-action-btn category-delete-btn';
      deleteButton.title = `Eliminar materia ${categoryName}`;
      deleteButton.textContent = '×';
      deleteButton.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        onDeleteCategory(categoryName);
      });
      header.appendChild(deleteButton);
    }

    const documentContainer = document.createElement('div');
    documentContainer.className = 'category-docs';
    if (!documents.length) {
      const emptyCategory = document.createElement('div');
      emptyCategory.className = 'empty-category-message';
      emptyCategory.textContent = 'Sin documentos';
      documentContainer.appendChild(emptyCategory);
    } else {
      documents.forEach(documentData => {
        documentContainer.appendChild(this.createDocumentItem(
          documentData,
          documentData.documentId === activeDocumentId,
          onSelect,
          onDelete,
          onMove
        ));
      });
    }

    group.appendChild(header);
    group.appendChild(documentContainer);
    return group;
  },

  createEmptyMessage() {
    const message = document.createElement('div');
    message.textContent = 'No hay documentos subidos';
    message.className = 'sidebar-empty-message';
    return message;
  },

  createDocumentItem(documentData, isActive, onSelect, onDelete, onMove) {
    const item = document.createElement('div');
    item.className = `doc-item ${isActive ? 'active' : ''}`;
    const wrapper = document.createElement('div');
    wrapper.className = 'doc-item-wrapper';
    const main = document.createElement('div');
    main.className = 'doc-item-main';
    const top = document.createElement('div');
    top.className = 'doc-item-top';
    const icon = document.createElement('div');
    icon.className = 'doc-item-icon';
    icon.style.backgroundColor = documentData.bg;
    icon.style.color = documentData.color;
    icon.textContent = 'PDF';
    const title = document.createElement('span');
    title.className = 'doc-item-title';
    title.title = documentData.fileName;
    title.textContent = documentData.fileName;
    top.appendChild(icon);
    top.appendChild(title);
    const date = document.createElement('div');
    date.className = 'doc-item-date';
    date.textContent = this.relativeTime(documentData.date);
    main.appendChild(top);
    main.appendChild(date);

    const actions = document.createElement('div');
    actions.className = 'doc-item-actions-wrapper';
    if (typeof onMove === 'function') {
      const moveSelect = document.createElement('select');
      moveSelect.className = 'category-move-select';
      moveSelect.title = 'Cambiar materia';
      const categories = DocumentModel.getCategories();
      categories.forEach(categoryName => {
        const option = document.createElement('option');
        option.value = categoryName;
        option.textContent = categoryName;
        moveSelect.appendChild(option);
      });
      moveSelect.value = documentData.category || 'General';
      moveSelect.addEventListener('click', event => event.stopPropagation());
      moveSelect.addEventListener('change', event => {
        event.stopPropagation();
        onMove(documentData.documentId, event.target.value);
      });
      actions.appendChild(moveSelect);
    }
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'doc-action-btn btn-delete';
    deleteButton.title = 'Eliminar PDF';
    deleteButton.textContent = '×';
    actions.appendChild(deleteButton);
    wrapper.appendChild(main);
    wrapper.appendChild(actions);
    item.appendChild(wrapper);

    item.addEventListener('click', event => {
      if (!event.target.closest('.doc-action-btn')) onSelect(documentData);
    });
    deleteButton.addEventListener('click', event => {
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
