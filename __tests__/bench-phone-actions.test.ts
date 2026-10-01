import { beforeEach, expect, it, vi } from 'vitest'
const state = vi.hoisted(() => ({ insert: vi.fn(), email: vi.fn(), offline: false, from: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`) } }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/supabase-admin', () => ({ createAdminClient: () => ({ from: state.from }) }))
vi.mock('@/lib/club-email-delivery', () => ({ sendClubTransactionalEmail: state.email }))
import { registerPublicEvent } from '@/app/(main)/community/actions'

beforeEach(() => {
  vi.clearAllMocks()
  state.offline = false
  state.from.mockImplementation((table: string) => {
    const q: any = {
      select: () => q, eq: () => q, abortSignal: () => q,
      insert: (row: unknown) => { state.insert(row); return q },
      maybeSingle: async () => ({ data: state.offline ? null : table === 'community_events'
        ? { id: 'event', slug: 'bench-netlex-2026', google_event_id: null }
        : { id: 'rsvp' }, error: null }),
    }
    return q
  })
})
function form(phone: string) {
  const data = new FormData()
  for (const [key, value] of Object.entries({ event_slug: 'bench-netlex-2026', name: 'Test Person', email: 'test@example.invalid', role: 'Legal Ops', organization: 'Example', phone })) data.set(key,value)
  return data
}
it('rejects missing phone before any database writes or messages', async () => {
  await expect(registerPublicEvent(form(''))).rejects.toThrow('registration=phone')
  expect(state.from).not.toHaveBeenCalled()
  expect(state.email).not.toHaveBeenCalled()
})
it('persists the normalized phone with the public registration', async () => {
  await expect(registerPublicEvent(form('+55 (11) 99999-1234'))).rejects.toThrow('registered=1')
  expect(state.insert).toHaveBeenCalledWith(expect.objectContaining({ guest_phone: '+5511999991234' }))
})
it('includes the phone in the organizer fallback when the database is unavailable', async () => {
  state.offline = true
  vi.stubEnv('LEGALOPS_ADMIN_EMAILS','organizer@example.invalid')
  try {
    await expect(registerPublicEvent(form('+55 (11) 99999-1234'))).rejects.toThrow('registered=1')
    expect(state.email).toHaveBeenCalledWith(expect.objectContaining({ textBody: expect.stringContaining('WhatsApp: +5511999991234') }))
  } finally { vi.unstubAllEnvs() }
})
