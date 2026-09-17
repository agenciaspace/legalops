import Link from 'next/link'
import { ArrowUpRight, CalendarDays, Clock3, GitBranch, MapPin } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasActiveClubAccess } from '@/lib/community'
import BenchClient from '../bench/BenchClient'

const dateFormat = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: 'numeric', month: 'long' })
const timeFormat = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })

export default async function BenchSection() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: member }, { data: event, error: eventError }] = await Promise.all([
    supabase.from('community_members').select('display_name,current_role,club_access_status,club_access_expires_at').eq('user_id', user?.id ?? '').maybeSingle(),
    supabase.from('community_events').select('id,title,description,host_name,starts_at,ends_at,location_label,location_url').eq('slug', 'bench-nubank-2026-09-17').eq('is_published', true).maybeSingle(),
  ])
  if (!user || !hasActiveClubAccess(member)) return <div className="px-5 py-10"><h2 className="text-2xl font-semibold">Bench</h2><p className="mt-3 text-sm">Complete seu perfil no Club para participar dos encontros.</p><Link href="/club/entrar" className="mt-4 inline-flex min-h-12 items-center underline">Completar perfil</Link></div>
  const { data: rsvp } = event ? await supabase.from('community_event_rsvps').select('response,guest_name,guest_role,organization_name,guest_email,guest_phone,dietary_restrictions,accessibility_needs,arrival_notes').eq('event_id', event.id).eq('user_id', user.id).maybeSingle() : { data: null }
  const ended = event && new Date(event.ends_at || event.starts_at).getTime() < Date.now()
  const mapUrl = event?.location_url?.startsWith('https://') ? event.location_url : null
  return <section id="bench" aria-labelledby="bench-heading" className="mt-8 scroll-mt-24 border-t border-[#CEC8BD] pt-7">
    <header className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-widest text-[#A94E38]">Eventos / Bench</p><h2 id="bench-heading" className="mt-2 text-3xl font-semibold tracking-tight">Bench</h2><p className="mt-3 text-base leading-7 text-[#625E59]">Compare ferramentas, participe dos encontros e ajude a construir referências para operações jurídicas.</p></header>
    <nav aria-label="Nesta página do Bench" className="mt-5 flex flex-wrap gap-2"><a href="#bench-ferramentas" className="inline-flex min-h-12 items-center rounded-xl border border-[#CEC8BD] bg-white px-4 text-sm font-semibold">Ferramentas</a><a href="#bench-encontros" className="inline-flex min-h-12 items-center rounded-xl border border-[#CEC8BD] bg-white px-4 text-sm font-semibold">Encontros</a></nav>
    <div className="mt-7 grid items-start gap-5 xl:grid-cols-2">
      <section id="bench-ferramentas" className="scroll-mt-24 rounded-2xl border border-[#CEC8BD] bg-white p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#A94E38]">Ferramentas / projeto aberto</p><h3 className="mt-3 text-2xl font-semibold tracking-tight">Qual CLM faz sentido para sua empresa?</h3><p className="mt-3 text-sm leading-7 text-[#625E59]">Explore o catálogo com foco no G2, escolha até quatro ferramentas e avalie 32 critérios, integrações e custo total no seu cenário.</p>
        <a href="https://legalops.dev/bench/" className="mt-5 flex min-h-12 items-center justify-between gap-3 rounded-xl bg-[#24231F] px-4 py-3 text-sm font-semibold text-white">Abrir avaliação de CLM <ArrowUpRight className="h-5 w-5 shrink-0" /></a>
        <a href="https://legalops.dev/bench/#contribuir" className="mt-2 flex min-h-12 items-center justify-between gap-3 rounded-xl border border-[#CEC8BD] px-4 py-3 text-sm font-semibold">Compartilhar uma experiência <ArrowUpRight className="h-5 w-5 shrink-0" /></a>
        <div className="mt-5 flex flex-wrap gap-x-4 border-t border-[#E6DED0] pt-3"><a href="https://legalops.dev/bench/apresentacao" className="inline-flex min-h-11 items-center text-sm underline">Apresentação</a><a href="https://github.com/agenciaspace/clm-bench" className="inline-flex min-h-11 items-center gap-2 text-sm underline"><GitBranch className="h-4 w-4" />Código aberto</a></div><p className="mt-2 text-xs leading-5 text-[#817A73]">Avaliação pública no legalops.dev. Contribuições passam por revisão antes de publicar.</p>
      </section>
      <section id="bench-encontros" className="scroll-mt-24 rounded-2xl border border-[#CEC8BD] bg-white p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#A94E38]">Encontros / troca entre profissionais</p>
        {event ? <><div className="mt-3 flex flex-wrap items-start justify-between gap-3"><h3 className="text-2xl font-semibold tracking-tight">{event.title}</h3><span className="rounded-full bg-[#F3F0E8] px-3 py-1 text-xs font-semibold">{ended ? 'Realizado' : rsvp?.response === 'confirmed' ? 'Presença confirmada' : 'Presencial'}</span></div>
          <dl className="mt-5 space-y-4 text-sm leading-6"><div className="flex gap-3"><CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-[#A94E38]" /><div><dt className="sr-only">Data</dt><dd>{dateFormat.format(new Date(event.starts_at))}</dd></div></div><div className="flex gap-3"><Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#A94E38]" /><div><dt className="sr-only">Horário</dt><dd>{timeFormat.format(new Date(event.starts_at))}{event.ends_at ? ` às ${timeFormat.format(new Date(event.ends_at))}` : ''} · Brasília</dd></div></div><div className="flex gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#A94E38]" /><div><dt className="sr-only">Local</dt><dd className="break-words">{event.location_label}</dd></div></div></dl>
          {mapUrl ? <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-12 items-center gap-2 text-sm font-semibold underline">Ver endereço no mapa <ArrowUpRight className="h-4 w-4" /></a> : null}
          <details className="mt-3 border-t border-[#E6DED0] pt-2"><summary className="min-h-12 cursor-pointer py-3 text-sm font-semibold">Sobre o encontro</summary><p className="pb-4 text-sm leading-7 text-[#625E59]">{event.description}</p></details>
          {!ended ? <details className="mt-2 rounded-xl bg-[#F5F1E8] p-4"><summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold">{rsvp?.response === 'confirmed' ? 'Revisar minha participação' : 'Confirmar minha participação'}</summary><p className="mt-2 text-sm leading-6 text-[#625E59]">Seus dados são usados para organizar a recepção.</p><div className="mt-5"><BenchClient eventId={event.id} initial={rsvp} member={{ name: member?.display_name || user.email?.split('@')[0] || 'Membro LegalOps', role: member?.current_role || '', email: user.email || '' }} /></div></details> : null}
        </> : <><h3 className="mt-3 text-2xl font-semibold">Próximos encontros</h3><p className="mt-3 text-sm leading-7 text-[#625E59]">{eventError ? 'Não conseguimos carregar a programação. Tente novamente.' : 'As próximas datas serão publicadas aqui.'}</p></>}
      </section>
    </div>
  </section>
}
