import { NextRequest, NextResponse } from 'next/server'
import { normalizeBrevoInboundPayloads } from '@/lib/brevo'
import { getCloudflareEmailWebhookToken } from '@/lib/cloudflare-email'
import { storeInboundEmailMessages } from '@/lib/inbound-email'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  const expectedToken = getCloudflareEmailWebhookToken()
  if (!expectedToken) {
    return NextResponse.json({ error: 'Cloudflare email webhook is not configured.' }, { status: 503 })
  }

  if (request.headers.get('authorization') !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await request.json().catch(() => null)
  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Invalid email payload.' }, { status: 400 })
  }

  try {
    const result = await storeInboundEmailMessages(
      createAdminClient(),
      normalizeBrevoInboundPayloads(payload as Record<string, unknown>),
      'cloudflare'
    )
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to store inbound email.' },
      { status: 500 }
    )
  }
}
