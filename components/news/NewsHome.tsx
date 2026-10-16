import Link from 'next/link'
import { NEWS_AUDIENCES, NEWS_TOPICS, formatNewsDate, isNewsTopic, type NewsAudience } from '@/lib/news'
import { loadNewsArticles } from '@/lib/news-server'
import { newsBasePath } from '@/lib/news-links'
import { beehiivConfigured } from '@/lib/news-beehiiv'
import { NewsSignup } from './NewsSignup'

export async function NewsHome({ audience, searchParams }: { audience?: NewsAudience; searchParams?: { assunto?: string; q?: string } }) {
  const base = newsBasePath()
  const topic = isNewsTopic(searchParams?.assunto) ? searchParams.assunto : undefined
  const { articles: all, unavailable } = await loadNewsArticles({ audience, topic })
  const search = (searchParams?.q ?? '').trim().slice(0, 100)
  const articles = search ? all.filter(article => `${article.title} ${article.summary}`.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))) : all
  const featured = articles.find(article => article.featured) ?? articles[0]
  const briefs = articles.filter(article => article.id !== featured?.id).slice(0, 3)
  const section = audience ? NEWS_AUDIENCES[audience] : null
  const indexPath = `${base}${audience ? `/${audience}` : ''}` || '/'
  return <>
    <section className="news-hero"><p className="news-kicker">{section ? `notícias / ${section.label}` : 'tecnologia · operações · negócios'}</p><h1>{section ? section.label.toLowerCase() : <>o que está mudando<br/>no trabalho jurídico.</>}</h1><p>{section ? section.description : 'As mudanças que importam, com contexto para o seu trabalho. Cobertura internacional, um olhar para o Brasil e a conversa que continua no Club.'}</p></section>
    <nav className="news-topics" aria-label="Filtrar por assunto"><Link aria-current={!topic ? 'page' : undefined} href={indexPath}>Todos os assuntos</Link>{Object.entries(NEWS_TOPICS).map(([key, label]) => <Link key={key} aria-current={topic === key ? 'page' : undefined} href={`${indexPath}?assunto=${key}`}>{label}</Link>)}</nav>
    {unavailable ? <p role="status" className="news-empty">Não conseguimos carregar as notícias agora. <Link href={indexPath}>Tentar novamente →</Link></p> : featured ? <section className="news-front" aria-label="Destaques">
      <article className="news-feature"><div><p className="news-kicker">em destaque / {NEWS_TOPICS[featured.topics[0]]}</p><Link href={`${base}/noticias/${featured.slug}`}><h2>{featured.title}</h2></Link><p>{featured.summary}</p><div className="news-feature-meta"><time dateTime={featured.published_at!}>{formatNewsDate(featured.published_at!)}</time><span>{featured.audiences.map(item => NEWS_AUDIENCES[item].label).join(' · ')}</span></div><Link className="news-feature-link" href={`${base}/noticias/${featured.slug}`}>Entenda o que muda <span>↗</span></Link></div><div className="news-feature-context"><strong>Por que acompanhar</strong><p>{featured.impact[audience ?? 'departamentos-juridicos'] ?? Object.values(featured.impact)[0]}</p></div></article>
      <div className="news-briefs"><h2>no radar</h2>{briefs.length ? briefs.map(article => <article className="news-brief" key={article.id}><p className="news-kicker">{NEWS_TOPICS[article.topics[0]]}</p><Link href={`${base}/noticias/${article.slug}`}><h3>{article.title}</h3></Link><p>{article.summary}</p><time dateTime={article.published_at!}>{formatNewsDate(article.published_at!)}</time></article>) : <p className="news-empty">Novas pautas serão publicadas aqui.</p>}</div>
    </section> : <p className="news-empty">{search || topic ? 'Nenhuma notícia encontrada para esta seleção.' : 'As primeiras notícias desta seção estão em preparação.'} <Link href={indexPath}>Ver todos os assuntos →</Link></p>}
    {!audience && <section className="news-section"><div className="news-section-title"><h2>o mercado, pelo seu ponto de vista.</h2></div><div className="news-audiences">{Object.entries(NEWS_AUDIENCES).map(([key, value]) => <div key={key}><h3>{value.label}</h3><p>{value.question}</p><Link href={`${base}/${key}`}>Acompanhar esta seção →</Link></div>)}</div></section>}
    <section className="news-newsletter" id="newsletter"><div><p className="news-kicker">no seu email</p><h2>as mudanças da semana.<br/>o contexto que faz falta.</h2><p>Uma seleção comentada para acompanhar o mercado e decidir o próximo passo. Você também pode receber as notícias dentro do <a href="https://legalops.club/community/news" className="underline underline-offset-4">Club</a>.</p></div><NewsSignup connected={beehiivConfigured()}/></section>
    <section className="news-section"><div className="news-section-title"><h2>{section ? `Mais para ${section.label.toLowerCase()}` : 'todas as notícias'}</h2><a href="https://legalops.club/community/news">Acompanhar no Club ↗</a></div>
      <form action={indexPath} className="mb-3 flex gap-2"><label className="sr-only" htmlFor="news-search">Buscar notícias</label><input id="news-search" name="q" defaultValue={search} maxLength={100} placeholder="Buscar nas notícias" className="min-h-11 min-w-0 flex-1 rounded-lg border border-[#CEC8BD] bg-[#FAF7F1] px-3 text-sm"/>{topic && <input type="hidden" name="assunto" value={topic}/>}<button className="min-h-11 rounded-lg border border-[#CEC8BD] px-4 text-xs font-semibold">Buscar</button></form>
      <div className="news-list">{articles.map(article => <article key={article.id}><p className="news-kicker">{NEWS_TOPICS[article.topics[0]]}</p><Link href={`${base}/noticias/${article.slug}`}><h3>{article.title}</h3></Link><p>{article.summary}</p><time dateTime={article.published_at!}>{formatNewsDate(article.published_at!)}</time></article>)}</div>
    </section>
  </>
}
