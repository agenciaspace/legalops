import { describe, it, expect } from 'vitest'
import { validMapContent, mapText } from '@/lib/contract-map'
import { clubReturnPath } from '@/lib/club-return-path'
import { googleReturnPath } from '@/lib/google-login'
const document = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Contribuição aberta', marks: [{ type: 'bold' }] }] }] }
describe('Collaborative map content and entry paths', () => {
  it('accepts basic Tiptap text and formatting', () => { expect(validMapContent(document)).toBe(true); expect(mapText(document)).toBe('Contribuição aberta') })
  it.each([
    { type: 'doc', content: [{ type: 'image', attrs: { src: 'https://example.com' } }] },
    { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'link', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] }] },
    { type: 'doc', content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'wrong' }] }] },
    { type: 'doc', content: [{ type: 'paragraph' }] },
    { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x'.repeat(60001) }] }] },
    { type: 'doc', content: [{ type: 'paragraph', onload: 'alert(1)' }] },
    { type: 'doc', content: [{ type: '__proto__' }] },
  ])('rejects unsupported or unsafe document content', value => expect(validMapContent(value)).toBe(false))
  it('preserves the selected map stage through onboarding and Google signup', () => {
    const path = '/community/tools/mapa-contratos?section=assinatura'
    expect(clubReturnPath(path)).toBe(path)
    expect(googleReturnPath(path)).toBe(`/club/entrar?next=${encodeURIComponent(path)}`)
    expect(googleReturnPath(`/club/entrar?next=${encodeURIComponent(path)}`)).toBe(googleReturnPath(path))
  })
  it.each(['//evil.test', '/\\evil.test', 'https://evil.test', '/community/tools/mapa-contratos?section=unknown', '/community/tools/mapa-contratos?section=assinatura&next=https://evil.test'])('rejects unexpected return destinations', path => { expect(clubReturnPath(path)).toBeNull(); expect(googleReturnPath(path)).toBe('/club/entrar') })
})
