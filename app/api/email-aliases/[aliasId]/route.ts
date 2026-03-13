import { NextRequest, NextResponse } from 'next/server'
import { getAliasCreationError, sortEmailAliases } from '@/lib/email-aliases'
import { getUserEmailAlias, getUserTier, listUserEmailAliases } from '@/lib/email-alias-store'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { EmailAliasStatus } from '@/lib/types'

interface RouteContext {
  params: {
    aliasId: string
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const makePrimary = body?.makePrimary === true
  const requestedStatus: EmailAliasStatus | null =
    body?.status === 'active' || body?.status === 'disabled'
      ? body.status
      : null

  if (!makePrimary && !requestedStatus) {
    return NextResponse.json(
      { error: 'Either makePrimary or a valid status is required.' },
      { status: 400 }
    )
  }

  const alias = await getUserEmailAlias(supabase, user.id, params.aliasId)

  if (!alias) {
    return NextResponse.json({ error: 'Email alias not found.' }, { status: 404 })
  }

  if (makePrimary) {
    if (alias.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active email aliases can be made primary.' },
        { status: 400 }
      )
    }

    const { error: clearPrimaryError } = await supabase
      .from('user_email_aliases')
      .update({ is_primary: false })
      .eq('user_id', user.id)

    if (clearPrimaryError) {
      return NextResponse.json({ error: clearPrimaryError.message }, { status: 500 })
    }

    const { data: updatedAlias, error } = await supabase
      .from('user_email_aliases')
      .update({ is_primary: true })
      .eq('id', alias.id)
      .eq('user_id', user.id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const aliases = await listUserEmailAliases(supabase, user.id)
    return NextResponse.json({ alias: updatedAlias, aliases: sortEmailAliases(aliases) })
  }

  if (!requestedStatus || requestedStatus === alias.status) {
    const aliases = await listUserEmailAliases(supabase, user.id)
    return NextResponse.json({ alias, aliases: sortEmailAliases(aliases) })
  }

  if (requestedStatus === 'active') {
    const [tier, aliases] = await Promise.all([
      getUserTier(supabase, user.id),
      listUserEmailAliases(supabase, user.id),
    ])
    const activeAliasCount = aliases.filter(
      currentAlias => currentAlias.status === 'active' && currentAlias.id !== alias.id
    ).length
    const creationError = getAliasCreationError({
      tier,
      source: alias.source,
      activeAliasCount,
    })

    if (creationError) {
      return NextResponse.json({ error: creationError }, { status: 403 })
    }

    const hasPrimary = aliases.some(
      currentAlias =>
        currentAlias.status === 'active' &&
        currentAlias.id !== alias.id &&
        currentAlias.is_primary
    )

    const { data: updatedAlias, error } = await supabase
      .from('user_email_aliases')
      .update({
        status: 'active',
        is_primary: hasPrimary ? false : true,
      })
      .eq('id', alias.id)
      .eq('user_id', user.id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const refreshedAliases = await listUserEmailAliases(supabase, user.id)
    return NextResponse.json({
      alias: updatedAlias,
      aliases: sortEmailAliases(refreshedAliases),
    })
  }

  const { data: updatedAlias, error } = await supabase
    .from('user_email_aliases')
    .update({
      status: 'disabled',
      is_primary: false,
    })
    .eq('id', alias.id)
    .eq('user_id', user.id)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (alias.is_primary) {
    const { data: nextPrimary } = await supabase
      .from('user_email_aliases')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (nextPrimary?.id) {
      await supabase
        .from('user_email_aliases')
        .update({ is_primary: true })
        .eq('id', nextPrimary.id)
        .eq('user_id', user.id)
    }
  }

  const refreshedAliases = await listUserEmailAliases(supabase, user.id)

  return NextResponse.json({
    alias: updatedAlias,
    aliases: sortEmailAliases(refreshedAliases),
  })
}
