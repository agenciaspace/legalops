import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasActiveClubAccess } from '@/lib/community'
import { MAP_SECTION_IDS, validMapContent } from '@/lib/contract-map'
export const dynamic = 'force-dynamic'
const reply = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } })
async function access() {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { response: reply({ error: 'Entre na comunidade.' }, 401) }
  const { data: member } = await db.from('community_members').select('club_access_status,club_access_expires_at').eq('user_id', user.id).maybeSingle()
  if (!hasActiveClubAccess(member)) return { response: reply({ error: 'Complete seu cadastro na comunidade.' }, 403) }
  return { db, user }
}
export async function GET() {
  const accessResult = await access()
  if (accessResult.response) return accessResult.response
  const { db, user } = accessResult
  const results = await Promise.all([
    db!.from('contract_map_sections').select('id,title,position,content,version,updated_at,journey').order('position'),
    db!.from('contract_map_contributions').select('*').order('created_at', { ascending: false }).limit(500),
    db!.from('contract_map_revisions').select('section_id,version,content,editor_id,note,created_at').order('created_at', { ascending: false }).limit(100),
    db!.from('contract_map_leads').select('user_id').eq('user_id', user!.id),
  ])
  if (results.some(result => result.error)) return reply({ error: 'Não foi possível carregar o mapa.' }, 503)
  const ids = Array.from(new Set([...results[1].data!.flatMap(row => [row.author_id, row.reviewer_id]), ...results[2].data!.map(row => row.editor_id)].filter(Boolean)))
  const { data: authors } = ids.length ? await db!.from('community_members').select('user_id,display_name').in('user_id', ids) : { data: [] }
  return reply({ sections: results[0].data, contributions: results[1].data, revisions: results[2].data, isLead: !!results[3].data?.length, userId: user!.id, authors: authors ?? [] })
}
export async function POST(request: Request) {
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin && !['https://legalops.club','https://www.legalops.club'].includes(request.headers.get('origin')!)) return reply({ error: 'Origem inválida.' }, 403)
  const auth = await access()
  if (auth.response) return auth.response
  const raw = await request.text()
  if (raw.length > 70000) return reply({ error: 'Sua proposta é muito longa.' }, 413)
  let body
  try { body = JSON.parse(raw) } catch { return reply({ error: 'Dados inválidos.' }, 400) }
  if (!body || typeof body !== 'object') return reply({ error: 'Dados inválidos.' }, 400)
  const { action, section, version, content, note, id } = body
  const isReview = action === 'review'
  if ((!isReview && (!MAP_SECTION_IDS.includes(section) || !Number.isInteger(version) || version < 1)) || typeof note !== 'string' || note.trim().length < 3 || note.length > (action === 'comment' || action === 'suggest' ? 4000 : 1000)) return reply({ error: 'Escolha uma etapa e explique sua contribuição.' }, 400)
  if (['suggest','publish','accept'].includes(action) && !validMapContent(content)) return reply({ error: 'Revise o texto da proposta.' }, 400)
  if ((action === 'accept' || isReview) && (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id))) return reply({ error: 'Contribuição inválida.' }, 400)
  let result
  if (action === 'comment' || action === 'suggest') {
    if (action === 'suggest' && body.license !== true) return reply({ error: 'Confirme a publicação sob licença MIT.' }, 400)
    result = await auth.db!.rpc('contract_map_contribute', { p_section: section, p_kind: action === 'comment' ? 'comment' : 'suggestion', p_body: note.trim(), p_version: version, p_content: action === 'suggest' ? content : null, p_license: body.license === true })
  } else if (action === 'publish' || action === 'accept') {
    result = await auth.db!.rpc('contract_map_publish', { p_section: section, p_version: version, p_content: content, p_note: note.trim(), p_contribution: action === 'accept' ? id : null })
  } else if (isReview && ['rejected','resolved'].includes(body.status)) {
    result = await auth.db!.rpc('contract_map_review', { p_id: id, p_status: body.status, p_note: note.trim() })
  } else return reply({ error: 'Ação inválida.' }, 400)
  if (result.error) {
    const message = result.error.message
    if (message.includes('VERSION_CONFLICT')) return reply({ error: 'Esta etapa mudou. Seu texto foi preservado: atualize o mapa e compare com a versão publicada antes de enviar novamente.', conflict: true }, 409)
    if (message.includes('LEAD_REQUIRED') || message.includes('MEMBERSHIP_REQUIRED')) return reply({ error: 'Seu perfil não tem permissão para esta ação.' }, 403)
    if (message.includes('DAILY_LIMIT')) return reply({ error: 'Limite de 50 contribuições por dia atingido.' }, 429)
    return reply({ error: 'Não foi possível salvar. Confira os dados e atualize o mapa.' }, 400)
  }
  return reply({ ok: true })
}
