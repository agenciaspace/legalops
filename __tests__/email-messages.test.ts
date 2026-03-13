import { describe, expect, it } from 'vitest'
import {
  getEmailMessageOccurredAt,
  getEmailMessagePreview,
  parseEmailAddressList,
  validateOutboundEmailDraft,
} from '@/lib/email-messages'

describe('email message helpers', () => {
  it('parses and deduplicates recipient lists', () => {
    expect(
      parseEmailAddressList('GC@Example.com, recruiter@example.com\ngc@example.com')
    ).toEqual(['gc@example.com', 'recruiter@example.com'])
  })

  it('validates outbound drafts', () => {
    expect(
      validateOutboundEmailDraft({
        to: '',
        subject: 'Hello',
        body: 'World',
      })
    ).toBe('Recipient email is required.')

    expect(
      validateOutboundEmailDraft({
        to: 'gc@example.com',
        subject: 'Hello',
        body: 'World',
      })
    ).toBeNull()
  })

  it('builds previews from html-only messages', () => {
    expect(
      getEmailMessagePreview({
        text_body: null,
        html_body: '<p>Hello<br />there</p><p>General Counsel</p>',
      })
    ).toContain('Hello')
  })

  it('picks the best occurred-at timestamp', () => {
    expect(
      getEmailMessageOccurredAt({
        received_at: null,
        sent_at: '2026-03-13T10:00:00.000Z',
        created_at: '2026-03-13T09:00:00.000Z',
      })
    ).toBe('2026-03-13T10:00:00.000Z')
  })
})
