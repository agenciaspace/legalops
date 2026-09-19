import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasActiveClubAccess } from '@/lib/community'
import { validCommentAnchor } from '@/lib/map-comments'
import { mergeMapChanges } from '@/lib/map-diff'
import { MAP_SECTION_IDS, validMapContent } from '@/lib/contract-map'
export const dynamic = 'force-dynamic'
const reply = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } })
async function access() {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return { response: reply({ error: 'Entre na comunidade.' }, 401) }
  const { data: member } = await db.from('community_members').select('club_access_status,club_access_expires_at,display_name').eq('user_id', user.id).maybeSingle()
  if (!hasActiveClubAccess(member)) return { response: reply({ error: 'Complete seu cadastro na comunidade.' }, 403) }
  return { db, user, userName: member?.display_name }
}
export async function GET(request: Request) {
  const project = new URL(request.url).searchParams.get('project') ?? 'migration'
  if (!['migration', 'playbook'].includes(project)) return reply({ error: 'Projeto inválido.' }, 400)
  const accessResult = await access()
  if (accessResult.response) return accessResult.response
  const { db, user } = accessResult
  const { data: sections, error: sectionsError } = await db!.from('contract_map_sections').select('id,title,position,content,version,updated_at,journey').in('journey', project === 'playbook' ? ['open-playbook'] : ['clm-migration', 'contract-lifecycle']).order('position')
  if (sectionsError) return reply({ error: 'Não foi possível carregar o documento.' }, 503)
  const sectionIds = (sections ?? []).map(section => section.id)
  const results = await Promise.all([
    Promise.resolve({ data: sections, error: null }),
    db!.from('contract_map_contributions').select('*').in('section_id', sectionIds).order('created_at', { ascending: false }).limit(500),
    db!.from('contract_map_revisions').select('section_id,version,content,editor_id,note,created_at').in('section_id', sectionIds).order('created_at', { ascending: false }).limit(100),
    db!.from('contract_map_leads').select('user_id').eq('user_id', user!.id),
  ])
  if (results.some(result => result.error)) return reply({ error: 'Não foi possível carregar o mapa.' }, 503)
  const ids = Array.from(new Set([...results[1].data!.flatMap(row => [row.author_id, row.reviewer_id]), ...results[2].data!.map(row => row.editor_id)].filter(Boolean)))
  const { data: authors } = ids.length ? await db!.from('community_members').select('user_id,display_name').in('user_id', ids) : { data: [] }
  return reply({ sections: results[0].data, contributions: results[1].data, revisions: results[2].data, isLead: !!results[3].data?.length, userId: user!.id, userName: accessResult.userName, authors: authors ?? [] })
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
  let reviewedContent = content
  if (action === 'accept' && body.decisions !== undefined) {
    if (!Array.isArray(body.decisions) || body.decisions.length > 300 || body.decisions.some((item: unknown) => typeof item !== 'boolean') || !body.decisions.some(Boolean)) return reply({error:'Escolha quais alterações aceitar.'},400)
    const [original,proposal] = await Promise.all([auth.db!.from('contract_map_sections').select('content,version').eq('id',section).single(), auth.db!.from('contract_map_contributions').select('proposed_content,section_id,base_version').eq('id',id).single()])
    if (original.error || proposal.error || proposal.data.section_id !== section) return reply({error:'Proposta não encontrada.'},404)
    if (original.data.version !== version || proposal.data.base_version !== version) return reply({error:'A etapa mudou. Atualize e revise a proposta novamente.',conflict:true},409)
    try { reviewedContent = mergeMapChanges(original.data.content, proposal.data.proposed_content, body.decisions) } catch {return reply({error:'Revise todas as alterações.'},400)}
    if (!validMapContent(reviewedContent)) return reply({error:'O resultado da revisão precisa conter um documento válido.'},400)
  }
  if (body.mentions !== undefined && (!Array.isArray(body.mentions) || body.mentions.length > 10 || body.mentions.some((id: unknown) => typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)))) return reply({error:'Selecione até 10 membros para mencionar.'},400)
  if (body.quote !== undefined && (typeof body.quote !== 'string' || body.quote.length > 1000)) return reply({error:'Selecione um trecho de até 1.000 caracteres.'},400)
  if (body.parent !== undefined && (typeof body.parent !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.parent))) return reply({error:'Resposta inválida.'},400)
  if (body.anchor !== undefined && (action !== 'comment' || body.parent || !body.quote || !validCommentAnchor(body.anchor))) return reply({error:'Selecione novamente o trecho para comentar.'},400)
  let result
  if (action === 'comment' || action === 'suggest') {
    if (action === 'suggest' && body.license !== true) return reply({ error: 'Confirme a publicação sob licença MIT.' }, 400)
    if (body.anchor) result = await auth.db!.rpc('contract_map_comment_anchor', { p_section: section, p_body: note.trim(), p_version: version, p_quote: body.quote, p_anchor: body.anchor, p_parent: null, p_mentions: body.mentions ?? [] })
    else result = await auth.db!.rpc('contract_map_submit', { p_section: section, p_kind: action === 'comment' ? 'comment' : 'suggestion', p_body: note.trim(), p_version: version, p_content: action === 'suggest' ? content : null, p_license: body.license === true, p_quote: body.quote || null, p_parent: body.parent || null, p_mentions: body.mentions ?? [] })
  } else if (action === 'publish' || action === 'accept') {
    result = await auth.db!.rpc('contract_map_publish_notify', { p_section: section, p_version: version, p_content: reviewedContent, p_note: note.trim(), p_contribution: action === 'accept' ? id : null, p_mentions: body.mentions ?? [] })
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
  return reply({ ok: true, ...((action === 'comment' || action === 'suggest') ? { id: result.data } : {}) })
}
