const BREVO_API_BASE_URL = 'https://api.brevo.com/v3'
const DEFAULT_SENDER_NAME = 'Legal Ops'
const DEFAULT_SENDER_EMAIL = 'hello@mail.legalops.work'
const DEFAULT_REPLY_DOMAIN = 'reply.legalops.work'

export interface BrevoNormalizedInboundMessage {
  providerMessageId: string | null
  fromName: string | null
  fromAddress: string | null
  toAddresses: string[]
  ccAddresses: string[]
  bccAddresses: string[]
  subject: string | null
  textBody: string | null
  htmlBody: string | null
  headers: Record<string, unknown>
  sentAt: string | null
  rawPayload: Record<string, unknown>
}

interface BrevoParticipant {
  Address?: unknown
  Name?: unknown
}

interface BrevoSendTransactionalEmailArgs {
  to: string[]
  subject: string
  textBody: string
  htmlBody?: string
  replyTo: string
  headers?: Record<string, string>
}

export function getBrevoSenderIdentity() {
  return {
    name: process.env.BREVO_SENDER_NAME?.trim() || DEFAULT_SENDER_NAME,
    email: process.env.BREVO_SENDER_EMAIL?.trim().toLowerCase() || DEFAULT_SENDER_EMAIL,
  }
}

export function getBrevoReplyDomain(): string {
  return process.env.BREVO_REPLY_DOMAIN?.trim().toLowerCase() || DEFAULT_REPLY_DOMAIN
}

export function getBrevoWebhookBearerToken(): string | null {
  return process.env.BREVO_WEBHOOK_BEARER_TOKEN?.trim() || null
}

function getBrevoApiKey(): string {
  const apiKey = process.env.BREVO_API_KEY?.trim()

  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not configured.')
  }

  return apiKey
}

async function brevoRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${BREVO_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      accept: 'application/json',
      'api-key': getBrevoApiKey(),
      'content-type': 'application/json',
      ...init.headers,
    },
    cache: 'no-store',
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      typeof payload?.message === 'string'
        ? payload.message
        : `Brevo request failed with status ${response.status}.`

    throw new Error(message)
  }

  return payload as T
}

export async function sendBrevoTransactionalEmail(
  args: BrevoSendTransactionalEmailArgs
): Promise<{ messageId: string | null; payload: Record<string, unknown> }> {
  const sender = getBrevoSenderIdentity()
  const payload = await brevoRequest<Record<string, unknown>>('/smtp/email', {
    method: 'POST',
    body: JSON.stringify({
      sender,
      to: args.to.map(email => ({ email })),
      replyTo: { email: args.replyTo },
      subject: args.subject,
      textContent: args.textBody,
      htmlContent: args.htmlBody ?? buildHtmlEmail(args.textBody),
      headers: args.headers,
    }),
  })

  return {
    messageId: typeof payload.messageId === 'string' ? payload.messageId : null,
    payload,
  }
}

export function buildHtmlEmail(text: string): string {
  const escaped = escapeHtml(text.trim())
  const paragraphs = escaped
    .split(/\n{2,}/)
    .map(block => block.replace(/\n/g, '<br />'))
    .filter(Boolean)

  return paragraphs.map(block => `<p>${block}</p>`).join('')
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function parseStructuredKey(key: string): string[] {
  return key
    .replace(/\]/g, '')
    .split('[')
    .filter(Boolean)
}

function normalizeFormValue(value: FormDataEntryValue): unknown {
  if (typeof value === 'string') {
    return value
  }

  return {
    name: value.name,
    type: value.type,
    size: value.size,
    lastModified: value.lastModified,
  }
}

