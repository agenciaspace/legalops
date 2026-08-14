import { CalendarDays, Clock3, Grid2X2, List, MapPin, Plus, Video } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'

type Event = {
  id: string
  title: string
  description: string
  host_name: string
  starts_at: string
  ends_at: string | null
  location_label: string
  location_url: string | null
  event_type: string
}

function toCalendarTimestamp(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function googleCalendarUrl(event: Event) {
  const end = event.ends_at ?? new Date(new Date(event.starts_at).getTime() + 60 * 60 * 1000).toISOString()
  const params = new URLSearchParams({ action: 'TEMPLATE', text: event.title, dates: `${toCalendarTimestamp(event.starts_at)}/${toCalendarTimestamp(end)}`, details: event.description, location: event.location_label })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

const eventLabels: Record<string, string> = {
  encontro: 'Encontro',
  aula: 'Aula ao vivo',
  'office-hours': 'Office hours',
  networking: 'Networking',
}

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const supabase = await createServerSupabaseClient()
  const { data: rawEvents } = await supabase
    .from('community_events')
    .select('id, title, description, host_name, starts_at, ends_at, location_label, location_url, event_type')
    .eq('is_published', true)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })

  const events = (rawEvents ?? []) as Event[]

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#24231F]">Eventos</h1>
          <p className="mt-1 text-xs text-[#77746E]">Aulas, office hours e encontros da comunidade. Horário de Brasília.</p>
        </div>
        <div className="hidden rounded-lg border border-[#DFDFDB] bg-white p-1 sm:flex">
          <button className="rounded-md bg-[#F1F1EE] p-1.5 text-[#33322E]" aria-label="Visualização em lista"><List className="h-3.5 w-3.5" /></button>
          <button className="rounded-md p-1.5 text-[#999690]" aria-label="Visualização em calendário"><Grid2X2 className="h-3.5 w-3.5" /></button>
        </div>
      </header>

      <section className="mt-5 overflow-hidden rounded-xl border border-[#E1E1DD] bg-white">
        <div className="flex items-center justify-between border-b border-[#ECECE8] px-4 py-3.5 sm:px-5">
          <h2 className="text-xs font-extrabold text-[#34332F]">Próximos eventos</h2>
          <span className="rounded-md bg-[#F1F1EE] px-2 py-1 text-[8px] font-black text-[#77746E]">{events.length} AGENDADOS</span>
        </div>

        <div className="divide-y divide-[#ECECE8]">
          {events.map((event, index) => {
            const date = new Date(event.starts_at)
            const weekday = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'short' }).format(date).replace('.', '')
            const day = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit' }).format(date)
            const month = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', month: 'short' }).format(date).replace('.', '')
            const time = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(date)
            return (
              <article key={event.id} className="group grid gap-4 px-4 py-5 transition hover:bg-[#FAFAF8] sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:items-center sm:px-5">
                <div className={`flex h-16 w-16 flex-col items-center justify-center rounded-lg ${index === 0 ? 'bg-[#FFF0E9] text-[#D9470F]' : 'bg-[#F1F1EE] text-[#4C4A45]'}`}>
                  <span className="text-[8px] font-black uppercase tracking-wider">{weekday}</span>
                  <span className="mt-0.5 text-xl font-black leading-none">{day}</span>
                  <span className="mt-0.5 text-[8px] font-bold uppercase">{month}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[8px] font-black uppercase tracking-[0.1em] text-[#D9470F]">{eventLabels[event.event_type] ?? 'Encontro'}</span>
                    {index === 0 ? <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wide text-emerald-700">Próximo</span> : null}
                  </div>
                  <h3 className="mt-1.5 text-sm font-extrabold tracking-[-0.01em] text-[#292824]">{event.title}</h3>
                  <p className="mt-1.5 line-clamp-2 max-w-xl text-[10px] leading-4 text-[#7F7C76]">{event.description}</p>
                  <div className="mt-2.5 flex flex-wrap gap-3 text-[9px] font-semibold text-[#94918B]">
                    <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" /> {time}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location_label}</span>
                    <span>Com {event.host_name}</span>
                  </div>
                </div>
                <a href={event.location_url ?? googleCalendarUrl(event)} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#DFDFDB] bg-white px-3 text-[10px] font-extrabold text-[#34332F] transition hover:border-[#FFB99E] hover:text-[#D9470F]">
                  {event.location_url ? <Video className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />} {event.location_url ? 'Participar' : 'Adicionar'}
                </a>
              </article>
            )
          })}
          {events.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarDays className="mx-auto h-7 w-7 text-[#FF5C1A]" />
              <p className="mt-3 text-xs font-bold text-[#68655F]">A próxima agenda será publicada em breve.</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
