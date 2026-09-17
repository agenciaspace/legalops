// Editorial starting assumptions, not measured vendor performance.
export const VERSION = '2026-09-17';
export const criteria = [
  { id: 'workflow', name: 'Workflows e aprovações', question: 'Quanto importa automatizar solicitações, alçadas e exceções?', test: 'Execute uma solicitação com duas alçadas, uma exceção e substituição do aprovador. Meça o trabalho do administrador.' },
  { id: 'salesforce', name: 'Integração Salesforce', question: 'Quanto a operação depende de contratos dentro do CRM?', test: 'Crie pela Opportunity, altere um campo, acompanhe a aprovação e devolva contrato assinado e dados ao CRM. Teste permissões e falhas de sincronização.' },
  { id: 'playbook', name: 'Criação e uso de playbooks', question: 'Quanto importa transformar posições jurídicas em revisão consistente?', test: 'Crie e atualize um playbook com posições e fallbacks. Aplique em contratos em português e conte omissões, falsos alertas e ajustes manuais.' },
  { id: 'repository', name: 'Repositório e inteligência', question: 'Quanto importa consultar contratos, aditivos e obrigações?', test: 'Importe contratos com aditivos e PDFs digitalizados. Confira extração, relação entre documentos, respostas com referência e exportação.' },
];
export const vendors = [
  { id: 'ironclad', name: 'Ironclad', scores: [5, 5, 4, 4] },
  { id: 'luminance', name: 'Luminance', scores: [2, 2, 5, 5] },
];
export const gates = [
  { id: 'security', name: 'Segurança e governança', description: 'Acesso, auditoria, tratamento de dados e requisitos internos aprovados.' },
  { id: 'integration', name: 'Integrações obrigatórias', description: 'CRM e demais sistemas essenciais demonstrados no seu cenário.' },
  { id: 'implementation', name: 'Implantação e migração', description: 'Prazo, responsáveis, migração e saída dos dados aceitos pela empresa.' },
  { id: 'budget', name: 'Custo total aprovado', description: 'Proposta com licença, IA, implementação, integrações e suporte.' },
];
export const presets = {
  balanced: { name: 'Visão equilibrada', weights: [3, 3, 3, 3] },
  revenue: { name: 'Operação comercial + Salesforce', weights: [5, 5, 2, 1] },
  intelligence: { name: 'Playbooks + acervo contratual', weights: [1, 0, 5, 5] },
};
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
  return { version: VERSION, weights: [...presets.balanced.weights], scores: vendors.map(v => [...v.scores]), gates: vendors.map(() => gates.map(() => 'pending')) };
}

export function normalizeState(input) {
  const state = initialState();
  const validScore = (n) => Number.isInteger(n) && n >= 0 && n <= 5;
  criteria.forEach((_, i) => {
    if (validScore(input?.weights?.[i])) state.weights[i] = input.weights[i];
    vendors.forEach((_, v) => {
      if (validScore(input?.scores?.[v]?.[i])) state.scores[v][i] = input.scores[v][i];
    });
  });
  vendors.forEach((_, v) => gates.forEach((_, g) => {
    if (['pending', 'pass', 'fail'].includes(input?.gates?.[v]?.[g])) state.gates[v][g] = input.gates[v][g];
  }));
  return state;
}

export function calculate(input) {
  const state = normalizeState(input);
  const total = state.weights.reduce((sum, weight) => sum + weight, 0);
  const results = vendors.map((vendor, v) => {
    const contributions = state.weights.map((weight, i) => total ? 100 * weight * state.scores[v][i] / (5 * total) : 0);
    return {
      ...vendor, contributions,
      score: total ? contributions.reduce((sum, n) => sum + n, 0) : null,
      failed: gates.filter((_, g) => state.gates[v][g] === 'fail').map(g => g.name),
      pending: gates.filter((_, g) => state.gates[v][g] === 'pending').map(g => g.name),
    };
  });
  const eligible = results.filter(v => !v.failed.length).sort((a, b) => b.score - a.score);
  let title, status;
  if (!total) { title = 'Escolha ao menos uma prioridade.'; status = 'empty'; }
  else if (!eligible.length) { title = 'Nenhuma ferramenta atende aos requisitos obrigatórios.'; status = 'blocked'; }
  else if (eligible.length > 1 && Math.abs(eligible[0].score - eligible[1].score) < 5) { title = 'Resultado próximo: compare as duas no piloto.'; status = 'close'; }
  else { title = `${eligible[0].name} tem maior aderência entre as opções sem veto.`; status = 'lead'; }
  return { state, total, results, eligible, title, status };
}

export function decodeState(hash) {
  if (!hash.startsWith('#cenario=')) return null;
  if (hash.length > 5000) return null;
  try {
    const input = JSON.parse(decodeURIComponent(hash.slice(9)));
    return input?.version === VERSION ? normalizeState(input) : null;
  } catch { return null; }
}

export function report(input) {
  const result = calculate(input);
  const { state } = result;
  const fmt = (n) => n === null ? 'Sem pontuação' : `${n.toFixed(1)}/100`;
  return [
    '# legalops.dev / bench — avaliação de CLM',
    `Base editorial: ${VERSION}. Exportado em ${new Date().toISOString().slice(0, 10)}.`,
    '', result.title,
    'Simulação de aderência com notas ajustáveis. Não é teste empírico, certificação ou decisão automática de compra.',
    '', '| Critério | Peso (0–5) | Ironclad (0–5) | Luminance (0–5) |', '|---|---:|---:|---:|',
    ...criteria.map((c, i) => `| ${c.name} | ${state.weights[i]} | ${state.scores[0][i]} | ${state.scores[1][i]} |`),
    '', ...result.results.flatMap(v => [`## ${v.name}: ${fmt(v.score)}`, `Vetos: ${v.failed.join(', ') || 'nenhum'}.`, `Pendências: ${v.pending.join(', ') || 'nenhuma informada'}.`]),
    '', '## Requisitos obrigatórios (declarados por quem preenche)',
    ...vendors.flatMap((v, vi) => gates.map((g, gi) => `${v.name} — ${g.name}: ${{pending:'A validar', pass:'Atende', fail:'Não atende'}[state.gates[vi][gi]]}`)),
    '', '## Como calculamos',
    'Pontos = 100 × soma(peso × nota) ÷ (5 × soma dos pesos). Peso zero exclui o critério. Diferença menor que 5 pontos indica resultado próximo. Veto exclui a opção da indicação, preservando a nota para auditoria. Pendência impede concluir a compra.',
    'As notas iniciais são hipóteses editoriais do Bench: Ironclad [5,5,4,4]; Luminance [2,2,5,5]. Fontes confirmam recursos anunciados, não as notas ou superioridade. Notas diferentes dessas foram ajustadas pelo usuário.',
    '', '## Roteiro do piloto', ...criteria.filter((_, i) => state.weights[i] > 0).map(c => `- ${c.name}: ${c.test}`),
    '', '## Fontes consultadas em 17/09/2026', ...sources.map(s => `- ${s.title}: ${s.url}`),
  ].join('\n');
}
