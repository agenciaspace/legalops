import type { Metadata } from 'next'
import Link from 'next/link'
import { BrandWordmark } from '@/components/BrandLogo'
import { NEWS_AUDIENCES } from '@/lib/news'
import { newsBasePath } from '@/lib/news-links'
import './news.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://legalops.news'),
  title: { default: 'legalops.news | o trabalho jurídico, em pauta', template: '%s | legalops.news' },
  description: 'Tecnologia, operações e negócios. Uma leitura do que muda no trabalho jurídico para escritórios, departamentos jurídicos e prestadores.',
  openGraph: { siteName: 'legalops.news', locale: 'pt_BR', type: 'website' },
  alternates: { types: { 'application/rss+xml': 'https://legalops.news/feed.xml' } },
}
export default function NewsLayout({ children }: { children: React.ReactNode }) {
  const base = newsBasePath()
  const date = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' }).format(new Date())
  return <div className="news-site">
    <a href="#news-content" className="news-skip">Ir para o conteúdo</a>
    <div className="news-utility"><div className="news-wrap"><span>uma leitura do trabalho jurídico.</span><nav aria-label="Ecossistema legalops"><a href="https://legalops.club">club ↗</a><a href="https://legalops.work">work ↗</a><a href="https://legalops.dev">dev ↗</a></nav></div></div>
    <header className="news-masthead news-wrap"><div className="news-masthead-top"><span>NOTÍCIAS / CONTEXTO / PRÓXIMOS PASSOS</span><a href={`${base || '/'}#newsletter`}>Acompanhe a publicação ↗</a></div>
      <Link href={base || '/'} aria-label="Página inicial do legalops.news" className="news-nameplate"><BrandWordmark suffix="news" className="news-wordmark"/></Link>
      <div className="news-edition"><span>uma publicação do ecossistema legalops</span><span>{date}</span></div>
      <nav className="news-nav" aria-label="Seções de notícias"><Link href={base || '/'}>Últimas</Link>{Object.entries(NEWS_AUDIENCES).map(([key, audience]) => <Link key={key} href={`${base}/${key}`}>{audience.label}</Link>)}<Link href={`${base}/sobre`}>Sobre</Link></nav>
    </header>
    <div className="news-wrap"><main id="news-content">{children}</main>
      <footer className="news-footer"><div><BrandWordmark suffix="news" className="inline-flex items-baseline text-[28px] leading-none"/><p>O mercado muda. A leitura continua.<br/>Tecnologia, operações e negócios para quem faz o trabalho jurídico acontecer.</p></div><nav className="news-footer-links" aria-label="Informações da publicação"><Link href={`${base}/sobre`}>Sobre a publicação</Link><Link href={`${base}/privacidade`}>Privacidade</Link><a href={`${base}/feed.xml`}>RSS ↗</a><a href="mailto:hi@legalops.club">Fale com a redação ↗</a></nav></footer>
    </div>
  </div>
}
