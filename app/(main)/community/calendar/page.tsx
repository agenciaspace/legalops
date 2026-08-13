import { CalendarDays, Clock3, MapPin, Plus } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { formatCommunityDate } from '@/lib/community'

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
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${toCalendarTimestamp(event.starts_at)}/${toCalendarTimestamp(end)}`,
    details: event.description,
    location: event.location_label,
  })
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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#FF6A00]"><CalendarDays className="h-4 w-4" /> Agenda do Club</div>
        <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Encontros para sair com um próximo passo.</h2>
        <p className="mt-3 text-sm leading-6 text-[#1A1A1A]/55">Aulas, office hours e networking. Todos os horários estão em Brasília.</p>
      </div>

      <div className="mt-8 space-y-4">
        {events.map((event, index) => {
          const date = new Date(event.starts_at)
          const day = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit' }).format(date)
          const month = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', month: 'short' }).format(date).replace('.', '')
          const time = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(date)
          return (
            <article key={event.id} className={`grid gap-5 rounded-2xl border bg-white p-5 shadow-sm sm:grid-cols-[5rem_1fr_auto] sm:items-center ${index === 0 ? 'border-[#FF6A00]/35 ring-2 ring-[#FF6A00]/8' : 'border-[#1A1A1A]/10'}`}>
              <div className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl bg-[#1A1A1A] text-white">
                <span className="text-2xl font-black leading-none">{day}</span>
                <span className="mt-1 text-[10px] font-black uppercase tracking-wider text-[#FF7A45]">{month}</span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#FF6A00]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-[#C5480B]">{eventLabels[event.event_type] ?? 'Encontro'}</span>
                  {index === 0 ? <span className="text-[9px] font-black uppercase tracking-wide text-emerald-700">Próximo</span> : null}
                </div>
                <h3 className="mt-2 text-lg font-black tracking-[-0.02em]">{event.title}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-5 text-[#1A1A1A]/55">{event.description}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-[11px] font-bold text-[#1A1A1A]/45">
                  <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {time}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {event.location_label}</span>
                  <span>Com {event.host_name}</span>
                </div>
              </div>
              <a href={event.location_url ?? googleCalendarUrl(event)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1A1A1A] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#FF6A00]">
                <Plus className="h-3.5 w-3.5" /> {event.location_url ? 'Participar' : 'Adicionar'}
              </a>
            </article>
          )
        })}
      </div>

      {events.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[#1A1A1A]/15 bg-white/60 p-10 text-center">
          <CalendarDays className="mx-auto h-7 w-7 text-[#FF6A00]" />
          <p className="mt-3 text-sm font-bold text-[#1A1A1A]/55">A próxima agenda será publicada em breve.</p>
        </div>
      ) : null}
      <p className="mt-6 text-center text-[11px] text-[#1A1A1A]/35">Última consulta: {formatCommunityDate(new Date().toISOString(), true)}</p>
    </div>
  )
}
