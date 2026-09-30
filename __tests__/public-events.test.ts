import { describe, expect, it } from 'vitest'
import { getPublicEventFallback } from '@/lib/public-events'

describe('public event fallback', () => {
  it('keeps the NetLex Bench public without inventing a date or format', () => {
    const event = getPublicEventFallback('bench-netlex-2026')
    expect(event?.is_published).toBe(true)
    expect(event?.title).toContain('NetLex')
    expect(event?.location_label).toContain('Data a confirmar')
    expect(event?.location_label).toContain('formato a confirmar')
    expect(event?.pre_questions).toHaveLength(4)
  })

  it('keeps the honorários Bench public and explicitly includes legal departments', () => {
    const event = getPublicEventFallback('bench-honorarios-exito-2026')
    expect(event?.is_published).toBe(true)
    expect(event?.description).toContain('departamentos jurídicos')
    expect(event?.description).toContain('escritórios')
    expect(event?.pre_questions).toHaveLength(4)
  })

  it('does not expose an unreviewed event', () => {
    expect(getPublicEventFallback('evento-inexistente')).toBeNull()
  })
})
