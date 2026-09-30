import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { isLegalOpsAdminEmail } from '@/lib/legalops-admin'

export async function requireEventAdminAccess(slug: string, nextPath: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`)

  const admin = createAdminClient()
  const { data: event } = await admin
    .from('community_events')
    .select('id,slug')
    .eq('slug', slug)
    .maybeSingle()

  if (!event) return null
  if (!isLegalOpsAdminEmail(user.email)) {
    const { data: assignment } = await admin
      .from('community_event_admins')
      .select('role')
      .eq('event_id', event.id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!assignment) redirect(`/community/events/${event.slug}?admin=required`)
  }

  return { admin, event, user }
}
