import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const LINKEDIN_PATTERN = /^https:\/\/(www\.)?linkedin\.com\/in\//

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const { entryId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: leader } = await supabase
    .from('leaders')
    .select('*')
    .eq('entry_id', entryId)
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ leader: leader ?? null })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const { entryId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: 'name required' }, { status: 400 })
  }
  if (body.linkedin_url && !LINKEDIN_PATTERN.test(body.linkedin_url)) {
    return NextResponse.json(
      { error: 'linkedin_url must start with https://linkedin.com/in/' },
      { status: 400 }
    )
  }

  const payload = {
    entry_id: entryId,
    user_id: user.id,
    name: body.name.trim(),
    title: body.title?.trim() ?? null,
    linkedin_url: body.linkedin_url ?? null,
    notes: body.notes?.trim() ?? null,
  }

  const { data: leader, error } = await supabase
    .from('leaders')
    .upsert(payload, { onConflict: 'entry_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ leader })
}
