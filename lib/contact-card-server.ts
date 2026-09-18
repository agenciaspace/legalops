import { createServerSupabaseClient } from './supabase-server'
import { createAdminClient } from './supabase-admin'
import { hasActiveClubAccess } from './community'
import { CONTACT_ID, type ContactCard } from './contact-card'

export async function readContactCard(id: string) {
  if (!CONTACT_ID.test(id)) return { status: 404 as const, card: null, viewerId: null, isMember: false }
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: viewer } = user ? await supabase.from('community_members').select('club_access_status,club_access_expires_at').eq('user_id', user.id).maybeSingle() : { data: null }
  const isMember = hasActiveClubAccess(viewer)
  const admin = createAdminClient()
  const [{ data: member }, { data: details, error }] = await Promise.all([
    admin.from('community_members').select('user_id,display_name,current_role,organization_name,linkedin_url,club_access_status,club_access_expires_at').eq('user_id', id).maybeSingle(),
    admin.from('community_contact_cards').select('email,phone,website,public_enabled').eq('user_id', id).maybeSingle(),
  ])
  if (error) return { status: 503 as const, card: null, viewerId: user?.id ?? null, isMember }
  if (!member || !hasActiveClubAccess(member)) return { status: 404 as const, card: null, viewerId: user?.id ?? null, isMember }
  if (!isMember && !details?.public_enabled) return { status: 403 as const, card: null, viewerId: user?.id ?? null, isMember }
  // Explicit public projection: never include auth email or private profile fields.
  const card: ContactCard = {
    user_id: member.user_id, display_name: member.display_name, current_role: member.current_role,
    organization_name: member.organization_name, linkedin_url: member.linkedin_url,
    email: details?.email ?? null, phone: details?.phone ?? null, website: details?.website ?? null,
    public_enabled: details?.public_enabled ?? false,
  }
  return { status: 200 as const, card, viewerId: user?.id ?? null, isMember }
}
