import { loadNewsArticles } from '@/lib/news-server'
import { newsXml } from '@/lib/news-xml'
export const dynamic = 'force-dynamic'
export async function GET() {
  const { articles, unavailable } = await loadNewsArticles({ limit: 50 })
  if (unavailable) return new Response('Feed temporariamente indisponível.', { status: 503 })
  const items = articles.map(article => `<item><title>${newsXml(article.title)}</title><link>https://legalops.news/noticias/${article.slug}</link><guid isPermaLink="true">https://legalops.news/noticias/${article.slug}</guid><description>${newsXml(article.summary)}</description><pubDate>${new Date(article.published_at!).toUTCString()}</pubDate></item>`).join('')
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>legalops.news</title><link>https://legalops.news</link><description>O que está mudando no trabalho jurídico.</description><language>pt-BR</language>${items}</channel></rss>`, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=60' } })
}
