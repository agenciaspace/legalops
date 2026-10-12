import { TranslatedContent } from '@/components/community/TranslatedContent'
import { loadClubTranslations } from '@/lib/club-translations'
import { getClubLocale, getClubTranslator, getClubTimezone } from '@/lib/club-locale-server'
import Link from 'next/link'
import { ArrowRight, CalendarDays, CheckCircle2, MapPin, MessageCircle, Send, ShieldCheck, UserRound } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasActiveClubAccess } from '@/lib/community'
import { createCommunityComment, registerPublicEvent } from '../../actions'
import { EventUpload } from '@/components/community/EventUpload'
import { EventPublications } from '@/components/community/EventPublications'
import BenchClient from '../../bench/BenchClient'
import { EventShare } from '@/components/community/EventShare'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getPublicEventFallback, type PublicEvent } from '@/lib/public-events'
import { loadLivePublicEvent } from '@/lib/public-event-live'
import { loadConfirmedEventRegistrationCount } from '@/lib/event-registration-count'
import { loadEventWhatsAppSummaries, type EventSummaryArchive } from '@/lib/event-whatsapp-summaries'
import { isEventWhatsAppSummaryEnabled } from '@/lib/event-whatsapp-summary'
import { loadPublicEventConversationTopics, type EventConversationTopic } from '@/lib/event-conversation-topics'
import { googleCalendarEventLink } from '@/lib/google-calendar'
import { EventWorkspace, EventSectionButton } from '@/components/community/EventWorkspace'
import '../event-workspace.css'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const fallback = getPublicEventFallback(params.slug)
  if (fallback) {
    const description = fallback.description.length > 180 ? `${fallback.description.slice(0, 177).trim()}…` : fallback.description
    const url = `https://legalops.club/community/events/${fallback.slug}`
    return { title: `${fallback.title} | legalops.club`, description, alternates: { canonical: url }, openGraph: { title: fallback.title, description, url, siteName: 'legalops.club', type: 'website' } }
  }
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

function EventWhatsAppSummaryArchive({ archive, eventSlug }: { archive: EventSummaryArchive, eventSlug: string }) {
  const { summaries, status } = archive
  const format = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(value))
  return <section id="resumos" className="min-w-0">
    <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#A94E38]">Acompanhe sem perder contexto</p>
    <h2 className="event-section-title mt-1">Resumos do grupo</h2>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-[#625E59]">Os resumos das discussões do WhatsApp ficam disponíveis para pessoas logadas. Novas edições são preparadas às 18h, quando há conversa relevante no período, sem nomes ou dados de contato.</p>
    {status === 'signed-out' ? <Link href={`/login?next=${encodeURIComponent(`/community/events/${eventSlug}`)}`} className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#24231F] px-4 text-sm font-bold text-white">Entrar para ler os resumos <ArrowRight className="ml-2 h-4 w-4" /></Link> : status === 'error' ? <p role="alert" className="mt-5 rounded-xl bg-[#F5F1E8] p-4 text-sm leading-6 text-[#625E59]">Não foi possível carregar os resumos agora. Recarregue a página para tentar novamente.</p> : summaries.length ? <div className="mt-4 space-y-2">{summaries.map((item, index) => <details key={item.id} name="event-summary-editions" open={index === 0} className="rounded-xl border border-[#E6DED0] bg-[#FAF7F1] px-4">
      <summary className="min-h-11 cursor-pointer py-3"><span className="text-sm font-bold">{item.title}</span><time className="mt-1 block text-[11px] text-[#817A73]" dateTime={item.period_end}>{format(item.period_end)}</time></summary>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#55514B]">{item.summary}</p>
      {item.key_points.length ? <ul className="mt-4 space-y-2 border-t border-[#DED6C9] pt-4 text-sm leading-6 text-[#625E59]">{item.key_points.map(point => <li key={point} className="flex gap-2"><span aria-hidden="true" className="text-[#A94E38]">•</span><span>{point}</span></li>)}</ul> : null}
      <p className="my-4 text-[11px] text-[#817A73]">{item.source_message_count} mensagens sintetizadas · sem identificação dos participantes</p>
    </details>)}</div> : <p className="mt-5 rounded-xl bg-[#F5F1E8] p-4 text-sm leading-6 text-[#625E59]">Ainda não há resumos publicados. Novas edições aparecem após as 18h quando há discussão relevante no período.</p>}
  </section>
}

