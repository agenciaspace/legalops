import { describe, expect, it } from 'vitest'
import {
  CLUB_LAUNCH_MEMBER_GOAL,
  CLUB_LAUNCH_REVENUE,
  CLUB_LAUNCH_TIERS,
  getTierCapacity,
  getTierRevenue,
} from '@/lib/club-pricing'
import { hasActiveClubAccess } from '@/lib/community'

describe('LegalOps Club launch pricing', () => {
  it('reaches the R$ 200k launch target with 380 members', () => {
    expect(CLUB_LAUNCH_MEMBER_GOAL).toBe(380)
    expect(CLUB_LAUNCH_REVENUE).toBe(200_620)
  })

  it('keeps cohorts continuous and calculates each tier revenue', () => {
    expect(CLUB_LAUNCH_TIERS.map(getTierCapacity)).toEqual([50, 50, 100, 180])
    expect(CLUB_LAUNCH_TIERS.map(getTierRevenue)).toEqual([9_950, 14_950, 49_900, 125_820])
    expect(CLUB_LAUNCH_TIERS[1].memberFrom).toBe(CLUB_LAUNCH_TIERS[0].memberTo + 1)
  })
})

describe('LegalOps Club access', () => {
  it('accepts active and complimentary access that has not expired', () => {
    const now = new Date('2026-08-13T12:00:00Z')
    expect(hasActiveClubAccess({ club_access_status: 'active' }, now)).toBe(true)
    expect(hasActiveClubAccess({ club_access_status: 'complimentary' }, now)).toBe(true)
    expect(hasActiveClubAccess({ club_access_status: 'active', club_access_expires_at: '2026-08-14T12:00:00Z' }, now)).toBe(true)
  })

  it('rejects inactive, canceled and expired access', () => {
    const now = new Date('2026-08-13T12:00:00Z')
    expect(hasActiveClubAccess({ club_access_status: 'inactive' }, now)).toBe(false)
    expect(hasActiveClubAccess({ club_access_status: 'canceled' }, now)).toBe(false)
    expect(hasActiveClubAccess({ club_access_status: 'active', club_access_expires_at: '2026-08-12T12:00:00Z' }, now)).toBe(false)
  })
})
