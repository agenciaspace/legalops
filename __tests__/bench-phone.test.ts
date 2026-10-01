import { expect, it } from 'vitest'
import { normalizeBenchPhone } from '@/lib/bench-phone'

it('normalizes explicit international numbers without inventing a country or ninth digit', () => {
  expect(normalizeBenchPhone('+55 (11) 99999-1234')).toBe('+5511999991234')
  expect(normalizeBenchPhone('+55 41 8888-1234')).toBe('+554188881234')
  expect(normalizeBenchPhone('+1 202 555 0123')).toBe('+12025550123')
})
it.each(['', '11999991234', '+55', '+00123456789', '+551199999123456789', '+5511999991234abc', '+55 11 9999'])('rejects missing or malformed phone: %s', value => {
  expect(normalizeBenchPhone(value)).toBeNull()
})
