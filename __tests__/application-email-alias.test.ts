import { describe, expect, it } from 'vitest'
import {
  pickPreferredApplicationAlias,
  pipelineStatusUsesApplicationAlias,
} from '@/lib/application-email-alias'
import type { UserEmailAlias } from '@/lib/types'

describe('application email alias helpers', () => {
  it('knows which pipeline statuses require an alias', () => {
    expect(pipelineStatusUsesApplicationAlias('researching')).toBe(false)
    expect(pipelineStatusUsesApplicationAlias('applied')).toBe(true)
    expect(pipelineStatusUsesApplicationAlias('interview')).toBe(true)
    expect(pipelineStatusUsesApplicationAlias('offer')).toBe(true)
  })

  it('prefers the active primary alias for applications', () => {
    const aliases: UserEmailAlias[] = [
      {
        id: 'secondary',
        user_id: 'user',
        domain_id: 'domain',
        local_part: 'secondary',
        address: 'secondary@reply.legalops.work',
        source: 'random',
        status: 'active',
        is_primary: false,
        provider: 'brevo',
        provider_alias_id: null,
        metadata: {},
        created_at: '2026-03-13T10:00:00.000Z',
        updated_at: '2026-03-13T10:00:00.000Z',
      },
      {
        id: 'primary',
        user_id: 'user',
        domain_id: 'domain',
        local_part: 'primary',
        address: 'primary@reply.legalops.work',
        source: 'random',
        status: 'active',
        is_primary: true,
        provider: 'brevo',
        provider_alias_id: null,
        metadata: {},
        created_at: '2026-03-13T09:00:00.000Z',
        updated_at: '2026-03-13T09:00:00.000Z',
      },
      {
        id: 'disabled',
        user_id: 'user',
        domain_id: 'domain',
        local_part: 'disabled',
        address: 'disabled@reply.legalops.work',
        source: 'random',
        status: 'disabled',
        is_primary: false,
        provider: 'brevo',
        provider_alias_id: null,
        metadata: {},
        created_at: '2026-03-13T08:00:00.000Z',
        updated_at: '2026-03-13T08:00:00.000Z',
      },
    ]

    expect(pickPreferredApplicationAlias(aliases)?.id).toBe('primary')
  })
})
