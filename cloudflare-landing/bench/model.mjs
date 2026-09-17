import { criteria, stages } from './framework.mjs';
export { criteria, stages };
export const VERSION = '2026-09-17-v2';
// Initial editorial hypotheses exist only for the original four axes.
// Missing evidence is null, never a zero score or an invented capability.
export const vendors = [
  { id: 'ironclad', name: 'Ironclad', scores: [5, 5, 4, 4, ...criteria.slice(4).map(() => null)] },
  { id: 'luminance', name: 'Luminance', scores: [2, 2, 5, 5, ...criteria.slice(4).map(() => null)] },
];
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
  return { version: VERSION, weights: [...presets.complete.weights], scores: vendors.map(v => [...v.scores]), gates: vendors.map(() => gates.map(() => 'pending')), profile: Object.fromEntries(profileFields.map(f => [f.id, ''])), stage: 'diagnosis', completed: [] };
}
export function normalizeState(input) {
  const state = initialState();
  const validScore = n => Number.isInteger(n) && n >= 0 && n <= 5;
  criteria.forEach((_, i) => {
    if (validScore(input?.weights?.[i])) state.weights[i] = input.weights[i];
    else if (Array.isArray(input?.weights) && input.weights.length === 4 && input.weights.every(validScore) && i >= 4) state.weights[i] = 0;
    vendors.forEach((_, v) => {
      const value = input?.scores?.[v]?.[i];
      if (value === null || validScore(value)) state.scores[v][i] = value;
    });
  });
  vendors.forEach((_, v) => gates.forEach((_, g) => {
    if (['pending', 'pass', 'fail'].includes(input?.gates?.[v]?.[g])) state.gates[v][g] = input.gates[v][g];
  }));
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
export function calculate(input) {
  const state = normalizeState(input);
  const total = state.weights.reduce((sum, weight) => sum + weight, 0);
  const results = vendors.map((vendor, v) => {
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
  if (!total) { title = 'Escolha ao menos uma prioridade.'; status = 'empty'; }
  else if (!eligible.length) { title = 'Nenhuma ferramenta atende aos requisitos obrigatórios.'; status = 'blocked'; }
  else if (eligible.some(v => v.missing.length)) { title = 'Há critérios importantes sem avaliação. Complete as evidências.'; status = 'incomplete'; }
  else if (eligible.length > 1 && Math.abs(eligible[0].score - eligible[1].score) < 5) { title = 'Resultado próximo: compare as duas no piloto.'; status = 'close'; }
  else { title = `${eligible[0].name} tem maior aderência entre as opções sem veto.`; status = 'lead'; }
  return { state, total, results, eligible, title, status };
}
export function decodeState(hash) {
  if (!hash.startsWith('#cenario=') || hash.length > 20000) return null;
  try {
    const input = JSON.parse(decodeURIComponent(hash.slice(9)));
    return [VERSION, '2026-09-17'].includes(input?.version) ? normalizeState(input) : null;
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
    '', '| Critério | Peso (0–5) | Ironclad (0–5) | Luminance (0–5) |', '|---|---:|---:|---:|',
    ...criteria.map((c, i) => `| ${c.name} | ${state.weights[i]} | ${state.scores[0][i] ?? 'A validar'} | ${state.scores[1][i] ?? 'A validar'} |`),
    '', ...result.results.flatMap(v => [`## ${v.name}: ${fmt(v)}`, `Vetos: ${v.failed.join(', ') || 'nenhum'}.`, `Requisitos pendentes: ${v.pending.join(', ') || 'nenhum informado'}.`, `Critérios sem nota: ${v.missing.join(', ') || 'nenhum entre os priorizados'}.`]),
    '', '## Requisitos obrigatórios (declarados por quem preenche)',
    ...vendors.flatMap((v, vi) => gates.map((g, gi) => `${v.name} — ${g.name}: ${{pending:'A validar', pass:'Atende', fail:'Não atende'}[state.gates[vi][gi]]}`)),
    '', '## Como calculamos',
    'Pontos = 100 × soma(peso × nota) ÷ (5 × soma dos pesos). Peso zero exclui. Critério sem avaliação não recebe zero: mostramos a faixa possível se as notas faltantes forem de 0 a 5, sem indicar vencedor. Cobertura é a proporção dos pesos com notas. Diferença menor que 5 pontos é resultado próximo. Veto exclui a opção da indicação; pendência impede concluir a compra.',
    'Notas iniciais nos primeiros quatro eixos: Ironclad [5,5,4,4]; Luminance [2,2,5,5]. Demais capacidades: a validar. Fontes confirmam recursos anunciados, não notas ou superioridade.',
    '', '## Roteiro do piloto', ...criteria.filter((_, i) => state.weights[i] > 0).map(c => `- ${c.name}: ${c.test}`),
    '', '## Fontes consultadas em 17/09/2026', ...sources.map(s => `- ${s.title}: ${s.url}`),
    '', 'Modelo aberto: https://github.com/agenciaspace/clm-bench',
  ].join('\n');
}
