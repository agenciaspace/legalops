import { normalize, markdown } from './model.mjs';
const status = document.getElementById('library-status');
const library = document.getElementById('library');
const retry = document.getElementById('retry');
const download = document.getElementById('download');
const club = 'https://legalops.club/community/tools/playbook';
let published;
function save(value, name, type) {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
// Only render the editor's supported nodes; never inject stored HTML or URLs.
export function renderNode(node) {
  if (node.type === 'text') {
    let result = document.createTextNode(node.text || '');
    for (const mark of node.marks || []) {
      if (!['bold', 'italic'].includes(mark.type)) continue;
      const wrap = document.createElement(mark.type === 'bold' ? 'strong' : 'em'); wrap.append(result); result = wrap;
    }
    return result;
  }
  const tags = { doc:'div', paragraph:'p', heading:node.attrs?.level === 2 ? 'h2' : 'h3', bulletList:'ul', orderedList:'ol', listItem:'li', blockquote:'blockquote', hardBreak:'br', taskList:'ul', taskItem:'li', table:'table', tableRow:'tr', tableCell:'td', tableHeader:'th' };
  const element = document.createElement(tags[node.type] || 'div');
  if (node.type === 'taskItem') element.append(document.createTextNode(node.attrs?.checked ? '☑ ' : '☐ '));
  if (node.type === 'orderedList') element.start = node.attrs?.start || 1;
  if (['tableCell','tableHeader'].includes(node.type)) { element.colSpan = Math.min(50, Math.max(1, node.attrs?.colspan || 1)); element.rowSpan = Math.min(50, Math.max(1, node.attrs?.rowspan || 1)); }
  for (const child of node.content || []) element.append(renderNode(child));
  if (node.type === 'table') { const wrap = document.createElement('div'); wrap.className = 'table-scroll'; wrap.append(element); return wrap; }
  return element;
}
async function load() {
  retry.hidden = true;
  try {
    const response = await fetch('https://legalops.club/api/playbook', { cache:'no-store', signal:AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('unavailable');
    const value = await response.json();
    if (value.journey !== 'open-playbook' || !Array.isArray(value.sections) || !value.sections.length) throw new Error('empty');
    const expanded = new Set([...library.querySelectorAll('details[open]')].map(item => item.id));
    const fragment = document.createDocumentFragment();
    for (const section of value.sections) {
      const details = document.createElement('details'); details.id = section.id; details.open = expanded.has(section.id);
      const title = document.createElement('summary'); title.textContent = section.title;
      const version = document.createElement('p'); version.className = 'version'; version.textContent = `Versão ${section.version}`;
      const edit = document.createElement('a'); edit.className = 'contribute'; edit.textContent = 'Comentar ou sugerir alteração →'; edit.href = `${club}?section=${encodeURIComponent(section.id)}`;
      details.append(title, version, renderNode(section.content), edit); fragment.append(details);
    }
    library.replaceChildren(fragment); published = value; download.hidden = false;
    status.textContent = 'Versão publicada pela comunidade. Rascunhos e propostas em revisão aparecem apenas no Club.';
  } catch {
    status.textContent = published ? 'Não foi possível atualizar. A versão exibida pode estar desatualizada.' : 'Não foi possível carregar a publicação. Tente novamente ou abra o editor do Club.';
    retry.hidden = false;
  }
}
retry.addEventListener('click', load);
download.addEventListener('click', () => save(JSON.stringify(published, null, 2), 'playbook-publicado.json', 'application/json'));
try {
  const draft = normalize(JSON.parse(localStorage.getItem('legalops-open-playbook-v1')));
  if (Object.values(draft).some(Boolean)) {
    document.getElementById('legacy-draft').hidden = false;
    document.getElementById('legacy-text').textContent = markdown(draft);
    document.getElementById('legacy-download').addEventListener('click', () => save(markdown(draft), 'playbook-rascunho.md', 'text/markdown;charset=utf-8'));
  }
} catch { /* Storage may be unavailable; published reading remains available. */ }
load();
setInterval(() => { if (document.visibilityState === 'visible') load(); }, 30000);
