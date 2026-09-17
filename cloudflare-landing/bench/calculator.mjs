import { criteria, stages, profileFields, vendors, gates, presets, sources, initialState, normalizeState, calculate, decodeState, report, selectedVendors, selectVendors, sharedState, catalogMeta, catalogCategories, MAX_COMPARISON } from './model.mjs';

const storageKey = 'legalops-clm-bench-v2'; // Stable key: normalizeState migrates previous editions.
function savedState() { try { return normalizeState(JSON.parse(localStorage.getItem(storageKey))); } catch { return initialState(); } }
let state = decodeState(location.hash) || savedState();
const $ = (id) => document.getElementById(id);
const format = (n) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const scoreOptions = (selected) => `<option value=""${selected === null ? ' selected' : ''}>A validar</option>` + Array.from({ length: 6 }, (_, n) => `<option value="${n}"${n === selected ? ' selected' : ''}>${n}</option>`).join('');

$('presets').innerHTML = Object.entries(presets).map(([id, p]) => `<button class="button" type="button" data-preset="${id}">${p.name}</button>`).join('');
const weightControl = (c, i) => `<div class="weight-row"><div class="weight-heading"><label for="weight-${i}">${c.name}</label><output for="weight-${i}" id="weight-value-${i}"></output></div><p id="weight-help-${i}">${c.question}</p><input id="weight-${i}" type="range" min="0" max="5" step="1" aria-describedby="weight-help-${i}" data-weight="${i}"><div class="range-labels"><span>não é prioridade</span><span>essencial</span></div></div>`;
const groups = [...new Set(criteria.map(c=>c.group))];
let currentGroup = groups[0];
$('criterion-group').innerHTML = groups.map((group,i)=>`<option value="${i}">${group}</option>`).join('');
$('weights').innerHTML = criteria.map((c,i)=>`<div data-criterion-group="${groups.indexOf(c.group)}">${weightControl(c,i)}</div>`).join('');
const profileControl = f => `<label>${f.label}${f.type === 'number' ? `<input type="number" min="0" max="10000000" step="1" data-profile="${f.id}" inputmode="numeric">` : `<textarea rows="2" maxlength="700" data-profile="${f.id}" placeholder="${f.placeholder}"></textarea>`}</label>`;
const primaryFields = ['main_problem','existing_tools','required_integrations'];
$('profile-fields').innerHTML = primaryFields.map(id=>profileControl(profileFields.find(f=>f.id===id))).join('');
$('profile-extra').innerHTML = profileFields.filter(f=>!primaryFields.includes(f.id)).map(profileControl).join('');
$('stage-buttons').innerHTML = stages.map((s, i) => `<button type="button" class="button" data-stage="${s.id}">${i + 1}. ${s.name}</button>`).join('');
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let renderedIds = null;
let visibleTools = 6;
let currentStep = 0;
function renderGroup() {
 const index=groups.indexOf(currentGroup);
 document.querySelectorAll('[data-criterion-group]').forEach(el=>{el.hidden=+el.dataset.criterionGroup!==index});
 document.querySelectorAll('[data-score-group]').forEach(el=>{el.hidden=+el.dataset.scoreGroup!==index});
 $('criterion-group').value=String(index);
 $('criterion-progress').textContent=`Grupo ${index+1} de ${groups.length}`;
 $('next-group').textContent=index===groups.length-1?'Conferir resultado':'Próximo grupo →';
}
$('criterion-group').addEventListener('change',()=>{currentGroup=groups[+$('criterion-group').value];renderGroup()});
$('next-group').addEventListener('click',()=>{const i=groups.indexOf(currentGroup);if(i<groups.length-1){currentGroup=groups[i+1];renderGroup();$('criterion-group').focus()}else{$('result-details').open=true;$('result-details').scrollIntoView({block:'start'})}});
function showStep(step, focus=true) {
 if(step===2&&state.vendorIds.length<2){$('wizard-status').textContent='Escolha pelo menos duas ferramentas para avaliar.';return}
 currentStep=step;
 document.querySelectorAll('[data-wizard-panel]').forEach(el=>{el.hidden=+el.dataset.wizardPanel!==step});
 document.querySelectorAll('[data-wizard-go]').forEach(el=>{el.setAttribute('aria-current',+el.dataset.wizardGo===step?'step':'false')});
 $('wizard-back').hidden=step===0;$('wizard-next').hidden=step===2;
 $('wizard-next').textContent=step===0?'Escolher ferramentas →':'Avaliar ferramentas →';
 $('wizard-status').textContent='';
 if(focus){const heading=document.querySelector(`[data-wizard-panel="${step}"] h2`);heading?.focus();heading?.scrollIntoView?.({block:'start'})}
}
document.querySelectorAll('[data-wizard-go]').forEach(el=>el.addEventListener('click',()=>showStep(+el.dataset.wizardGo)));
$('wizard-next').addEventListener('click',()=>showStep(Math.min(2,currentStep+1)));
$('wizard-back').addEventListener('click',()=>showStep(Math.max(0,currentStep-1)));
function revealHash(){
 let id;try{id=decodeURIComponent(location.hash.slice(1))}catch{return}if(!id||id.startsWith('cenario='))return;
 const target=document.getElementById(id);if(!target)return;
 if(['ferramentas','catalog-title'].includes(id))showStep(1,false);
 if(['diagnostico','necessidade'].includes(id))showStep(0,false);
 if(['avaliacao','requisitos'].includes(id))showStep(2,false);
 for(let parent=target;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
 target.scrollIntoView?.({block:'start'});
}
function renderComparison() {
  const active = selectedVendors(state);
  const head = label => `<tr><th scope="col">${label}</th>${active.map(v => `<th scope="col">${escape(v.name)}</th>`).join('')}</tr>`;
  $('score-head').innerHTML = head('Eixo'); $('gate-head').innerHTML = head('Requisito');
  $('score-inputs').innerHTML = criteria.map((c, i) => `<tr data-score-group="${groups.indexOf(c.group)}"><th scope="row">${c.name}</th>${active.map((v, vi) => `<td><select aria-label="Nota ${escape(v.name)}: ${c.name}" data-vendor="${vi}" data-score="${i}">${scoreOptions(state.scores[vi][i])}</select></td>`).join('')}</tr>`).join('');
  $('gate-inputs').innerHTML = gates.map((g, i) => `<tr><th scope="row">${g.name}<span class="cell-note">${g.description}</span></th>${active.map((v, vi) => `<td><select aria-label="${escape(v.name)}: ${g.name}" data-vendor="${vi}" data-gate="${i}"><option value="pending">A validar</option><option value="pass">Atende</option><option value="fail">Não atende</option></select></td>`).join('')}</tr>`).join('');
  renderedIds = state.vendorIds.join('|');
  renderGroup();
}
$('catalog-provenance').textContent = `${catalogMeta.toolCount} ferramentas no catálogo da comunidade. Escolha de duas a quatro para avaliar.`;
$('tool-category').innerHTML += Object.entries(catalogCategories).map(([id, label]) => `<option value="${id}">${label}</option>`).join('');
$('bench-tools').innerHTML = vendors.map(v => `<option value="${escape(v.name)}"></option>`).join('');
const searchable = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function renderCatalog() {
  const query = searchable($('tool-search').value.trim());
  const category = $('tool-category').value;
  const matches = vendors.filter(v => (!category || v.category === category) && searchable([v.name,...v.aliases].join(' ')).includes(query)).sort((a,b) => a.name.localeCompare(b.name,'pt-BR'));
  $('selection-count').textContent = `${state.vendorIds.length} selecionadas`;
  $('selected-tools').innerHTML = selectedVendors(state).map(v => `<button type="button" class="tool-chip" data-toggle-vendor="${v.id}" aria-label="Remover ${escape(v.name)} da comparação">${escape(v.name)} ×</button>`).join('') || '<p class="small">Busque abaixo para montar sua comparação.</p>';
  $('catalog-count').textContent = matches.length ? `${Math.min(visibleTools,matches.length)} de ${matches.length} opções encontradas.` : 'Nenhuma ferramenta encontrada. Tente outro nome ou sugira uma no formulário da comunidade.';
  $('tool-cards').innerHTML = matches.slice(0,visibleTools).map(v => {
    const selected = state.vendorIds.includes(v.id);
    return `<article class="tool-card${selected?' selected':''}"><p class="micro">${catalogCategories[v.category]}</p><h4>${escape(v.name)}</h4><p>${escape(v.description)}</p>${v.sourceNote?`<p class="small catalog-source-note">${escape(v.sourceNote)}</p>`:''}<p class="small">${v.initialScores?'4 hipóteses editoriais; demais critérios a validar.':'Capacidades sem nota; avalie no seu piloto.'}</p><div class="tool-actions"><button type="button" class="button" data-toggle-vendor="${v.id}" aria-pressed="${selected}" aria-label="${selected?'Remover':'Comparar'} ${escape(v.name)}">${selected?'Remover':'Comparar'}</button>${v.officialUrl?`<a href="${v.officialUrl}" target="_blank" rel="noopener noreferrer">Site da ferramenta ↗</a>`:'<a href="#contribuir">Contribuir</a>'}</div></article>`;
  }).join('');
  $('catalog-more').hidden = matches.length <= visibleTools;
}
$('tool-search').addEventListener('input',()=>{visibleTools=6;renderCatalog()});
$('tool-category').addEventListener('change',()=>{visibleTools=6;renderCatalog()});
$('catalog-more').addEventListener('click',()=>{const old=visibleTools;visibleTools+=6;renderCatalog();$('tool-cards').children[old]?.querySelector('button')?.focus()});
$('ferramentas').addEventListener('click',event=>{
  const button=event.target.closest('[data-toggle-vendor]');if(!button)return;
  const id=button.dataset.toggleVendor;const selected=state.vendorIds.includes(id);
  if(!selected&&state.vendorIds.length>=MAX_COMPARISON){$('catalog-message').textContent='Compare até quatro ferramentas por vez. Remova uma da seleção para adicionar outra.';return}
  state=selectVendors(state,selected?state.vendorIds.filter(value=>value!==id):[...state.vendorIds,id]);
  clearSharedHash();render(true);renderCatalog();
  $('catalog-message').textContent=selected?'Ferramenta removida. Suas notas continuam salvas neste navegador.':'Ferramenta adicionada à avaliação.';
  const replacement=$('tool-cards').querySelector(`[data-toggle-vendor="${id}"]`)||$('tool-search');replacement.focus();
});
$('sources').innerHTML = sources.map((s) => `<li id="source-${s.id}"><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.title} ↗</a><p>${s.note}</p></li>`).join('');

function render(syncInputs = false) {
  const result = calculate(state);
  state = result.state;
  if (renderedIds !== state.vendorIds.join('|')) { renderComparison(); syncInputs = true; }
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
  $('ranking').innerHTML = result.results.map(v => `<div class="vendor-result${v.failed.length ? ' vetoed' : ''}"><div class="result-line"><strong>${escape(v.name)}</strong><span>${!result.total ? '—' : v.score === null ? `${format(v.lower)}–${format(v.upper)}` : format(v.score)}<small>${result.total ? ' / 100' : ''}</small></span></div><div class="score-track" aria-hidden="true"><div style="width:${v.lower}%"></div></div><p class="small">${v.missing.length ? `Faixa possível. ${format(100 * v.coverage)}% do peso tem avaliação; ${v.missing.length} critérios ainda sem nota.` : result.total ? 'Todos os critérios priorizados têm nota informada.' : 'Sem prioridades selecionadas.'}</p><p class="small">${v.failed.length ? `Veto: ${v.failed.join('; ')}.` : v.pending.length ? `${v.pending.length} requisitos a validar. Indicação provisória.` : 'Requisitos declarados como atendidos.'}</p></div>`).join('');
  if (result.status === 'selection') {
    $('result-explanation').textContent = 'Adicione ferramentas no catálogo. Suas prioridades e avaliações são preservadas quando a seleção muda.';
  } else if (result.status === 'incomplete') {
    $('result-explanation').textContent = 'A validar não significa nota zero. A faixa mostra o resultado possível se as notas faltantes forem de 0 a 5. Complete o piloto antes de indicar uma opção.';
  } else if (result.total && result.status !== 'blocked') {
    const compared = result.eligible.length >= 2 ? result.eligible.slice(0, 2) : result.results.slice(0, 2);
    const differences = criteria.map((c, i) => ({ name: c.name, points: compared[0].contributions[i] - compared[1].contributions[i] })).sort((a, b) => Math.abs(b.points) - Math.abs(a.points));
    const strongest = differences[0];
    $('result-explanation').textContent = Math.abs(strongest.points) < 0.01 ? 'As notas atuais não diferenciam as ferramentas nos eixos priorizados.' : `Entre ${compared[0].name} e ${compared[1].name}, maior diferença ponderada: ${strongest.name} contribui com ${format(Math.abs(strongest.points))} pontos a favor de ${strongest.points > 0 ? compared[0].name : compared[1].name}. Os vetos são avaliados separadamente.`;
  } else {
    $('result-explanation').textContent = result.status === 'blocked' ? 'A pontuação permanece visível para comparação, mas nenhuma opção pode ser indicada enquanto houver veto.' : 'Ajuste os pesos para iniciar a comparação.';
  }
  $('next-step').textContent = result.status === 'selection' ? 'Selecione pelo menos duas ferramentas para comparar.' : result.status === 'empty' ? 'Defina suas prioridades para montar o roteiro.' : result.status === 'incomplete' ? 'Use o roteiro abaixo para avaliar os critérios sem nota. Registre os testes antes de comparar o resultado final.' : result.status === 'blocked' ? 'Reveja as condições com os fornecedores ou amplie a lista de ferramentas. Não compense requisitos obrigatórios com pontos.' : result.eligible.some(v => v.pending.length) ? 'Use a indicação para ordenar as demonstrações. Ainda há requisitos obrigatórios pendentes; não conclua a compra pela pontuação.' : 'Compare o desempenho no piloto e as propostas finais. Os requisitos foram declarados como atendidos por você; valide as evidências com os responsáveis internos.';
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
$('reset').addEventListener('click', () => { state = initialState(); clearSharedHash(); render(true); renderCatalog(); $('catalog-message').textContent=''; currentGroup=groups[0];renderGroup();showStep(0);$('action-status').textContent = 'Diagnóstico, etapas, pesos, notas e requisitos restaurados.'; });
$('download').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([report(state)], { type: 'text/markdown;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = 'legalops-bench-avaliacao.md'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('action-status').textContent = 'Avaliação exportada com pesos, notas, pendências e fontes.';
});
$('share').addEventListener('click', async () => {
  const comparison = sharedState(state);
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
  if (shared) { state = shared; render(true); renderCatalog(); showStep(2); }
  revealHash();
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
renderCatalog();
showStep(decodeState(location.hash)?2:0,false);
$('calculator-ui').hidden = false;
if (location.hash.startsWith('#cenario=')) {
  $('action-status').textContent = decodeState(location.hash) ? 'Cenário compartilhado carregado.' : 'Link inválido ou de outra edição. Carregamos a avaliação inicial.';
}

revealHash();
