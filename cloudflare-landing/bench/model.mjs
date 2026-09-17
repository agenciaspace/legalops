import { criteria, stages } from './framework.mjs';
export { criteria, stages };
import { catalog, catalogMeta, catalogCategories } from './catalog.mjs';
export { catalogMeta, catalogCategories };
export const VERSION = '2026-09-17-v3';
export const MAX_COMPARISON = 4;
// Catalog membership is discovery metadata, never a capability score.
export const vendors = catalog.map(v => ({ ...v, scores: criteria.map((_, i) => v.initialScores?.[i] ?? null) }));
const byId = new Map(vendors.map(v => [v.id, v]));
const defaultIds = ['ironclad', 'luminance'];
const validScore = n => Number.isInteger(n) && n >= 0 && n <= 5;
const validGate = value => ['pending', 'pass', 'fail'].includes(value);
const safeScores = (id, input) => criteria.map((_, i) => input?.[i] === null || validScore(input?.[i]) ? input[i] : byId.get(id).scores[i]);
const safeGates = input => gates.map((_, i) => validGate(input?.[i]) ? input[i] : 'pending');
export const gates = [
  { id: 'security', name: 'Segurança e governança', description: 'Acesso, auditoria, tratamento de dados e requisitos internos aprovados.' },
  { id: 'integration', name: 'Integrações obrigatórias', description: 'Cada sistema indispensável demonstrado na edição e no fluxo da empresa.' },
  { id: 'implementation', name: 'Implantação e migração', description: 'Prazo, responsáveis, migração e saída dos dados aceitos.' },
  { id: 'budget', name: 'Custo total aprovado', description: 'Licenças, IA, assinatura, conectores, implantação, horas internas e suporte.' },
];
const weights = values => [...values, ...criteria.slice(values.length).map(() => 0)];
export const presets = {
  balanced: { name: 'Quatro eixos iniciais', weights: weights([3, 3, 3, 3]) },
  revenue: { name: 'Operação comercial + Salesforce', weights: weights([5, 5, 2, 1]) },
  intelligence: { name: 'Playbooks + acervo contratual', weights: weights([1, 0, 5, 5]) },
  complete: { name: 'Avaliação completa · 32 critérios', weights: criteria.map(() => 3) },
};
export const profileFields = [
  { id: 'monthly_contracts', label: 'Contratos por mês', type: 'number' },
  { id: 'legacy_contracts', label: 'Contratos no legado', type: 'number' },
  { id: 'legal_users', label: 'Usuários do jurídico', type: 'number' },
  { id: 'business_users', label: 'Usuários de outras áreas', type: 'number' },
  { id: 'contract_types', label: 'Tipos e origem dos contratos', type: 'text', placeholder: 'Ex.: compras, vendas, NDAs; modelos próprios e de terceiros' },
  { id: 'languages', label: 'Idiomas e países relevantes', type: 'text', placeholder: 'Ex.: português e inglês; Brasil e outros países de atuação' },
  { id: 'existing_tools', label: 'Ferramentas já usadas (uma por linha)', type: 'text', placeholder: 'Liste assinatura eletrônica, CRM, ERP, documentos, identidade e outros sistemas' },
  { id: 'required_integrations', label: 'Integrações obrigatórias e dados trocados', type: 'text', placeholder: 'Ex.: CRM → criar contrato; assinatura → devolver o assinado; ERP → obrigações' },
  { id: 'main_problem', label: 'Problema, indicador atual e resultado esperado', type: 'text', placeholder: 'Ex.: reduzir o tempo entre solicitação completa e assinatura' },
];
export const sources = [
  { id: 'ic-sf', title: 'Ironclad · Salesforce Integration Overview', url: 'https://support.ironcladapp.com/hc/en-us/articles/12285720910103-Ironclad-Salesforce-Integration-Overview', note: 'Documenta Workflow Launch, Workflow Sync e Record Sync; o Sync usa managed package.' },
  { id: 'ic-package', title: 'Ironclad · instalação do managed package', url: 'https://support.ironcladapp.com/hc/en-us/articles/18984794209047-Install-the-Ironclad-Managed-Package-for-the-First-Time', note: 'Pacote distribuído pelo Salesforce AppExchange. Managed package é o termo técnico.' },
  { id: 'ic-playbook', title: 'Ironclad · AI Playbooks Overview', url: 'https://support.ironcladapp.com/hc/en-us/articles/12275685560215-Ironclad-AI-Playbooks-Overview', note: 'Playbooks vinculados a workflows, detecção de cláusulas e revisão com posições preferidas.' },
  { id: 'ic-ai', title: 'Ironclad · AI Overview', url: 'https://support.ironcladapp.com/hc/en-us/articles/12947738534935-Ironclad-AI-Overview', note: 'Smart Import, busca e extração no repositório, além de revisão e análise contratual.' },
  { id: 'lu-sf', title: 'Luminance · Sales', url: 'https://www.luminance.com/solutions/sales/', note: 'Anuncia criação de contratos a partir de oportunidades no Salesforce. A integração existe; a profundidade exige demonstração.' },
  { id: 'lu-workflow', title: 'Luminance · Collaborate', url: 'https://www.luminance.com/collaborate/', note: 'Apresenta automação e colaboração em workflows. Menor nota no Bench não significa ausência do recurso.' },
  { id: 'lu-playbook', title: 'Luminance · Negotiate', url: 'https://www.luminance.com/negotiate/', note: 'Descreve revisão com precedentes, templates e playbooks, com checklists no Word.' },
  { id: 'lu-repository', title: 'Luminance · Analyze', url: 'https://www.luminance.com/analyze/', note: 'Apresenta análise do acervo contratual, extração e acompanhamento de obrigações.' },
  { id: 'lu-workshop', title: 'Luminance · workshops da versão 4.0', url: 'https://www.luminance.com/customer-webinar-4-0-update-series/', note: 'Demonstrações anunciadas de workflows, playbooks e análise de famílias de documentos no repositório.' },
];

