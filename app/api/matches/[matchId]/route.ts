import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { MatchStatus } from '@/lib/types'

const VALID_STATUSES: MatchStatus[] = ['new', 'viewed', 'interested', 'applied', 'dismissed']

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { matchId } = await params
  const body = await req.json().catch(() => null)

  if (!body?.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { data: match, error } = await supabase
    .from('job_matches')
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq('id', matchId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ match })
}
