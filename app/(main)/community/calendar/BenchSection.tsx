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
  const upcoming = (events ?? []).filter(event => /data a confirmar/i.test(event.location_label || '') || new Date(event.ends_at || event.starts_at).getTime() >= now).reverse()
  const past = (events ?? []).filter(event => !/data a confirmar/i.test(event.location_label || '') && new Date(event.ends_at || event.starts_at).getTime() < now)
  return <section id="bench" aria-labelledby="bench-heading" className="mt-10 scroll-mt-24 sm:mt-14">
    <div className="grid gap-5 border-b border-[#CEC8BD] pb-6 md:grid-cols-[minmax(0,1fr)_18rem] md:items-end">
      <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#A94E38]">{t('Troca entre pares')}</p><h2 id="bench-heading" className="mt-2 text-3xl font-bold tracking-[-.04em] text-[#24231F]">{t('Bench')}</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-[#625E59]">{t('Encontros para comparar experiências reais. Cada Bench continua em um espaço próprio com fotos, documentos e conversas.')}</p></div>
      <Link href="/community/tools" className="inline-flex min-h-11 items-center justify-between rounded-lg border border-[#CEC8BD] bg-white px-4 text-xs font-bold">{t('Avaliação de CLM e recursos')}<Wrench className="h-4 w-4 text-[#A94E38]" /></Link>
    </div>
    {error ? <p role="alert" className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{t('Não foi possível carregar os encontros. Atualize a página para tentar novamente.')}</p> : !events?.length ? <div className="mt-6 rounded-xl border border-dashed border-[#CEC8BD] bg-white p-8 text-center"><CalendarDays className="mx-auto h-6 w-6 text-[#A94E38]" /><p className="mt-3 text-sm font-semibold text-[#625E59]">{t('Os próximos encontros de Bench serão publicados aqui.')}</p></div> : <div className="mt-7 space-y-10">
      {upcoming.length ? <div><h3 className="text-sm font-bold text-[#34332F]">{t('Próximos encontros')}</h3><div className="mt-3 grid gap-4 lg:grid-cols-2">{upcoming.map((event,index) => {
        const tbd = /data a confirmar/i.test(event.location_label || '')
        return <article key={event.id} className={`flex min-w-0 flex-col overflow-hidden rounded-xl border ${index === 0 ? 'border-[#D89A82] bg-[#FFF9F5]' : 'border-[#CEC8BD] bg-white'}`}>
          <div className="flex items-center justify-between gap-3 border-b border-[#E6DED0] px-5 py-3"><span className="text-[10px] font-black uppercase tracking-[.14em] text-[#A94E38]">{index === 0 ? t('Próximo Bench') : t('Bench agendado')}</span><span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#817A73]"><Clock3 className="h-3.5 w-3.5" />{tbd ? t('Data a confirmar') : dateFormat.format(new Date(event.starts_at))}</span></div>
          <div className="flex flex-1 flex-col p-5 sm:p-6"><TranslatedContent source={translations.sources.get(`event:${event.id}`)} original={{title:event.title,description:event.description}} enabled={translations.enabled} serverLocale={getClubLocale()} titleAs="h3" titleClassName="text-xl font-extrabold leading-7 tracking-[-.025em] text-[#252420]" bodyClassName="mt-3 line-clamp-3 text-sm leading-6 text-[#625E59]" />
            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-[#817A73]"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A94E38]" />{event.location_label}</p>
            <div className="mt-auto flex flex-wrap gap-2 pt-5"><Link href={`/community/events/${event.slug}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#24231F] px-4 text-xs font-bold text-white">{t('Ver encontro e participar')}<ArrowRight className="h-3.5 w-3.5" /></Link><EventShare slug={event.slug} title={event.title} variant="invitation" /></div>
          </div>
        </article>
      })}</div></div> : null}
      {past.length ? <div><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-[#34332F]">{t('Encontros realizados')}</h3><span className="text-xs text-[#817A73]">{past.length}</span></div><div className="mt-3 overflow-hidden rounded-xl border border-[#CEC8BD] bg-white">{past.map((event,index) => <article key={event.id} className={`grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${index ? 'border-t border-[#E6DED0]' : ''}`}>
        <div className="min-w-0"><p className="text-[11px] font-semibold text-[#817A73]">{dateFormat.format(new Date(event.starts_at))}</p><TranslatedContent source={translations.sources.get(`event:${event.id}`)} original={{title:event.title}} enabled={translations.enabled} serverLocale={getClubLocale()} titleAs="h3" titleClassName="mt-1 text-base font-bold leading-6 text-[#252420]" /></div>
        <div className="flex flex-wrap items-center gap-2"><Link href={`/community/events/${event.slug}`} className="inline-flex min-h-11 items-center rounded-lg bg-[#24231F] px-4 text-xs font-bold text-white">{t('Ver encontro e publicações')}</Link><Link className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-[#CEC8BD] px-3 text-xs font-bold" href={`/community/events/${event.slug}?tab=fotos#publicacoes`}><ImageIcon className="h-3.5 w-3.5" />{t('Fotos')}</Link><Link className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-[#CEC8BD] px-3 text-xs font-bold" href={`/community/events/${event.slug}?tab=documentos#publicacoes`}><FileText className="h-3.5 w-3.5" />{t('Documentos')}</Link><EventShare slug={event.slug} title={event.title} /></div>
      </article>)}</div></div> : null}
    </div>}
  </section>
}
