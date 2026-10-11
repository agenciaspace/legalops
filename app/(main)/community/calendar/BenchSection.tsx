import { EventSections } from '@/components/community/EventSections'
import { isEventDatePending, upcomingCommunityEvents } from '@/lib/community-event-display'
import { TranslatedContent } from '@/components/community/TranslatedContent'
import { loadClubTranslations } from '@/lib/club-translations'
import { getClubLocale, getClubTranslator, getClubTimezone } from '@/lib/club-locale-server'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { EventShare } from '@/components/community/EventShare'
import { ArrowRight, CalendarDays, Clock3, FileText, Image as ImageIcon, MapPin, Wrench } from 'lucide-react'


export default async function BenchSection() {
 const t = getClubTranslator()
 const dateFormat = new Intl.DateTimeFormat(getClubLocale(), { timeZone: getClubTimezone(), dateStyle: 'medium', timeStyle: 'short' })

  const supabase = await createServerSupabaseClient()
  const { data: events, error } = await supabase.from('community_events')
    .select('id,slug,title,description,starts_at,ends_at,location_label')
    .eq('is_published', true).ilike('slug', 'bench-%').order('starts_at', { ascending: false }).limit(50)
  const translations = await loadClubTranslations(supabase, (events ?? []).map(event => event.id))
  const now = Date.now()
  const upcoming = upcomingCommunityEvents(events ?? [], now)
  const past = (events ?? []).filter(event => !isEventDatePending(event) && new Date(event.ends_at || event.starts_at).getTime() < now)
  return <section id="bench" aria-labelledby="bench-heading" className="scroll-mt-24">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 id="bench-heading" className="text-xl font-semibold">{t('Bench')}</h2><Link href="/community/tools" className="brand-text-link">{t('Avaliação de CLM e recursos')}<Wrench className="h-4 w-4" /></Link></div>
    {error ? <p role="alert" className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{t('Não foi possível carregar os encontros. Atualize a página para tentar novamente.')}</p> : !events?.length ? <div className="mt-6 rounded-xl border border-dashed border-[#CEC8BD] bg-[#FAF7F1] p-8 text-center"><CalendarDays className="mx-auto h-6 w-6 text-[#A94E38]" /><p className="mt-3 text-sm font-semibold text-[#625E59]">{t('Os próximos encontros de Bench serão publicados aqui.')}</p></div> : <EventSections upcoming={upcoming.length ? <div><div className="mt-3 grid gap-4">{upcoming.map((event,index) => {
        const tbd = isEventDatePending(event)
        return <article key={event.id} className="brand-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6DED0] px-5 py-3"><span className="text-xs font-medium uppercase tracking-[.14em] text-[#A94E38]">{index === 0 ? t('Próximo Bench') : t('Bench agendado')}</span><span className="inline-flex items-center gap-1 text-xs font-semibold text-[#817A73]"><Clock3 className="h-3.5 w-3.5" />{tbd ? t('Data a confirmar') : dateFormat.format(new Date(event.starts_at))}</span></div>
          <div className="flex flex-1 flex-col p-5 sm:p-6"><TranslatedContent source={translations.sources.get(`event:${event.id}`)} original={{title:event.title,description:event.description}} enabled={translations.enabled} serverLocale={getClubLocale()} titleAs="h3" titleClassName="text-xl font-semibold leading-7 tracking-[-.025em] text-[#252420]" bodyClassName="mt-3 line-clamp-3 text-sm leading-6 text-[#625E59]" />
            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-[#817A73]"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A94E38]" />{event.location_label}</p>
            <div className="mt-auto flex flex-wrap gap-2 pt-5"><Link href={`/community/events/${event.slug}`} className="brand-action">{t('Ver encontro e participar')}<ArrowRight className="h-3.5 w-3.5" /></Link><EventShare slug={event.slug} title={event.title} variant="invitation" /></div>
          </div>
        </article>
      })}</div></div> : <p className="py-6 text-sm text-[#625E59]">{t('Os próximos encontros de Bench serão publicados aqui.')}</p>} past={past.length ? <div><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-medium text-[#34332F]">{t('Encontros realizados')}</h3><span className="text-xs text-[#817A73]">{past.length}</span></div><div className="mt-3 overflow-hidden rounded-lg border border-[#CEC8BD] bg-[#FAF7F1]">{past.map((event,index) => <article key={event.id} className={`grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${index ? 'border-t border-[#E6DED0]' : ''}`}>
        <div className="min-w-0"><p className="text-xs font-semibold text-[#817A73]">{dateFormat.format(new Date(event.starts_at))}</p><TranslatedContent source={translations.sources.get(`event:${event.id}`)} original={{title:event.title}} enabled={translations.enabled} serverLocale={getClubLocale()} titleAs="h3" titleClassName="mt-1 text-base font-medium leading-6 text-[#252420]" /></div>
        <div className="flex flex-wrap items-center gap-2"><Link href={`/community/events/${event.slug}`} className="inline-flex min-h-11 items-center rounded-lg bg-[#24231F] px-4 text-xs font-medium text-white">{t('Ver encontro e publicações')}</Link><Link className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-[#CEC8BD] px-3 text-xs font-medium" href={`/community/events/${event.slug}?tab=fotos#publicacoes`}><ImageIcon className="h-3.5 w-3.5" />{t('Fotos')}</Link><Link className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-[#CEC8BD] px-3 text-xs font-medium" href={`/community/events/${event.slug}?tab=documentos#publicacoes`}><FileText className="h-3.5 w-3.5" />{t('Documentos')}</Link><EventShare slug={event.slug} title={event.title} /></div>
      </article>)}</div></div> : <p className="py-6 text-sm text-[#625E59]">{t('Nenhum encontro realizado.')}</p>}/>}
  </section>
}