function EventConversationTopicDirectory({ topics, eventSlug, linked = false, selectedTopicId, activity = new Map<string, number>() }: { topics: EventConversationTopic[], eventSlug: string, linked?: boolean, selectedTopicId?: string | null, activity?: Map<string, number> }) {
  if (!topics.length) return null
  if (linked) return <nav aria-label="Tópicos desta conversa" className="self-start overflow-hidden rounded-xl border border-[#CEC8BD] bg-white lg:sticky lg:top-20">
    <div className="border-b border-[#E6DED0] bg-[#F5F1E8] px-4 py-4"><p className="text-[10px] font-black uppercase tracking-[.14em] text-[#A94E38]">Conversas do evento</p><h2 className="mt-1 text-base font-bold">Escolha um tópico</h2></div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-1">{topics.map((topic, index) => {
      const active = topic.id === selectedTopicId
      const replies = topic.id ? activity.get(topic.id) ?? 0 : 0
      return topic.id ? <Link key={topic.id} href={`/community/events/${eventSlug}?tab=discussoes&topic=${topic.id}#publicacoes`} aria-current={active ? 'page' : undefined} className={`group grid min-h-16 grid-cols-[1.75rem_minmax(0,1fr)] gap-2 border-b border-[#E6DED0] px-4 py-3.5 last:border-b-0 sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0 lg:border-b lg:last:border-b-0 ${active ? 'bg-[#24231F] text-white' : 'hover:bg-[#FAF7F1]'}`}>
        <span className={`mt-0.5 text-[10px] font-black ${active ? 'text-[#F1AD93]' : 'text-[#A94E38]'}`}>{String(topic.display_order || index + 1).padStart(2, '0')}</span>
        <span><span className="block text-sm font-bold leading-5">{topic.title}</span>{active ? <span className="mt-1 block text-xs leading-5 text-white/60">{topic.description}</span> : <span className="mt-1 block text-[10px] font-semibold text-[#817A73] group-hover:text-[#625E59]">{replies === 1 ? '1 resposta' : `${replies} respostas`}</span>}</span>
      </Link> : null
    })}</div>
  </nav>
  return <section id="conversas" className="min-w-0">
    <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#A94E38]">Conversas organizadas</p>
    <h2 className="event-section-title mt-1">Tópicos do Bench</h2>
    <p className="mt-3 max-w-3xl text-sm leading-7 text-[#625E59]">O grupo de WhatsApp continua aberto para a conversa geral. No legalops.club, cada frente tem um espaço próprio para registrar experiências e respostas.</p>
    <div className="mt-6 grid gap-3 sm:grid-cols-2">{topics.map((topic, index) => {
      const content = <><span className="text-[10px] font-black text-[#A94E38]">0{topic.display_order || index + 1}</span><h3 className="mt-2 font-bold">{topic.title}</h3><p className="mt-2 text-sm leading-6 text-[#625E59]">{topic.description}</p>{linked && topic.id ? <span className="mt-3 inline-flex items-center text-xs font-bold text-[#A94E38]">Abrir conversa <ArrowRight className="ml-1 h-3.5 w-3.5" /></span> : null}</>
      return linked && topic.id ? <Link key={topic.id} href={`/community/events/${eventSlug}?tab=discussoes&topic=${topic.id}#publicacoes`} className="rounded-xl border border-[#DED6C9] bg-white p-4 hover:border-[#A94E38]">{content}</Link> : <article key={topic.id || topic.title} className="rounded-xl border border-[#DED6C9] bg-white p-4">{content}</article>
    })}</div>
  </section>
}

