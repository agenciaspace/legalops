/* Only approved document content is returned by this public endpoint. */
(() => {
  const status = document.getElementById('map-status');
  let downloadUrl;
  function render(node) {
    if (node.type === 'text') {
      let text = document.createTextNode(node.text || '');
      for (const mark of node.marks || []) {
        if (!['bold', 'italic'].includes(mark.type)) continue;
        const wrapper = document.createElement(mark.type === 'bold' ? 'strong' : 'em');
        wrapper.append(text); text = wrapper;
      }
      return text;
    }
    const tag = { doc: 'div', paragraph: 'p', bulletList: 'ul', orderedList: 'ol', listItem: 'li', blockquote: 'blockquote', hardBreak: 'br' }[node.type] || (node.type === 'heading' ? node.attrs?.level === 3 ? 'h3' : 'h2' : 'div');
    const element = document.createElement(tag);
    if (tag === 'ol' && Number.isInteger(node.attrs?.start)) element.start = node.attrs.start;
    for (const child of node.content || []) element.append(render(child));
    return element;
  }
  async function refresh() {
    try {
      const response = await fetch('https://legalops.club/api/contract-map', { signal: AbortSignal.timeout(12000), cache: 'no-store' });
      if (!response.ok) throw new Error('unavailable');
      const data = await response.json();
      if (!Array.isArray(data.sections) || data.sections.length !== 8) throw new Error('incomplete');
      // Prepare all nodes before changing the page so a malformed response keeps the fallback intact.
      const replacements = data.sections.map(section => {
        const container = document.getElementById(section.id);
        if (!container || !section.content || section.content.type !== 'doc') throw new Error('invalid');
        const content = render(section.content);
        const version = document.createElement('p'); version.className = 'label'; version.textContent = `Versão ${section.version} · aprovada pela comunidade`;
        const link = container.querySelector('.contribute').cloneNode(true);
        return { container, content, version, link };
      });
      for (const { container, content, version, link } of replacements) {
        container.querySelector('.detail').replaceChildren(version, content, link);
        container.querySelector('summary small').textContent = 'Texto aprovado pela comunidade';
      }
      status.textContent = 'Versão aprovada atualizada. Abra uma etapa para explorar ou contribuir.';
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      downloadUrl = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const download = document.getElementById('download-map'); download.href = downloadUrl; download.textContent = 'Baixar versão aprovada';
    } catch {
      status.textContent = 'Não foi possível consultar atualizações. A estrutura inicial continua disponível; tente atualizar a página.';
    }
  }
  refresh();
  window.addEventListener('focus', refresh);
})();
