export const NEWS_AUDIENCES = {
  escritorios: { label: 'Escritórios', description: 'Tecnologia, gestão e novos modelos para entregar serviços jurídicos.', question: 'O que muda na entrega, na margem e na relação com o cliente?' },
  'departamentos-juridicos': { label: 'Departamentos jurídicos', description: 'Demandas, contratos, orçamento e decisões sobre a operação jurídica.', question: 'O que muda na operação, nas compras e na distribuição do trabalho?' },
  prestadores: { label: 'Prestadores de serviços', description: 'Consultorias, legal techs, implementadores e operações terceirizadas.', question: 'Que demanda surge e como adaptar sua oferta de serviços?' },
} as const

export const NEWS_TOPICS = {
  'ia-tecnologia': 'IA e tecnologia',
  'operacoes-contratos': 'Operações e contratos',
  'negocios-mercado': 'Negócios e mercado',
  'pessoas-competencias': 'Pessoas e competências',
  governanca: 'Governança',
} as const

export type NewsAudience = keyof typeof NEWS_AUDIENCES
export type NewsTopic = keyof typeof NEWS_TOPICS
export type NewsSource = { title: string; url: string }
export type NewsArticle = {
  id: string; slug: string; title: string; summary: string; body: string
  audiences: NewsAudience[]; topics: NewsTopic[]; impact: Partial<Record<NewsAudience, string>>
  sources: NewsSource[]; status: 'draft' | 'published'; published_at: string | null
  event_date: string | null; updated_at: string; author_name: string; featured: boolean
}
export type NewsPreferences = { enabled: boolean; audiences: NewsAudience[]; topics: NewsTopic[] }
export const DEFAULT_NEWS_PREFERENCES: NewsPreferences = { enabled: false, audiences: [], topics: [] }

export function isNewsAudience(value: unknown): value is NewsAudience {
  return typeof value === 'string' && Object.hasOwn(NEWS_AUDIENCES, value)
}
export function isNewsTopic(value: unknown): value is NewsTopic {
  return typeof value === 'string' && Object.hasOwn(NEWS_TOPICS, value)
}
function choices<T extends string>(value: unknown, guard: (item: unknown) => item is T): T[] {
  if (!Array.isArray(value) || value.length > 10 || value.some(item => !guard(item))) throw new Error('Escolha os públicos e assuntos disponíveis.')
  return Array.from(new Set(value)) as T[]
}
export function parseNewsPreferences(input: unknown): NewsPreferences {
  if (!input || typeof input !== 'object') throw new Error('Confira suas preferências.')
  const value = input as Record<string, unknown>
  if (typeof value.enabled !== 'boolean') throw new Error('Indique se deseja acompanhar as notícias no Club.')
  return { enabled: value.enabled, audiences: choices(value.audiences, isNewsAudience), topics: choices(value.topics, isNewsTopic) }
}
export function parseNewsSignup(input: unknown) {
  if (!input || typeof input !== 'object') throw new Error('Confira os campos.')
  const value = input as Record<string, unknown>
  const email = typeof value.email === 'string' ? value.email.trim().toLowerCase() : ''
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Informe um email válido.')
  if (value.consent !== true) throw new Error('Autorize o recebimento da newsletter para continuar.')
  const preferences = parseNewsPreferences({ enabled: true, audiences: value.audiences ?? [], topics: value.topics ?? [] })
  return { email, audiences: preferences.audiences, topics: preferences.topics, honeypot: Boolean(value.company) }
}
export function matchesNewsPreferences(article: NewsArticle, preferences: NewsPreferences) {
  return (!preferences.audiences.length || article.audiences.some(audience => preferences.audiences.includes(audience)))
    && (!preferences.topics.length || article.topics.some(topic => preferences.topics.includes(topic)))
}
export function formatNewsDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Sao_Paulo' }).format(new Date(value.length === 10 ? `${value}T12:00:00Z` : value))
}
export function safeNewsSource(value: unknown): value is NewsSource {
  if (!value || typeof value !== 'object') return false
  const source = value as Record<string, unknown>
  if (typeof source.title !== 'string' || !source.title.trim() || source.title.length > 200 || typeof source.url !== 'string' || source.url.length > 2048) return false
  try { const url = new URL(source.url); return url.protocol === 'https:' && !url.username && !url.password } catch { return false }
}
export function parseNewsArticle(input: unknown) {
  if (!input || typeof input !== 'object') throw new Error('Confira a matéria.')
  const value = input as Record<string, unknown>
  const text = (key: string, min: number, max: number) => {
    const result = typeof value[key] === 'string' ? value[key].trim() : ''
    if (result.length < min || result.length > max) throw new Error(`Confira o campo ${key}.`)
    return result
  }
  const slug = text('slug', 3, 140)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Use apenas letras minúsculas, números e hífens no endereço.')
  const audiences = choices(value.audiences, isNewsAudience)
  const topics = choices(value.topics, isNewsTopic)
  if (!audiences.length || !topics.length) throw new Error('Escolha ao menos um público e um assunto.')
  if (!Array.isArray(value.sources) || !value.sources.length || value.sources.length > 10 || !value.sources.every(safeNewsSource)) throw new Error('Inclua fontes HTTPS com título e endereço.')
  if (value.status !== 'draft' && value.status !== 'published') throw new Error('Status inválido.')
  const impact: Partial<Record<NewsAudience, string>> = {}
  for (const audience of audiences) {
    const item = (value.impact as Record<string, unknown> | undefined)?.[audience]
    if (typeof item !== 'string' || item.trim().length < 20 || item.length > 2000) throw new Error(`Explique o impacto para ${NEWS_AUDIENCES[audience].label}.`)
    impact[audience] = item.trim()
  }
  const eventDate = typeof value.event_date === 'string' && value.event_date ? value.event_date : null
  if (eventDate && (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || !Number.isFinite(Date.parse(eventDate)) || new Date(eventDate).toISOString().slice(0, 10) !== eventDate)) throw new Error('Data do fato inválida.')
  return { slug, title: text('title', 10, 200), summary: text('summary', 30, 600), body: text('body', 80, 30000), audiences, topics, impact, sources: value.sources as NewsSource[], status: value.status, event_date: eventDate, featured: value.featured === true }
}
