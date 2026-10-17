import type { NewsArticle } from './news'

export type NewsWhatsappConfig = { instanceUrl: string; token: string; groupId: string }
export function newsWhatsappConfig(): NewsWhatsappConfig | null {
  if (process.env.NEWS_WHATSAPP_ENABLED !== 'true') return null
  const instanceUrl = process.env.NEWS_WHATSAPP_INSTANCE_URL?.replace(/\/+$/, '')
  const token = process.env.NEWS_WHATSAPP_INSTANCE_TOKEN
  const groupId = process.env.NEWS_WHATSAPP_GROUP_ID
  if (!instanceUrl || !token || !/^\d+(?:-\d+)?@g\.us$/.test(groupId ?? '')) return null
  try {
    const url = new URL(instanceUrl)
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return null
  } catch { return null }
  return { instanceUrl, token, groupId: groupId! }
}

const plain = (value: string) => value.replace(/[\u0000-\u001f\u007f*_~`{}]/g, ' ').replace(/\s+/g, ' ').trim()
export function newsWhatsappMessage(article: Pick<NewsArticle, 'title' | 'summary' | 'slug'>) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug)) throw new Error('invalid_article_slug')
  return `*legalops.news*\n\n*${plain(article.title).slice(0, 200)}*\n\n${plain(article.summary).slice(0, 600)}\n\nLeia a matéria e as fontes:\nhttps://legalops.news/noticias/${article.slug}`
}

export async function sendNewsWhatsapp(config: NewsWhatsappConfig, deliveryId: string, article: Pick<NewsArticle, 'title' | 'summary' | 'slug'>) {
  try {
    const response = await fetch(`${config.instanceUrl}/send/text`, {
      method: 'POST', redirect: 'error', headers: { token: config.token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: config.groupId, text: newsWhatsappMessage(article), linkPreview: true, readchat: false, track_source: 'legalops.news', track_id: deliveryId }),
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) return { state: response.status >= 500 || response.status === 408 ? 'uncertain' as const : 'failed' as const, messageId: null, code: `provider_${response.status}` }
    const payload = await response.json().catch(() => null) as { messageid?: string; id?: string } | null
    const messageId = payload?.messageid || payload?.id
    if (typeof messageId !== 'string' || !messageId || messageId.length > 200) return { state: 'uncertain' as const, messageId: null, code: 'provider_missing_receipt' }
    return { state: 'accepted' as const, messageId, code: null }
  } catch { return { state: 'uncertain' as const, messageId: null, code: 'provider_connection_unconfirmed' } }
}
