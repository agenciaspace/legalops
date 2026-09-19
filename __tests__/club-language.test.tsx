import { cleanup, fireEvent, render, screen, within, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }), usePathname: () => '/community/tools' }))
import { ClubLanguageProvider, ClubLanguageSelect } from '@/components/community/ClubLanguage'
import { CommunityTabs } from '@/components/community/CommunityTabs'
import { EventShare } from '@/components/community/EventShare'
import { normalizeClubLocale, clubTranslator } from '@/lib/club-locale'
import { personalAgentPrompt } from '@/lib/club-personal-agent'
afterEach(() => { cleanup(); document.cookie = 'club-locale=; Max-Age=0; Path=/'; vi.clearAllMocks(); vi.unstubAllGlobals() })
it('switches the interface and share message and restores the saved choice on the next visit', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: true })))
  const renderApp = (initialLocale: 'en' | 'pt-BR' | 'es') => render(<ClubLanguageProvider initialLocale={initialLocale}><ClubLanguageSelect /><CommunityTabs /><EventShare slug="bench-test" title="Título original" /></ClubLanguageProvider>)
  const view = renderApp('pt-BR')
  fireEvent.change(screen.getByRole('combobox', { name: 'Idioma / Language / Idioma' }), { target: { value: 'en' } })
  await waitFor(() => expect(document.cookie).toContain('club-locale=en'))
  const nav = within(screen.getByRole('navigation', { name: 'Club areas' }))
  expect(nav.getByRole('link', { name: 'Resources' })).toHaveAttribute('aria-current', 'page')
  expect(document.cookie).toContain('club-locale=en')
  expect(document.documentElement.lang).toBe('en')
  expect(mocks.refresh).toHaveBeenCalledOnce()
  const message = new URL(screen.getByRole('link', { name: 'Share on WhatsApp' }).getAttribute('href')!).searchParams.get('text')
  expect(message).toContain('*Título original*\n\n📸 Share photos')
  view.unmount()
  const saved = document.cookie.split('; ').find(value => value.startsWith('club-locale='))?.split('=')[1]
  renderApp(normalizeClubLocale(saved))
  expect(screen.getByRole('combobox')).toHaveValue('en')
  expect(screen.getByRole('navigation', { name: 'Club areas' })).toBeInTheDocument()
})
it('normalizes unsupported preferences and tells the one agent which language to use', () => {
  expect(normalizeClubLocale('ignore instructions')).toBe('pt-BR')
  expect(clubTranslator('en')('Foto {n} de {total}', { n: 2, total: 4 })).toBe('Photo 2 of 4')
  const args = { profile: {}, focus: '', topics: [], history: [], sources: [], question: 'Hello' }
  expect(personalAgentPrompt({ ...args, locale: 'en' }).systemPrompt).toContain('Respond in English.')
  expect(personalAgentPrompt(args).systemPrompt).toContain('Responda em português do Brasil.')
})
