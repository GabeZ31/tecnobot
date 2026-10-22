const MarkdownRenderer = {
  render(text) {
    const escapeHtml = (value) => value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const parseInline = (value) => value
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');

    const lines = text.split(/\r?\n/);
    let html = '';
    let paragraph = '';
    let listItems = [];
    let listType = null;
    let insideCodeBlock = false;
    let codeLines = [];
    let insideTable = false;
    let tableRows = [];

    const flushParagraph = () => {
      if (!paragraph) return;
      html += `<p>${parseInline(paragraph.trim())}</p>`;
      paragraph = '';
    };

    const flushList = () => {
      if (!listItems.length) return;
      html += `<${listType}>${listItems.map(item => `<li>${parseInline(item)}</li>`).join('')}</${listType}>`;
      listItems = [];
      listType = null;
    };

    const flushTable = () => {
      if (!insideTable || !tableRows.length) return;
      html += '<table>';
      tableRows.forEach((row, rowIndex) => {
        if (rowIndex === 0) html += '<thead>';
        if (rowIndex === 1) html += '<tbody>';
        const cellTag = rowIndex === 0 ? 'th' : 'td';
        html += `<tr>${row.map(cell => `<${cellTag}>${parseInline(cell)}</${cellTag}>`).join('')}</tr>`;
        if (rowIndex === 0) html += '</thead>';
        if (rowIndex === tableRows.length - 1 && rowIndex > 0) html += '</tbody>';
      });
      html += '</table>';
      tableRows = [];
      insideTable = false;
    };

    lines.forEach(line => {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('```')) {
        if (insideCodeBlock) {
          insideCodeBlock = false;
          html += `<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`;
          codeLines = [];
        } else {
          flushParagraph();
          flushList();
          flushTable();
          insideCodeBlock = true;
        }
        return;
      }

      if (insideCodeBlock) {
        codeLines.push(line);
        return;
      }

      const isTableLine = trimmedLine.startsWith('|') && trimmedLine.endsWith('|');
      if (isTableLine) {
        flushParagraph();
        flushList();
        const cells = line.split('|')
          .map(cell => cell.trim())
          .filter((cell, index, values) => index > 0 && index < values.length - 1);
        if (!cells.every(cell => /^:?-+:?$/.test(cell))) {
          insideTable = true;
          tableRows.push(cells);
        }
        return;
      }

      flushTable();

      if (!trimmedLine) {
        flushParagraph();
        flushList();
        return;
      }

      const heading = line.match(/^(#{1,6})\s+(.*)$/);
      if (heading) {
        flushParagraph();
        flushList();
        const level = heading[1].length;
        html += `<h${level}>${parseInline(heading[2])}</h${level}>`;
        return;
      }

      const unorderedItem = line.match(/^\s*[-*]\s+(.*)$/);
      const orderedItem = line.match(/^\s*(\d+)\.\s+(.*)$/);
      if (unorderedItem || orderedItem) {
        flushParagraph();
        const nextListType = unorderedItem ? 'ul' : 'ol';
        if (listType && listType !== nextListType) flushList();
        listType = nextListType;
        listItems.push((unorderedItem || orderedItem)[unorderedItem ? 1 : 2]);
        return;
      }

      flushList();
      paragraph = paragraph ? `${paragraph} ${line}` : line;
    });

    flushParagraph();
    flushList();
    flushTable();
    if (insideCodeBlock && codeLines.length) {
      html += `<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`;
    }
    return html;
  }
};
