import { NextRequest, NextResponse } from 'next/server'
import {
  generateRandomEmailLocalPart,
  getAliasCreationError,
  isEmailAliasSource,
  normalizeEmailLocalPart,
  sortEmailAliases,
  validateCustomEmailLocalPart,
} from '@/lib/email-aliases'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getActiveEmailDomainForSource, getUserTier, listUserEmailAliases } from '@/lib/email-alias-store'
import type { EmailAliasSource } from '@/lib/types'

const RANDOM_ALIAS_ATTEMPTS = 5

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [tier, aliases] = await Promise.all([
    getUserTier(supabase, user.id),
    listUserEmailAliases(supabase, user.id),
  ])

  return NextResponse.json({
    tier,
    aliases: sortEmailAliases(aliases),
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const source: EmailAliasSource = isEmailAliasSource(body?.source) ? body.source : 'random'
  const requestedLocalPart =
    typeof body?.localPart === 'string' ? normalizeEmailLocalPart(body.localPart) : ''

  const [tier, aliases, domain] = await Promise.all([
    getUserTier(supabase, user.id),
    listUserEmailAliases(supabase, user.id),
    getActiveEmailDomainForSource(supabase, source),
  ])

  const activeAliases = aliases.filter(alias => alias.status === 'active')
  const creationError = getAliasCreationError({
    tier,
    source,
    activeAliasCount: activeAliases.length,
  })

  if (creationError) {
    return NextResponse.json({ error: creationError }, { status: 403 })
  }

  if (!domain) {
    return NextResponse.json(
      { error: 'No active email domain is configured for this alias type.' },
      { status: 503 }
    )
  }

  if (source === 'custom') {
    const validationError = validateCustomEmailLocalPart(requestedLocalPart)

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }
  }

  for (let attempt = 0; attempt < RANDOM_ALIAS_ATTEMPTS; attempt += 1) {
    const localPart =
      source === 'custom'
        ? requestedLocalPart
        : generateRandomEmailLocalPart()

    const { data: alias, error } = await supabase
      .from('user_email_aliases')
      .insert({
        user_id: user.id,
        domain_id: domain.id,
        local_part: localPart,
        source,
        status: 'active',
        is_primary: activeAliases.length === 0,
      })
      .select('*')
      .single()

    if (!error) {
      return NextResponse.json({ alias }, { status: 201 })
    }

    if (error.code === '23505' && source === 'random') {
      continue
    }

    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'This email alias is already taken.' },
        { status: 409 }
      )
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    { error: 'Failed to generate a unique random email alias. Try again.' },
    { status: 409 }
  )
}
