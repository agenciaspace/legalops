import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

/**
 * Webhook endpoint for inbound email providers (Resend, Mailgun, etc.).
 * Receives emails sent to tracking addresses and stores them as inbound_emails
 * + creates an application_event on the timeline.
 *
 * Expected JSON payload:
 *   { to: string, from: string, subject: string, text: string, html?: string }
 *
 * Secured via INBOUND_EMAIL_SECRET bearer token.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.INBOUND_EMAIL_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.to || !body?.from) {
    return NextResponse.json({ error: 'Missing required fields: to, from' }, { status: 400 })
  }

  const recipientEmail = extractEmail(body.to)
  if (!recipientEmail) {
    return NextResponse.json({ error: 'Invalid recipient' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Find the pipeline entry by tracking_email
  const { data: entry, error: lookupError } = await supabase
    .from('user_pipeline_entries')
    .select('id, user_id')
    .eq('tracking_email', recipientEmail)
    .single()

  if (lookupError || !entry) {
    return NextResponse.json({ error: 'Unknown tracking email' }, { status: 404 })
  }

  // Store the inbound email
  const { error: insertError } = await supabase.from('inbound_emails').insert({
    entry_id: entry.id,
    user_id: entry.user_id,
    sender: body.from,
    subject: body.subject ?? '',
    body_text: body.text ?? '',
    body_html: body.html ?? null,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Create a timeline event
  await supabase.from('application_events').insert({
    entry_id: entry.id,
    user_id: entry.user_id,
    event_type: 'email_received',
    title: `E-mail recebido: ${body.subject || '(sem assunto)'}`,
    description: `De: ${body.from}`,
  })

  return NextResponse.json({ ok: true })
}

/** Extract a bare email from formats like "Name <email@example.com>" or plain "email@example.com" */
function extractEmail(raw: string): string | null {
  const match = raw.match(/<([^>]+)>/) ?? raw.match(/([^\s,]+@[^\s,]+)/)
  return match ? match[1].toLowerCase() : null
}
