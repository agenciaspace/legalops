'use client'

import { useState } from 'react'
import { confirmBenchAttendance, declineBenchAttendance } from '../actions'

type Props = { eventId: string; initial: Record<string, string | null> | null; member: { name: string; role: string; email: string } }

export default function BenchClient({ eventId, initial, member }: Props) {
  const [response, setResponse] = useState(initial?.response ?? 'pending')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ name: initial?.guest_name || member.name, role: initial?.guest_role || member.role || 'Legal Operations', organization: initial?.organization_name || '', email: initial?.guest_email || member.email, phone: initial?.guest_phone || '', dietary: initial?.dietary_restrictions || '', accessibility: initial?.accessibility_needs || '', notes: initial?.arrival_notes || '' })
  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }))
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('')
    const data = new FormData(); data.set('event_id', eventId); Object.entries(form).forEach(([key, value]) => data.set(key, value))
    const result = await confirmBenchAttendance(data); setBusy(false); setResponse(result.ok ? 'confirmed' : 'pending'); setMessage(result.message)
  }
  async function decline() { setBusy(true); const data = new FormData(); data.set('event_id', eventId); const result = await declineBenchAttendance(data); setBusy(false); setResponse('declined'); setMessage(result.message) }
  const input = (key: string, label: string, required = false) => <label className="block text-xs font-bold text-[#4C4A45]">{label}<input required={required} value={form[key as keyof typeof form]} onChange={e => update(key, e.target.value)} className="mt-1.5 w-full rounded-lg border border-[#DFDFDB] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-[#D9470F]" /></label>
  return <form onSubmit={submit} className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2">{input('name', 'Nome completo', true)}{input('email', 'E-mail', true)}{input('role', 'Cargo / atuação', true)}{input('organization', 'Empresa / organização', true)}{input('phone', 'Celular para contato')} </div>
    <div className="grid gap-3 sm:grid-cols-2">{input('dietary', 'Restrições alimentares')}{input('accessibility', 'Acessibilidade')}</div>
    <label className="block text-xs font-bold text-[#4C4A45]">Observações para chegada<textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={3} className="mt-1.5 w-full rounded-lg border border-[#DFDFDB] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-[#D9470F]" /></label>
    {message && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">{message}</p>}
    <div className="flex flex-wrap gap-2"><button disabled={busy} className="rounded-lg bg-[#D9470F] px-4 py-2.5 text-xs font-extrabold text-white disabled:opacity-50">{busy ? 'Salvando...' : response === 'confirmed' ? 'Atualizar confirmação' : 'Confirmar presença'}</button>{response === 'confirmed' && <button type="button" disabled={busy} onClick={decline} className="rounded-lg border border-[#DFDFDB] px-4 py-2.5 text-xs font-bold text-[#5E5A54]">Não poderei ir</button>}</div>
  </form>
}
