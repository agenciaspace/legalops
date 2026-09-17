import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { hasActiveClubAccess } from '@/lib/community'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })
  const { data: member } = await supabase.from('community_members').select('club_access_status,club_access_expires_at').eq('user_id', user.id).maybeSingle()
  if (!hasActiveClubAccess(member)) return new NextResponse('Forbidden', { status: 403 })
  const admin = createAdminClient()
  const { data: resource } = await admin.from('community_event_resources').select('event_id,storage_path').eq('id', params.id).maybeSingle()
  if (!resource?.storage_path) return new NextResponse('Not found', { status: 404 })
  const [{ data: organizer }, { data: attendance }] = await Promise.all([
    admin.from('community_event_admins').select('event_id').eq('event_id', resource.event_id).eq('user_id', user.id).maybeSingle(),
    admin.from('community_event_rsvps').select('id').eq('event_id', resource.event_id).eq('user_id', user.id).eq('response', 'confirmed').maybeSingle(),
  ])
  if (!organizer && !attendance) return new NextResponse('Forbidden', { status: 403 })
  const { data: signed, error } = await admin.storage.from('community-event-files').createSignedUrl(resource.storage_path, 300, { download: true })
  if (error || !signed?.signedUrl) return new NextResponse('Not found', { status: 404 })
  return NextResponse.redirect(signed.signedUrl)
}
