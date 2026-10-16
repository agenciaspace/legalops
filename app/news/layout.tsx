import type { Metadata } from 'next'
import Link from 'next/link'
import { BrandWordmark } from '@/components/BrandLogo'
import { NEWS_AUDIENCES } from '@/lib/news'
import { newsBasePath } from '@/lib/news-links'
import './news.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://legalops.news'),
  title: { default: 'legalops.news | o que está mudando no trabalho jurídico', template: '%s | legalops.news' },
  description: 'Notícias e análises sobre tecnologia, operações e negócios para escritórios, departamentos jurídicos e prestadores de serviços.',
  openGraph: { siteName: 'legalops.news', locale: 'pt_BR', type: 'website' },
  alternates: { types: { 'application/rss+xml': 'https://legalops.news/feed.xml' } },
}
export default function NewsLayout({ children }: { children: React.ReactNode }) {
  const base = newsBasePath()
  return <div className="news-site">
    <a href="#news-content" className="sr-only focus:not-sr-only">Ir para o conteúdo</a>
    <header className="news-topbar"><div className="news-wrap news-topbar-inner">
      <Link href={base || '/'} aria-label="Página inicial do legalops.news"><BrandWordmark suffix="news" className="inline-flex items-baseline text-[32px] leading-none"/></Link>
      <nav className="news-ecosystem" aria-label="Ecossistema legalops"><Link className="news-active" href={base || '/'}>notícias</Link><a href="https://legalops.club">comunidade ↗</a><a href="https://legalops.work">vagas ↗</a><a href="https://legalops.dev">open source ↗</a></nav>
    </div></header>
    <div className="news-wrap"><div className="news-edition"><span>legalops.news / uma publicação do legalops.club</span><a href={`${base || '/'}#newsletter`}>Receber por email ↗</a></div>
      <nav className="news-nav" aria-label="Seções de notícias"><Link href={base || '/'}>Últimas</Link>{Object.entries(NEWS_AUDIENCES).map(([key, audience]) => <Link key={key} href={`${base}/${key}`}>{audience.label}</Link>)}<Link href={`${base}/sobre`}>Sobre</Link></nav>
      <main id="news-content">{children}</main>
      <footer className="news-footer"><div><BrandWordmark suffix="news" className="inline-flex items-baseline text-[24px] leading-none"/><p className="mt-3">Notícias com contexto para quem organiza, contrata e entrega o trabalho jurídico. Parte do ecossistema legalops.club.</p></div><nav className="news-footer-links" aria-label="Informações da publicação"><Link href={`${base}/sobre`}>Sobre a publicação</Link><Link href={`${base}/privacidade`}>Privacidade</Link><a href={`${base}/feed.xml`}>RSS ↗</a><a href="mailto:hi@legalops.club">Fale com a redação ↗</a></nav></footer>
    </div>
  </div>
}
