import { sendCloudflareTransactionalEmail } from './cloudflare-email'

type Message = Parameters<typeof sendCloudflareTransactionalEmail>[0] & { idempotencyKey?: string }

export async function sendClubTransactionalEmail({ idempotencyKey, ...message }: Message) {
  const key = process.env.RESEND_API_KEY?.trim()
  // Keep the existing transport available while the new secret is rolled out.
  if (!key) return sendCloudflareTransactionalEmail(message)
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`, 'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: `legalops.club <${process.env.RESEND_SENDER_EMAIL || 'contato@legalops.club'}>`,
      to: message.to, subject: message.subject, text: message.textBody,
      html: message.htmlBody, reply_to: message.replyTo, headers: message.headers,
    }),
    cache: 'no-store', signal: AbortSignal.timeout(15000),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || typeof payload?.id !== 'string') {
    // Do not retry via another provider after an ambiguous delivery response.
    throw new Error(`Resend email request failed (${response.status}).`)
  }
  return { messageId: payload.id as string, payload }
}
