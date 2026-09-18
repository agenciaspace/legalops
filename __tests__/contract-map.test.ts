import { describe, it, expect } from 'vitest'
import { validMapContent, mapText, MIGRATION_PHASES, MIGRATION_STAGES, MAP_SECTION_IDS } from '@/lib/contract-map'
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

describe('CLM migration journey', () => {
  it('offers four phases with three unique stages each', () => {
    expect(MIGRATION_PHASES).toHaveLength(4); expect(MIGRATION_STAGES).toHaveLength(12)
    expect(new Set(MIGRATION_STAGES.map(stage => stage.id)).size).toBe(12)
    for (const phase of MIGRATION_PHASES) expect(MIGRATION_STAGES.filter(stage => stage.phase === phase.id)).toHaveLength(3)
    for (const stage of MIGRATION_STAGES) { expect(stage.gate.length).toBeGreaterThan(20); expect(stage.deliverable.length).toBeGreaterThan(20); expect(MAP_SECTION_IDS).toContain(stage.id); expect(clubReturnPath(`/community/tools/mapa-contratos?section=${stage.id}`)).toBeTruthy() }
  })
})
