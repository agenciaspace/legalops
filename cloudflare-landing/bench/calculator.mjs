import { criteria, stages, profileFields, vendors, gates, presets, sources, initialState, normalizeState, calculate, decodeState, report } from './model.mjs';

const storageKey = 'legalops-clm-bench-v2';
function savedState() { try { return normalizeState(JSON.parse(localStorage.getItem(storageKey))); } catch { return initialState(); } }
let state = decodeState(location.hash) || savedState();
const $ = (id) => document.getElementById(id);
const format = (n) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const scoreOptions = (selected) => `<option value=""${selected === null ? ' selected' : ''}>A validar</option>` + Array.from({ length: 6 }, (_, n) => `<option value="${n}"${n === selected ? ' selected' : ''}>${n}</option>`).join('');

$('presets').innerHTML = Object.entries(presets).map(([id, p]) => `<button class="button" type="button" data-preset="${id}">${p.name}</button>`).join('');
const weightControl = (c, i) => `<div class="weight-row"><div class="weight-heading"><label for="weight-${i}">${c.name}</label><output for="weight-${i}" id="weight-value-${i}"></output></div><p id="weight-help-${i}">${c.question}</p><input id="weight-${i}" type="range" min="0" max="5" step="1" aria-describedby="weight-help-${i}" data-weight="${i}"><div class="range-labels"><span>não é prioridade</span><span>essencial</span></div></div>`;
$('weights').innerHTML = criteria.slice(0, 4).map(weightControl).join('') + [...new Set(criteria.slice(4).map(c => c.group))].map(group => `<details class="criteria-group"><summary>${group}</summary>${criteria.map((c, i) => i >= 4 && c.group === group ? weightControl(c, i) : '').join('')}</details>`).join('');
$('profile-fields').innerHTML = profileFields.map(f => `<label>${f.label}${f.type === 'number' ? `<input type="number" min="0" max="10000000" step="1" data-profile="${f.id}" inputmode="numeric">` : `<textarea rows="2" maxlength="700" data-profile="${f.id}" placeholder="${f.placeholder}"></textarea>`}</label>`).join('');
$('stage-buttons').innerHTML = stages.map((s, i) => `<button type="button" class="button" data-stage="${s.id}">${i + 1}. ${s.name}</button>`).join('');
$('score-inputs').innerHTML = criteria.map((c, i) => `<tr><th scope="row">${c.name}</th>${vendors.map((v, vi) => `<td><select aria-label="Nota ${v.name}: ${c.name}" data-vendor="${vi}" data-score="${i}">${scoreOptions(state.scores[vi][i])}</select></td>`).join('')}</tr>`).join('');
$('gate-inputs').innerHTML = gates.map((g, i) => `<tr><th scope="row">${g.name}<span class="cell-note">${g.description}</span></th>${vendors.map((v, vi) => `<td><select aria-label="${v.name}: ${g.name}" data-vendor="${vi}" data-gate="${i}"><option value="pending">A validar</option><option value="pass">Atende</option><option value="fail">Não atende</option></select></td>`).join('')}</tr>`).join('');
$('sources').innerHTML = sources.map((s) => `<li id="source-${s.id}"><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.title} ↗</a><p>${s.note}</p></li>`).join('');

