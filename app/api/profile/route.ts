import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/** GET /api/profile — fetch current user profile */
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ profile })
}

/** PATCH /api/profile — set email alias */
export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body.email_alias !== 'string') {
    return NextResponse.json({ error: 'email_alias required' }, { status: 400 })
  }

  const alias = body.email_alias.toLowerCase().trim()

  // Validate alias format: only lowercase letters, numbers, dots, hyphens
  if (alias && !/^[a-z0-9][a-z0-9._-]{0,28}[a-z0-9]$/.test(alias)) {
    return NextResponse.json(
      { error: 'Alias deve ter 2-30 caracteres, apenas letras, numeros, pontos e hifens' },
      { status: 400 }
    )
  }

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .upsert(
      { user_id: user.id, email_alias: alias || null, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Esse alias ja esta em uso' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profile })
}
