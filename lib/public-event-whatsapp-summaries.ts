import type { EventWhatsAppSummary } from '@/lib/event-whatsapp-summary'

const COLUMNS = 'id,event_id,period_start,period_end,title,summary,key_points,source_message_count,source_participant_count,omitted_media_count,published_at,whatsapp_sent_at'

export async function loadPublicEventWhatsAppSummaries(eventId: string): Promise<EventWhatsAppSummary[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!eventId || !baseUrl || !key) return []
  const query = new URLSearchParams({ select: COLUMNS, event_id: `eq.${eventId}`, order: 'period_end.desc', limit: '30' })
  try {
    const response = await fetch(`${baseUrl}/rest/v1/community_event_whatsapp_summaries?${query}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(3_500),
    })
    if (!response.ok) return []
    const rows = await response.json() as unknown
    return Array.isArray(rows) ? rows as EventWhatsAppSummary[] : []
  } catch {
    return []
  }
}
