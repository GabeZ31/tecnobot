document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('utilities-toggle');
  const content = document.getElementById('utilities-content');
  const modal = document.getElementById('utility-modal');
  const closeButton = document.getElementById('close-utility-modal');
  const utilityPanel = document.getElementById('chat-utility-panel');
  const openUtilityPanelButton = document.getElementById('open-chat-utility-panel');
  const closeUtilityPanelButton = document.getElementById('close-chat-utility-panel');
  let mergeFiles = [];
  let imageFiles = [];
  let diagramSvg = '';
  let currentDiagramType = 'mindmap';

  toggle.addEventListener('click', () => {
    const isOpen = content.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  document.querySelectorAll('[data-utility]').forEach(button => {
    button.addEventListener('click', () => openUtility(button.dataset.utility));
  });
  document.querySelectorAll('[data-chat-action]').forEach(button => {
    button.addEventListener('click', () => {
      closeChatUtilityPanel();
      document.dispatchEvent(new CustomEvent('tecnobot:study-action', {
        detail: { action: button.dataset.chatAction }
      }));
    });
  });

  const closeChatUtilityPanel = () => {
    if (!utilityPanel) return;
    utilityPanel.classList.add('hidden');
    openUtilityPanelButton?.setAttribute('aria-expanded', 'false');
  };

  openUtilityPanelButton?.addEventListener('click', () => {
    if (!utilityPanel) return;
    const isOpen = utilityPanel.classList.toggle('hidden');
    openUtilityPanelButton.setAttribute('aria-expanded', String(!isOpen));
  });
  closeUtilityPanelButton?.addEventListener('click', closeChatUtilityPanel);

  closeButton.addEventListener('click', () => UtilityView.close());
  modal.addEventListener('cancel', event => {
    event.preventDefault();
    UtilityView.close();
  });
  modal.addEventListener('click', event => {
    if (event.target === modal) UtilityView.close();
  });

  function openUtility(type) {
    SidebarView.closeMobile();
    closeChatUtilityPanel();
    const activeDocumentName = DocumentModel.currentFileName || 'Documento';
    if (type === 'merge') {
      UtilityView.open('Unir PDFs');
      UtilityView.renderMerge();
      setupMerge();
    } else if (type === 'images') {
      UtilityView.open('Imágenes a PDF');
      UtilityView.renderImages();
      setupImages();
    } else if (type === 'apa') {
      UtilityView.open('Citas APA 7');
      UtilityView.renderApa(activeDocumentName);
      setupApa();
    } else if (type === 'diagrams') {
      UtilityView.open('Mapas y diagramas');
      UtilityView.renderDiagrams();
      setupDiagrams();
    }
  }

  function setupMerge() {
    mergeFiles = [];
    document.getElementById('merge-files').addEventListener('change', event => {
      mergeFiles = Array.from(event.target.files || []);
      UtilityView.renderMergeFiles(mergeFiles);
    });
    document.getElementById('merge-download').addEventListener('click', async event => {
      if (mergeFiles.length < 2) return;
      const button = event.currentTarget;
      button.disabled = true;
      UtilityView.showStatus('Combinando PDFs...');
      try {
        const result = await UtilityService.mergePdfFiles(mergeFiles);
        UtilityService.downloadBlob(result.blob, 'Apuntes_Unidos_Tecnobot.pdf');
        UtilityView.showStatus(`PDF creado con ${result.pageCount} páginas.`);
      } catch (error) {
        UtilityView.showStatus('No fue posible combinar estos PDFs.', true);
      } finally {
        button.disabled = mergeFiles.length < 2;
      }
    });
  }

  function setupImages() {
    imageFiles = [];
    document.getElementById('image-files').addEventListener('change', event => {
      imageFiles = Array.from(event.target.files || []);
      UtilityView.renderImageFiles(imageFiles);
    });
    document.getElementById('images-download').addEventListener('click', async event => {
      if (!imageFiles.length) return;
      const button = event.currentTarget;
      button.disabled = true;
      UtilityView.showStatus('Creando PDF...');
      try {
        const blob = await UtilityService.imagesToPdf(imageFiles);
        UtilityService.downloadBlob(blob, 'Apuntes_Escaneados_Tecnobot.pdf');
        UtilityView.showStatus('PDF generado correctamente.');
      } catch (error) {
        UtilityView.showStatus('Revisa que las imágenes sean JPG o PNG válidas.', true);
      } finally {
        button.disabled = imageFiles.length === 0;
      }
    });
  }

  function setupApa() {
    const inputs = ['apa-author', 'apa-year', 'apa-title', 'apa-publisher', 'apa-url'];
    const updatePreview = () => {
      const author = document.getElementById('apa-author').value.trim() || 'Autor desconocido';
      const year = document.getElementById('apa-year').value.trim() || 's. f.';
      const title = document.getElementById('apa-title').value.trim() || 'Título del documento';
      const publisher = document.getElementById('apa-publisher').value.trim();
      const url = document.getElementById('apa-url').value.trim();
      const citation = `${author} (${year}). ${title}.${publisher ? ` ${publisher}.` : ''}${url ? ` ${url}` : ''}`;
      document.getElementById('apa-preview').textContent = citation;
    };
    inputs.forEach(id => document.getElementById(id).addEventListener('input', updatePreview));
    document.getElementById('copy-apa').addEventListener('click', async () => {
      const citation = document.getElementById('apa-preview').textContent;
      try {
        await navigator.clipboard.writeText(citation);
        UtilityView.showStatus('Cita APA copiada al portapapeles.');
      } catch (error) {
        UtilityView.showStatus('No se pudo copiar automáticamente.', true);
      }
    });
  }

  function setupDiagrams() {
    const source = document.getElementById('diagram-source');
    source.value = 'mindmap\n  root((Tecnobot))\n    Documentos\n    Chat\n    Estudio';

    document.querySelectorAll('[data-diagram-type]').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('[data-diagram-type]').forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        currentDiagramType = button.dataset.diagramType;
        source.value = defaultDiagramSource(currentDiagramType);
      });
    });

    document.getElementById('render-diagram').addEventListener('click', renderDiagram);
    document.getElementById('download-diagram').addEventListener('click', downloadDiagram);
  }

  function defaultDiagramSource(type) {
    if (type === 'flowchart') return 'flowchart TD\n  A[Subir PDF] --> B[Extraer texto]\n  B --> C[Fragmentar]\n  C --> D[Consultar a Bedrock]\n  D --> E[Responder al usuario]';
    if (type === 'erDiagram') return 'erDiagram\n  USUARIO ||--o{ DOCUMENTO : sube\n  DOCUMENTO ||--|{ FRAGMENTO : contiene\n  USUARIO ||--o{ CHAT : inicia';
    if (type === 'classDiagram') return 'classDiagram\n  class Documento {\n    +String documentId\n    +String fileName\n    +procesar()\n  }\n  class Chat {\n    +preguntar()\n    +resumir()\n  }\n  Documento --> Chat';
    return 'mindmap\n  root((Tecnobot))\n    Documentos\n      PDF\n      Materias\n    Estudio\n      Chat\n      Resumen\n      Examen';
  }

  async function renderDiagram() {
    const preview = document.getElementById('diagram-preview');
    const code = document.getElementById('diagram-source').value.trim();
    if (!code) {
      UtilityView.showStatus('Escribe el código Mermaid antes de renderizar.', true);
      return;
    }
    preview.innerHTML = '<span>Renderizando diagrama...</span>';
    try {
      const mermaid = await UtilityService.getMermaid();
      const id = `tecnobot-diagram-${Date.now()}`;
      const result = await mermaid.render(id, code);
      diagramSvg = result.svg;
      preview.innerHTML = result.svg;
      document.getElementById('download-diagram').disabled = false;
    } catch (error) {
      preview.innerHTML = '<span class="utility-error">Revisa la sintaxis del diagrama.</span>';
    }
  }

  function downloadDiagram() {
    if (!diagramSvg) return;
    const blob = new Blob([diagramSvg], { type: 'image/svg+xml;charset=utf-8' });
    UtilityService.downloadBlob(blob, `Tecnobot_${currentDiagramType}.svg`);
  }
});
