import { describe, expect, it } from 'vitest'
import {
  BENCH_EVENT_URL,
  buildBenchInvitationEmail,
} from '@/lib/bench-invitation-email'

describe('Bench invitation email', () => {
  it('uses the event date in Brasilia and clearly marks a test delivery', () => {
    const email = buildBenchInvitationEmail({
      title: 'Bench de honorários de êxito',
      startsAt: '2026-10-14T22:00:00.000Z',
      test: true,
    })

    expect(email.subject).toBe('[TESTE] Convite oficial · Bench de honorários de êxito')
    expect(email.textBody).toContain('Quarta-feira, 14 de outubro de 2026, às 19:00')
    expect(email.textBody).toContain('não encaminhado às pessoas inscritas')
    expect(email.textBody).toContain(BENCH_EVENT_URL)
    expect(email.htmlBody).toContain('Teste do convite')
    expect(email.htmlBody).toContain('19:00')
  })

  it('builds the production copy without the test warning', () => {
    const email = buildBenchInvitationEmail({
      title: 'Bench de honorários de êxito',
      startsAt: '2026-10-14T22:00:00.000Z',
    })

    expect(email.subject).not.toContain('[TESTE]')
    expect(email.textBody).not.toContain('não encaminhado')
    expect(email.htmlBody).not.toContain('Teste do convite')
  })

  it('rejects an invalid event date', () => {
    expect(() => buildBenchInvitationEmail({ title: 'Bench', startsAt: 'invalid' }))
      .toThrow('Bench event start date is invalid.')
  })
})
