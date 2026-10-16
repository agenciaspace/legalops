import { createClient } from '@supabase/supabase-js'
import type { NewsArticle } from './news'

export async function loadNewsArticles(options: { audience?: string; topic?: string; slug?: string; limit?: number } = {}) {
  // Public reads use the public key and published-only RLS, never service role.
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false }, global: { fetch: (url, init) => fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(8000) }) } })
  let query = db.from('news_articles').select('*').eq('status', 'published').lte('published_at', new Date().toISOString())
  if (options.audience) query = query.contains('audiences', [options.audience])
  if (options.topic) query = query.contains('topics', [options.topic])
  if (options.slug) query = query.eq('slug', options.slug)
  const { data, error } = await query.order('published_at', { ascending: false }).order('id', { ascending: true }).limit(options.limit ?? 60)
  return { articles: (data ?? []) as NewsArticle[], unavailable: Boolean(error) }
}
