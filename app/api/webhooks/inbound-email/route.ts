import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

/**
 * Webhook for receiving inbound emails.
 *
 * Supports two payload formats:
 *
 * 1. Resend Inbound (recommended):
 *    { type: "email.received", data: { to: ["email"], from: "sender", subject: "...", text: "...", html: "..." } }
 *
 * 2. Generic / Mailgun-style:
 *    { to: "email", from: "sender", subject: "...", text: "...", html: "..." }
 *
 * Secured via INBOUND_EMAIL_SECRET bearer token.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.INBOUND_EMAIL_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const raw = await req.json().catch(() => null)
  if (!raw) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Normalize payload from different providers
  const payload = normalizePayload(raw)
  if (!payload) {
    return NextResponse.json({ error: 'Missing required fields: to, from' }, { status: 400 })
  }

  const recipientEmail = extractEmail(payload.to)
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
    sender: payload.from,
    subject: payload.subject,
    body_text: payload.text,
    body_html: payload.html,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Create a timeline event
  await supabase.from('application_events').insert({
    entry_id: entry.id,
    user_id: entry.user_id,
    event_type: 'email_received',
    title: `E-mail recebido: ${payload.subject || '(sem assunto)'}`,
    description: `De: ${payload.from}`,
  })

  return NextResponse.json({ ok: true })
}

interface NormalizedEmail {
  to: string
  from: string
  subject: string
  text: string
  html: string | null
}

/** Normalize payloads from Resend, Mailgun, or generic format */
function normalizePayload(raw: Record<string, unknown>): NormalizedEmail | null {
  // Resend Inbound format: { type: "email.received", data: { to: [...], from, subject, text, html } }
  if (raw.type === 'email.received' && raw.data) {
    const d = raw.data as Record<string, unknown>
    const toArr = d.to as string[] | undefined
    const to = Array.isArray(toArr) ? toArr[0] : undefined
    const from = d.from as string | undefined
    if (!to || !from) return null
    return {
      to,
      from,
      subject: (d.subject as string) ?? '',
      text: (d.text as string) ?? '',
      html: (d.html as string) ?? null,
    }
  }

  // Generic / Mailgun format: { to, from, subject, text, html }
  const to = raw.to as string | undefined
  const from = raw.from as string | undefined
  if (!to || !from) return null
  return {
    to: Array.isArray(to) ? to[0] : to,
    from,
    subject: (raw.subject as string) ?? '',
    text: (raw.text as string) ?? '',
    html: (raw.html as string) ?? null,
  }
}

/** Extract a bare email from formats like "Name <email@example.com>" or plain "email@example.com" */
function extractEmail(raw: string): string | null {
  const match = raw.match(/<([^>]+)>/) ?? raw.match(/([^\s,]+@[^\s,]+)/)
  return match ? match[1].toLowerCase() : null
}
