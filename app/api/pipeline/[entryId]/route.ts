import { NextRequest, NextResponse } from 'next/server'
import {
  ensureUserApplicationAlias,
  pipelineStatusUsesApplicationAlias,
} from '@/lib/application-email-alias'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { PipelineStatus } from '@/lib/types'

const VALID_PATCH_STATUSES: PipelineStatus[] = ['researching', 'applied', 'interview', 'offer', 'discarded']

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const { entryId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.status || !VALID_PATCH_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { data: currentEntry } = await supabase
    .from('user_pipeline_entries')
    .select('id, status, applied_at, email_alias_id')
    .eq('id', entryId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!currentEntry) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const updates: Record<string, unknown> = {
    status: body.status,
  }

  if (pipelineStatusUsesApplicationAlias(body.status) && !currentEntry.email_alias_id) {
    try {
      const alias = await ensureUserApplicationAlias(supabase as never, user.id)
      updates.email_alias_id = alias.id
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to assign an application email alias.'

      return NextResponse.json({ error: message }, { status: 503 })
    }
  }

  if (pipelineStatusUsesApplicationAlias(body.status) && !currentEntry.applied_at) {
    updates.applied_at = new Date().toISOString()
  }

  const { data: entry, error } = await supabase
    .from('user_pipeline_entries')
    .update(updates)
    .eq('id', entryId)
    .eq('user_id', user.id)
    .select('*, email_alias:user_email_aliases(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ entry })
}
