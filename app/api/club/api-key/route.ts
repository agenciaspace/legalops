import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasActiveClubAccess } from '@/lib/community'
import { memberKeyStatus, memberKeyStorageReady, saveMemberKey, removeMemberKey, validMemberKey, MemberKeyError } from '@/lib/club-api-key'

export const dynamic = 'force-dynamic'
const reply = (body: object, status = 200) => NextResponse.json(body, { status,
  headers: { 'Cache-Control': 'private, no-store', 'Pragma': 'no-cache' },
})
const failure = (error: unknown) => reply({ error: error instanceof MemberKeyError ? error.code : 'key_storage_unavailable' }, error instanceof MemberKeyError ? error.status : 503)

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')
  // Require the actual browser origin, never trust a body-supplied owner or URL.
  return origin === request.nextUrl.origin && request.headers.get('sec-fetch-site') !== 'cross-site'
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return reply({ error: 'sign_in_required' }, 401)
    return reply({ connection: await memberKeyStatus(user.id), available: memberKeyStorageReady() })
  } catch (error) { return failure(error) }
}

export async function PUT(request: NextRequest) {
  if (!sameOrigin(request)) return reply({ error: 'invalid_origin' }, 403)
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({ error: 'invalid_request' }, 415)
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return reply({ error: 'sign_in_required' }, 401)
    const { data: member, error } = await supabase.from('community_members')
      .select('club_access_status,club_access_expires_at').eq('user_id', user.id).maybeSingle()
    if (error) return reply({ error: 'key_storage_unavailable' }, 503)
    if (!hasActiveClubAccess(member)) return reply({ error: 'club_access_required' }, 403)
    if (!memberKeyStorageReady()) return reply({ error: 'key_storage_unavailable' }, 503)
    // Bound the raw body before parsing so secrets never reach logs or error output.
    const reader = request.body?.getReader()
    if (!reader) return reply({ error: 'invalid_request' }, 400)
    let raw = ''
    let size = 0
    const decoder = new TextDecoder()
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > 2048) { await reader.cancel(); return reply({ error: 'invalid_request' }, 413) }
        raw += decoder.decode(value, { stream: true })
      }
      raw += decoder.decode()
    } finally { reader.releaseLock() }
    let body
    try { body = JSON.parse(raw) } catch { return reply({ error: 'invalid_request' }, 400) }
    const key = typeof body?.api_key === 'string' ? body.api_key.trim() : null
    if (!validMemberKey(key)) return reply({ error: 'invalid_api_key' }, 400)
    if (body?.consent !== true) return reply({ error: 'consent_required' }, 400)
    return reply({ connection: await saveMemberKey(user.id, key), available: true })
  } catch (error) { return failure(error) }
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return reply({ error: 'invalid_origin' }, 403)
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return reply({ error: 'sign_in_required' }, 401)
    // Members can remove a key even after Club or Pro access expires.
    await removeMemberKey(user.id)
    return reply({ connection: null, available: memberKeyStorageReady() })
  } catch (error) { return failure(error) }
}