function PublicEventLanding({ initialSection, event, translations, user, registered, registrationError, phoneError, clubStatus, dateTbd, past, registrationCount, whatsappSummaries, conversationTopics }: {
  initialSection?: string
  event: PublicEvent
  translations: Awaited<ReturnType<typeof loadClubTranslations>>
  user: { id: string } | null
  registered: boolean
  registrationError: boolean
  phoneError?: boolean
  clubStatus?: string
  dateTbd: boolean
  past: boolean
  registrationCount: number | null
  whatsappSummaries: EventSummaryArchive
  conversationTopics: EventConversationTopic[]
}) {
  const t = getClubTranslator()
  const locale = getClubLocale()
  const date = dateTbd ? t('Data a confirmar') : new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short', timeZone: getClubTimezone() }).format(new Date(event.starts_at))
  const mode = /formato a confirmar/i.test(event.location_label || '') ? t('A confirmar') : event.participation_mode === 'presencial' ? t('Presencial') : event.participation_mode === 'hibrido' ? t('Híbrido') : t('Remoto')
  const joinUrl = `/club/entrar?next=${encodeURIComponent(`/community/events/${event.slug}`)}`
  const source = translations.sources.get(`event:${event.id}`)
  const questions = event.pre_questions?.filter(Boolean) ?? []
  const calendarLink = !dateTbd && googleCalendarEventLink(event.google_event_id)

  const registration = <div className="event-form">
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
            {clubStatus === 'confirmation_sent' ? <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-bold text-emerald-900">{t('Confira seu email para ativar o Club.')}</p><p className="mt-1 text-xs leading-5 text-emerald-800">{t('Depois de criar sua senha e completar o perfil, você poderá acompanhar as conversas e materiais.')}</p></div> : null}
            {clubStatus === 'existing_account' ? <div className="mt-5 rounded-xl border border-[#CEC8BD] bg-white p-4"><p className="text-sm font-bold">{t('Você já tem uma conta LegalOps.')}</p><p className="mt-1 text-xs leading-5 text-[#625E59]">{t('Entre para completar seu perfil e acompanhar as conversas do evento.')}</p></div> : null}
            {clubStatus === 'error' ? <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-bold text-amber-900">{t('A vaga no evento está confirmada.')}</p><p className="mt-1 text-xs leading-5 text-amber-800">{t('Não conseguimos iniciar sua conta do Club agora. Você pode criá-la separadamente.')}</p></div> : null}
            {clubStatus !== 'confirmation_sent' ? <Link href={clubStatus === 'existing_account' ? `/login?next=${encodeURIComponent(joinUrl)}` : joinUrl} className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-[#24231F] px-4 text-sm font-bold">{clubStatus === 'existing_account' ? t('Entrar na minha conta') : user ? t('Completar meu cadastro') : t('Conhecer a comunidade')} <ArrowRight className="ml-2 h-4 w-4" /></Link> : null}
          </div> : registrationError ? <div role="alert">
            <p className="text-xs font-black uppercase tracking-[.14em] text-[#A94E38]">{t('Inscrição pendente')}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-.035em]">{t('Não foi possível registrar agora.')}</h2>
            <p className="mt-3 text-sm leading-6 text-[#625E59]">{t('Envie seus dados por email e a organização confirmará sua participação.')}</p>
            <a href={`mailto:hi@legalops.club?subject=${encodeURIComponent(`Inscrição · ${event.title}`)}`} className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#24231F] px-4 text-sm font-bold text-white">{t('Enviar por email')} <ArrowRight className="ml-2 h-4 w-4" /></a>
          </div> : <form action={registerPublicEvent}>
            {phoneError ? <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{t('Informe seu WhatsApp com +DDI e DDD, usando o mesmo número do grupo do Bench.')}</p> : null}
            {event.id ? <input type="hidden" name="event_id" value={event.id} /> : null}
            <input type="hidden" name="event_slug" value={event.slug} />
            <input type="hidden" name="source_locale" value={locale} />
            <p className="text-xs font-black uppercase tracking-[.14em] text-[#A94E38]">{t('Inscrição gratuita')}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-.035em]">{t('Reserve sua vaga')}</h2>
            <p className="mt-2 text-sm leading-6 text-[#625E59]">{t('Você não precisa criar uma conta para registrar seu interesse.')}</p>
            <div className="event-registration-fields">
              <label className="block text-xs font-bold">{t('Nome')}<input name="name" autoComplete="name" required minLength={2} className="mt-1.5 min-h-12 w-full rounded-lg border border-[#CEC8BD] bg-white px-3 text-base" /></label>
              <label className="block text-xs font-bold">{t('E-mail')}<input name="email" autoComplete="email" required type="email" className="mt-1.5 min-h-12 w-full rounded-lg border border-[#CEC8BD] bg-white px-3 text-base" /></label>
              <label className="block text-xs font-bold">{t('WhatsApp com DDI e DDD')}<input name="phone" autoComplete="tel" required type="tel" maxLength={40} placeholder="+55 11 99999-9999" aria-describedby="bench-phone-help" className="mt-1.5 min-h-12 w-full rounded-lg border border-[#CEC8BD] bg-white px-3 text-base" /></label>
              <p id="bench-phone-help" className="text-xs leading-5 text-[#625E59]">{t('Informe o mesmo número que você usa no grupo do Bench, começando com + e o código do país. Esse dado não será exibido publicamente.')}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-bold">{t('Cargo')}<input name="role" autoComplete="organization-title" required minLength={2} className="mt-1.5 min-h-12 w-full rounded-lg border border-[#CEC8BD] bg-white px-3 text-base" /></label>
                <label className="block text-xs font-bold">{t('Onde trabalha')}<input name="organization" autoComplete="organization" required minLength={2} className="mt-1.5 min-h-12 w-full rounded-lg border border-[#CEC8BD] bg-white px-3 text-base" /></label>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-[#D9D0C4] bg-[#FAF7F1] p-3">
              <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#A94E38]">{t('Opcional')}</p>
              <label className="mt-2 flex cursor-pointer items-start gap-3 text-sm">
                <input type="checkbox" name="join_club" className="mt-1 h-4 w-4 shrink-0 accent-[#24231F]" />
                <span><strong className="block">{t('Também quero entrar no LegalOps Club')}</strong><span className="mt-1 block text-xs leading-5 text-[#625E59]">{t('Receba um email para ativar sua conta e acompanhar as conversas, materiais e próximos encontros.')}</span></span>
              </label>
              <p className="mt-2 border-t border-[#E6DED0] pt-2 text-[11px] leading-5 text-[#716B65]">{t('A inscrição no evento é independente do Club.')}</p>
            </div>
            <button className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#24231F] px-5 text-sm font-bold text-white hover:bg-[#3A3834]">{t('Quero participar')} <ArrowRight className="ml-2 h-4 w-4" /></button>
            <p className="mt-4 flex gap-2 text-[11px] leading-5 text-[#716B65]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />{t('Seus dados serão usados para organizar o encontro e enviar as informações de acesso.')}</p>
          </form>}
  </div>
  const overview = <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(15rem,.7fr)]">
    <div className="min-w-0 space-y-5">
      <article>
        <h2 className="event-section-title">{t('Sobre o encontro')}</h2>
        <div className="mt-3"><TranslatedContent source={source} original={{description:event.description}} enabled={translations.enabled} serverLocale={locale} bodyClassName="whitespace-pre-wrap text-sm leading-6 text-[#625E59]" /></div>
      </article>
      {questions.length ? <article>
        <h2 className="text-sm font-bold">{t('O que vamos discutir?')}</h2>
        <ol className="mt-3 space-y-3">{questions.map((question,index)=><li key={question} className="flex gap-3 text-sm leading-6 text-[#625E59]"><span className="font-bold text-[#A94E38]">{String(index+1).padStart(2,'0')}</span><span>{question}</span></li>)}</ol>
      </article> : null}
    </div>
    <aside className="self-start rounded-xl border border-[#E6DED0] bg-[#F8F5EF] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#A94E38]">{past ? t('Evento realizado') : t('Inscrição gratuita')}</p>
      <h2 className="mt-2 text-lg font-semibold">{past ? t('Continue pela comunidade') : t('Participe da conversa')}</h2>
      {event.participation_details ? <div className="mt-2"><TranslatedContent source={source} original={{participation_details:event.participation_details}} enabled={translations.enabled} serverLocale={locale} bodyClassName="text-sm leading-6 text-[#625E59]" /></div> : null}
      {!past ? <EventSectionButton section="inscricao" className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#24231F] px-4 text-sm font-bold text-white">{t('Reserve sua vaga')} <ArrowRight className="ml-2 h-4 w-4" /></EventSectionButton> : null}
      <Link href={joinUrl} className="mt-2 inline-flex min-h-11 items-center text-xs font-semibold text-[#A94E38] underline underline-offset-4">{user ? t('Completar meu cadastro') : t('Conhecer a comunidade')}</Link>
      <div className="mt-3 border-t border-[#DED6C9] pt-3"><EventShare slug={event.slug} title={event.title} variant="invitation" /></div>
      {calendarLink ? <a href={calendarLink} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-11 items-center text-xs font-semibold underline">Abrir no Google Calendar</a> : null}
    </aside>
  </div>
  const header = <>
    <div className="mb-2 flex min-h-8 flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <Link href="/community/calendar" className="inline-flex min-h-11 items-center font-semibold text-[#A94E38]">{t('← Eventos')}</Link>
      <span className="text-[#817A73]">{past ? t('Evento realizado') : t('Inscrições abertas')}</span>
      {registrationCount !== null ? <span className="ml-auto rounded-full border border-[#CEC8BD] px-2 py-1 text-[11px] text-[#625E59]">{registrationCount === 1 ? t('{count} pessoa inscrita', { count: registrationCount }) : t('{count} pessoas inscritas', { count: registrationCount })}</span> : null}
    </div>
    <TranslatedContent source={source} original={{title:event.title}} enabled={translations.enabled} serverLocale={locale} titleAs="h1" titleClassName="font-semibold" />
    <dl className="event-meta mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#625E59]">
      <div className="flex items-center gap-1.5"><dt><CalendarDays className="h-3.5 w-3.5" aria-label={t('Quando')} /></dt><dd>{date}</dd></div>
      <div className="flex items-center gap-1.5"><dt><MapPin className="h-3.5 w-3.5" aria-label={t('Formato')} /></dt><dd>{mode}</dd></div>
      <div className="flex items-center gap-1.5"><dt><UserRound className="h-3.5 w-3.5" aria-label={t('Organização')} /></dt><dd>{event.host_name}</dd></div>
    </dl>
  </>
  return <EventWorkspace header={header} initialSection={initialSection || (registered || registrationError || phoneError ? 'inscricao' : user && isEventWhatsAppSummaryEnabled(event.slug) ? 'resumos' : 'sobre')} sections={[
    { id: 'sobre', label: t('Sobre'), content: overview },
    { id: 'inscricao', label: registered ? t('Inscrição') : t('Participar'), content: registration },
    ...(isEventWhatsAppSummaryEnabled(event.slug) ? [{ id: 'resumos', label: t('Resumos'), locked: whatsappSummaries.status === 'signed-out', content: <EventWhatsAppSummaryArchive archive={whatsappSummaries} eventSlug={event.slug} /> }] : []),
    ...(conversationTopics.length ? [{ id: 'discussoes', label: t('Conversas'), content: <EventConversationTopicDirectory topics={conversationTopics} eventSlug={event.slug} /> }] : []),
  ]} />
}

export default async function EventPage({ params, searchParams }: { params: { slug: string }, searchParams?: { registered?: string, registration?: string, club?: string, shared?: string, tab?: string, topic?: string } }) {
 const t = getClubTranslator()

  const fallback = getPublicEventFallback(params.slug)
  if (fallback && headers().get('x-public-event-fallback') === params.slug) {
    const liveEvent = await loadLivePublicEvent(params.slug)
    const publicEvent = liveEvent ?? fallback
    const dateTbd = /data(?: e formato)? a confirmar/i.test(publicEvent.location_label || '')
    const past = !dateTbd && new Date(publicEvent.ends_at || publicEvent.starts_at) < new Date()
    const [registrationCount, conversationTopics] = await Promise.all([loadConfirmedEventRegistrationCount(publicEvent.id), loadPublicEventConversationTopics(publicEvent.id, publicEvent.slug)])
    const whatsappSummaries: EventSummaryArchive = { summaries: [], status: 'signed-out' }
    return <PublicEventLanding initialSection={searchParams?.tab} event={publicEvent} translations={{ enabled: false, sources: new Map() }} user={null} registered={Boolean(searchParams?.registered)} registrationError={searchParams?.registration === 'error'} phoneError={searchParams?.registration === 'phone'} clubStatus={searchParams?.club} dateTbd={dateTbd} past={past} registrationCount={registrationCount} whatsappSummaries={whatsappSummaries} conversationTopics={conversationTopics} />
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: event } = await supabase.from('community_events').select('id,slug,title,description,host_name,starts_at,ends_at,location_label,event_type,is_published,participation_mode,participation_details,pre_questions,google_event_id,google_meet_url').eq('slug', params.slug).eq('is_published', true).maybeSingle()
  if (!event) return <div className="mx-auto max-w-2xl px-5 py-16"><h1 className="text-2xl font-bold">{t("Evento não encontrado")}</h1><Link className="mt-4 inline-flex underline" href="/community/calendar">{t("Voltar para eventos")}</Link></div>
  const [registrationCount, memberResult, whatsappSummaries, conversationTopics] = await Promise.all([
    loadConfirmedEventRegistrationCount(event.id),
    user ? supabase.from('community_members').select('display_name,current_role,club_access_status,club_access_expires_at').eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
    user && !user.is_anonymous && isEventWhatsAppSummaryEnabled(event.slug) ? loadEventWhatsAppSummaries(supabase, event.id) : Promise.resolve<EventSummaryArchive>({ summaries: [], status: 'signed-out' }),
    loadPublicEventConversationTopics(event.id, event.slug),
  ])
  const { data: member } = memberResult
  const isMember = hasActiveClubAccess(member)
  const [{ data: attendance }, { data: eventAdmin }] = user && isMember ? await Promise.all([
    supabase.from('community_event_rsvps').select('id,response,guest_name,guest_role,organization_name,guest_email,guest_phone,dietary_restrictions,accessibility_needs,arrival_notes').eq('event_id', event.id).eq('user_id', user.id).maybeSingle(),
    supabase.from('community_event_admins').select('event_id').eq('event_id', event.id).eq('user_id', user.id).maybeSingle(),
  ]) : [{ data: null }, { data: null }]
  const canContribute = Boolean(attendance?.response === 'confirmed' || eventAdmin)
  const [{ data: resources }, { data: discussions }] = await Promise.all([
    canContribute ? supabase.from('community_event_resources').select('id,publication_id,uploader_id,title,description,kind,resource_url,storage_path,created_at').eq('event_id', event.id).is('duplicate_of', null).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
    canContribute ? supabase.from('community_posts').select('id,topic_id,title,body,created_at,community_comments(id,author_name,body,created_at)').eq('event_id', event.id).order('created_at', { ascending: false }).limit(50) : Promise.resolve({ data: [] }),
  ])
  const authorIds = Array.from(new Set(resources?.map(item => item.uploader_id) ?? []))
  const { data: authors } = authorIds.length ? await supabase.from('community_members').select('user_id,display_name,avatar_path,current_role,organization_name').in('user_id', authorIds) : { data: [] }
  const dateTbd = /data(?: e formato)? a confirmar/i.test(event.location_label || '')
  const past = !dateTbd && new Date(event.ends_at || event.starts_at) < new Date()
  const initialSection = searchParams?.topic ? 'discussoes' : searchParams?.tab || (isEventWhatsAppSummaryEnabled(event.slug) ? 'resumos' : 'sobre')
  const selectedTopic = conversationTopics.find(topic => topic.id && topic.id === searchParams?.topic) ?? null
  const selectedDiscussions = selectedTopic ? (discussions ?? []).filter(post => post.topic_id === selectedTopic.id) : []
  const topicActivity = new Map<string, number>()
  for (const post of discussions ?? []) if (post.topic_id) topicActivity.set(post.topic_id, (topicActivity.get(post.topic_id) ?? 0) + (post.community_comments?.length ?? 0))
  const translations = await loadClubTranslations(supabase, [event.id,...(discussions ?? []).flatMap(post => [post.id, ...(post.community_comments ?? []).map(comment => comment.id)]),...(resources ?? []).map(resource => resource.id),...authorIds])
  if (!isMember) return <PublicEventLanding initialSection={searchParams?.tab} event={event as PublicEvent} translations={translations} user={user} registered={Boolean(searchParams?.registered)} registrationError={searchParams?.registration === 'error'} phoneError={searchParams?.registration === 'phone'} clubStatus={searchParams?.club} dateTbd={dateTbd} past={past} registrationCount={registrationCount} whatsappSummaries={whatsappSummaries} conversationTopics={conversationTopics} />

  const overview = <div className="space-y-5">
    <TranslatedContent source={translations.sources.get(`event:${event.id}`)} original={{description:event.description,location_label:event.location_label}} enabled={translations.enabled} serverLocale={getClubLocale()} />
    <dl className="space-y-4 text-sm text-[#625E59]">
      <div><dt className="text-xs font-semibold text-[#817A73]">{t('Quando')}</dt><dd className="mt-1">{dateTbd ? t('Data a confirmar') : new Intl.DateTimeFormat(getClubLocale(), { dateStyle: 'long', timeStyle: 'short', timeZone: getClubTimezone() }).format(new Date(event.starts_at))}</dd></div>

      <div><dt className="text-xs font-semibold text-[#817A73]">{t('Organização')}</dt><dd className="mt-1 break-words">{event.host_name}</dd></div>
    </dl>
    <div className="space-y-2 border-t border-[#E6DED0] pt-4">
      <EventShare slug={event.slug} title={event.title} />
      {googleCalendarEventLink(event.google_event_id) && !dateTbd ? <a href={googleCalendarEventLink(event.google_event_id) ?? '#'} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-xs font-bold text-[#A94E38] underline underline-offset-4">Abrir no Google Calendar</a> : null}
    </div>
  </div>
  const attendanceCard = isMember && user && !past ? <section className="rounded-xl border border-[#CEC8BD] bg-[#F5F1E8] p-4 sm:p-5">
    <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#A94E38]">{t('Minha participação')}</p>
    <h2 className="mt-2 text-lg font-bold">{attendance?.response === 'confirmed' ? t('Presença confirmada') : t('Confirmar presença')}</h2>
    <p className="mt-2 text-xs leading-5 text-[#716B65]">{attendance?.response === 'confirmed' ? t('Revise seus dados ou avise se não puder participar.') : t('Confirme seus dados para participar do encontro e das conversas.')}</p>
    <details open className="mt-3"><summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold underline underline-offset-4">{attendance?.response === 'confirmed' ? t('Revisar participação') : t('Confirmar agora')}</summary><div className="mt-3"><BenchClient eventId={event.id} initial={attendance} member={{ name: member?.display_name || '', role: member?.current_role || '', email: user.email || '' }} /></div></details>
  </section> : null
  const conversation = <div className="space-y-4">
        {!canContribute ? <><EventConversationTopicDirectory topics={conversationTopics} eventSlug={event.slug} /><p className="rounded-xl border border-[#CEC8BD] bg-white p-5 text-sm leading-6 text-[#625E59]">Confirme sua participação no Bench para entrar nas conversas específicas do evento.</p></> : <div className="grid items-start gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <div className="hidden lg:block"><EventConversationTopicDirectory topics={conversationTopics} eventSlug={event.slug} linked selectedTopicId={selectedTopic?.id} activity={topicActivity} /></div><details open={!selectedTopic} className="rounded-lg border border-[#CEC8BD] lg:hidden"><summary className="min-h-11 cursor-pointer px-3 py-3 text-sm font-semibold">{selectedTopic ? `Tópico: ${selectedTopic.title}` : 'Escolher tópico'}</summary><EventConversationTopicDirectory topics={conversationTopics} eventSlug={event.slug} linked selectedTopicId={selectedTopic?.id} activity={topicActivity} /></details>
        {selectedTopic ? <section className="min-w-0 rounded-xl border border-[#CEC8BD] bg-white p-4 sm:p-6">
          <Link href={`/community/events/${event.slug}?tab=discussoes#publicacoes`} className="inline-flex min-h-11 items-center text-xs font-bold text-[#A94E38]">← Todos os tópicos</Link>
          <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#A94E38]">Tópico em discussão</p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-.03em]">{selectedTopic.title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#625E59]">{selectedTopic.description}</p>
          {selectedDiscussions.length ? <div className="mt-6 space-y-5">{selectedDiscussions.map(post => <article key={post.id} className="rounded-xl bg-[#F8F5EF] p-4 sm:p-5">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[.12em] text-[#817A73]">Ponto de partida</p>
            <TranslatedContent source={translations.sources.get(`post:${post.id}`)} original={{title:post.title,body:post.body}} enabled={translations.enabled} serverLocale={getClubLocale()} />
            {(post.community_comments ?? []).length ? <div className="mt-5 space-y-3 border-t border-[#DED6C9] pt-5"><p className="text-[10px] font-black uppercase tracking-[.12em] text-[#817A73]">{post.community_comments.length === 1 ? '1 resposta' : `${post.community_comments.length} respostas`}</p>{[...(post.community_comments ?? [])].sort((a,b)=>a.created_at.localeCompare(b.created_at)).map(comment => <div key={comment.id} className="rounded-lg bg-white p-3 text-sm leading-6"><p className="text-xs font-bold text-[#817A73]">{comment.author_name}</p><TranslatedContent source={translations.sources.get(`comment:${comment.id}`)} original={{body:comment.body}} enabled={translations.enabled} serverLocale={getClubLocale()} compact /></div>)}</div> : null}
            <form action={createCommunityComment} className="mt-5 flex gap-2 border-t border-[#DED6C9] pt-5">
              <input type="hidden" name="post_id" value={post.id} />
              <input type="hidden" name="return_to" value={`/community/events/${event.slug}?tab=discussoes&topic=${selectedTopic.id}#publicacoes`} />
              <input name="body" required maxLength={3000} aria-label="Responder neste tópico" placeholder="Compartilhe sua experiência ou pergunta…" className="min-h-11 min-w-0 flex-1 rounded-lg border border-[#CEC8BD] bg-white px-3 text-base" />
              <button aria-label="Enviar resposta" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-[#24231F] text-white"><Send className="h-4 w-4" /></button>
            </form>
            <p className="mt-2 text-[11px] leading-5 text-[#817A73]">Novas perguntas e respostas também são encaminhadas ao grupo do Bench no WhatsApp.</p>
          </article>)}</div> : <p className="mt-5 rounded-lg bg-[#F5F1E8] p-4 text-sm">A conversa deste tópico será aberta pela organização.</p>}
        </section> : <section className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-[#CEC8BD] bg-white p-6 text-center"><div className="max-w-sm"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#F5F1E8]"><MessageCircle className="h-5 w-5 text-[#A94E38]" /></span><h2 className="mt-4 text-lg font-bold">Escolha uma frente da conversa</h2><p className="mt-2 text-sm leading-6 text-[#625E59]">Abra um dos tópicos para ler as respostas e compartilhar sua experiência ou pergunta.</p></div></section>}
        </div>}
      </div>
  const publications = (photos: boolean) => canContribute ? <section aria-label={t('Publicações do evento')}>
    <details className="rounded-lg border border-[#CEC8BD] bg-[#FAF7F1] px-4"><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">{photos ? t('Compartilhar fotos') : t('Compartilhar documento')}</summary><div className="pb-4"><EventUpload eventId={event.id} photos={photos} /></div></details>
    <EventPublications translations={translations} resources={(resources ?? []).filter(item => photos ? item.kind === 'foto' : item.kind !== 'foto')} authors={authors ?? []} />
  </section> : <div className="mx-auto max-w-lg py-6 text-center"><h2 className="event-section-title">{t('Conteúdo para participantes')}</h2><p className="mt-3 text-sm leading-6 text-[#625E59]">{t('As fotos e documentos são exclusivos de participantes confirmados e organizadores. Se você participou e não tem acesso, peça à organização para conferir sua inscrição.')}</p>{attendanceCard ? <EventSectionButton section="participacao" className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-[#24231F] px-4 text-sm font-semibold text-white">{t('Confirmar presença')}</EventSectionButton> : null}</div>
  return <EventWorkspace header={    <div>
      <div className="flex min-h-11 flex-wrap items-center gap-3 text-xs">
        <Link href="/community/calendar" className="inline-flex min-h-11 items-center font-semibold text-[#A94E38]">{t('← Eventos')}</Link>
        <span className="text-[#817A73]">{past ? t('Evento realizado') : t('Próximo evento')}</span>
        {eventAdmin ? <Link href={`/club/admin/events/${event.slug}`} className="ml-auto inline-flex min-h-11 items-center rounded-lg border border-[#CEC8BD] bg-white px-4 font-bold text-[#24231F]">Ver confirmados</Link> : null}
      </div>
      <TranslatedContent source={translations.sources.get(`event:${event.id}`)} original={{title:event.title}} enabled={translations.enabled} serverLocale={getClubLocale()} titleAs="h1" titleClassName="text-2xl font-extrabold leading-tight tracking-[-.025em] text-[#252420] sm:text-3xl" />
    </div>} initialSection={initialSection} sections={[
    { id: 'sobre', label: t('Sobre'), content: <div className="max-w-3xl"><h2 className="event-section-title mb-4">{t('Sobre o encontro')}</h2>{overview}</div> },
    ...(isEventWhatsAppSummaryEnabled(event.slug) ? [{ id: 'resumos', label: t('Resumos'), content: <EventWhatsAppSummaryArchive archive={whatsappSummaries} eventSlug={event.slug} /> }] : []),
    { id: 'discussoes', label: t('Conversas'), content: conversation },
    { id: 'fotos', label: t('Fotos'), content: publications(true) },
    { id: 'documentos', label: t('Documentos'), content: publications(false) },
    ...(attendanceCard ? [{ id: 'participacao', label: t('Participação'), content: attendanceCard }] : []),
  ]} />
}
