import { expect, it, vi } from 'vitest'
import { PLAYBOOK_SECTIONS, validMapContent, documentPath } from '@/lib/contract-map'
import { clubReturnPath } from '@/lib/club-return-path'
const mocks = vi.hoisted(() => ({ eq: vi.fn(), select: vi.fn(), error: null as unknown }))
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ from: () => ({ select: (fields: string) => { mocks.select(fields); return { eq: (...args: unknown[]) => { mocks.eq(...args); return { order: async () => ({ data: [], error: mocks.error }) } } } } }) }) }))
import { GET } from '@/app/api/playbook/route'
it('serves only published Playbook columns with a scoped journey and CORS', async () => {
  const response = await GET()
  expect(response.status).toBe(200)
  expect(mocks.eq).toHaveBeenCalledWith('journey','open-playbook')
  expect(mocks.select).toHaveBeenCalledWith('id,title,position,content,version,updated_at,journey')
  expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://legalops.dev')
  expect(await response.json()).toMatchObject({ journey:'open-playbook', license:'MIT' })
})
it('does not cache errors as published content', async () => {
  mocks.error = { message: 'unavailable' }
  const response = await GET()
  expect(response.status).toBe(503)
  expect(response.headers.get('Cache-Control')).toBe('no-store')
})
it('seeds valid editable documents and routes notifications and login back to the right project', () => {
  for (const section of PLAYBOOK_SECTIONS) {
    expect(validMapContent(section.content)).toBe(true)
    expect(documentPath(section.id)).toBe('/community/tools/playbook')
    const path = `/community/tools/playbook?section=${section.id}`
    expect(clubReturnPath(path)).toBe(path)
  }
  expect(documentPath('contexto')).toBe('/community/tools/mapa-contratos')
  expect(clubReturnPath('/community/tools/playbook?section=unknown')).toBe(null)
})
