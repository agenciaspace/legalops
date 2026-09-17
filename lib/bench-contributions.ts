export const BENCH_TYPES = { tool: 'Sugerir ferramenta', evidence: 'Compartilhar experiência ou fonte', correction: 'Corrigir uma avaliação', criterion: 'Propor critério' } as const
export const BENCH_EVIDENCE = { official: 'Documentação oficial', hands_on: 'Uso na operação', demo: 'Demonstração ou piloto', hypothesis: 'Hipótese a validar' } as const
export const BENCH_RELATIONSHIPS = { independent: 'Sem vínculo com o fornecedor', customer: 'Cliente ou usuário', vendor: 'Trabalho no fornecedor', partner: 'Parceiro ou consultor' } as const
export const BENCH_CRITERIA = {"general": "Geral", "workflow": "Workflows e aprovações", "salesforce": "Integração Salesforce", "playbook": "Criação e uso de playbooks", "repository": "Repositório e inteligência", "intake": "Entrada e triagem de demandas", "templates": "Modelos e geração de documentos", "third_party": "Contratos de terceiros", "collaboration": "Negociação e controle de versões", "signature": "Assinatura eletrônica", "integrations": "ERP, CRM e ferramentas existentes", "api": "APIs, webhooks e extensibilidade", "identity": "Identidade e provisionamento", "sync": "Operação das integrações", "ai_quality": "Qualidade da revisão por IA", "ai_governance": "Governança e custo da IA", "languages": "Idiomas e contexto jurídico", "migration": "Migração do legado", "extraction": "OCR e extração de metadados", "obligations": "Obrigações e renovações", "analytics": "Relatórios e indicadores", "portability": "Portabilidade e saída", "permissions": "Permissões e segregação", "audit": "Auditoria e rastreabilidade", "privacy": "Privacidade e segurança", "residency": "Residência e retenção de dados", "continuity": "Disponibilidade e continuidade", "implementation": "Implantação e administração", "usability": "Usabilidade e acessibilidade", "support": "Suporte e capacitação", "scale": "Escala e complexidade organizacional", "tco": "Custo total de propriedade", "supplier": "Fornecedor, parceiro e condições"} as const
export type BenchContent = {
  kind: keyof typeof BENCH_TYPES
  tool_name: string
  tool_url: string
  criterion: keyof typeof BENCH_CRITERIA
  title: string
  body: string
  source_url: string
  evidence_kind: keyof typeof BENCH_EVIDENCE
  observed_on: string
  context: string
  relationship: keyof typeof BENCH_RELATIONSHIPS
  public_name: string
}
export class BenchValidationError extends Error {}
function text(input: Record<string, unknown>, key: string, min: number, max: number) {
  const value = typeof input[key] === 'string' ? input[key].trim() : ''
  if (value.length < min || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new BenchValidationError(`Confira o campo ${key}.`)
  return value
}
function option<T extends Record<string, string>>(input: Record<string, unknown>, key: string, options: T): keyof T {
  const value = input[key]
  if (typeof value !== 'string' || !Object.hasOwn(options, value)) throw new BenchValidationError(`Confira o campo ${key}.`)
  return value
}
function source(value: string) {
  if (!value) return ''
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error()
    return url.href
  } catch { throw new BenchValidationError('Use um link público com https:// e sem credenciais.') }
}
export function parseBenchContent(input: unknown): BenchContent {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new BenchValidationError('Preencha a contribuição.')
  const raw = input as Record<string, unknown>
  const content = {
    kind: option(raw, 'kind', BENCH_TYPES),
    tool_name: text(raw, 'tool_name', 2, 100),
    tool_url: source(text(raw, 'tool_url', 0, 1000)),
    criterion: option(raw, 'criterion', BENCH_CRITERIA),
    title: text(raw, 'title', 8, 140),
    body: text(raw, 'body', 40, 3000),
    source_url: source(text(raw, 'source_url', 0, 1000)),
    evidence_kind: option(raw, 'evidence_kind', BENCH_EVIDENCE),
    observed_on: text(raw, 'observed_on', 0, 10),
    context: text(raw, 'context', 20, 700),
    relationship: option(raw, 'relationship', BENCH_RELATIONSHIPS),
    public_name: text(raw, 'public_name', 2, 80),
  }
  if (content.kind === 'tool' && !content.tool_url) throw new BenchValidationError('Informe o site oficial da ferramenta.')
  if (content.evidence_kind === 'official' && !content.source_url) throw new BenchValidationError('Inclua a fonte pública da documentação.')
  if (content.observed_on && (!/^\d{4}-\d{2}-\d{2}$/.test(content.observed_on) || !Number.isFinite(Date.parse(content.observed_on)) || new Date(content.observed_on).toISOString().slice(0, 10) !== content.observed_on || content.observed_on > new Date().toISOString().slice(0, 10))) throw new BenchValidationError('Informe uma data válida, até hoje.')
  if (['hands_on', 'demo'].includes(content.evidence_kind) && !content.observed_on) throw new BenchValidationError('Informe a data da experiência ou demonstração.')
  return content
}
export function parseBenchSubmission(input: unknown) {
  const content = parseBenchContent(input)
  const raw = input as Record<string, unknown>
  const email = text(raw, 'email', 3, 254).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BenchValidationError('Informe um email válido para contato privado.')
  if (raw.consent !== true) throw new BenchValidationError('Confirme a autorização para publicar o conteúdo revisado.')
  if (raw.website) throw new BenchValidationError('Não foi possível enviar. Recarregue a página e tente novamente.')
  return { content, email }
}
export function publicBenchEntry(row: { id: string; content: unknown; published_at: string; review_note: string }) {
  return { id: row.id, ...parseBenchContent(row.content), published_at: row.published_at, review_note: row.review_note }
}
