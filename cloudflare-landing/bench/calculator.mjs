import { criteria, vendors, gates, presets, sources, initialState, calculate, decodeState, report } from './model.mjs';

let state = decodeState(location.hash) || initialState();
const $ = (id) => document.getElementById(id);
const format = (n) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const scoreOptions = (selected) => Array.from({ length: 6 }, (_, n) => `<option value="${n}"${n === selected ? ' selected' : ''}>${n}</option>`).join('');

$('presets').innerHTML = Object.entries(presets).map(([id, p]) => `<button class="button" type="button" data-preset="${id}">${p.name}</button>`).join('');
$('weights').innerHTML = criteria.map((c, i) => `<div class="weight-row"><div class="weight-heading"><label for="weight-${i}">${c.name}</label><output for="weight-${i}" id="weight-value-${i}"></output></div><p id="weight-help-${i}">${c.question}</p><input id="weight-${i}" type="range" min="0" max="5" step="1" aria-describedby="weight-help-${i}" data-weight="${i}"><div class="range-labels"><span>não é prioridade</span><span>essencial</span></div></div>`).join('');
$('score-inputs').innerHTML = criteria.map((c, i) => `<tr><th scope="row">${c.name}</th>${vendors.map((v, vi) => `<td><select aria-label="Nota ${v.name}: ${c.name}" data-vendor="${vi}" data-score="${i}">${scoreOptions(state.scores[vi][i])}</select></td>`).join('')}</tr>`).join('');
$('gate-inputs').innerHTML = gates.map((g, i) => `<tr><th scope="row">${g.name}<span class="cell-note">${g.description}</span></th>${vendors.map((v, vi) => `<td><select aria-label="${v.name}: ${g.name}" data-vendor="${vi}" data-gate="${i}"><option value="pending">A validar</option><option value="pass">Atende</option><option value="fail">Não atende</option></select></td>`).join('')}</tr>`).join('');
$('sources').innerHTML = sources.map((s) => `<li id="source-${s.id}"><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.title} ↗</a><p>${s.note}</p></li>`).join('');

function render(syncInputs = false) {
  const result = calculate(state);
  state = result.state;
  if (syncInputs) {
    document.querySelectorAll('[data-weight]').forEach(el => { el.value = state.weights[+el.dataset.weight]; });
    document.querySelectorAll('[data-score]').forEach(el => { el.value = state.scores[+el.dataset.vendor][+el.dataset.score]; });
    document.querySelectorAll('[data-gate]').forEach(el => { el.value = state.gates[+el.dataset.vendor][+el.dataset.gate]; });
  }
  criteria.forEach((_, i) => {
    $(`weight-value-${i}`).textContent = `${state.weights[i]}/5 · ${result.total ? format(100 * state.weights[i] / result.total) : '0'}% do peso`;
  });
  document.querySelectorAll('[data-preset]').forEach(el => {
    el.setAttribute('aria-pressed', String(presets[el.dataset.preset].weights.every((w, i) => w === state.weights[i])));
  });
  $('result-title').textContent = result.title;
  $('ranking').innerHTML = result.results.map(v => `<div class="vendor-result${v.failed.length ? ' vetoed' : ''}"><div class="result-line"><strong>${v.name}</strong><span>${v.score === null ? '—' : format(v.score)}<small>${v.score === null ? '' : ' / 100'}</small></span></div><div class="score-track" aria-hidden="true"><div style="width:${v.score || 0}%"></div></div><p class="small">${v.failed.length ? `Veto: ${v.failed.join('; ')}.` : v.pending.length ? `${v.pending.length} requisitos a validar. Indicação provisória.` : 'Requisitos declarados como atendidos.'}</p></div>`).join('');
  if (result.total && result.status !== 'blocked') {
    const differences = criteria.map((c, i) => ({ name: c.name, points: result.results[0].contributions[i] - result.results[1].contributions[i] })).sort((a, b) => Math.abs(b.points) - Math.abs(a.points));
    const strongest = differences[0];
    $('result-explanation').textContent = Math.abs(strongest.points) < 0.01 ? 'As notas atuais não diferenciam as ferramentas nos eixos priorizados.' : `Maior diferença ponderada: ${strongest.name} contribui com ${format(Math.abs(strongest.points))} pontos a favor de ${strongest.points > 0 ? 'Ironclad' : 'Luminance'}. Os vetos são avaliados separadamente.`;
  } else {
    $('result-explanation').textContent = result.status === 'blocked' ? 'A pontuação permanece visível para comparação, mas nenhuma opção pode ser indicada enquanto houver veto.' : 'Ajuste os pesos para iniciar a comparação.';
  }
  $('next-step').textContent = result.status === 'empty' ? 'Defina suas prioridades para montar o roteiro.' : result.status === 'blocked' ? 'Reveja as condições com os fornecedores ou amplie a lista de ferramentas. Não compense requisitos obrigatórios com pontos.' : result.eligible.some(v => v.pending.length) ? 'Use a indicação para ordenar as demonstrações. Ainda há requisitos obrigatórios pendentes; não conclua a compra pela pontuação.' : 'Compare o desempenho no piloto e as propostas finais. Os requisitos foram declarados como atendidos por você; valide as evidências com os responsáveis internos.';
  $('pilot').innerHTML = criteria.map((c, i) => ({ ...c, weight: state.weights[i] })).filter(c => c.weight > 0).sort((a, b) => b.weight - a.weight).map(c => `<article><h3>${c.name}</h3><p>${c.test}</p></article>`).join('');
  $('share-fallback').hidden = true;
  $('action-status').textContent = '';
}

