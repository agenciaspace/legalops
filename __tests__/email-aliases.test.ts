import { describe, expect, it } from 'vitest'
import {
  generateRandomEmailLocalPart,
  getAliasCreationError,
  getEmailTierPolicy,
  getRemainingAliasSlots,
  normalizeEmailLocalPart,
  sortEmailAliases,
  validateCustomEmailLocalPart,
} from '@/lib/email-aliases'
import type { UserEmailAlias } from '@/lib/types'

describe('email alias helpers', () => {
  it('returns the expected tier policies', () => {
    expect(getEmailTierPolicy('free')).toEqual({
      tier: 'free',
      maxActiveAliases: 1,
      allowsRandomAliases: true,
      allowsCustomAliases: false,
    })

    expect(getEmailTierPolicy('pro').maxActiveAliases).toBe(10)
  })

  it('normalizes custom alias input before validation', () => {
    expect(normalizeEmailLocalPart('  João Silva  ')).toBe('joao-silva')
    expect(validateCustomEmailLocalPart('support')).toBe('This email alias is reserved.')
    expect(validateCustomEmailLocalPart('ok')).toBe(
      'Custom email alias must have at least 3 characters.'
    )
    expect(validateCustomEmailLocalPart('Meu Time Jurídico')).toBeNull()
  })

  it('blocks custom aliases on free tier and enforces slot limits', () => {
    expect(
      getAliasCreationError({
        tier: 'free',
        source: 'custom',
        activeAliasCount: 0,
      })
    ).toBe('Custom email aliases are available on paid tiers only.')

    expect(
      getAliasCreationError({
        tier: 'free',
        source: 'random',
        activeAliasCount: 1,
      })
    ).toBe('Your free tier supports up to 1 active email alias.')

    expect(getRemainingAliasSlots('pro', 3)).toBe(7)
  })

  it('generates deterministic random aliases when indexes are provided', () => {
    expect(
      generateRandomEmailLocalPart({
        prefix: 'team',
        length: 6,
        randomIndexes: [0, 1, 2, 3, 4, 5],
      })
    ).toBe('team-abcdef')
  })

  it('sorts active primary aliases first', () => {
    const aliases: UserEmailAlias[] = [
      {
        id: 'disabled',
        user_id: 'user',
        domain_id: 'domain',
        local_part: 'disabled',
        address: 'disabled@reply.legalops.work',
        source: 'custom',
        status: 'disabled',
        is_primary: false,
        provider: null,
        provider_alias_id: null,
        metadata: {},
        created_at: '2026-03-12T10:00:00.000Z',
        updated_at: '2026-03-12T10:00:00.000Z',
      },
      {
        id: 'active-secondary',
        user_id: 'user',
        domain_id: 'domain',
        local_part: 'secondary',
        address: 'secondary@reply.legalops.work',
        source: 'random',
        status: 'active',
        is_primary: false,
        provider: null,
        provider_alias_id: null,
        metadata: {},
        created_at: '2026-03-12T09:00:00.000Z',
        updated_at: '2026-03-12T09:00:00.000Z',
      },
      {
        id: 'active-primary',
        user_id: 'user',
        domain_id: 'domain',
        local_part: 'primary',
        address: 'primary@reply.legalops.work',
        source: 'random',
        status: 'active',
        is_primary: true,
        provider: null,
        provider_alias_id: null,
        metadata: {},
        created_at: '2026-03-12T08:00:00.000Z',
        updated_at: '2026-03-12T08:00:00.000Z',
      },
    ]

    expect(sortEmailAliases(aliases).map(alias => alias.id)).toEqual([
      'active-primary',
      'active-secondary',
      'disabled',
    ])
  })
})
