import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { validateTranslationPayload, translateClubPayload } from '@/lib/club-translation-model'
import { clubTranslator, browserClubLocale } from '@/lib/club-locale'
import { ClubLanguageProvider } from '@/components/community/ClubLanguage'
import { TranslatedContent } from '@/components/community/TranslatedContent'
import type { TranslationSource } from '@/lib/club-translations'
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it('rejects changed numbers, URLs, mentions, code, keys and array lengths', () => {
  const original = { title: 'Contrato de R$ 1.234,56 em 22/09', body: 'Veja https://example.com/legal @Ana `approve=false`', points: ['CLM 20%'], empty: null }
  expect(validateTranslationPayload(original, { ...original, title: 'Contract for R$ 1.234,56 on 22/09' })).toBe(true)
  for (const changed of [
    { ...original, title: 'Contract for R$ 1,234.56 on 22/09' },
    { ...original, body: 'https://evil.example @Ana `approve=false`' },
    { ...original, body: 'https://example.com/legal @Bob `approve=false`' },
    { ...original, body: 'https://example.com/legal @Ana `approve=true`' },
    { ...original, points: [] }, { ...original, empty: '' }, { ...original, extra: 'invented' },
  ]) expect(validateTranslationPayload(original, changed)).toBe(false)
})
it('protects opaque values before sending text and restores them after validated output', async () => {
  const original = { body: 'Contrato R$ 100 em https://example.com @Ana `x=1`' }
  const provider = vi.fn(async (_url: string, options: RequestInit) => {
    const request = JSON.parse(String(options.body))
    const protectedInput = JSON.parse(request.messages[1].content).content
    expect(protectedInput.body).not.toContain('https://example.com')
    expect(request.provider).toEqual({ data_collection: 'deny', zdr: true })
    return Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ detected_locale: 'pt', translations: { 'pt-BR': protectedInput, en: { body: protectedInput.body.replace('Contrato', 'Contract') }, es: { body: protectedInput.body.replace('Contrato', 'Contrato traducido') } } }) } }], usage: { cost: 0.001 } })
  })
  vi.stubGlobal('fetch', provider)
  const result = await translateClubPayload(original, null, 'test-key')
  expect(result.detected_locale).toBe('pt-BR')
  expect(result.translations.en.body).toBe('Contract R$ 100 em https://example.com @Ana `x=1`')
  expect(result.translations['pt-BR']).toEqual(original)
  expect(provider).toHaveBeenCalledOnce()
})
it('fails closed on provider errors and avoids a model call for empty text', async () => {
  const provider = vi.fn(async () => Response.json({ error: 'provider down' }, { status: 503 }))
  vi.stubGlobal('fetch', provider)
  await expect(translateClubPayload({ body: 'Olá' }, null, 'test-key')).rejects.toThrow('translation_provider_failed')
  provider.mockClear()
  expect((await translateClubPayload({ body: '', empty: null }, 'es', 'test-key')).usage.cost).toBe(0)
  expect(provider).not.toHaveBeenCalled()
  await expect(translateClubPayload({ body: 'x'.repeat(20001) }, null, 'test-key')).rejects.toThrow('translation_input_too_large')
})
it('does not flash original text while pending and makes viewing it an explicit choice', () => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: true })))
  const source: TranslationSource = { id: 'test', entity_type: 'post', entity_id: 'post', revision: 1, payload: { body: 'Texto original privado' }, status: 'pending', detected_locale: 'pt-BR', locale_hint: null, translations: {} }
  const app = (locale: 'en' | 'es', next = source) => <ClubLanguageProvider initialLocale={locale}><TranslatedContent original={next.payload} source={next} enabled serverLocale={locale} /></ClubLanguageProvider>
  const view = render(app('en'))
  expect(screen.queryByText('Texto original privado')).not.toBeInTheDocument()
  expect(screen.getByRole('status')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: clubTranslator('en')('Ver original') }))
  expect(screen.getByText('Texto original privado')).toBeInTheDocument()
  view.rerender(app('es'))
  expect(screen.queryByText('Texto original privado')).not.toBeInTheDocument()
  view.rerender(app('es', { ...source, status: 'ready', translations: { es: { body: 'Texto traducido' } } }))
  expect(screen.getByText('Texto traducido')).toBeInTheDocument()
  view.rerender(app('es', { ...source, revision: 2, payload: { body: 'Original editado' } }))
  expect(screen.queryByText('Texto traducido')).not.toBeInTheDocument()
  expect(screen.queryByText('Original editado')).not.toBeInTheDocument()
})
it('supports browser language priorities, Spanish labels and the Spanish agent', () => {
  expect(browserClubLocale('fr-FR;q=1,es-MX;q=0.9,en;q=0.8')).toBe('es')
  expect(clubTranslator('es')('Ver original')).toBe('Ver original')
})
