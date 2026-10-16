import Link from 'next/link'
import { notFound } from 'next/navigation'
import { loadNewsArticles } from '@/lib/news-server'
import { NewsArticleBody } from '@/components/news/NewsArticleBody'
import '@/app/news/news.css'
export const dynamic = 'force-dynamic'
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { articles } = await loadNewsArticles({ slug: params.slug, limit: 1 })
  return { title: articles[0]?.title ?? 'Notícia', alternates: { canonical: `https://legalops.news/noticias/${params.slug}` } }
}
export default async function ClubNewsArticlePage({ params }: { params: { slug: string } }) {
  const { articles, unavailable } = await loadNewsArticles({ slug: params.slug, limit: 1 })
  if (unavailable) return <p className="p-6 text-sm">Notícia indisponível. Tente novamente.</p>
  if (!articles[0]) notFound()
  return <div className="news-site news-club-article"><Link className="news-breadcrumb" href="/community/news">← Notícias no Club</Link><NewsArticleBody article={articles[0]} inClub/></div>
}
