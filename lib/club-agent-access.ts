import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasActiveClubAccess } from '@/lib/community'
import { hasClubProAccess } from '@/lib/club-membership'

export const isConversationId = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

export async function agentSession() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Entre na sua conta.' }, { status: 401 }) } as const
  const { data: member } = await supabase.from('community_members').select('club_access_status,club_access_expires_at,club_pro_status,club_pro_expires_at').eq('user_id', user.id).maybeSingle()
  if (!hasActiveClubAccess(member) || !hasClubProAccess(member)) return { error: NextResponse.json({ error: 'Este recurso faz parte do Club Pro.' }, { status: 403 }) } as const
  return { supabase, user } as const
}

export const CONVERSATION_FIELDS = 'id,title,created_at,updated_at'
