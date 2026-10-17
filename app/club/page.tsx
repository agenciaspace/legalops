import type { Metadata } from 'next'
import { ResumeClubSession } from '@/components/community/ResumeClubSession'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { isEventDatePending, upcomingCommunityEvents } from '@/lib/community-event-display'
import ClubEditorialHome from './ClubEditorialHome'

export const metadata: Metadata = {
  title: 'legalops.club | comunidade para profissionais do jurídico',
  description: 'Converse com profissionais de Legal Ops, contratos e tecnologia jurídica. Participe de encontros e encontre referências para o seu trabalho.',
  openGraph: { title: 'legalops.club | comunidade para o trabalho jurídico', description: 'Troque experiências, conheça membros e participe dos encontros da comunidade.', url: 'https://legalops.club', siteName: 'legalops.club', type: 'website' },
}
export const dynamic = 'force-dynamic'
type PublicEvent = { id: string; slug: string; title: string; description: string; starts_at: string; ends_at: string | null; location_label: string | null }
async function loadEvents(): Promise<PublicEvent[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return []
  const db = await createServerSupabaseClient()
  const { data } = await db.from('community_events')
    .select('id,slug,title,description,starts_at,ends_at,location_label')
    .eq('is_published', true).order('starts_at', { ascending: false }).limit(50)
    .abortSignal(AbortSignal.timeout(1500))
  return upcomingCommunityEvents((data ?? []) as PublicEvent[]).slice(0, 3)
}
function eventDate(event: PublicEvent) {
  return isEventDatePending(event) ? 'Data e formato a confirmar' : new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'long', timeStyle: 'short' }).format(new Date(event.starts_at))
}
export default async function ClubLandingPage() {
  const events = await loadEvents().catch(() => [])
  return <><ResumeClubSession /><ClubEditorialHome events={events.map(event => ({ id: event.id, slug: event.slug, title: event.title, description: event.description, dateLabel: eventDate(event) }))} /></>
}
