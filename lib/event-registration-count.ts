import { createAdminClient } from '@/lib/supabase-admin'

export async function loadConfirmedEventRegistrationCount(eventId: string | null | undefined) {
  if (!eventId) return null

  try {
    const { count, error } = await createAdminClient()
      .from('community_event_rsvps')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('response', 'confirmed')

    if (error || typeof count !== 'number') return null
    return count
  } catch {
    return null
  }
}