function clearSharedHash() {
  if (location.hash.startsWith('#cenario=')) history.replaceState(null, '', location.pathname + location.search + '#calculadora');
}

function updateInput(e) {
  const el = e.target;
  if (el.dataset.weight !== undefined) state.weights[+el.dataset.weight] = +el.value;
  else if (el.dataset.score !== undefined) state.scores[+el.dataset.vendor][+el.dataset.score] = +el.value;
  else if (el.dataset.gate !== undefined) state.gates[+el.dataset.vendor][+el.dataset.gate] = el.value;
  else return;
  clearSharedHash();
  render();
}
$('calculator-ui').addEventListener('input', updateInput);
$('calculator-ui').addEventListener('change', updateInput);
$('presets').addEventListener('click', e => {
  const button = e.target.closest('[data-preset]');
  if (!button) return;
  state.weights = [...presets[button.dataset.preset].weights];
  clearSharedHash(); render(true);
});
$('reset').addEventListener('click', () => { state = initialState(); clearSharedHash(); render(true); $('action-status').textContent = 'Pesos, notas e requisitos restaurados.'; });
$('download').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([report(state)], { type: 'text/markdown;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = 'legalops-bench-avaliacao.md'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('action-status').textContent = 'Avaliação exportada com pesos, notas, pendências e fontes.';
});
$('share').addEventListener('click', async () => {
  const hash = '#cenario=' + encodeURIComponent(JSON.stringify(state));
  const url = location.origin + location.pathname + hash;
  history.replaceState(null, '', hash);
  try {
    await navigator.clipboard.writeText(url);
    $('action-status').textContent = 'Link copiado. Quem abrir verá estes pesos, notas e requisitos.';
  } catch {
    $('share-fallback').hidden = false; $('share-fallback').value = url; $('share-fallback').focus(); $('share-fallback').select();
    $('action-status').textContent = 'Copie o link selecionado abaixo.';
  }
});
$('print').addEventListener('click', () => window.print());
window.addEventListener('hashchange', () => {
  const shared = decodeState(location.hash);
  if (shared) { state = shared; render(true); }
});
document.querySelectorAll('a[href^="#source-"]').forEach(link => {
  link.addEventListener('click', () => { document.querySelector('.sources').open = true; });
});
let closedDetails = [];
window.addEventListener('beforeprint', () => {
  closedDetails = [...document.querySelectorAll('details:not([open])')];
  closedDetails.forEach(el => { el.open = true; });
});
window.addEventListener('afterprint', () => closedDetails.forEach(el => { el.open = false; }));
render(true);
$('calculator-ui').hidden = false;
if (location.hash.startsWith('#cenario=')) {
  $('action-status').textContent = decodeState(location.hash) ? 'Cenário compartilhado carregado.' : 'Link inválido ou de outra edição. Carregamos a avaliação inicial.';
}
