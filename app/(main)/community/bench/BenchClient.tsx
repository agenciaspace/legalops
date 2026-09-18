'use client'
import { useClubLanguage } from '@/components/community/ClubLanguage'


import { useState } from 'react'
import { confirmBenchAttendance, declineBenchAttendance } from '../actions'

type Props = { eventId: string; initial: Record<string, string | null> | null; member: { name: string; role: string; email: string } }
const fields = [
  {key:'name',label:'Nome completo',type:'text',autocomplete:'name',required:true,max:120},
  {key:'email',label:'Email',type:'email',autocomplete:'email',required:true,max:240},
  {key:'role',label:'Cargo / atuação',type:'text',autocomplete:'organization-title',required:true,max:120},
  {key:'organization',label:'Empresa / organização',type:'text',autocomplete:'organization',required:true,max:120},
  {key:'phone',label:'Celular para contato',type:'tel',autocomplete:'tel',required:false,max:40},
] as const
export default function BenchClient({ eventId, initial, member }: Props) {
 const { t } = useClubLanguage()

  const [response, setResponse] = useState(initial?.response ?? 'pending')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  const [form, setForm] = useState({ name: initial?.guest_name || member.name, role: initial?.guest_role || member.role || '', organization: initial?.organization_name || '', email: initial?.guest_email || member.email, phone: initial?.guest_phone || '', dietary: initial?.dietary_restrictions || '', accessibility: initial?.accessibility_needs || '', notes: initial?.arrival_notes || '' })
  const update = (key: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [key]: value }))
  async function save(decline = false) {
    if (busy) return
    setBusy(true); setMessage(''); setFailed(false)
    try {
      const data = new FormData(); data.set('event_id', eventId)
      Object.entries(form).forEach(([key, value]) => data.set(key, value))
      const result = await (decline ? declineBenchAttendance(data) : confirmBenchAttendance(data))
      if (result.ok) setResponse(decline ? 'declined' : 'confirmed')
      setFailed(!result.ok); setMessage(result.message)
    } catch { setFailed(true); setMessage('Não foi possível salvar. Seus dados continuam no formulário; tente novamente.') }
    finally { setBusy(false) }
  }
  return <form onSubmit={event => {event.preventDefault(); void save()}} className="space-y-5" aria-busy={busy}>
    <fieldset disabled={busy} className="space-y-4"><legend className="sr-only">{t("Dados de participação")}</legend>
      {fields.map(field => <label key={field.key} className="block text-sm font-medium text-[#4C4A45]">{t(field.label)}{field.required ? ' *' : ''}<input name={field.key} required={field.required} type={field.type} autoComplete={field.autocomplete} maxLength={field.max} value={form[field.key]} onChange={event => update(field.key,event.target.value)} className="mt-2 min-h-12 w-full min-w-0 rounded-xl border border-[#CEC8BD] bg-white px-3 py-3 text-base font-normal focus:border-[#A94E38]" /></label>)}
      <details><summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">{t("Acessibilidade, alimentação e chegada")}</summary><div className="mt-2 space-y-4">{([['dietary',t("Restrições alimentares"),500],['accessibility',t("Necessidades de acessibilidade"),500],['notes',t("Observações para chegada"),1000]] as const).map(([key,label,max]) => <label key={key} className="block text-sm font-medium">{t(label)}<textarea name={key} value={form[key]} onChange={event => update(key,event.target.value)} rows={2} maxLength={max} className="mt-2 w-full min-w-0 rounded-xl border border-[#CEC8BD] bg-white px-3 py-3 text-base font-normal" /></label>)}</div></details>
    </fieldset>
    <p className="text-xs text-[#625E59]">{t("* Campos obrigatórios")}</p>
    {message ? <p role={failed ? 'alert' : 'status'} className={`rounded-xl px-4 py-3 text-sm leading-6 ${failed ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>{t(message)}</p> : null}
    <div className="grid gap-2"><button disabled={busy} className="min-h-12 rounded-xl bg-[#24231F] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? t("Salvando…") : response === 'confirmed' ? t("Atualizar confirmação") : t("Confirmar presença")}</button>{response === 'confirmed' ? <button type="button" disabled={busy} onClick={() => void save(true)} className="min-h-12 rounded-xl border border-[#CEC8BD] px-4 py-3 text-sm font-semibold disabled:opacity-50">{t("Não poderei ir")}</button> : null}</div>
  </form>
}
