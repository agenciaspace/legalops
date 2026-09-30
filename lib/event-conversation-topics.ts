export type EventConversationTopic = {
  id: string
  event_id: string
  title: string
  description: string
  display_order: number
}

export const NETLEX_EVENT_CONVERSATION_TOPICS = [
  { title: 'Implantação e roll-out', description: 'Planejamento, migração, fases, prazos e aprendizados da entrada em produção.' },
  { title: 'Integrações e dados', description: 'ERP, assinatura, APIs, cadastros, migração de dados e qualidade das informações.' },
  { title: 'Fluxos, templates e automações', description: 'Workflows, modelos, aprovações, alertas e automações que funcionaram na prática.' },
  { title: 'Governançã, segurança e permissões', description: 'Papéis, acessos, auditoria, privacidade, controles e decisões de governança.' },
  { title: 'Adoção, suporte e valor', description: 'Engajamento, treinamento, suporte, indicadores e como demonstrar resultado.' },
] as const

export async function loadPublicEventConversationTopics(eventId: string, slug: string): Promise<EventConversationTopic[]> {
  if (slug !== 'bench-netlex-2026') return []
  const fallback = NETLEX_EVENT_CONVERSATION_TOPICS.map((topic, index) => ({ id: '', event_id: eventId, ...topic, display_order: index + 1 }))
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!eventId || !baseUrl || !key) return fallback
  const query = new URLSearchParams({ select: 'id,event_id,title,description,display_order', event_id: `eq.${eventId}`, status: 'eq.active', order: 'display_order.asc' })
  try {
    const response = await fetch(`${baseUrl}/rest/v1/community_forum_topics?${query}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(3_500),
    })
    if (!response.ok) return fallback
    const rows = await response.json() as unknown
    return Array.isArray(rows) && rows.length ? rows as EventConversationTopic[] : fallback
  } catch {
    return fallback
  }
}
