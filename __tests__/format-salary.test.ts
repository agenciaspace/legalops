import { describe, expect, it } from 'vitest'
import { formatSalary, normalizeSalaryRange, parseSalaryNumber } from '@/lib/format-salary'

describe('formatSalary', () => {
  it('renders legacy inverted ranges from lowest to highest', () => {
    expect(formatSalary({
      salary_min: 8790,
      salary_max: 7550,
      salary_currency: 'BRL',
    })).toBe('R$ 7.550 – 8.790')
  })

  it('parses Brazilian thousands and cents without truncating the amount', () => {
    expect(parseSalaryNumber('R$ 10.000,00')).toBe(10000)
    expect(parseSalaryNumber('R$ 12.000,00')).toBe(12000)
  })

  it('normalizes salary fields before persistence', () => {
    expect(normalizeSalaryRange(8790, 7550)).toEqual({
      salary_min: 7550,
      salary_max: 8790,
    })
  })
})