export function initialState() {
  return { version: VERSION, vendorIds: [...defaultIds], weights: [...presets.complete.weights], scores: defaultIds.map(id => [...byId.get(id).scores]), gates: defaultIds.map(() => gates.map(() => 'pending')), savedEvaluations: {}, profile: Object.fromEntries(profileFields.map(f => [f.id, ''])), stage: 'diagnosis', completed: [] };
}
export function selectedVendors(state) { return state.vendorIds.map(id => byId.get(id)); }
export function normalizeState(input) {
  const state = initialState();
  const suppliedIds = Array.isArray(input?.vendorIds) ? input.vendorIds : defaultIds;
  state.vendorIds = [...new Set(suppliedIds.filter(id => byId.has(id)))].slice(0, MAX_COMPARISON);
  state.scores = state.vendorIds.map(id => safeScores(id, input?.scores?.[suppliedIds.indexOf(id)]));
  state.gates = state.vendorIds.map(id => safeGates(input?.gates?.[suppliedIds.indexOf(id)]));
  // Keep evaluations when a tool leaves the shortlist; keys must be catalog IDs.
  if (input?.savedEvaluations && typeof input.savedEvaluations === 'object') {
    for (const vendor of vendors) {
      const saved = Object.hasOwn(input.savedEvaluations, vendor.id) && input.savedEvaluations[vendor.id];
      if (saved && typeof saved === 'object') state.savedEvaluations[vendor.id] = { scores: safeScores(vendor.id, saved.scores), gates: safeGates(saved.gates) };
    }
  }
  criteria.forEach((_, i) => {
    if (validScore(input?.weights?.[i])) state.weights[i] = input.weights[i];
    else if (Array.isArray(input?.weights) && input.weights.length === 4 && input.weights.every(validScore) && i >= 4) state.weights[i] = 0;
  });
  profileFields.forEach(f => {
    const value = input?.profile?.[f.id];
    if (f.type === 'number' && Number.isInteger(value) && value >= 0 && value <= 10000000) state.profile[f.id] = value;
    if (f.type === 'text' && typeof value === 'string') state.profile[f.id] = value.slice(0, 700);
  });
  if (stages.some(s => s.id === input?.stage)) state.stage = input.stage;
  const taskIds = stages.flatMap(s => s.tasks.map((_, i) => `${s.id}-${i}`));
  if (Array.isArray(input?.completed)) state.completed = [...new Set(input.completed.filter(id => taskIds.includes(id)))];
  return state;
}
export function selectVendors(input, ids) {
  const state = normalizeState(input);
  state.vendorIds.forEach((id, i) => { state.savedEvaluations[id] = { scores: [...state.scores[i]], gates: [...state.gates[i]] }; });
  const selected = [...new Set(ids.filter(id => byId.has(id)))].slice(0, MAX_COMPARISON);
  return normalizeState({ ...state, vendorIds: selected, scores: selected.map(id => state.savedEvaluations[id]?.scores ?? byId.get(id).scores), gates: selected.map(id => state.savedEvaluations[id]?.gates ?? gates.map(() => 'pending')) });
}
export function sharedState(input) {
  const { profile, completed, stage, savedEvaluations, ...comparison } = normalizeState(input);
  return comparison;
}
export function calculate(input) {
  const state = normalizeState(input);
  const total = state.weights.reduce((sum, weight) => sum + weight, 0);
  const results = selectedVendors(state).map((vendor, v) => {
    const knownWeight = state.weights.reduce((sum, w, i) => sum + (state.scores[v][i] === null ? 0 : w), 0);
    const missing = criteria.filter((_, i) => state.weights[i] > 0 && state.scores[v][i] === null).map(c => c.name);
    const contributions = state.weights.map((weight, i) => total ? 100 * weight * (state.scores[v][i] ?? 0) / (5 * total) : 0);
    const lower = contributions.reduce((sum, n) => sum + n, 0);
    const upper = total ? lower + 100 * (total - knownWeight) / total : 0;
    return { ...vendor, contributions, lower, upper, coverage: total ? knownWeight / total : 0, missing,
      score: total && !missing.length ? lower : null,
      failed: gates.filter((_, g) => state.gates[v][g] === 'fail').map(g => g.name),
      pending: gates.filter((_, g) => state.gates[v][g] === 'pending').map(g => g.name),
    };
  });
  const eligible = results.filter(v => !v.failed.length).sort((a, b) => (b.score ?? b.lower) - (a.score ?? a.lower));
  let title, status;
  if (state.vendorIds.length < 2) { title = 'Escolha de duas a quatro ferramentas para comparar.'; status = 'selection'; }
  else if (!total) { title = 'Escolha ao menos uma prioridade.'; status = 'empty'; }
  else if (!eligible.length) { title = 'Nenhuma ferramenta atende aos requisitos obrigatórios.'; status = 'blocked'; }
  else if (eligible.some(v => v.missing.length)) { title = 'Há critérios importantes sem avaliação. Complete as evidências.'; status = 'incomplete'; }
  else if (eligible.length > 1 && Math.abs(eligible[0].score - eligible[1].score) < 5) { title = 'Resultado próximo: compare as opções líderes no piloto.'; status = 'close'; }
  else { title = `${eligible[0].name} tem maior aderência entre as opções sem veto.`; status = 'lead'; }
  return { state, total, results, eligible, title, status };
}
export function decodeState(hash) {
  if (!hash.startsWith('#cenario=') || hash.length > 20000) return null;
  try {
    const input = JSON.parse(decodeURIComponent(hash.slice(9)));
    return [VERSION, '2026-09-17-v2', '2026-09-17'].includes(input?.version) ? normalizeState(input) : null;
  } catch { return null; }
}
export function report(input) {
  const result = calculate(input);
  const { state } = result;
  const fmt = v => !result.total ? 'Sem pontuação' : v.score === null ? `${v.lower.toFixed(1)}–${v.upper.toFixed(1)}/100 (faixa possível; cobertura ${(100 * v.coverage).toFixed(0)}%)` : `${v.score.toFixed(1)}/100`;
  return [
    '# legalops.dev / bench — decisão de CLM',
    `Modelo: ${VERSION}. Exportado em ${new Date().toISOString().slice(0, 10)}.`, '', result.title,
    'Simulação de aderência. As notas iniciais são hipóteses editoriais, não testes de desempenho.',
    '', '## Contexto da empresa', ...profileFields.map(f => `${f.label}: ${state.profile[f.id] === '' ? 'Não informado' : state.profile[f.id]}`),
    '', '## Ciclo de decisão (conclusões declaradas pelo avaliador)',
    ...stages.flatMap(s => [`### ${s.name}`, ...s.tasks.map((task, i) => `- [${state.completed.includes(`${s.id}-${i}`) ? 'x' : ' '}] ${task}`)]),
    '', `| Critério | Peso (0–5) | ${selectedVendors(state).map(v => `${v.name} (0–5)`).join(' | ')} |`, `|---|---:|${state.vendorIds.map(() => '---:|').join('')}`,
    ...criteria.map((c, i) => `| ${c.name} | ${state.weights[i]} | ${state.scores.map(scores => scores[i] ?? 'A validar').join(' | ')} |`),
    '', ...result.results.flatMap(v => [`## ${v.name}: ${fmt(v)}`, `Vetos: ${v.failed.join(', ') || 'nenhum'}.`, `Requisitos pendentes: ${v.pending.join(', ') || 'nenhum informado'}.`, `Critérios sem nota: ${v.missing.join(', ') || 'nenhum entre os priorizados'}.`]),
    '', '## Requisitos obrigatórios (declarados por quem preenche)',
    ...selectedVendors(state).flatMap((v, vi) => gates.map((g, gi) => `${v.name} — ${g.name}: ${{pending:'A validar', pass:'Atende', fail:'Não atende'}[state.gates[vi][gi]]}`)),
    '', '## Como calculamos',
    'Pontos = 100 × soma(peso × nota) ÷ (5 × soma dos pesos). Peso zero exclui. Critério sem avaliação não recebe zero: mostramos a faixa possível se as notas faltantes forem de 0 a 5, sem indicar vencedor. Cobertura é a proporção dos pesos com notas. Diferença menor que 5 pontos é resultado próximo. Veto exclui a opção da indicação; pendência impede concluir a compra.',
    'Notas iniciais nos primeiros quatro eixos: Ironclad [5,5,4,4]; Luminance [2,2,5,5]. Demais capacidades: a validar. Fontes confirmam recursos anunciados, não notas ou superioridade.',
    '', '## Roteiro do piloto', ...criteria.filter((_, i) => state.weights[i] > 0).map(c => `- ${c.name}: ${c.test}`),
    '', `## Catálogo consultado em ${catalogMeta.checkedAt}`,
    'Cadastros de descoberta, não notas de capacidade. Recursos anunciados e adequação precisam ser validados no piloto. Notas e avaliações do G2 não entram na pontuação.',
    ...selectedVendors(state).flatMap(v => [`### ${v.name}`, v.description, ...(v.sourceNote ? [v.sourceNote] : []), ...v.g2Listings.map(s => `- G2: ${s.url}`), ...(v.officialUrl ? [`- Fornecedor: ${v.officialUrl}`] : [])]),
    '', '## Fontes consultadas em 17/09/2026', ...sources.map(s => `- ${s.title}: ${s.url}`),
    '', 'Modelo aberto: https://github.com/agenciaspace/clm-bench',
  ].join('\n');
}
