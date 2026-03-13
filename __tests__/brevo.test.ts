import { describe, expect, it } from 'vitest'
import {
  buildHtmlEmail,
  normalizeBrevoInboundPayload,
  parseBrevoInboundFormData,
} from '@/lib/brevo'

describe('brevo helpers', () => {
  it('reconstructs nested inbound form data payloads', () => {
    const formData = new FormData()
    formData.set('From[Address]', 'ana@example.com')
    formData.set('From[Name]', 'Ana Lima')
    formData.set('To[0][Address]', 'lo-abcd12@reply.legalops.work')
    formData.set('To[0][Name]', 'Legal Ops')
    formData.set('Subject', 'Hello')

    expect(parseBrevoInboundFormData(formData)).toEqual({
      From: {
        Address: 'ana@example.com',
        Name: 'Ana Lima',
      },
      To: [
        {
          Address: 'lo-abcd12@reply.legalops.work',
          Name: 'Legal Ops',
        },
      ],
      Subject: 'Hello',
    })
  })

  it('normalizes inbound webhook payloads into mailbox rows', () => {
    const normalized = normalizeBrevoInboundPayload({
      MessageId: '<message-id@example.com>',
      From: {
        Address: 'Ana@Example.com',
        Name: 'Ana Lima',
      },
      To: [
        {
          Address: 'lo-abcd12@reply.legalops.work',
        },
      ],
      Recipients: ['extra@reply.legalops.work'],
      Subject: 'Application follow-up',
      ExtractedMarkdownMessage: 'Hello from Brevo',
      SentAtDate: 'Fri, 13 Mar 2026 10:00:00 GMT',
      Headers: {
        'message-id': '<message-id@example.com>',
      },
    })

    expect(normalized.providerMessageId).toBe('<message-id@example.com>')
    expect(normalized.fromAddress).toBe('ana@example.com')
    expect(normalized.toAddresses).toEqual([
      'lo-abcd12@reply.legalops.work',
      'extra@reply.legalops.work',
    ])
    expect(normalized.textBody).toBe('Hello from Brevo')
    expect(normalized.sentAt).toBe('2026-03-13T10:00:00.000Z')
  })

  it('builds a safe html body from plain text', () => {
    expect(buildHtmlEmail('Hello <team>\n\nThanks')).toBe(
      '<p>Hello &lt;team&gt;</p><p>Thanks</p>'
    )
  })
})
