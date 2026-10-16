import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { isLegalOpsAdminEmail } from '@/lib/legalops-admin'
import { newsSameOrigin, readNewsJson } from '@/lib/news-http'
import { parseNewsArticle } from '@/lib/news'

export const dynamic = 'force-dynamic'
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
async function authorized() {
  const db = await createServerSupabaseClient()
  const { data: { user } } = await db.auth.getUser()
  return Boolean(user && isLegalOpsAdminEmail(user.email))
}
export async function GET() {
  if (!await authorized()) return reply({ error: 'Acesso restrito à redação.' }, 403)
  const admin = createAdminClient()
  const [articles, candidates, pending] = await Promise.all([
    admin.from('news_articles').select('*').order('created_at', { ascending: false }).limit(100),
    admin.from('news_candidates').select('*').eq('status', 'pending').order('discovered_at', { ascending: false }).limit(40),
    admin.from('news_email_signups').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])
  if (articles.error || candidates.error || pending.error) return reply({ error: 'Não conseguimos carregar a redação.' }, 503)
  return reply({ articles: articles.data, candidates: candidates.data, pendingSubscriptions: pending.count ?? 0 })
}
export async function POST(request: NextRequest) {
  if (!newsSameOrigin(request) || !await authorized()) return reply({ error: 'Acesso restrito à redação.' }, 403)
  try {
    const input = await readNewsJson(request, 50000) as Record<string, unknown>
    const admin = createAdminClient()
    if (input.action === 'dismiss_candidate') {
      if (typeof input.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(input.id)) return reply({ error: 'Pauta inválida.' }, 400)
      const { error } = await admin.from('news_candidates').update({ status: 'dismissed' }).eq('id', input.id)
      return error ? reply({ error: 'Não conseguimos arquivar a pauta.' }, 503) : reply({ saved: true })
    }
    let article
    try { article = parseNewsArticle(input) } catch (cause) { return reply({ error: cause instanceof Error ? cause.message : 'Confira a matéria.' }, 400) }
    const now = new Date().toISOString()
    const id = typeof input.id === 'string' && /^[a-f0-9-]{36}$/i.test(input.id) ? input.id : null
    let publishedAt = article.status === 'published' ? now : null
    if (id) {
      const { data: existing, error } = await admin.from('news_articles').select('published_at').eq('id', id).maybeSingle()
      if (error) return reply({ error: 'Não conseguimos verificar a matéria.' }, 503)
      if (!existing) return reply({ error: 'Matéria não encontrada.' }, 404)
      if (article.status === 'published') publishedAt = existing.published_at ?? now
    }
    const record = { ...article, published_at: publishedAt, updated_at: now }
    const result = id ? await admin.from('news_articles').update(record).eq('id', id).select('id,slug').single() : await admin.from('news_articles').insert(record).select('id,slug').single()
    if (result.error) return reply({ error: result.error.code === '23505' ? 'Já existe uma matéria com esse endereço.' : 'Não conseguimos salvar a matéria.' }, 409)
    if (article.status === 'published') {
      const { error } = await admin.from('news_candidates').update({ status: 'published' }).in('url', article.sources.map(source => source.url))
      if (error) console.error('news_candidate_link_failed')
    }
    return reply({ article: result.data, status: article.status })
  } catch { return reply({ error: 'Não conseguimos processar a matéria. Confira os campos e tente novamente.' }, 400) }
}
