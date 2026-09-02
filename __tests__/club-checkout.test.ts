import { describe, expect, it } from 'vitest'
import { CLUB_PIX_KEY, CLUB_PIX_KEY_TYPE, buildClubProofMailto } from '@/lib/club-checkout'

describe('Club PIX checkout', () => {
  it('uses the configured email PIX key', () => {
    expect(CLUB_PIX_KEY).toBe('leonhatori@gmail.com')
    expect(CLUB_PIX_KEY_TYPE).toBe('email')
  })

  it('builds a prefilled proof email without collecting financial data', () => {
    const mailto = buildClubProofMailto(199)
    expect(mailto).toMatch(/^mailto:leonhatori@gmail\.com\?/)

    const decoded = decodeURIComponent(mailto)
    expect(decoded).toContain('Comprovante PIX — legalops.club')
    expect(decoded).toContain('PIX de R$ 199')
    expect(decoded).toContain('Email para acesso:')
    expect(decoded).not.toContain('senha')
  })
})
