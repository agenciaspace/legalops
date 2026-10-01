import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import {
  BENCH_EVENT_SLUG,
  BENCH_TEST_RECIPIENT,
  buildBenchInvitationEmail,
} from '@/lib/bench-invitation-email'
import { sendClubTransactionalEmail } from '@/lib/club-email-delivery'
import { getPublicEventFallback } from '@/lib/public-events'

export const dynamic = 'force-dynamic'

const reply = (data: unknown, status = 200) => NextResponse.json(data, {
  status,
  headers: { 'Cache-Control': 'private, no-store' },
})

export async function POST(request: Request) {
  const secret = process.env.WHATSAPP_SUMMARY_INGEST_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return reply({ error: 'Unauthorized' }, 401)
  }

  const db = createAdminClient()
  const { data: event, error } = await db
    .from('community_events')
    .select('id,title,starts_at')
    .eq('slug', BENCH_EVENT_SLUG)
    .eq('is_published', true)
    .maybeSingle()
  const fallback = getPublicEventFallback(BENCH_EVENT_SLUG)
  const resolvedEvent = event?.id && event.starts_at ? event : fallback

  if (!resolvedEvent?.starts_at) {
    return reply({ error: 'Bench event unavailable' }, 503)
  }

  try {
    const message = buildBenchInvitationEmail({
      title: resolvedEvent.title ?? 'Bench de honorários de êxito',
      startsAt: resolvedEvent.starts_at,
      test: true,
    })
    const delivery = await sendClubTransactionalEmail({
      idempotencyKey: `bench-invitation-test/${event?.id || BENCH_EVENT_SLUG}/${resolvedEvent.starts_at}/${BENCH_TEST_RECIPIENT}`,
      to: [BENCH_TEST_RECIPIENT],
      subject: message.subject,
      textBody: message.textBody,
      htmlBody: message.htmlBody,
    })

    return reply({
      ok: true,
      test: true,
      recipient: BENCH_TEST_RECIPIENT,
      event_slug: BENCH_EVENT_SLUG,
      starts_at: resolvedEvent.starts_at,
      source: error || !event ? 'local-fallback' : 'database',
      message_id: delivery.messageId,
    })
  } catch (sendError) {
    console.error('[bench-invitation-test] email delivery failed', sendError)
    return reply({ error: 'Test invitation could not be delivered' }, 502)
  }
}
