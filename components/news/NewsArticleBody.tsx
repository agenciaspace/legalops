import { newsImages } from '@/lib/news-images'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { NEWS_AUDIENCES, NEWS_TOPICS, formatNewsDate, type NewsArticle, safeNewsSource } from '@/lib/news'

export function NewsArticleBody({ article, inClub = false }: { article: NewsArticle; inClub?: boolean }) {
  const photo = newsImages[article.slug]
  const sources = article.sources.filter(safeNewsSource)
  return <article className="news-article">
    <div className="news-kicker">{article.topics.map(topic => NEWS_TOPICS[topic]).join(' / ')}</div>
    <h1>{article.title}</h1>
    <p className="news-standfirst">{article.summary}</p>
    <div className="news-byline"><span>{article.author_name}</span><time dateTime={article.published_at!}>Publicado em {formatNewsDate(article.published_at!)}</time>{article.event_date && <span>Fato de {formatNewsDate(article.event_date)}</span>}</div>
    {photo && <figure className="news-article-photo"><img src={photo.src} alt={photo.alt} width={1200} height={750}/><figcaption>{photo.credit} {photo.sources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.name} ↗ </a>)}</figcaption></figure>}
    <div className="news-prose"><ReactMarkdown allowedElements={['p','h2','h3','ul','ol','li','strong','em','a','blockquote','hr','code']} components={{ a: ({ href, children }) => href?.startsWith('https://') ? <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> : <span>{children}</span> }}>{article.body}</ReactMarkdown></div>
    <section className="news-impact"><p className="news-kicker">a leitura para o seu trabalho</p>{article.audiences.map(audience => article.impact[audience] && <div key={audience}><h2>{NEWS_AUDIENCES[audience].label}</h2><p>{article.impact[audience]}</p></div>)}</section>
    <section className="news-sources"><h2>Fontes e apuração</h2><p>As funcionalidades e os resultados anunciados são atribuídos às fontes. Os impactos acima são análise editorial do legalops.news.</p>{sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.title} ↗</a>)}<p>Encontrou algo a corrigir? <a href={`mailto:hi@legalops.club?subject=${encodeURIComponent(`Correção: ${article.title}`)}`}>Avise a redação</a>.</p></section>
    <section className="news-discuss"><p className="news-kicker">continue a conversa</p><h2>Como essa mudança chega ao seu trabalho?</h2><p>Compare experiências e leve suas dúvidas à comunidade.</p><Link href={inClub ? '/community?space=ia-automacao' : 'https://legalops.club/community?space=ia-automacao'}>Conversar no Club →</Link></section>
  </article>
}
