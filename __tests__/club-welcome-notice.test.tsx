import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { ClubWelcomeNotice } from '@/components/community/ClubWelcomeNotice'
afterEach(() => { cleanup(); vi.unstubAllGlobals() })
it('requests pending welcome messages when a member enters the community', async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ clubSent: true }) })
  vi.stubGlobal('fetch', fetch)
  render(<ClubWelcomeNotice />)
  expect(await screen.findByRole('status')).toHaveTextContent('convite do WhatsApp')
  expect(fetch).toHaveBeenCalledWith('/api/auth/welcome', { method: 'POST' })
})
it('lets the member retry failed delivery', async () => {
  const fetch = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValue({ ok: true, json: async () => ({ clubSent: true }) })
  vi.stubGlobal('fetch', fetch)
  render(<ClubWelcomeNotice />)
  fireEvent.click(await screen.findByRole('button', { name: 'Tentar enviar novamente' }))
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Boas-vindas enviadas'))
  expect(fetch).toHaveBeenCalledTimes(2)
})
