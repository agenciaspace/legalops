// @vitest-environment node
import { File } from 'node:buffer'
import { beforeEach, expect, it, vi } from 'vitest'
const state = vi.hoisted(() => ({
  user: { id: 'owner', email_confirmed_at: '2026-09-16' } as any,
  member: true, offer: { active: true, price_cents: 12300, period_months: 1 } as any,
  order: { id: 'purchase', status: 'pending' } as any,
  saved: true, insert: vi.fn(), upload: vi.fn(), remove: vi.fn(), filters: [] as unknown[][],
}))
vi.mock('next/navigation', () => ({ redirect: (path: string) => { throw new Error(`REDIRECT:${path}`) } }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/supabase-server', () => ({ createServerSupabaseClient: async () => ({
  auth: { getUser: async () => ({ data: { user: state.user } }) },
  from: () => { const q: any = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: state.member ? { club_access_status: 'active' } : null }) }; return q },
}) }))
vi.mock('@/lib/supabase-admin', () => ({ createAdminClient: () => ({
  from: (table: string) => {
    const q: any = { select: () => q, eq: (key: string, value: unknown) => { state.filters.push([table, key, value]); return q },
      single: async () => ({ data: state.offer }), maybeSingle: async () => ({ data: state.order }),
      insert: state.insert, update: () => q,
      then: (resolve: (v: unknown) => unknown) => resolve({ data: state.saved ? [{ id: 'purchase' }] : [], error: null }),
    }; return q
  },
  storage: { from: () => ({ upload: state.upload, remove: state.remove }) },
}) }))
import { createProOrder, submitProReceipt } from '@/app/club/checkout/actions'
beforeEach(() => {
  vi.clearAllMocks(); vi.stubGlobal('File', File)
  state.user = { id: 'owner', email_confirmed_at: '2026-09-16' }; state.member = true
  state.offer = { active: true, price_cents: 12300, period_months: 1 }
  state.order = { id: 'purchase', status: 'pending' }; state.saved = true; state.filters = []
  state.insert.mockResolvedValue({ error: null }); state.upload.mockResolvedValue({ error: null })
})
function receipt(content = '%PDF-1.4 test') {
  const data = new FormData(); data.set('order_id', 'purchase')
  data.set('receipt', new File([content], 'receipt.pdf', { type: 'application/pdf' }) as any)
  return data
}
it('requires confirmed membership before creating a payment order', async () => {
  state.user = null
  await expect(createProOrder()).rejects.toThrow('REDIRECT:/login')
  expect(state.insert).not.toHaveBeenCalled()
  state.user = { id: 'owner', email_confirmed_at: 'today' }; state.member = false
  await expect(createProOrder()).rejects.toThrow('REDIRECT:/club/entrar')
  expect(state.insert).not.toHaveBeenCalled()
})
it('snapshots only the active server price and period', async () => {
  state.offer.active = false
  await expect(createProOrder()).rejects.toThrow('error=unavailable')
  expect(state.insert).not.toHaveBeenCalled()
  state.offer.active = true
  await expect(createProOrder()).rejects.toThrow('REDIRECT:/club/checkout')
  expect(state.insert).toHaveBeenCalledWith({ user_id: 'owner', price_cents: 12300, period_months: 1 })
})
it('rejects missing or submitted orders and disguised receipt files', async () => {
  state.order = null
  expect((await submitProReceipt(receipt())).ok).toBe(false)
  state.order = { id: 'purchase', status: 'submitted' }
  expect((await submitProReceipt(receipt())).ok).toBe(false)
  state.order.status = 'pending'
  expect((await submitProReceipt(receipt('<html>not a receipt</html>'))).ok).toBe(false)
  expect(state.upload).not.toHaveBeenCalled()
  expect(state.filters).toContainEqual(['club_pro_orders', 'user_id', 'owner'])
})
it('removes an uploaded receipt if another request already submitted the order', async () => {
  state.saved = false
  expect((await submitProReceipt(receipt())).ok).toBe(false)
  expect(state.upload).toHaveBeenCalledOnce()
  expect(state.remove).toHaveBeenCalledWith([expect.stringMatching(/^owner\/purchase\/.+\.pdf$/)])
})
