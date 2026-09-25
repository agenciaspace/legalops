import { TranslatedContent } from '@/components/community/TranslatedContent'
import { loadClubTranslations } from '@/lib/club-translations'
import { getClubLocale, getClubTranslator, getClubTimezone } from '@/lib/club-locale-server'
import Link from 'next/link'
import { ArrowRight, CalendarDays, CheckCircle2, ChevronDown, MapPin, ShieldCheck, UserRound } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasActiveClubAccess } from '@/lib/community'
import { registerPublicEvent } from '../../actions'
import { EventUpload } from '@/components/community/EventUpload'
import { EventPublications } from '@/components/community/EventPublications'
import BenchClient from '../../bench/BenchClient'
import { EventShare } from '@/components/community/EventShare'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

type PublicEvent = {
  id: string
  slug: string
  title: string
  description: string
  host_name: string
  starts_at: string
  ends_at: string | null
  location_label: string
  event_type: string
  is_published: boolean
  participation_mode: 'remoto' | 'presencial' | 'hibrido'
  participation_details: string
  pre_questions: string[] | null
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = await createServerSupabaseClient()
  const { data: event } = await supabase.from('community_events').select('slug,title,description').eq('slug', params.slug).eq('is_published', true).maybeSingle()
  if (!event) return { title: 'Evento | legalops.club' }
  const description = event.description.length > 180 ? `${event.description.slice(0, 177).trim()}…` : event.description
  const url = `https://legalops.club/community/events/${event.slug}`
  return {
    title: `${event.title} | legalops.club`,
    description,
    alternates: { canonical: url },
    openGraph: { title: event.title, description, url, siteName: 'legalops.club', type: 'website' },
  }
}

