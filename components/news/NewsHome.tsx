import Link from 'next/link'
import { ArrowDown, ArrowUpRight, Search } from 'lucide-react'
import { NEWS_AUDIENCES, NEWS_TOPICS, formatNewsDate, isNewsTopic, type NewsAudience } from '@/lib/news'
import { loadNewsArticles } from '@/lib/news-server'
import { newsBasePath } from '@/lib/news-links'
import { beehiivConfigured } from '@/lib/news-beehiiv'
import { NewsSignup } from './NewsSignup'
import { NewsCover } from './NewsCover'

export async function NewsHome({ audience, searchParams }: { audience?: NewsAudience; searchParams?: { assunto?: string; q?: string } }) {
  const base = newsBasePath()
  const topic = isNewsTopic(searchParams?.assunto) ? searchParams.assunto : undefined
  const { articles: all, unavailable } = await loadNewsArticles({ audience, topic })
  const search = (searchParams?.q ?? '').trim().slice(0, 100)
  const articles = search ? all.filter(article => `${article.title} ${article.summary}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))) : all
  const section = audience ? NEWS_AUDIENCES[audience] : null
  const indexPath = `${base}${audience ? `/${audience}` : ''}` || '/'
  return <>
    <section className="news-hero">
      <div><p className="news-kicker">{section ? `a leitura para / ${section.label}` : 'tecnologia, operações & negócios'}</p><h1>{section ? section.label.toLowerCase() : <>o trabalho jurídico,<br/><span>em pauta.</span></>}</h1></div>
      <div className="news-hero-note"><span className="news-editorial-symbol" aria-hidden="true">✳</span><p>{section ? section.description : 'O mercado muda. A gente conecta os pontos para você entender o que isso tem a ver com o seu trabalho.'}</p><a href="#publicacoes">Comece a leitura <ArrowDown size={15}/></a></div>
    </section>
    <section className="news-archive" id="publicacoes" aria-label="Publicações">
      <div className="news-archive-heading"><div><p className="news-kicker">o que está acontecendo</p><h2>últimas publicações<span>.</span></h2></div><span className="news-archive-count">{articles.length} {articles.length === 1 ? 'leitura' : 'leituras'}{search || topic ? ' nesta seleção' : ' no radar'}</span></div>
      <form action={indexPath} className="news-search"><Search size={19} aria-hidden="true"/><label className="sr-only" htmlFor="news-search">Buscar notícias</label><input id="news-search" name="q" defaultValue={search} maxLength={100} placeholder="Uma pauta, uma empresa, um assunto…"/>{topic && <input type="hidden" name="assunto" value={topic}/>}<button type="submit">Buscar <ArrowUpRight size={15}/></button></form>
      <nav className="news-topics" aria-label="Filtrar por assunto"><Link aria-current={!topic ? 'page' : undefined} href={indexPath}>Todos os assuntos</Link>{Object.entries(NEWS_TOPICS).map(([key, label]) => <Link key={key} aria-current={topic === key ? 'page' : undefined} href={`${indexPath}?assunto=${key}`}>{label}</Link>)}</nav>
      {unavailable ? <p role="status" className="news-empty">Não conseguimos carregar as notícias agora. <Link href={indexPath}>Tentar novamente →</Link></p> : articles.length ? <div className={`news-archive-grid${articles.length <= 4 ? ' news-archive-compact' : ''}`}>
        {articles.map(article => <article className="news-publication" key={article.id}>
          <Link href={`${base}/noticias/${article.slug}`} className="news-publication-link" aria-labelledby={`news-title-${article.id}`}>
            <div className="news-publication-cover"><NewsCover topic={article.topics[0]} seed={article.slug}/>{article.featured && <span className="news-featured-label">EM DESTAQUE</span>}</div>
            <div className="news-publication-copy"><div className="news-publication-meta"><span>{NEWS_TOPICS[article.topics[0]]}</span><time dateTime={article.published_at!}>{formatNewsDate(article.published_at!)}</time></div><h3 id={`news-title-${article.id}`}>{article.title}</h3><p>{article.summary}</p><div className="news-publication-bottom"><span>{Math.max(1, Math.ceil(article.body.split(/\s+/).length / 200))} min de leitura</span><span className="news-read-link">Ler a matéria <ArrowUpRight size={16}/></span></div></div>
          </Link>
        </article>)}
      </div> : <p className="news-empty">{search || topic ? 'Nenhuma notícia encontrada para esta seleção.' : 'As primeiras notícias desta seção estão em preparação.'} <Link href={indexPath}>Ver todos os assuntos →</Link></p>}
    </section>
    {!audience && <section className="news-section news-perspectives"><div className="news-section-title"><div><p className="news-kicker">o mesmo fato. outros ângulos.</p><h2>o que muda para você?</h2></div></div><div className="news-audiences">{Object.entries(NEWS_AUDIENCES).map(([key, value], index) => <div key={key}><span className="news-audience-number">0{index + 1}</span><h3>{value.label}</h3><p>{value.question}</p><Link href={`${base}/${key}`}>Acompanhar esta seção <ArrowUpRight size={15}/></Link></div>)}</div></section>}
    <section className="news-newsletter" id="newsletter"><div><p className="news-kicker">para não perder o fio</p><h2>uma boa leitura.<br/>um próximo passo.</h2><p>Uma seleção comentada sobre o que está mudando no trabalho jurídico. Você também pode acompanhar as publicações no <a href="https://legalops.club/community/news">Club ↗</a>.</p></div><NewsSignup connected={beehiivConfigured()}/></section>
  </>
}
