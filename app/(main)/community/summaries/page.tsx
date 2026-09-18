import { getClubLocale } from '@/lib/club-locale-server'
import { loadClubTranslations } from '@/lib/club-translations'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { WhatsAppSummaries } from '@/components/community/WhatsAppSummaries'
import type { WhatsAppDigest, WhatsAppSchedule } from '@/lib/whatsapp-summary'
export const dynamic = 'force-dynamic'
export default async function DiscussionSummariesPage() {
  const db = await createServerSupabaseClient()
  const [summaries, schedule] = await Promise.all([
    db.from('club_whatsapp_summaries').select('id,period_start,period_end,title,summary,key_points,source_message_count,source_participant_count,omitted_media_count,published_at,whatsapp_sent_at').order('period_end',{ascending:false}).limit(24),
    db.from('club_whatsapp_summary_schedule').select('*').eq('id','community').maybeSingle(),
  ])
  const translations = await loadClubTranslations(db, (summaries.data ?? []).map(item=>item.id))
  return <WhatsAppSummaries serverLocale={getClubLocale()} translations={Object.fromEntries(translations.sources)} translationEnabled={translations.enabled} summaries={(summaries.data ?? []) as WhatsAppDigest[]} schedule={schedule.data as WhatsAppSchedule | null} unavailable={!!summaries.error || !!schedule.error} />
}
