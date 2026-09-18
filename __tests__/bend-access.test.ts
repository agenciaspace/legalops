import { expect, it } from 'vitest'
import { hasActiveClubAccess } from '@/lib/community'
import { hasClubProAccess } from '@/lib/club-membership'

it('keeps community admission independent of a paid Pro entitlement', () => {
  const member = { club_access_status: 'active', club_pro_status: 'inactive' }
  expect(hasActiveClubAccess(member)).toBe(true)
  expect(hasClubProAccess(member)).toBe(false)
})
it('denies absent, unknown, expired and malformed entitlements in both host adapters', () => {
  const now = new Date('2026-09-18T12:00:00Z')
  for (const status of [null, 'inactive', 'unknown', 'active', 'complimentary']) {
    for (const expiry of [null, 'invalid date', '2026-09-18T12:00:00Z', '2026-09-18T12:00:01Z']) {
      const expected = ['active', 'complimentary'].includes(status ?? '') && (!expiry || new Date(expiry).getTime() > now.getTime())
      expect(hasActiveClubAccess({ club_access_status: status, club_access_expires_at: expiry }, now)).toBe(expected)
      expect(hasClubProAccess({ club_pro_status: status, club_pro_expires_at: expiry }, now)).toBe(expected)
    }
  }
  expect(hasActiveClubAccess(null, now)).toBe(false)
  expect(hasClubProAccess(null, now)).toBe(false)
})
