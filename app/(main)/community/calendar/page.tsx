import { TranslatedContent } from '@/components/community/TranslatedContent'
import { loadClubTranslations } from '@/lib/club-translations'
import { getClubLocale, getClubTranslator, getClubTimezone } from '@/lib/club-locale-server'
import { ArrowRight, CalendarDays, CalendarPlus, Clock3, MapPin, Settings2, Video } from 'lucide-react'
import BenchSection from './BenchSection'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { EventShare } from '@/components/community/EventShare'

type Event = {
  id: string
  slug: string
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
  aula: 'Live',
  'office-hours': 'Office hours',
  networking: 'Networking',
}

export const dynamic = 'force-dynamic'
export const metadata = {title:'Eventos | legalops.club',description:'Bench, encontros e agenda da comunidade.'}

export default async function CalendarPage() {
 const t = getClubTranslator()

  const supabase = await createServerSupabaseClient()
  const { data: rawEvents } = await supabase
    .from('community_events')
    .select('id, slug, title, description, host_name, starts_at, ends_at, location_label, location_url, event_type')
    .eq('is_published', true)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true }).limit(50)

  const events = ((rawEvents ?? []) as Event[]).filter(event => !event.slug.startsWith('bench-'))

  const translations = await loadClubTranslations(supabase, events.map(event => event.id))
  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <header className="overflow-hidden rounded-xl border border-[#2B2925] bg-[#171715] text-[#F8F4EC]">
        <div className="grid gap-8 px-5 py-7 sm:px-8 sm:py-9 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#E8A58D]">{t('Agenda da comunidade')}</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-[-.045em] sm:text-4xl">{t('Eventos')}</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/65">{t('Encontros para comparar experiências, conhecer outras pessoas e manter as conversas organizadas depois de cada encontro.')}</p>
          </div>
          <Link href="/community/events/manage" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/20 px-4 text-xs font-bold text-white hover:border-[#E88A6A] hover:text-[#F1AD93]"><Settings2 className="h-4 w-4" />{t('Gerenciar eventos')}</Link>
        </div>
        <nav aria-label={t('Seções da agenda')} className="flex gap-6 border-t border-white/10 px-5 sm:px-8">
          <a href="#bench" className="inline-flex min-h-12 items-center border-b-2 border-[#E88A6A] text-xs font-bold">{t('Bench')}</a>
          <a href="#outros-eventos" className="inline-flex min-h-12 items-center border-b-2 border-transparent text-xs font-bold text-white/60 hover:text-white">{t('Outros encontros')}</a>
        </nav>
      </header>

      <BenchSection />

      <section id="outros-eventos" className="mt-12 scroll-mt-24 border-t border-[#CEC8BD] pt-8 sm:mt-16 sm:pt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#A94E38]">{t('Agenda aberta')}</p><h2 className="mt-2 text-2xl font-bold tracking-[-.035em] text-[#24231F]">{t('Outros encontros')}</h2><p className="mt-2 text-sm leading-6 text-[#69635E]">{t('Lives, encontros da comunidade e conversas com convidados.')}</p></div>
          <p className="text-xs font-semibold text-[#817A73]">{getClubTimezone()}</p>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-[#CEC8BD] bg-white">
          <div className="divide-y divide-[#E6DED0]">
          {events.map((event, index) => {
            const date = new Date(event.starts_at)
            const weekday = new Intl.DateTimeFormat(getClubLocale(), { timeZone: getClubTimezone(), weekday: 'short' }).format(date).replace('.', '')
            const day = new Intl.DateTimeFormat(getClubLocale(), { timeZone: getClubTimezone(), day: '2-digit' }).format(date)
            const month = new Intl.DateTimeFormat(getClubLocale(), { timeZone: getClubTimezone(), month: 'short' }).format(date).replace('.', '')
            const time = new Intl.DateTimeFormat(getClubLocale(), { timeZone: getClubTimezone(), hour: '2-digit', minute: '2-digit' }).format(date)
            return (
              <article key={event.id} className="group grid gap-5 p-5 transition hover:bg-[#FAF7F1] sm:grid-cols-[68px_minmax(0,1fr)] sm:p-6 lg:grid-cols-[68px_minmax(0,1fr)_auto] lg:items-center">
                <div className={`flex h-[68px] w-[68px] flex-col items-center justify-center rounded-lg border ${index === 0 ? 'border-[#E8B4A1] bg-[#FFF0E9] text-[#A94E38]' : 'border-[#DED6C9] bg-[#F5F1E8] text-[#4C4A45]'}`}>
                  <span className="text-[8px] font-black uppercase tracking-wider">{weekday}</span>
                  <span className="mt-0.5 text-xl font-black leading-none">{day}</span>
                  <span className="mt-0.5 text-[8px] font-bold uppercase">{month}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[8px] font-black uppercase tracking-[0.1em] text-[#D9470F]">{t(eventLabels[event.event_type] ?? t("Encontro"))}</span>
                    {index === 0 ? <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wide text-emerald-700">{t("Próximo")}</span> : null}
                  </div>
                  <TranslatedContent source={translations.sources.get(`event:${event.id}`)} original={{title:event.title,description:event.description}} enabled={translations.enabled} serverLocale={getClubLocale()} titleAs="h3" titleClassName="text-lg font-extrabold leading-6 text-[#252420]" bodyClassName="mt-2 line-clamp-2 text-sm leading-6 text-[#69635E]" />
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-[#817A73]">
                    <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" /> {time}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location_label}</span>
                    <span>{event.host_name}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:col-start-2 lg:col-start-auto lg:max-w-56 lg:justify-end">
                  <Link href={`/community/events/${event.slug}`} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-[#24231F] px-4 text-xs font-semibold text-white">{t('Ver evento')}<ArrowRight className="h-3.5 w-3.5" /></Link>
                  {event.location_url ? <a href={event.location_url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-[#CEC8BD] bg-white px-3 text-xs font-bold"><Video className="h-3.5 w-3.5" />{t('Participar')}</a> : null}
                  <a href={googleCalendarUrl(event)} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-[#CEC8BD] bg-white px-3 text-xs font-bold"><CalendarPlus className="h-3.5 w-3.5" />{t('Adicionar')}</a>
                  <EventShare slug={event.slug} title={event.title} variant="invitation" />
                </div>
              </article>
            )
          })}
          {events.length === 0 ? (
            <div className="p-8 text-center sm:p-12">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#F5F1E8]"><CalendarDays className="h-5 w-5 text-[#A94E38]" /></span>
              <p className="mt-4 text-sm font-bold text-[#34332F]">{t('A próxima agenda será publicada em breve.')}</p>
              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[#817A73]">{t('Enquanto isso, veja os encontros de Bench e continue as conversas já abertas.')}</p>
            </div>
          ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}
