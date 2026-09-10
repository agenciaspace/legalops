import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export type RegionalLeadership = {
  id: string
  region_id: string
  role: 'lead' | 'co_lead' | 'organizer'
  status: 'active'
}

export function isLegalOpsAdminEmail(email?: string | null) {
  if (!email) return false
  const admins = new Set(
    (process.env.LEGALOPS_ADMIN_EMAILS ?? '')
      .split(',')
      .map(value => value.trim().toLowerCase())
      .filter(Boolean)
  )
  return admins.has(email.trim().toLowerCase())
}

export async function getCommunityManager(nextPath = '/bench/manage') {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect(`/login?next=${encodeURIComponent(nextPath)}`)

  const email = user.email.trim().toLowerCase()
  const isAdmin = isLegalOpsAdminEmail(email)
  const admin = createAdminClient()

  const { data: rawLeaderships } = await admin
    .from('community_regional_leaders')
    .select('id, region_id, role, status, user_id, email')
    .eq('status', 'active')
    .eq('email', email)

  const leaderships = (rawLeaderships ?? []) as Array<RegionalLeadership & { user_id: string | null; email: string }>

  // Link an approved leadership to the account after the leader signs in for the first time.
  await Promise.all(
    leaderships
      .filter(leadership => leadership.user_id !== user.id)
      .map(leadership => admin
        .from('community_regional_leaders')
        .update({ user_id: user.id, updated_at: new Date().toISOString() })
        .eq('id', leadership.id))
  )

  return {
    admin,
    user,
    email,
    isAdmin,
    leaderships: leaderships.map(({ id, region_id, role, status }) => ({ id, region_id, role, status })),
    managedRegionIds: new Set(leaderships.map(item => item.region_id)),
  }
}

export async function requireCommunityManager(nextPath = '/bench/manage') {
  const manager = await getCommunityManager(nextPath)
  if (!manager.isAdmin && manager.leaderships.length === 0) {
    redirect('/regions?leadership=required')
  }
  return manager
}

export async function requireLegalOpsAdmin(nextPath = '/regions/manage') {
  const manager = await getCommunityManager(nextPath)
  if (!manager.isAdmin) redirect('/regions?admin=required')
  return manager
}
