import { criteria } from './framework.mjs';
const API = document.querySelector('meta[name="bench-api"]')?.content || 'https://legalops.club/api/bench/contributions';
const $ = id => document.getElementById(id);
const form = $('contribution-form');
const kinds = { tool: 'Ferramenta sugerida', evidence: 'Experiência ou fonte', correction: 'Correção proposta', criterion: 'Critério proposto' };
const evidenceKinds = { official: 'Documentação oficial', hands_on: 'Uso na operação', demo: 'Demonstração ou piloto', hypothesis: 'Hipótese a validar' };
const relationships = { independent: 'Sem vínculo com o fornecedor', customer: 'Cliente ou usuário', vendor: 'Fornecedor', partner: 'Parceiro ou consultor' };
const criterionNames = { general: 'Geral', ...Object.fromEntries(criteria.map(c => [c.id, c.name])) };
let page = 0;
let loading = false;
const visibleIds = new Set();
function element(tag, text, className) {
  const el = document.createElement(tag); el.textContent = text;
  if (className) el.className = className;
  return el;
}
function externalLink(url, text) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return null;
    const link = element('a', text); link.href = parsed.href; link.target = '_blank'; link.rel = 'noopener noreferrer nofollow ugc'; return link;
  } catch { return null; }
}
function addEntry(entry) {
  if (visibleIds.has(entry.id)) return;
  visibleIds.add(entry.id);
  const article = document.createElement('article'); article.className = 'community-entry';
  article.append(element('p', `${kinds[entry.kind] || 'Contribuição'} · ${entry.tool_name} · ${criterionNames[entry.criterion] || 'Geral'}`, 'micro'));
  article.append(element('h3', entry.title), element('p', entry.body, 'entry-body'));
  article.append(element('p', `Contexto: ${entry.context}`, 'small'));
  article.append(element('p', `${evidenceKinds[entry.evidence_kind] || 'A validar'}${entry.observed_on ? ` · observação: ${entry.observed_on}` : ''}`, 'small'));
  const links = document.createElement('div'); links.className = 'entry-links';
  for (const [url, label] of [[entry.source_url, 'fonte ↗'], [entry.tool_url, 'site da ferramenta ↗']]) { const link = externalLink(url, label); if (link) links.append(link); }
  article.append(links);
  article.append(element('p', `Crédito informado: ${entry.public_name} · ${relationships[entry.relationship] || 'Vínculo não informado'}`, 'small'));
  article.append(element('p', `Revisão editorial: ${entry.review_note}`, 'small'));
  article.append(element('p', `Publicado em ${new Date(entry.published_at).toLocaleDateString('pt-BR')}. Publicação não equivale à homologação do produto.`, 'small'));
  const correction = element('button', 'propor correção ou acrescentar evidência', 'button'); correction.type = 'button';
  correction.addEventListener('click', () => {
    form.elements.kind.value = 'correction'; form.elements.tool_name.value = entry.tool_name;
    form.elements.title.value = `Revisão: ${entry.title}`.slice(0, 140);
    form.elements.context.value = `Sobre a contribuição ${entry.id}. `;
    form.elements.criterion.value = entry.criterion;
    syncForm(); $('contribuir').open = true; form.elements.body.focus();
  });
  article.append(correction); $('community-entries').append(article);
}
async function loadEntries() {
  if (loading) return;
  loading = true; $('community-more').disabled = true;
  try {
    const response = await fetch(`${API}?page=${page}`, { credentials: 'omit', signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('unavailable');
    const data = await response.json();
    if (!Array.isArray(data.entries)) throw new Error('invalid');
    data.entries.forEach(addEntry);
    $('community-status').textContent = data.total ? `${data.total} contribuições publicadas após revisão editorial.` : 'Ainda não há contribuições da comunidade publicadas. As notas da comparação inicial são editoriais; seja a primeira pessoa a acrescentar evidências.';
    $('community-more').hidden = !data.has_more;
    $('community-more').textContent = 'carregar mais';
    page += 1;
  } catch {
    $('community-status').textContent = 'Não foi possível carregar as contribuições. O diagnóstico e a calculadora continuam disponíveis.';
    $('community-more').hidden = false; $('community-more').textContent = 'tentar carregar novamente';
  } finally { loading = false; $('community-more').disabled = false; }
}
$('community-more').addEventListener('click', loadEntries);
for (const [value, label] of Object.entries(criterionNames)) {
  const option = element('option', label); option.value = value; $('contribution-criteria').append(option);
}
form.elements.observed_on.max = new Date().toISOString().slice(0, 10);
function syncForm() {
  form.elements.tool_url.required = form.elements.kind.value === 'tool';
  form.elements.source_url.required = form.elements.evidence_kind.value === 'official';
  form.elements.observed_on.required = ['hands_on', 'demo'].includes(form.elements.evidence_kind.value);
}
form.addEventListener('change', syncForm); syncForm();
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const submit = $('contribution-submit'); submit.disabled = true;
  $('contribution-status').textContent = 'Enviando para revisão…';
  try {
    const payload = Object.fromEntries(new FormData(form)); payload.consent = form.elements.consent.checked;
    const response = await fetch(API, { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(20000) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Envio não confirmado. Tente novamente.');
    $('contribution-status').textContent = `Recebido para revisão. Protocolo: ${data.id}. Seu email permanece privado; o conteúdo ainda não foi publicado. Guarde este protocolo.`;
    form.reset(); syncForm();
  } catch (error) {
    $('contribution-status').textContent = error.name === 'TimeoutError' || error instanceof TypeError ? 'Não conseguimos confirmar o envio. Seu texto foi preservado; tente novamente.' : error.message;
  } finally { submit.disabled = false; }
});
loadEntries();