function PublicEventLanding({ event, translations, user, registered, dateTbd, past }: {
  event: PublicEvent
  translations: Awaited<ReturnType<typeof loadClubTranslations>>
  user: { id: string } | null
  registered: boolean
  dateTbd: boolean
  past: boolean
}) {
  const t = getClubTranslator()
  const locale = getClubLocale()
  const date = dateTbd ? t('Data a confirmar') : new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short', timeZone: getClubTimezone() }).format(new Date(event.starts_at))
  const mode = event.participation_mode === 'presencial' ? t('Presencial') : event.participation_mode === 'hibrido' ? t('Híbrido') : t('Remoto')
  const joinUrl = `/club/entrar?next=${encodeURIComponent(`/community/events/${event.slug}`)}`
  const source = translations.sources.get(`event:${event.id}`)
  const questions = event.pre_questions?.filter(Boolean) ?? []

  return <main className="bg-[#F5F1E8]">
    <section className="relative overflow-hidden border-b border-[#2B2925] bg-[#171715] text-[#F8F4EC]">
      <div aria-hidden="true" className="absolute -right-24 -top-32 h-80 w-80 rounded-full border border-[#E88A6A]/25" />
      <div aria-hidden="true" className="absolute -right-8 -top-16 h-52 w-52 rounded-full border border-[#E88A6A]/20" />
      <div className="relative mx-auto grid max-w-[1180px] gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-16 lg:py-20">
        <div className="max-w-3xl">
          <Link href="/club" className="inline-flex min-h-11 items-center text-xs font-bold text-[#E8B4A1] underline decoration-[#E88A6A]/60 underline-offset-4">← legalops.club</Link>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-[#E88A6A]/45 bg-[#E88A6A]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] text-[#F1AD93]">{t('Bench entre pares')}</span>
            <span className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-white/65">{past ? t('Evento realizado') : t('Inscrições abertas')}</span>
          </div>
          <div className="mt-6">
            <TranslatedContent source={source} original={{title:event.title}} enabled={translations.enabled} serverLocale={locale} titleAs="h1" titleClassName="max-w-3xl text-[38px] font-semibold leading-[1.04] tracking-[-.045em] text-[#F8F4EC] sm:text-[54px] lg:text-[64px]" />
          </div>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/65 sm:text-lg sm:leading-8">{t('Uma conversa prática para comparar como outros jurídicos estão resolvendo o mesmo desafio.')}</p>
          <dl className="mt-9 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[.04] p-4"><dt className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em] text-white/45"><CalendarDays className="h-4 w-4 text-[#E88A6A]" />{t('Quando')}</dt><dd className="mt-2 text-sm font-semibold leading-5 text-white/90">{date}</dd></div>
            <div className="rounded-xl border border-white/10 bg-white/[.04] p-4"><dt className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em] text-white/45"><MapPin className="h-4 w-4 text-[#E88A6A]" />{t('Formato')}</dt><dd className="mt-2 text-sm font-semibold text-white/90">{mode}</dd></div>
            <div className="rounded-xl border border-white/10 bg-white/[.04] p-4"><dt className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em] text-white/45"><UserRound className="h-4 w-4 text-[#E88A6A]" />{t('Organização')}</dt><dd className="mt-2 text-sm font-semibold leading-5 text-white/90">{event.host_name}</dd></div>
          </dl>
        </div>

        <aside aria-label={t('Inscrição no evento')} className="self-start rounded-2xl border border-white/10 bg-[#F8F4EC] p-5 text-[#24231F] shadow-[0_24px_70px_rgba(0,0,0,.28)] sm:p-6 lg:sticky lg:top-5">
          {past ? <div>
            <p className="text-xs font-black uppercase tracking-[.14em] text-[#A94E38]">{t('Evento realizado')}</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-.035em]">{t('Continue pela comunidade')}</h2>
            <p className="mt-3 text-sm leading-6 text-[#625E59]">{t('Materiais e conversas do encontro ficam disponíveis para membros e participantes confirmados.')}</p>
            <Link href={joinUrl} className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#24231F] px-4 text-sm font-bold text-white">{user ? t('Completar meu cadastro') : t('Conhecer a comunidade')} <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </div> : registered ? <div role="status">
            <CheckCircle2 className="h-8 w-8 text-emerald-700" />
            <p className="mt-4 text-xs font-black uppercase tracking-[.14em] text-emerald-700">{t('Cadastro recebido')}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-.035em]">{t('Seu interesse está confirmado.')}</h2>
            <p className="mt-3 text-sm leading-6 text-[#625E59]">{t('Você receberá as informações quando a data e o acesso forem definidos.')}</p>
            <Link href={joinUrl} className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-[#24231F] px-4 text-sm font-bold">{user ? t('Completar meu cadastro') : t('Conhecer a comunidade')} <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </div> : <form action={registerPublicEvent}>
            <input type="hidden" name="event_id" value={event.id} />
            <p className="text-xs font-black uppercase tracking-[.14em] text-[#A94E38]">{t('Inscrição gratuita')}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-.035em]">{t('Reserve sua vaga')}</h2>
            <p className="mt-2 text-sm leading-6 text-[#625E59]">{t('Você não precisa criar uma conta para registrar seu interesse.')}</p>
            <div className="mt-5 space-y-3">
              <label className="block text-xs font-bold">{t('Nome')}<input name="name" autoComplete="name" required minLength={2} className="mt-1.5 min-h-12 w-full rounded-lg border border-[#CEC8BD] bg-white px-3 text-base" /></label>
              <label className="block text-xs font-bold">{t('E-mail')}<input name="email" autoComplete="email" required type="email" className="mt-1.5 min-h-12 w-full rounded-lg border border-[#CEC8BD] bg-white px-3 text-base" /></label>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <label className="block text-xs font-bold">{t('Cargo')}<input name="role" autoComplete="organization-title" required minLength={2} className="mt-1.5 min-h-12 w-full rounded-lg border border-[#CEC8BD] bg-white px-3 text-base" /></label>
                <label className="block text-xs font-bold">{t('Onde trabalha')}<input name="organization" autoComplete="organization" required minLength={2} className="mt-1.5 min-h-12 w-full rounded-lg border border-[#CEC8BD] bg-white px-3 text-base" /></label>
              </div>
            </div>
            <button className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#24231F] px-5 text-sm font-bold text-white hover:bg-[#3A3834]">{t('Quero participar')} <ArrowRight className="ml-2 h-4 w-4" /></button>
            <p className="mt-4 flex gap-2 text-[11px] leading-5 text-[#716B65]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />{t('Seus dados serão usados para organizar o encontro e enviar as informações de acesso.')}</p>
          </form>}
        </aside>
      </div>
    </section>

    <section className="mx-auto grid max-w-[1180px] gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16">
      <div className="space-y-12">
        <article>
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#A94E38]">{t('Bench LegalOps')}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-.04em]">{t('Sobre o encontro')}</h2>
          <div className="mt-5 max-w-3xl border-l-2 border-[#E88A6A] pl-5 sm:pl-7">
            <TranslatedContent source={source} original={{description:event.description}} enabled={translations.enabled} serverLocale={locale} bodyClassName="whitespace-pre-wrap text-[15px] leading-8 text-[#55514B]" />
          </div>
        </article>

        {questions.length ? <article>
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#A94E38]">{t('Pauta')}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-.04em]">{t('O que vamos discutir?')}</h2>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2">{questions.map((question,index)=><li key={question} className="flex gap-4 rounded-xl border border-[#CEC8BD] bg-[#FAF7F1] p-4 text-sm leading-6"><span className="font-black text-[#A94E38]">0{index+1}</span><span>{question}</span></li>)}</ol>
        </article> : null}

        {event.participation_details ? <article className="rounded-2xl bg-[#EDE5D8] p-6 sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#A94E38]">{t('Participação')}</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-.035em]">{t('Como vai funcionar')}</h2>
          <div className="mt-3 max-w-3xl"><TranslatedContent source={source} original={{participation_details:event.participation_details}} enabled={translations.enabled} serverLocale={locale} bodyClassName="whitespace-pre-wrap text-sm leading-7 text-[#5D574F]" /></div>
        </article> : null}
      </div>

      <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
        <section className="border-t-2 border-[#24231F] py-5">
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#817A73]">{t('Quem organiza')}</p>
          <p className="mt-3 text-lg font-semibold">{event.host_name}</p>
          <p className="mt-2 text-sm leading-6 text-[#625E59]">{t('A organização confirmará data, horário e acesso com as pessoas inscritas.')}</p>
        </section>
        <section className="border-t border-[#CEC8BD] py-5">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[.16em] text-[#817A73]">{t('Convide alguém')}</p>
          <EventShare slug={event.slug} title={event.title} variant="invitation" />
        </section>
      </aside>
    </section>

    <section className="border-t border-[#CEC8BD] bg-[#FAF7F1]">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#A94E38]">legalops.club</p><h2 className="mt-2 text-2xl font-semibold tracking-[-.035em]">{t('Materiais e conversas depois do encontro')}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#625E59]">{t('Membros acessam fotos, documentos e discussões e podem continuar a troca depois do Bench.')}</p></div>
        <Link href={joinUrl} className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-lg border border-[#24231F] px-5 text-sm font-bold">{user ? t('Completar meu cadastro') : t('Conhecer a comunidade')} <ArrowRight className="ml-2 h-4 w-4" /></Link>
      </div>
    </section>
  </main>
}

export default async function EventPage({ params, searchParams }: { params: { slug: string }, searchParams?: { registered?: string, shared?: string, tab?: string } }) {
 const t = getClubTranslator()

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: event } = await supabase.from('community_events').select('id,slug,title,description,host_name,starts_at,ends_at,location_label,event_type,is_published,participation_mode,participation_details,pre_questions').eq('slug', params.slug).eq('is_published', true).maybeSingle()
  if (!event) return <div className="mx-auto max-w-2xl px-5 py-16"><h1 className="text-2xl font-bold">{t("Evento não encontrado")}</h1><Link className="mt-4 inline-flex underline" href="/community/calendar">{t("Voltar para eventos")}</Link></div>
  const { data: member } = user ? await supabase.from('community_members').select('display_name,current_role,club_access_status,club_access_expires_at').eq('user_id', user.id).maybeSingle() : {data:null}
  const isMember = hasActiveClubAccess(member)
  const [{ data: attendance }, { data: eventAdmin }] = user && isMember ? await Promise.all([
    supabase.from('community_event_rsvps').select('id,response,guest_name,guest_role,organization_name,guest_email,guest_phone,dietary_restrictions,accessibility_needs,arrival_notes').eq('event_id', event.id).eq('user_id', user.id).maybeSingle(),
    supabase.from('community_event_admins').select('event_id').eq('event_id', event.id).eq('user_id', user.id).maybeSingle(),
  ]) : [{ data: null }, { data: null }]
  const canContribute = Boolean(attendance?.response === 'confirmed' || eventAdmin)
  const [{ data: resources }, { data: discussions }] = await Promise.all([
    canContribute ? supabase.from('community_event_resources').select('id,publication_id,uploader_id,title,description,kind,resource_url,storage_path,created_at').eq('event_id', event.id).is('duplicate_of', null).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
    isMember ? supabase.from('community_posts').select('id,title,body,created_at').eq('event_id', event.id).order('created_at', { ascending: false }).limit(20) : Promise.resolve({ data: [] }),
  ])
  const authorIds = Array.from(new Set(resources?.map(item => item.uploader_id) ?? []))
  const { data: authors } = authorIds.length ? await supabase.from('community_members').select('user_id,display_name,avatar_path,current_role,organization_name').in('user_id', authorIds) : { data: [] }
  const dateTbd = /data a confirmar/i.test(event.location_label || '')
  const past = !dateTbd && new Date(event.ends_at || event.starts_at) < new Date()
  const activeTab = searchParams?.tab === 'discussoes' ? 'discussoes' : searchParams?.tab === 'documentos' ? 'documentos' : 'fotos'
  const visibleResources = resources?.filter(item => activeTab === 'fotos' ? item.kind === 'foto' : item.kind !== 'foto') ?? []
  const translations = await loadClubTranslations(supabase, [event.id,...(discussions ?? []).map(post => post.id),...(resources ?? []).map(resource => resource.id),...authorIds])
  if (!isMember) return <PublicEventLanding event={event as PublicEvent} translations={translations} user={user} registered={Boolean(searchParams?.registered)} dateTbd={dateTbd} past={past} />

  const overview = <div className="space-y-5">
    <TranslatedContent source={translations.sources.get(`event:${event.id}`)} original={{description:event.description,location_label:event.location_label}} enabled={translations.enabled} serverLocale={getClubLocale()} />
    <dl className="space-y-4 text-sm text-[#625E59]">
      <div><dt className="text-xs font-semibold text-[#817A73]">{t('Quando')}</dt><dd className="mt-1">{dateTbd ? t('Data a confirmar') : new Intl.DateTimeFormat(getClubLocale(), { dateStyle: 'long', timeStyle: 'short', timeZone: getClubTimezone() }).format(new Date(event.starts_at))}</dd></div>

      <div><dt className="text-xs font-semibold text-[#817A73]">{t('Organização')}</dt><dd className="mt-1 break-words">{event.host_name}</dd></div>
    </dl>
    <div className="space-y-2 border-t border-[#E6DED0] pt-4">
      <EventShare slug={event.slug} title={event.title} />
    </div>
  </div>
  return <main className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:py-6">
    <header className="mb-4 sm:mb-5">
      <div className="flex min-h-11 items-center gap-3 text-xs">
        <Link href="/community/calendar" className="inline-flex min-h-11 items-center font-semibold text-[#A94E38]">{t('← Eventos')}</Link>
        <span className="text-[#817A73]">{past ? t('Evento realizado') : t('Próximo evento')}</span>
      </div>
      <TranslatedContent source={translations.sources.get(`event:${event.id}`)} original={{title:event.title}} enabled={translations.enabled} serverLocale={getClubLocale()} titleAs="h1" titleClassName="text-2xl font-extrabold leading-tight tracking-[-.025em] text-[#252420] sm:text-3xl" />
    </header>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-6">
      <div className="min-w-0">
        <details open={!past} className="mb-4 rounded-xl border border-[#CEC8BD] bg-white xl:hidden">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">{t('Sobre o encontro')}<ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0" /></summary>
          <div className="border-t border-[#E6DED0] p-4">{overview}</div>
        </details>
        {isMember && <nav id="publicacoes" aria-label={t('Conteúdo do evento')} className="mb-4 flex scroll-mt-20 gap-1 border-b border-[#CEC8BD]">
          {([{ key: 'fotos', label: t("Fotos") }, { key: 'documentos', label: t("Documentos") }, { key: 'discussoes', label: t("Conversas") }] as const).map(tab => <Link key={tab.key} href={`/community/events/${event.slug}?tab=${tab.key}#publicacoes`} aria-current={activeTab === tab.key ? 'page' : undefined} className={`inline-flex min-h-12 flex-1 items-center justify-center border-b-2 px-2 text-sm font-semibold sm:flex-none sm:px-5 ${activeTab === tab.key ? 'border-[#A94E38] text-[#A94E38]' : "border-transparent text-[#625E59] hover:text-[#24231F]"}`}>{t(tab.label)}</Link>)}
        </nav>}
      {isMember && user && !past && <details className="mb-4 rounded-xl border border-[#CEC8BD] bg-[#F5F1E8] p-4"><summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold">{attendance?.response === 'confirmed' ? t("Revisar minha participação") : t("Confirmar minha participação")}</summary><div className="mt-4"><BenchClient eventId={event.id} initial={attendance} member={{ name: member?.display_name || '', role: member?.current_role || '', email: user.email || '' }} /></div></details>}
      {isMember && !canContribute && activeTab !== 'discussoes' && past && <p className="mb-4 rounded-lg border border-[#CEC8BD] p-4 text-sm leading-6 text-[#625E59]">{t("As fotos e documentos são exclusivos de participantes confirmados e organizadores. Se você participou e não tem acesso, peça à organização para conferir sua inscrição.")}</p>}

        {canContribute && activeTab !== 'discussoes' && <section aria-label={t('Publicações do evento')}>
          <EventUpload key={activeTab} eventId={event.id} photos={activeTab === 'fotos'} />
          <EventPublications translations={translations} resources={visibleResources} authors={authors ?? []} />
        </section>}
      {isMember && activeTab === 'discussoes' ? <section className="rounded-xl border border-[#CEC8BD] bg-white p-4 sm:p-5"><h2 className="text-lg font-bold">{t("Discussões do evento")}</h2>{discussions?.length ? <div className="mt-3 space-y-3">{discussions.map(post => <div key={post.id} className="block rounded-lg border border-[#E4E2DD] p-3 hover:border-[#FFB99E]"><TranslatedContent source={translations.sources.get(`post:${post.id}`)} original={{title:post.title,body:post.body}} enabled={translations.enabled} serverLocale={getClubLocale()} /><Link href={`/community?post=${post.id}`} className="inline-flex min-h-11 items-center underline">{t("Conversas")}</Link></div>)}</div> : <p className="mt-2 text-sm text-[#77746E]">{t("A discussão será criada pelos participantes.")}</p>}</section> : null}

      </div>
      <aside aria-label={t('Sobre o encontro')} className="sticky top-20 hidden min-w-0 rounded-xl border border-[#CEC8BD] bg-white p-5 xl:block">
        <h2 className="mb-4 text-sm font-semibold">{t('Sobre o encontro')}</h2>
        {overview}
      </aside>
    </div>
  </main>
}