function assignStructuredValue(target: Record<string, unknown>, path: string[], value: unknown) {
  let current: Record<string, unknown> | unknown[] = target

  for (let index = 0; index < path.length; index += 1) {
    const segment = path[index]
    const isLeaf = index === path.length - 1
    const nextSegment = path[index + 1]
    const nextContainerIsArray = /^\d+$/.test(nextSegment ?? '')

    if (Array.isArray(current)) {
      const arrayIndex = Number(segment)

      if (isLeaf) {
        current[arrayIndex] = value
        return
      }

      if (current[arrayIndex] == null) {
        current[arrayIndex] = nextContainerIsArray ? [] : {}
      }

      current = current[arrayIndex] as Record<string, unknown> | unknown[]
      continue
    }

    if (isLeaf) {
      current[segment] = value
      return
    }

    if (current[segment] == null) {
      current[segment] = nextContainerIsArray ? [] : {}
    }

    current = current[segment] as Record<string, unknown> | unknown[]
  }
}

export function parseBrevoInboundFormData(formData: FormData): Record<string, unknown> {
  const payload: Record<string, unknown> = {}

  for (const [key, rawValue] of Array.from(formData.entries())) {
    assignStructuredValue(payload, parseStructuredKey(key), normalizeFormValue(rawValue))
  }

  return payload
}

function extractParticipantAddress(value: unknown): string | null {
  if (typeof value === 'string') {
    return value.trim().toLowerCase() || null
  }

  if (!value || typeof value !== 'object') {
    return null
  }

  const participant = value as BrevoParticipant

  if (typeof participant.Address === 'string' && participant.Address.trim()) {
    return participant.Address.trim().toLowerCase()
  }

  return null
}

function extractParticipantName(value: unknown): string | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const participant = value as BrevoParticipant

  if (typeof participant.Name === 'string' && participant.Name.trim()) {
    return participant.Name.trim()
  }

  return null
}

function extractAddressList(value: unknown): string[] {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value
      .map(entry => extractParticipantAddress(entry))
      .filter((entry): entry is string => Boolean(entry))
  }

  const address = extractParticipantAddress(value)
  return address ? [address] : []
}

function toIsoDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  const timestamp = new Date(value)
  return Number.isNaN(timestamp.getTime()) ? null : timestamp.toISOString()
}

export function normalizeBrevoInboundPayload(
  input: FormData | Record<string, unknown>
): BrevoNormalizedInboundMessage {
  const rawPayload = input instanceof FormData ? parseBrevoInboundFormData(input) : input
  const recipients = extractAddressList(rawPayload.Recipients)
  const toAddresses = extractAddressList(rawPayload.To)
  const uniqueToAddresses = Array.from(new Set([...toAddresses, ...recipients]))

  return {
    providerMessageId:
      typeof rawPayload.MessageId === 'string' && rawPayload.MessageId.trim()
        ? rawPayload.MessageId.trim()
        : null,
    fromName: extractParticipantName(rawPayload.From),
    fromAddress: extractParticipantAddress(rawPayload.From),
    toAddresses: uniqueToAddresses,
    ccAddresses: extractAddressList(rawPayload.Cc),
    bccAddresses: extractAddressList(rawPayload.Bcc),
    subject:
      typeof rawPayload.Subject === 'string' && rawPayload.Subject.trim()
        ? rawPayload.Subject.trim()
        : null,
    textBody:
      typeof rawPayload.RawTextBody === 'string' && rawPayload.RawTextBody.trim()
        ? rawPayload.RawTextBody
        : typeof rawPayload.ExtractedMarkdownMessage === 'string' &&
            rawPayload.ExtractedMarkdownMessage.trim()
          ? rawPayload.ExtractedMarkdownMessage
          : null,
    htmlBody:
      typeof rawPayload.RawHtmlBody === 'string' && rawPayload.RawHtmlBody.trim()
        ? rawPayload.RawHtmlBody
        : null,
    headers:
      rawPayload.Headers && typeof rawPayload.Headers === 'object' && !Array.isArray(rawPayload.Headers)
        ? (rawPayload.Headers as Record<string, unknown>)
        : {},
    sentAt: toIsoDate(rawPayload.SentAtDate),
    rawPayload,
  }
}
