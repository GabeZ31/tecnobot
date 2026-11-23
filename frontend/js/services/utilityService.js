const UtilityService = {
  scriptPromises: {},

  loadScript(key, url) {
    if (this.scriptPromises[key]) return this.scriptPromises[key];
    this.scriptPromises[key] = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.crossOrigin = 'anonymous';
      script.referrerPolicy = 'no-referrer';
      script.onload = resolve;
      script.onerror = () => reject(new Error(`No se pudo cargar ${key}`));
      document.head.appendChild(script);
    });
    return this.scriptPromises[key];
  },

  async getPdfLib() {
    if (window.PDFLib) return window.PDFLib;
    await this.loadScript('pdf-lib', 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js');
    return window.PDFLib;
  },

  async getMermaid() {
    if (window.mermaid) return window.mermaid;
    await this.loadScript('mermaid', 'https://cdn.jsdelivr.net/npm/mermaid@10.9.4/dist/mermaid.min.js');
    window.mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor: '#eef2ff',
        primaryTextColor: '#1f2937',
        primaryBorderColor: '#3a6ef5',
        lineColor: '#64748b',
        secondaryColor: '#f8fafc',
        tertiaryColor: '#ffffff',
        fontFamily: 'system-ui, sans-serif'
      }
    });
    return window.mermaid;
  },

  downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  async mergePdfFiles(files) {
    const PDFLib = await this.getPdfLib();
    const mergedPdf = await PDFLib.PDFDocument.create();
    for (const file of files) {
      const sourcePdf = await PDFLib.PDFDocument.load(await file.arrayBuffer());
      const pages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
    }
    const bytes = await mergedPdf.save();
    return {
      blob: new Blob([bytes], { type: 'application/pdf' }),
      pageCount: mergedPdf.getPageCount()
    };
  },

  async imagesToPdf(files) {
    const PDFLib = await this.getPdfLib();
    const pdf = await PDFLib.PDFDocument.create();
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const image = file.type === 'image/png'
        ? await pdf.embedPng(bytes)
        : await pdf.embedJpg(bytes);
      const size = image.scale(1);
      const page = pdf.addPage([size.width, size.height]);
      page.drawImage(image, { x: 0, y: 0, width: size.width, height: size.height });
    }
    const bytes = await pdf.save();
    return new Blob([bytes], { type: 'application/pdf' });
  }
};
