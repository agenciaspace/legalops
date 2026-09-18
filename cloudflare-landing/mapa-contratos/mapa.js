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
      if (!Array.isArray(data.sections) || data.sections.length !== document.querySelectorAll('[data-stage]').length) throw new Error('incomplete');
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
      }
      status.textContent = 'Versão aprovada atualizada. Abra uma etapa para explorar ou contribuir.';
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      downloadUrl = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const download = document.getElementById('download-map'); download.href = downloadUrl; download.textContent = 'Baixar versão aprovada';
    } catch {
      status.textContent = 'Não foi possível consultar atualizações. A versão exibida pode estar desatualizada; tente atualizar a página.';
    }
  }
  const panels = Array.from(document.querySelectorAll('.journey-phase'));
  const tabs = Array.from(document.querySelectorAll('[data-phase]'));
  const position = document.getElementById('journey-position');
  const previous = document.getElementById('phase-prev');
  const next = document.getElementById('phase-next');
  const all = document.getElementById('show-all');
  let active = 0;
  function showPhase(index, updateHash = true) {
    active = Math.max(0, Math.min(index, panels.length - 1));
    panels.forEach((panel, i) => { panel.hidden = i !== active; });
    tabs.forEach((tab, i) => { if (i === active) tab.setAttribute('aria-current','step'); else tab.removeAttribute('aria-current'); });
    previous.disabled = active === 0; next.disabled = active === panels.length - 1;
    position.textContent = `Fase ${active+1} de ${panels.length} · etapas ${active*3+1} a ${active*3+3}`;
    all.textContent = 'Ver todas as etapas';
    if (updateHash) history.replaceState(null, '', `#${panels[active].id}`);
  }
  function followHash() {
    const target = document.getElementById(location.hash.slice(1));
    const panel = target?.closest('.journey-phase');
    if (panel) { showPhase(panels.indexOf(panel), false); if (target.matches('[data-stage]')) target.open = true; }
    else showPhase(0, false);
  }
  tabs.forEach((tab, index) => tab.addEventListener('click', event => { event.preventDefault(); showPhase(index); }));
  previous.addEventListener('click', () => showPhase(active-1));
  next.addEventListener('click', () => showPhase(active+1));
  all.hidden = false; document.querySelector('.phase-paging').hidden = false;
  all.addEventListener('click', () => {
    if (all.textContent === 'Ver uma fase por vez') return showPhase(active);
    panels.forEach(panel => { panel.hidden = false; }); tabs.forEach(tab => tab.removeAttribute('aria-current'));
    position.textContent = '12 etapas · 4 fases'; all.textContent = 'Ver uma fase por vez';
  });
  window.addEventListener('hashchange', followHash);
  followHash();
  refresh();
  window.addEventListener('focus', refresh);
})();
