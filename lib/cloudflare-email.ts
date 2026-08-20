const CLOUDFLARE_EMAIL_API_BASE = 'https://api.cloudflare.com/client/v4'
const DEFAULT_SENDER_NAME = 'Legal Ops'
const DEFAULT_SENDER_EMAIL = 'hello@mail.legalops.work'

type CloudflareEmailAddress =
  | string
  | { address: string; name?: string }
  | CloudflareEmailAddress[]

type CloudflareEmailResponse = {
  success?: boolean
  errors?: Array<{ code?: number; message?: string }>
  messages?: Array<{ code?: number; message?: string }>
  result?: {
    delivered?: string[]
    queued?: string[]
    permanent_bounces?: string[]
    message_id?: string
  } | null
}

export function getCloudflareEmailSender() {
  return {
    name: process.env.CLOUDFLARE_EMAIL_SENDER_NAME?.trim() || DEFAULT_SENDER_NAME,
    email:
      process.env.CLOUDFLARE_EMAIL_SENDER_EMAIL?.trim().toLowerCase() ||
      DEFAULT_SENDER_EMAIL,
  }
}

export function getCloudflareEmailWebhookToken(): string | null {
  return process.env.CLOUDFLARE_EMAIL_WEBHOOK_TOKEN?.trim() || null
}

function getCloudflareEmailConfig() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim()
  const apiToken = process.env.CLOUDFLARE_EMAIL_API_TOKEN?.trim()

  if (!accountId || !apiToken) {
    throw new Error('Cloudflare Email Service is not configured.')
  }

  return { accountId, apiToken }
}

function getErrorMessage(payload: CloudflareEmailResponse) {
  const errors = [...(payload.errors ?? []), ...(payload.messages ?? [])]
    .map(error => error.message)
    .filter((message): message is string => Boolean(message))

  return errors.join('; ') || 'Cloudflare Email Service request failed.'
}

export async function sendCloudflareTransactionalEmail(args: {
  to: string[]
  subject: string
  textBody: string
  htmlBody?: string
  replyTo?: string
  headers?: Record<string, string>
}) {
  const { accountId, apiToken } = getCloudflareEmailConfig()
  const sender = getCloudflareEmailSender()
  const recipients: CloudflareEmailAddress = args.to.length === 1 ? args.to[0] : args.to

  const response = await fetch(
    `${CLOUDFLARE_EMAIL_API_BASE}/accounts/${accountId}/email/sending/send`,
    {
      method: 'POST',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${apiToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: { address: sender.email, name: sender.name },
        to: recipients,
        reply_to: args.replyTo,
        subject: args.subject,
        text: args.textBody,
        html: args.htmlBody,
        headers: args.headers,
      }),
      cache: 'no-store',
    }
  )

  const payload = (await response.json().catch(() => null)) as CloudflareEmailResponse | null

  if (!response.ok || !payload?.success) {
    throw new Error(payload ? getErrorMessage(payload) : `Cloudflare Email Service failed with status ${response.status}.`)
  }

  return {
    messageId: payload.result?.message_id ?? null,
    payload,
  }
}
