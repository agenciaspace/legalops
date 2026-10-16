import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { formatNewsDate, type NewsArticle, type NewsPreferences } from '@/lib/news'

export async function ClubNewsDigest({ userId }: { userId: string }) {
  const db = await createServerSupabaseClient()
  const { data } = await db.from('news_preferences').select('enabled,audiences,topics').eq('user_id', userId).maybeSingle()
  const preferences = data as NewsPreferences | null
  if (!preferences?.enabled) return null
  let query = db.from('news_articles').select('id,slug,title,summary,published_at').eq('status', 'published').lte('published_at', new Date().toISOString())
  if (preferences.audiences.length) query = query.overlaps('audiences', preferences.audiences)
  if (preferences.topics.length) query = query.overlaps('topics', preferences.topics)
  const { data: articles, error } = await query.order('published_at', { ascending: false }).order('id', { ascending: true }).limit(3)
  return <section aria-label="Notícias para você" className="mb-5 rounded-lg border border-[#CEC8BD] bg-[#FAF7F1] p-4 sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-semibold">Notícias para você</h2><Link href="/community/news#preferences" className="inline-flex min-h-11 items-center text-xs font-semibold text-[#A94E38] underline underline-offset-4">Minhas preferências</Link></div>
    {error ? <p className="text-sm text-[#69635E]">As notícias estão indisponíveis agora. Tente novamente mais tarde.</p> : articles?.length ? <div className="divide-y divide-[#E6DED0]">{(articles as NewsArticle[]).map(article => <article key={article.id} className="py-3"><p className="text-xs text-[#69635E]">legalops.news · {formatNewsDate(article.published_at!)}</p><Link href={`/community/news/${article.slug}`} className="mt-1 inline-block text-base font-semibold leading-6 hover:underline">{article.title}</Link><p className="mt-1 text-sm leading-6 text-[#69635E]">{article.summary}</p></article>)}</div> : <p className="py-3 text-sm text-[#69635E]">Ainda não há notícias para sua seleção. Novas publicações aparecerão aqui automaticamente.</p>}
    <Link href="/community/news" className="inline-flex min-h-11 items-center text-sm font-semibold">Todas as notícias →</Link>
  </section>
}
