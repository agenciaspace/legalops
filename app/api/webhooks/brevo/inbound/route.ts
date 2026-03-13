import { NextRequest, NextResponse } from 'next/server'
import {
  getBrevoWebhookBearerToken,
  normalizeBrevoInboundPayload,
} from '@/lib/brevo'
import { listAliasesByAddresses } from '@/lib/email-alias-store'
import { createAdminClient } from '@/lib/supabase-admin'

async function readWebhookPayload(req: NextRequest): Promise<FormData | Record<string, unknown>> {
  const contentType = req.headers.get('content-type')?.toLowerCase() ?? ''

  if (
    contentType.includes('multipart/form-data') ||
    contentType.includes('application/x-www-form-urlencoded')
  ) {
    return req.formData()
  }

  const json = await req.json().catch(() => null)
  return json && typeof json === 'object' ? (json as Record<string, unknown>) : {}
}

export async function POST(req: NextRequest) {
  const expectedToken = getBrevoWebhookBearerToken()

  if (!expectedToken) {
    return NextResponse.json(
      { error: 'BREVO_WEBHOOK_BEARER_TOKEN is not configured.' },
      { status: 503 }
    )
  }

  const authorization = req.headers.get('authorization')

  if (authorization !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const normalized = normalizeBrevoInboundPayload(await readWebhookPayload(req))

  if (!normalized.fromAddress || normalized.toAddresses.length === 0) {
    return NextResponse.json(
      { error: 'Inbound payload is missing sender or recipients.' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const aliases = await listAliasesByAddresses(supabase, normalized.toAddresses)

  if (aliases.length === 0) {
    return NextResponse.json({ inserted: 0, matchedAliases: 0 }, { status: 202 })
  }

  const now = new Date().toISOString()
  let inserted = 0

  for (const alias of aliases) {
    const { error } = await supabase
      .from('email_messages')
      .insert({
        user_id: alias.user_id,
        alias_id: alias.id,
        provider: 'brevo',
        provider_message_id: normalized.providerMessageId,
        direction: 'inbound',
        status: 'received',
        from_name: normalized.fromName,
        from_address: normalized.fromAddress,
        to_addresses: normalized.toAddresses,
        cc_addresses: normalized.ccAddresses,
        bcc_addresses: normalized.bccAddresses,
        subject: normalized.subject,
        text_body: normalized.textBody,
        html_body: normalized.htmlBody,
        headers: normalized.headers,
        provider_payload: normalized.rawPayload,
        received_at: normalized.sentAt ?? now,
      })

    if (!error) {
      inserted += 1
      continue
    }

    if (error.code === '23505') {
      continue
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    inserted,
    matchedAliases: aliases.length,
  })
}
