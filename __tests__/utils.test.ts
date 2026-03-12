import { describe, it, expect } from 'vitest'
import { stripHtml, matchesKeywords } from '@/lib/utils'

describe('stripHtml', () => {
  it('removes HTML tags', () => {
    expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world')
  })

  it('decodes HTML entities', () => {
    expect(stripHtml('R&amp;D &gt; 5 years')).toBe('R&D > 5 years')
  })

  it('collapses whitespace', () => {
    expect(stripHtml('<p>  lots   of   spaces  </p>')).toBe('lots of spaces')
  })

  it('returns empty string for empty input', () => {
    expect(stripHtml('')).toBe('')
  })
})

describe('matchesKeywords', () => {
  const KEYWORDS = ['legal operations', 'legal ops', 'clm']

  it('matches exact keyword', () => {
    expect(matchesKeywords('Head of Legal Operations', KEYWORDS)).toBe(true)
  })

  it('matches case-insensitively', () => {
    expect(matchesKeywords('LEGAL OPS Manager', KEYWORDS)).toBe(true)
  })

  it('returns false when no keyword matches', () => {
    expect(matchesKeywords('Software Engineer', KEYWORDS)).toBe(false)
  })

  it('matches partial word in title', () => {
    expect(matchesKeywords('VP of CLM Solutions', KEYWORDS)).toBe(true)
  })
})
