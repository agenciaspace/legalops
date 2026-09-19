'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClubLanguage } from './ClubLanguage'
import { COUNTRY_CODES as countries } from '@/lib/club-countries'
export function ClubRegionPreferences({ country, timezone }: { country?: string | null; timezone?: string | null }) {
  const { locale, t } = useClubLanguage()
  const router = useRouter()
  const [status, setStatus] = useState('')
  const labels = new Intl.DisplayNames([locale], { type: 'region' })
  const zones = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : ['America/Sao_Paulo', 'Europe/Madrid', 'America/New_York']
  return <details className="my-5 rounded-lg border border-[#CEC8BD] p-4"><summary className="min-h-11 cursor-pointer text-sm font-semibold">{t('País e fuso horário')}</summary><form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={async event => {
    event.preventDefault(); setStatus('Salvando…')
    const form = new FormData(event.currentTarget)
    try {
      const response = await fetch('/api/account/preferences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locale, country: form.get('country'), timezone: form.get('timezone') }) })
      setStatus(response.ok ? 'Preferências salvas.' : 'Não conseguimos salvar. Tente novamente.')
      if (response.ok) router.refresh()
    } catch { setStatus('Não conseguimos salvar. Tente novamente.') }
  }}><label className="text-sm">{t('País')}<select name="country" defaultValue={country ?? ''} className="mt-2 min-h-11 w-full rounded-lg border bg-white px-3"><option value="">{t('Selecione')}</option>{countries.map(code => <option key={code} value={code}>{labels.of(code)}</option>)}</select></label><label className="text-sm">{t('Fuso horário')}<select name="timezone" defaultValue={timezone || Intl.DateTimeFormat().resolvedOptions().timeZone} className="mt-2 min-h-11 w-full rounded-lg border bg-white px-3"><option value="UTC">UTC</option>{zones.map(zone => <option key={zone} value={zone}>{zone.replaceAll('_', ' ')}</option>)}</select></label><p className="text-xs text-[#69635E] sm:col-span-2">{t('Idioma, país e fuso são escolhas independentes. Os eventos usam seu fuso horário.')}</p><button className="min-h-11 rounded-lg bg-[#111] px-4 text-sm text-white">{t('Salvar preferências')}</button><p role="status" className="text-xs">{t(status)}</p></form></details>
}
