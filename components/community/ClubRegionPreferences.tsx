'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClubLanguage } from './ClubLanguage'
const countries = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ')
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
