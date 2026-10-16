import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NEWS_AUDIENCES, NEWS_TOPICS, formatNewsDate, isNewsAudience, isNewsTopic, type NewsArticle } from '@/lib/news'
import { NewsPreferencesForm } from '@/components/news/NewsPreferencesForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Notícias | legalops.club' }
export default async function ClubNewsPage({ searchParams }: { searchParams?: { publico?: string; assunto?: string } }) {
  const db = await createServerSupabaseClient()
  let query = db.from('news_articles').select('*').eq('status', 'published').lte('published_at', new Date().toISOString())
  if (isNewsAudience(searchParams?.publico)) query = query.contains('audiences', [searchParams.publico])
  if (isNewsTopic(searchParams?.assunto)) query = query.contains('topics', [searchParams.assunto])
  const { data, error } = await query.order('published_at', { ascending: false }).order('id', { ascending: true }).limit(50)
  return <div className="mx-auto max-w-[980px] px-4 py-6 sm:px-6"><p className="text-xs font-semibold uppercase tracking-widest text-[#A94E38]">legalops.news / no Club</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">O que está mudando no trabalho jurídico</h1><p className="mt-3 text-sm leading-6 text-[#69635E]">Notícias com fontes e contexto para o seu trabalho. As publicações do legalops.news chegam a esta área automaticamente.</p>
    <form className="my-5 flex flex-wrap gap-3"><label className="text-xs">Público<select name="publico" defaultValue={searchParams?.publico ?? ''} className="mt-2 block min-h-11 rounded-lg border border-[#CEC8BD] bg-white px-3 text-sm"><option value="">Todos os públicos</option>{Object.entries(NEWS_AUDIENCES).map(([key,value])=><option key={key} value={key}>{value.label}</option>)}</select></label><label className="text-xs">Assunto<select name="assunto" defaultValue={searchParams?.assunto ?? ''} className="mt-2 block min-h-11 rounded-lg border border-[#CEC8BD] bg-white px-3 text-sm"><option value="">Todos os assuntos</option>{Object.entries(NEWS_TOPICS).map(([key,value])=><option key={key} value={key}>{value}</option>)}</select></label><button className="min-h-11 self-end rounded-lg bg-[#24231F] px-4 text-sm font-semibold text-white">Filtrar</button></form>
    <div className="divide-y divide-[#CEC8BD]">{error ? <p className="py-6 text-sm" role="status">Não conseguimos carregar as notícias. Tente novamente.</p> : data?.length ? (data as NewsArticle[]).map(article => <article key={article.id} className="py-5"><p className="text-xs text-[#A94E38]">{article.topics.map(topic => NEWS_TOPICS[topic]).join(' · ')} · {formatNewsDate(article.published_at!)}</p><Link href={`/community/news/${article.slug}`} className="mt-2 block text-xl font-semibold tracking-tight hover:underline">{article.title}</Link><p className="mt-2 text-sm leading-7 text-[#69635E]">{article.summary}</p><p className="mt-2 text-xs text-[#69635E]">{article.audiences.map(audience => NEWS_AUDIENCES[audience].label).join(' · ')}</p></article>) : <p className="py-6 text-sm text-[#69635E]">Ainda não há notícias para essa seleção.</p>}</div>
    <div id="preferences" className="scroll-mt-20"><NewsPreferencesForm/></div>
  </div>
}
