import { createAdminClient } from './supabase-admin'
import { newsWhatsappConfig, sendNewsWhatsapp } from './news-whatsapp'

export async function dispatchNewsWhatsapp() {
  const config = newsWhatsappConfig()
  // Do not even claim a delivery until this specific instance and group are configured.
  if (!config) return { state: 'awaiting_connection', processed: 0 }
  const admin = createAdminClient()
  const { data: deliveries, error } = await admin.rpc('news_whatsapp_claim', { p_group_id: config.groupId, p_limit: 2 })
  if (error) throw new Error('news_whatsapp_queue_unavailable')
  const results = []
  for (const delivery of deliveries ?? []) {
    const { data: article, error: readError } = await admin.from('news_articles').select('title,summary,slug,status,published_at').eq('id', delivery.article_id).maybeSingle()
    const result = readError ? { state: 'failed', messageId: null, code: 'article_unavailable' }
      : !article || article.status !== 'published' || !article.published_at || new Date(article.published_at).getTime() > Date.now()
        ? { state: 'cancelled', messageId: null, code: 'article_not_public' }
        : await sendNewsWhatsapp(config, delivery.id, article)
    const { error: updateError } = await admin.from('news_whatsapp_deliveries').update({ status: result.state, provider_message_id: result.messageId, error_code: result.code, finished_at: new Date().toISOString() }).eq('id', delivery.id).eq('claim_token', delivery.claim_token).eq('status', 'sending')
    if (updateError) throw new Error('news_whatsapp_receipt_unavailable')
    results.push(result.state)
  }
  return { state: 'processed', processed: results.length, results }
}
