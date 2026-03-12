import { createAdminClient } from './supabase-admin'
import { Resend } from 'resend'
import webpush from 'web-push'

// ── Types ────────────────────────────────────────────────────────

export interface NotificationPayload {
  userId: string
  eventType: string
  title: string
  body: string
  url?: string
}

interface NotificationPrefs {
  email_enabled: boolean
  whatsapp_enabled: boolean
  push_enabled: boolean
  email_address: string | null
  whatsapp_number: string | null
  notify_new_jobs: boolean
  notify_status_change: boolean
  notify_interview_reminder: boolean
  notify_follow_up_reminder: boolean
  notify_weekly_summary: boolean
  quiet_start_hour: number
  quiet_end_hour: number
}

// ── Event → preference mapping ───────────────────────────────────

const EVENT_PREF_MAP: Record<string, keyof NotificationPrefs> = {
  new_jobs: 'notify_new_jobs',
  status_change: 'notify_status_change',
  interview_reminder: 'notify_interview_reminder',
  follow_up_reminder: 'notify_follow_up_reminder',
  weekly_summary: 'notify_weekly_summary',
}

// ── Quiet hours check ────────────────────────────────────────────

function isQuietHour(prefs: NotificationPrefs): boolean {
  const nowUtc = new Date().getUTCHours()
  const { quiet_start_hour: start, quiet_end_hour: end } = prefs
  if (start <= end) return nowUtc >= start && nowUtc < end
  return nowUtc >= start || nowUtc < end
}

// ── Send email via Resend ────────────────────────────────────────

async function sendEmail(to: string, title: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not configured' }

  try {
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'LegalOps <notifications@legalops.app>',
      to,
      subject: title,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
          <div style="background:#2563eb;color:white;padding:12px 16px;border-radius:12px 12px 0 0;font-size:14px;font-weight:600;">
            LegalOps
          </div>
          <div style="background:#f8fafc;padding:20px 16px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
            <h2 style="margin:0 0 8px;font-size:16px;color:#0f172a;">${title}</h2>
            <p style="margin:0;font-size:14px;color:#475569;line-height:1.5;">${body}</p>
          </div>
        </div>
      `,
    })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

// ── Send WhatsApp via Twilio ─────────────────────────────────────

async function sendWhatsApp(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM

  if (!sid || !token || !from) return { ok: false, error: 'Twilio credentials not configured' }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: `whatsapp:${from}`,
        To: `whatsapp:${to}`,
        Body: body,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      return { ok: false, error: data.message || `HTTP ${res.status}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

// ── Send Web Push ────────────────────────────────────────────────

async function sendPush(userId: string, title: string, body: string, url?: string): Promise<{ ok: boolean; error?: string }> {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const mailto = process.env.VAPID_MAILTO || 'mailto:admin@legalops.app'

  if (!publicKey || !privateKey) return { ok: false, error: 'VAPID keys not configured' }

  webpush.setVapidDetails(mailto, publicKey, privateKey)

  const supabase = createAdminClient()
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth_key')
    .eq('user_id', userId)

  if (!subs?.length) return { ok: false, error: 'No push subscriptions found' }

  const payload = JSON.stringify({ title, body, url: url || '/dashboard' })
  let sentCount = 0

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth_key },
        },
        payload
      )
      sentCount++
    } catch (err) {
      // Remove invalid subscriptions (410 Gone)
      if ((err as { statusCode?: number }).statusCode === 410) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', sub.endpoint)
          .eq('user_id', userId)
      }
    }
  }

  return sentCount > 0 ? { ok: true } : { ok: false, error: 'All push sends failed' }
}

// ── Log notification ─────────────────────────────────────────────

async function logNotification(
  userId: string,
  channel: string,
  eventType: string,
  title: string,
  body: string,
  status: 'sent' | 'failed',
  errorMessage?: string
) {
  const supabase = createAdminClient()
  await supabase.from('notification_log').insert({
    user_id: userId,
    channel,
    event_type: eventType,
    title,
    body,
    status,
    error_message: errorMessage || null,
    sent_at: status === 'sent' ? new Date().toISOString() : null,
  })
}

// ── Main dispatch function ───────────────────────────────────────

export async function sendNotification(payload: NotificationPayload): Promise<void> {
  const supabase = createAdminClient()

  // Get user preferences
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', payload.userId)
    .single()

  if (!prefs) return // No preferences set → no notifications

  // Check if this event type is enabled
  const prefKey = EVENT_PREF_MAP[payload.eventType]
  if (prefKey && !prefs[prefKey]) return

  // Check quiet hours
  if (isQuietHour(prefs as NotificationPrefs)) return

  // Send to all enabled channels
  const promises: Promise<void>[] = []

  if (prefs.email_enabled && prefs.email_address) {
    promises.push(
      sendEmail(prefs.email_address, payload.title, payload.body).then(async (r) => {
        await logNotification(payload.userId, 'email', payload.eventType, payload.title, payload.body, r.ok ? 'sent' : 'failed', r.error)
      })
    )
  }

  if (prefs.whatsapp_enabled && prefs.whatsapp_number) {
    const msg = `*${payload.title}*\n${payload.body}`
    promises.push(
      sendWhatsApp(prefs.whatsapp_number, msg).then(async (r) => {
        await logNotification(payload.userId, 'whatsapp', payload.eventType, payload.title, payload.body, r.ok ? 'sent' : 'failed', r.error)
      })
    )
  }

  if (prefs.push_enabled) {
    promises.push(
      sendPush(payload.userId, payload.title, payload.body, payload.url).then(async (r) => {
        await logNotification(payload.userId, 'push', payload.eventType, payload.title, payload.body, r.ok ? 'sent' : 'failed', r.error)
      })
    )
  }

  await Promise.allSettled(promises)
}
