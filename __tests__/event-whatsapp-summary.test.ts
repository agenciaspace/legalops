import { describe, expect, it } from 'vitest'
import {
  eventWhatsAppDigestPrompt,
  eventWhatsAppSummarySource,
  validateEventWhatsAppInput,
} from '@/lib/event-whatsapp-summary'

const now = new Date('2026-09-30T21:01:00Z')
const payload = {
  source: 'event:bench-netlex-2026',
  event_slug: 'bench-netlex-2026',
  action: 'publish',
  period_start: '2026-09-29T21:00:00Z',
  period_end: '2026-09-30T21:00:00Z',
  omitted_media_count: 0,
  messages: [{ id: '1', at: '2026-09-30T20:00:00Z', author: 'Ana Lima', text: 'A integração com o ERP exigiu uma fila de aprovação.' }],
}

describe('event WhatsApp summaries', () => {
  it('accepts only the source that belongs to the requested event', () => {
    expect(eventWhatsAppSummarySource('bench-netlex-2026')).toBe('event:bench-netlex-2026')
    expect(validateEventWhatsAppInput(payload, now)).not.toBeNull()
    expect(validateEventWhatsAppInput({ ...payload, source: 'event:other' }, now)).toBeNull()
    expect(validateEventWhatsAppInput({ ...payload, event_slug: 'other' }, now)).toBeNull()
  })

  it('creates a factual prompt without exposing participant names', () => {
    const prompt = eventWhatsAppDigestPrompt(payload.messages, 'Bench: experiências com o NetLex')
    expect(prompt).toContain('Bench: experiências com o NetLex')
    expect(prompt).toContain('fila de aprovação')
    expect(prompt).not.toContain('Ana Lima')
    expect(prompt).toContain('Não inclua nomes')
  })
})
