import type { NewsAudience, NewsTopic } from './news'

export function beehiivConfigured() {
  return Boolean(process.env.BEEHIIV_API_KEY && /^pub_[a-f0-9-]+$/i.test(process.env.BEEHIIV_PUBLICATION_ID ?? ''))
}
export async function sendNewsSubscription(input: { email: string; audiences: NewsAudience[]; topics: NewsTopic[]; source: string }) {
  if (!beehiivConfigured()) return { state: 'awaiting_connection' as const, subscriptionId: null }
  const response = await fetch(`https://api.beehiiv.com/v2/publications/${process.env.BEEHIIV_PUBLICATION_ID}/subscriptions`, {
    method: 'POST', signal: AbortSignal.timeout(10000),
    headers: { Authorization: `Bearer ${process.env.BEEHIIV_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: input.email, double_opt_override: 'on', reactivate_existing: false, send_welcome_email: false, utm_source: input.source, utm_medium: 'website', custom_fields: [{ name: 'legalops_audiences', value: input.audiences.join(',') }, { name: 'legalops_topics', value: input.topics.join(',') }] }),
  })
  if (!response.ok) throw new Error('beehiiv_unavailable')
  const result = await response.json() as { data?: { id?: string; status?: string } }
  if (!result.data?.id) throw new Error('beehiiv_invalid_response')
  return { state: 'sent_to_provider' as const, subscriptionId: result.data.id }
}
