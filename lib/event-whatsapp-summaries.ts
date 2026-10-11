import type { SupabaseClient } from '@supabase/supabase-js'
import type { EventWhatsAppSummary } from '@/lib/event-whatsapp-summary'

const COLUMNS = 'id,event_id,period_start,period_end,title,summary,key_points,source_message_count,source_participant_count,omitted_media_count,published_at,whatsapp_sent_at'

export type EventSummaryArchive = {
  summaries: EventWhatsAppSummary[]
  status: 'signed-out' | 'ready' | 'error'
}

export async function loadEventWhatsAppSummaries(db: SupabaseClient, eventId: string): Promise<EventSummaryArchive> {
  try {
    const { data: { user }, error: authError } = await db.auth.getUser()
    if (authError || !user || user.is_anonymous) return { summaries: [], status: 'signed-out' }
    const { data, error } = await db.from('community_event_whatsapp_summaries')
      .select(COLUMNS).eq('event_id', eventId).order('period_end', { ascending: false }).limit(30)
    if (error) return { summaries: [], status: 'error' }
    return { summaries: (data ?? []) as EventWhatsAppSummary[], status: 'ready' }
  } catch {
    return { summaries: [], status: 'error' }
  }
}
