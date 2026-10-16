import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { DEFAULT_NEWS_PREFERENCES, parseNewsPreferences } from '@/lib/news'
import { newsSameOrigin, readNewsJson } from '@/lib/news-http'
import { hasActiveClubAccess } from '@/lib/community'

export const dynamic = 'force-dynamic'
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
export async function GET() {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return reply({ error: 'Entre no Club para continuar.' }, 401)
  const { data, error } = await db.from('news_preferences').select('enabled,audiences,topics').eq('user_id', user.id).maybeSingle()
  if (error) return reply({ error: 'Não conseguimos carregar suas preferências.' }, 503)
  return reply({ preferences: data ?? DEFAULT_NEWS_PREFERENCES })
}
export async function PUT(request: NextRequest) {
  if (!newsSameOrigin(request)) return reply({ error: 'Salve suas preferências pelo Club.' }, 403)
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return reply({ error: 'Entre no Club para continuar.' }, 401)
  const { data: member } = await db.from('community_members').select('club_access_status,club_access_expires_at').eq('user_id', user.id).maybeSingle()
  if (!hasActiveClubAccess(member)) return reply({ error: 'Complete seu perfil para entrar na comunidade.' }, 403)
  let preferences
  try { preferences = parseNewsPreferences(await readNewsJson(request)) } catch (error) { return reply({ error: error instanceof Error ? error.message : 'Confira os campos.' }, 400) }
  const { error } = await db.from('news_preferences').upsert({ user_id: user.id, ...preferences, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) return reply({ error: 'Não conseguimos salvar. Tente novamente.' }, 503)
  return reply({ preferences })
}
