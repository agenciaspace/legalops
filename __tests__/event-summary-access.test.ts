import { describe, expect, it, vi } from 'vitest'
import { loadEventWhatsAppSummaries } from '@/lib/event-whatsapp-summaries'

function client(user: object | null, result = { data: [{ id: 'private-summary' }], error: null as object | null }) {
  const query: any = { select: vi.fn(() => query), eq: vi.fn(() => query), order: vi.fn(() => query), limit: vi.fn(async () => result) }
  const db = { auth: { getUser: vi.fn(async () => ({ data: { user }, error: null })) }, from: vi.fn(() => query) }
  return { db, query }
}

describe('private event summaries', () => {
  it.each([null, { id: 'anonymous-auth', is_anonymous: true }])('never queries group content without a real signed-in account: %j', async user => {
    const { db } = client(user)
    expect(await loadEventWhatsAppSummaries(db as never, 'event')).toEqual({ summaries: [], status: 'signed-out' })
    expect(db.from).not.toHaveBeenCalled()
  })
  it('uses the signed-in client and filters the requested event', async () => {
    const { db, query } = client({ id: 'member' })
    expect(await loadEventWhatsAppSummaries(db as never, 'event')).toEqual({ summaries: [{ id: 'private-summary' }], status: 'ready' })
    expect(db.from).toHaveBeenCalledWith('community_event_whatsapp_summaries')
    expect(query.eq).toHaveBeenCalledWith('event_id', 'event')
  })
  it('distinguishes a database failure from an empty archive', async () => {
    const { db } = client({ id: 'member' }, { data: [], error: { code: '42501' } })
    expect(await loadEventWhatsAppSummaries(db as never, 'event')).toEqual({ summaries: [], status: 'error' })
  })
  it('does not leak rows when authentication has failed', async () => {
    const { db } = client({ id: 'stale' })
    db.auth.getUser.mockResolvedValue({ data: { user: { id: 'stale' } }, error: { message: 'expired' } } as never)
    expect((await loadEventWhatsAppSummaries(db as never, 'event')).status).toBe('signed-out')
    expect(db.from).not.toHaveBeenCalled()
  })
})
