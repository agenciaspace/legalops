import { CalendarDays, Clock3, MapPin, Navigation, Users } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasActiveClubAccess } from '@/lib/community'
import BenchClient from './BenchClient'

export const dynamic = 'force-dynamic'

export default async function BenchPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: member }, { data: event }] = await Promise.all([
    supabase.from('community_members').select('display_name, current_role, club_access_status, club_access_expires_at').eq('user_id', user?.id ?? '').maybeSingle(),
    supabase.from('community_events').select('id, title, description, host_name, starts_at, ends_at, location_label, location_url').eq('slug', 'bench-nubank-2026-09-17').maybeSingle(),
  ])
  if (!user || !hasActiveClubAccess(member) || !event) return <div className="mx-auto max-w-3xl px-5 py-16"><h1 className="text-2xl font-black">Bench LegalOps</h1><p className="mt-2 text-sm text-[#77746E]">Este encontro está disponível para membros ativos do Club.</p></div>
  const { data: rsvp } = await supabase.from('community_event_rsvps').select('*').eq('event_id', event.id).eq('user_id', user.id).maybeSingle()
  const date = new Date(event.starts_at)
  const activeMember = member!
  return <main className="mx-auto w-full max-w-[1000px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9"><div className="grid gap-5 lg:grid-cols-[1.05fr_.95fr]"><section className="rounded-2xl bg-[#292824] p-6 text-[#F8F4EA] sm:p-9"><span className="text-[10px] font-black uppercase tracking-[.18em] text-[#FFB092]">Primeiro Bench · presencial</span><h1 className="mt-4 max-w-xl text-3xl font-black tracking-[-.04em] sm:text-5xl">Bench LegalOps no Nubank</h1><p className="mt-4 max-w-xl text-sm leading-6 text-[#D7D0C3]">{event.description}</p><div className="mt-8 space-y-3 text-xs font-bold"><div className="flex gap-3"><CalendarDays className="h-4 w-4 text-[#FF9B76]" /> Quinta-feira, 17 de setembro de 2026</div><div className="flex gap-3"><Clock3 className="h-4 w-4 text-[#FF9B76]" /> 19h às 21h · horário de Brasília</div><div className="flex gap-3"><MapPin className="h-4 w-4 text-[#FF9B76]" /> Nubank · Pinheiros, São Paulo</div></div><a href={event.location_url ?? '#'} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#F8F4EA] px-4 py-2.5 text-xs font-black text-[#292824]"><Navigation className="h-3.5 w-3.5" /> Abrir endereço no mapa</a></section><section className="rounded-2xl border border-[#E1E1DD] bg-white p-5 sm:p-7"><div className="flex items-start justify-between gap-3"><div><span className="text-[10px] font-black uppercase tracking-[.14em] text-[#D9470F]">Sua participação</span><h2 className="mt-2 text-xl font-black text-[#292824]">Confirme seus dados</h2></div><Users className="h-5 w-5 text-[#D9470F]" /></div><p className="mt-2 text-xs leading-5 text-[#77746E]">Precisamos dessas informações para organizar a recepção e tornar a conversa melhor para todo mundo.</p><div className="mt-6"><BenchClient eventId={event.id} initial={rsvp} member={{ name: activeMember.display_name || user.email?.split('@')[0] || 'Membro LegalOps', role: activeMember.current_role || '', email: user.email || '' }} /></div></section></div></main>
}
