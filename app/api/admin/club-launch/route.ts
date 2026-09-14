import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { launchClubWhatsappGroup } from '@/lib/club-whatsapp-launch'

export async function POST() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const allowed = (process.env.LEGALOPS_ADMIN_EMAILS ?? '').split(',').map(value => value.trim().toLowerCase())
  if (!user?.email || !allowed.includes(user.email.toLowerCase())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data: existing } = await admin.from('club_launch_config').select('whatsapp_group_jid, whatsapp_invite_url').eq('id', true).maybeSingle()
  if (existing?.whatsapp_group_jid && existing.whatsapp_invite_url) return NextResponse.json({ launched: true, inviteUrl: existing.whatsapp_invite_url })

  try {
    const launch = await launchClubWhatsappGroup()
    await admin.from('club_launch_config').upsert({ id: true, whatsapp_group_jid: launch.groupjid, whatsapp_invite_url: launch.inviteUrl, launched_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    return NextResponse.json({ launched: true, inviteUrl: launch.inviteUrl })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Launch failed.' }, { status: 502 })
  }
}