function render(syncInputs = false) {
  const result = calculate(state);
  state = result.state;
  try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* The assessment still works without local storage. */ }
  if (syncInputs) {
    document.querySelectorAll('[data-weight]').forEach(el => { el.value = state.weights[+el.dataset.weight]; });
    document.querySelectorAll('[data-score]').forEach(el => { el.value = state.scores[+el.dataset.vendor][+el.dataset.score] ?? ''; });
    document.querySelectorAll('[data-gate]').forEach(el => { el.value = state.gates[+el.dataset.vendor][+el.dataset.gate]; });
    document.querySelectorAll('[data-profile]').forEach(el => { el.value = state.profile[el.dataset.profile]; });
  }
  const stage = stages.find(s => s.id === state.stage);
  $('stage-description').textContent = stage.description;
  if ($('stage-tasks').dataset.stage !== stage.id) {
    $('stage-tasks').dataset.stage = stage.id;
    $('stage-tasks').innerHTML = stage.tasks.map((task, i) => `<label><input type="checkbox" data-task="${stage.id}-${i}"${state.completed.includes(`${stage.id}-${i}`) ? ' checked' : ''}>${task}</label>`).join('');
  }
  document.querySelectorAll('[data-task]').forEach(el => { el.checked = state.completed.includes(el.dataset.task); });
  $('stage-progress').textContent = `${state.completed.length} de ${stages.reduce((sum, s) => sum + s.tasks.length, 0)} passos marcados por você.`;
  document.querySelectorAll('[data-stage]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.stage === state.stage)));
  $('stack-count').textContent = `${new Set(state.profile.existing_tools.split(/\n|,/).map(s => s.trim().toLowerCase()).filter(Boolean)).size} ferramentas mapeadas. Confirme separadamente cada integração obrigatória.`;
  criteria.forEach((_, i) => {
    $(`weight-value-${i}`).textContent = `${state.weights[i]}/5 · ${result.total ? format(100 * state.weights[i] / result.total) : '0'}% do peso`;
  });
  document.querySelectorAll('[data-preset]').forEach(el => {
    el.setAttribute('aria-pressed', String(presets[el.dataset.preset].weights.every((w, i) => w === state.weights[i])));
  });
  $('result-title').textContent = result.title;
  $('ranking').innerHTML = result.results.map(v => `<div class="vendor-result${v.failed.length ? ' vetoed' : ''}"><div class="result-line"><strong>${v.name}</strong><span>${!result.total ? '—' : v.score === null ? `${format(v.lower)}–${format(v.upper)}` : format(v.score)}<small>${result.total ? ' / 100' : ''}</small></span></div><div class="score-track" aria-hidden="true"><div style="width:${v.lower}%"></div></div><p class="small">${v.missing.length ? `Faixa possível. ${format(100 * v.coverage)}% do peso tem avaliação; ${v.missing.length} critérios ainda sem nota.` : result.total ? 'Todos os critérios priorizados têm nota informada.' : 'Sem prioridades selecionadas.'}</p><p class="small">${v.failed.length ? `Veto: ${v.failed.join('; ')}.` : v.pending.length ? `${v.pending.length} requisitos a validar. Indicação provisória.` : 'Requisitos declarados como atendidos.'}</p></div>`).join('');
  if (result.status === 'incomplete') {
    $('result-explanation').textContent = 'A validar não significa nota zero. A faixa mostra o resultado possível se as notas faltantes forem de 0 a 5. Complete o piloto antes de indicar uma opção.';
  } else if (result.total && result.status !== 'blocked') {
    const differences = criteria.map((c, i) => ({ name: c.name, points: result.results[0].contributions[i] - result.results[1].contributions[i] })).sort((a, b) => Math.abs(b.points) - Math.abs(a.points));
    const strongest = differences[0];
    $('result-explanation').textContent = Math.abs(strongest.points) < 0.01 ? 'As notas atuais não diferenciam as ferramentas nos eixos priorizados.' : `Maior diferença ponderada: ${strongest.name} contribui com ${format(Math.abs(strongest.points))} pontos a favor de ${strongest.points > 0 ? 'Ironclad' : 'Luminance'}. Os vetos são avaliados separadamente.`;
  } else {
    $('result-explanation').textContent = result.status === 'blocked' ? 'A pontuação permanece visível para comparação, mas nenhuma opção pode ser indicada enquanto houver veto.' : 'Ajuste os pesos para iniciar a comparação.';
  }
  $('next-step').textContent = result.status === 'empty' ? 'Defina suas prioridades para montar o roteiro.' : result.status === 'incomplete' ? 'Use o roteiro abaixo para avaliar os critérios sem nota. Registre os testes antes de comparar o resultado final.' : result.status === 'blocked' ? 'Reveja as condições com os fornecedores ou amplie a lista de ferramentas. Não compense requisitos obrigatórios com pontos.' : result.eligible.some(v => v.pending.length) ? 'Use a indicação para ordenar as demonstrações. Ainda há requisitos obrigatórios pendentes; não conclua a compra pela pontuação.' : 'Compare o desempenho no piloto e as propostas finais. Os requisitos foram declarados como atendidos por você; valide as evidências com os responsáveis internos.';
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
  else if (el.dataset.score !== undefined) state.scores[+el.dataset.vendor][+el.dataset.score] = el.value === '' ? null : +el.value;
  else if (el.dataset.gate !== undefined) state.gates[+el.dataset.vendor][+el.dataset.gate] = el.value;
  else if (el.dataset.profile !== undefined) state.profile[el.dataset.profile] = el.type === 'number' ? (el.value === '' ? '' : Number(el.value)) : el.value;
  else return;
  clearSharedHash();
  render();
}
$('calculator-ui').addEventListener('input', updateInput);
$('calculator-ui').addEventListener('change', e => { if (!e.target.matches('[data-task]')) updateInput(e); });
$('stage-buttons').addEventListener('click', e => {
  const button = e.target.closest('[data-stage]');
  if (button) { state.stage = button.dataset.stage; render(); }
});
$('stage-tasks').addEventListener('change', e => {
  const el = e.target;
  if (!el.dataset.task) return;
  state.completed = state.completed.filter(id => id !== el.dataset.task);
  if (el.checked) state.completed.push(el.dataset.task);
  render();
});
$('presets').addEventListener('click', e => {
  const button = e.target.closest('[data-preset]');
  if (!button) return;
  state.weights = [...presets[button.dataset.preset].weights];
  clearSharedHash(); render(true);
});
$('reset').addEventListener('click', () => { state = initialState(); clearSharedHash(); render(true); $('action-status').textContent = 'Diagnóstico, etapas, pesos, notas e requisitos restaurados.'; });
$('download').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([report(state)], { type: 'text/markdown;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = 'legalops-bench-avaliacao.md'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('action-status').textContent = 'Avaliação exportada com pesos, notas, pendências e fontes.';
});
$('share').addEventListener('click', async () => {
  const { profile, completed, stage, ...comparison } = state;
  const hash = '#cenario=' + encodeURIComponent(JSON.stringify(comparison));
  const url = location.origin + location.pathname + hash;
  history.replaceState(null, '', hash);
  try {
    await navigator.clipboard.writeText(url);
    $('action-status').textContent = 'Link copiado com pesos, notas e requisitos. O diagnóstico e as etapas não entram no link; use o relatório para compartilhar o contexto.';
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
