import { loadNewsArticles } from '@/lib/news-server'
export const dynamic = 'force-dynamic'
export async function GET() {
  const { articles, unavailable } = await loadNewsArticles()
  if (unavailable) return new Response('Sitemap temporariamente indisponível.', { status: 503 })
  const paths = ['', '/escritorios', '/departamentos-juridicos', '/prestadores', '/sobre', '/privacidade', ...articles.map(article => `/noticias/${article.slug}`)]
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>https://legalops.news${path}</loc></url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=60' } })
}
