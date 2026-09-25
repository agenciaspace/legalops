import { TranslatedContent } from '@/components/community/TranslatedContent'
import { loadClubTranslations } from '@/lib/club-translations'
import { getClubLocale, getClubTranslator, getClubTimezone } from '@/lib/club-locale-server'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { EventShare } from '@/components/community/EventShare'


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
  return <section id="bench" aria-labelledby="bench-heading" className="mt-8 scroll-mt-24">
    <h2 id="bench-heading" className="text-xl font-semibold tracking-tight">{t("Bench")}</h2>
    <p className="mt-2 text-sm leading-6 text-[#625E59]">{t("Encontros para trocar experiências. Abra um encontro para participar ou acessar as fotos, documentos e conversas.")}</p>
    {error ? <p role="alert" className="mt-4 text-sm">{t("Não foi possível carregar os encontros. Atualize a página para tentar novamente.")}</p> : !events?.length ? <p className="mt-4 text-sm text-[#625E59]">{t("Os próximos encontros de Bench serão publicados aqui.")}</p> : <div className="mt-5 space-y-6">{[{ title: t("Próximos encontros"), items: upcoming, ended: false }, { title: t("Encontros realizados"), items: past, ended: true }].filter(group => group.items.length).map(group => <div key={group.title}>
      <h3 className="mb-3 text-sm font-semibold text-[#625E59]">{group.title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">{group.items.map(event => <article key={event.id} className="flex min-w-0 flex-col rounded-xl border border-[#CEC8BD] bg-white p-5">
        <p className="text-xs text-[#817A73]">{/data a confirmar/i.test(event.location_label || '') ? t('Data a confirmar') : `${dateFormat.format(new Date(event.starts_at))} · ${getClubTimezone()}`}</p>
        <TranslatedContent source={translations.sources.get(`event:${event.id}`)} original={{title:event.title,description:event.description,location_label:event.location_label}} enabled={translations.enabled} serverLocale={getClubLocale()} />
        <div className="mt-auto pt-4"><Link href={`/community/events/${event.slug}`} className="inline-flex min-h-11 items-center rounded-lg bg-[#24231F] px-4 text-sm font-semibold text-white">{group.ended ? t("Ver encontro e publicações") : t("Ver encontro e participar")}</Link>
          {group.ended && <div className="mt-2 flex flex-wrap gap-4 text-sm"><Link className="inline-flex min-h-11 items-center underline" href={`/community/events/${event.slug}?tab=fotos#publicacoes`}>{t("Fotos")}</Link><Link className="inline-flex min-h-11 items-center underline" href={`/community/events/${event.slug}?tab=documentos#publicacoes`}>{t("Documentos")}</Link></div>}
          <div className="mt-2"><EventShare slug={event.slug} title={event.title} /></div>
        </div>
      </article>)}</div>
    </div>)}</div>}
    <Link href="/community/tools" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold underline">{t("Avaliação de CLM e outros recursos → Recursos")}</Link>
  </section>
}
