import { notFound } from 'next/navigation'
import Link from 'next/link'
import { loadNewsArticles } from '@/lib/news-server'
import { newsBasePath } from '@/lib/news-links'
import { NewsArticleBody } from '@/components/news/NewsArticleBody'
export const dynamic = 'force-dynamic'
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { articles } = await loadNewsArticles({ slug: params.slug, limit: 1 })
  const article = articles[0]
  return article ? { title: article.title, description: article.summary, alternates: { canonical: `https://legalops.news/noticias/${article.slug}` }, openGraph: { type: 'article', title: article.title, description: article.summary, publishedTime: article.published_at } } : { title: 'Notícia não encontrada', robots: { index: false } }
}
export default async function NewsArticlePage({ params }: { params: { slug: string } }) {
  const { articles, unavailable } = await loadNewsArticles({ slug: params.slug, limit: 1 })
  if (unavailable) return <p className="news-empty">A notícia está indisponível agora. Tente novamente mais tarde.</p>
  if (!articles[0]) notFound()
  return <><Link className="news-breadcrumb" href={newsBasePath() || '/'}>← Todas as notícias</Link><NewsArticleBody article={articles[0]}/></>
}
