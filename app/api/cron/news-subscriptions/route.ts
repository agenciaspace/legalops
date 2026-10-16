import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { beehiivConfigured, sendNewsSubscription } from '@/lib/news-beehiiv'
import { newsCronAuthorized } from '@/lib/news-http'
import type { NewsAudience, NewsTopic } from '@/lib/news'

export const maxDuration = 60
export async function GET(request: NextRequest) {
  if (!newsCronAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!beehiivConfigured()) return NextResponse.json({ configured: false, processed: 0 })
  const db = createAdminClient()
  const { data, error } = await db.rpc('claim_news_signups')
  if (error) return NextResponse.json({ error: 'subscription_queue_unavailable' }, { status: 503 })
  const results = await Promise.all((data ?? []).map(async (signup: { id: string; email: string; audiences: NewsAudience[]; topics: NewsTopic[]; source: string; lease_token: string }) => {
    try {
      const result = await sendNewsSubscription(signup)
      const { error: saveError } = await db.from('news_email_signups').update({ status: result.state, provider_subscription_id: result.subscriptionId, processed_at: new Date().toISOString(), lease_until: null }).eq('id', signup.id).eq('lease_token', signup.lease_token)
      return saveError ? 'failed' : 'sent'
    } catch {
      await db.from('news_email_signups').update({ status: 'pending', next_attempt_at: new Date(Date.now() + 3600000).toISOString(), lease_until: null }).eq('id', signup.id).eq('lease_token', signup.lease_token)
      return 'failed'
    }
  }))
  return NextResponse.json({ configured: true, processed: results.length, sent: results.filter(value => value === 'sent').length, failed: results.filter(value => value === 'failed').length })
}
