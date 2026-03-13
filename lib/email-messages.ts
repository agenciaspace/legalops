import type { EmailMessage } from '@/lib/email-types'

const EMAIL_ADDRESS_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i
const MAX_SUBJECT_LENGTH = 200
const MAX_BODY_LENGTH = 20_000

export function parseEmailAddressList(value: string): string[] {
  const addresses = value
    .split(/[\n,;]+/)
    .map(entry => entry.trim().toLowerCase())
    .filter(Boolean)

  return Array.from(new Set(addresses))
}

export function validateOutboundEmailDraft(args: {
  to: string
  subject: string
  body: string
}): string | null {
  const recipients = parseEmailAddressList(args.to)
  const trimmedSubject = args.subject.trim()
  const trimmedBody = args.body.trim()

  if (recipients.length === 0) {
    return 'Recipient email is required.'
  }

  if (recipients.some(address => !EMAIL_ADDRESS_REGEX.test(address))) {
    return 'Enter at least one valid recipient email.'
  }

  if (!trimmedSubject) {
    return 'Subject is required.'
  }

  if (trimmedSubject.length > MAX_SUBJECT_LENGTH) {
    return `Subject must be at most ${MAX_SUBJECT_LENGTH} characters.`
  }

  if (!trimmedBody) {
    return 'Email body is required.'
  }

  if (trimmedBody.length > MAX_BODY_LENGTH) {
    return `Email body must be at most ${MAX_BODY_LENGTH} characters.`
  }

  return null
}

export function getEmailMessageBody(message: Pick<EmailMessage, 'text_body' | 'html_body'>): string {
  if (message.text_body?.trim()) {
    return message.text_body.trim()
  }

  if (message.html_body?.trim()) {
    return message.html_body
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim()
  }

  return ''
}

export function getEmailMessagePreview(
  message: Pick<EmailMessage, 'text_body' | 'html_body'>,
  maxLength = 160
): string {
  const body = getEmailMessageBody(message)

  if (!body) {
    return 'No message body captured.'
  }

  if (body.length <= maxLength) {
    return body
  }

  return `${body.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`
}

export function getEmailMessageOccurredAt(
  message: Pick<EmailMessage, 'received_at' | 'sent_at' | 'created_at'>
): string {
  return message.received_at ?? message.sent_at ?? message.created_at
}
