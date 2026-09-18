import { TranslatedContent } from '@/components/community/TranslatedContent'
import { loadClubTranslations } from '@/lib/club-translations'
import { getClubLocale, getClubTranslator, getClubTimezone } from '@/lib/club-locale-server'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasActiveClubAccess } from '@/lib/community'
import { registerPublicEvent } from '../../actions'
import { EventUpload } from '@/components/community/EventUpload'
import { EventPublications } from '@/components/community/EventPublications'
import BenchClient from '../../bench/BenchClient'
import { EventShare } from '@/components/community/EventShare'

export const dynamic = 'force-dynamic'

export default async function EventPage({ params, searchParams }: { params: { slug: string }, searchParams?: { registered?: string, shared?: string, tab?: string } }) {
 const t = getClubTranslator()

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: event } = await supabase.from('community_events').select('id,slug,title,description,host_name,starts_at,ends_at,location_label,location_url,event_type,is_published').eq('slug', params.slug).eq('is_published', true).maybeSingle()
  if (!event) return <div className="mx-auto max-w-2xl px-5 py-16"><h1 className="text-2xl font-bold">{t("Evento não encontrado")}</h1><Link className="mt-4 inline-flex underline" href="/community/calendar">{t("Voltar para eventos")}</Link></div>
  const { data: member } = await supabase.from('community_members').select('display_name,current_role,club_access_status,club_access_expires_at').eq('user_id', user?.id ?? '').maybeSingle()
  const isMember = hasActiveClubAccess(member)
  const { data: attendance } = user && isMember ? await supabase.from('community_event_rsvps').select('id,response,guest_name,guest_role,organization_name,guest_email,guest_phone,dietary_restrictions,accessibility_needs,arrival_notes').eq('event_id', event.id).eq('user_id', user.id).maybeSingle() : { data: null }
  const { data: eventAdmin } = user && isMember ? await supabase.from('community_event_admins').select('event_id').eq('event_id', event.id).eq('user_id', user.id).maybeSingle() : { data: null }
  const canContribute = Boolean(attendance?.response === 'confirmed' || eventAdmin)
  const { data: resources } = canContribute ? await supabase.from('community_event_resources').select('id,publication_id,uploader_id,title,description,kind,resource_url,storage_path,created_at').eq('event_id', event.id).is('duplicate_of', null).order('created_at', { ascending: false }) : { data: [] }
  const authorIds = Array.from(new Set(resources?.map(item => item.uploader_id) ?? []))
  const { data: authors } = authorIds.length ? await supabase.from('community_members').select('user_id,display_name,avatar_path,current_role,organization_name').in('user_id', authorIds) : { data: [] }
  const { data: discussions } = isMember ? await supabase.from('community_posts').select('id,title,body,created_at').eq('event_id', event.id).order('created_at', { ascending: false }).limit(20) : { data: [] }
  const past = new Date(event.ends_at || event.starts_at) < new Date()
  const joinUrl = `/club/entrar?next=${encodeURIComponent(`/community/events/${event.slug}`)}`
  const activeTab = searchParams?.tab === 'discussoes' ? 'discussoes' : searchParams?.tab === 'documentos' ? 'documentos' : 'fotos'
  const visibleResources = resources?.filter(item => activeTab === 'fotos' ? item.kind === 'foto' : item.kind !== 'foto') ?? []
  const translations = await loadClubTranslations(supabase, [event.id,...(discussions ?? []).map(post => post.id),...(resources ?? []).map(resource => resource.id),...authorIds])
  const overview = <div className="space-y-5">
    <TranslatedContent source={translations.sources.get(`event:${event.id}`)} original={{description:event.description,location_label:event.location_label}} enabled={translations.enabled} serverLocale={getClubLocale()} />
    <dl className="space-y-4 text-sm text-[#625E59]">
      <div><dt className="text-xs font-semibold text-[#817A73]">{t('Quando')}</dt><dd className="mt-1">{new Intl.DateTimeFormat(getClubLocale(), { dateStyle: 'long', timeStyle: 'short', timeZone: getClubTimezone() }).format(new Date(event.starts_at))}</dd></div>

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
      <TranslatedContent source={translations.sources.get(`event:${event.id}`)} original={{title:event.title}} enabled={translations.enabled} serverLocale={getClubLocale()} />
    </header>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-6">
      <div className="min-w-0">
        <details open={!isMember || !past} className="mb-4 rounded-xl border border-[#CEC8BD] bg-white xl:hidden">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">{t('Sobre o encontro')}<ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0" /></summary>
          <div className="border-t border-[#E6DED0] p-4">{overview}</div>
        </details>
        {isMember && <nav id="publicacoes" aria-label={t('Conteúdo do evento')} className="mb-4 flex scroll-mt-20 gap-1 border-b border-[#CEC8BD]">
          {([{ key: 'fotos', label: t("Fotos") }, { key: 'documentos', label: t("Documentos") }, { key: 'discussoes', label: t("Conversas") }] as const).map(tab => <Link key={tab.key} href={`/community/events/${event.slug}?tab=${tab.key}#publicacoes`} aria-current={activeTab === tab.key ? 'page' : undefined} className={`inline-flex min-h-12 flex-1 items-center justify-center border-b-2 px-2 text-sm font-semibold sm:flex-none sm:px-5 ${activeTab === tab.key ? 'border-[#A94E38] text-[#A94E38]' : "border-transparent text-[#625E59] hover:text-[#24231F]"}`}>{t(tab.label)}</Link>)}
        </nav>}
      {searchParams?.registered ? <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{t("Cadastro recebido. Para acessar materiais e discussões, entre na comunidade.")}</p> : null}
      {!isMember && !past ? <form action={registerPublicEvent} className="mb-4 rounded-xl bg-[#F5F1E8] p-4 sm:p-5"><input type="hidden" name="event_id" value={event.id} /><h2 className="font-bold">{t("Reserve sua vaga")}</h2><p className="mt-1 text-xs leading-5 text-[#716B65]">{t("O cadastro é público. Seu acesso aos materiais depois do encontro depende de uma conta da comunidade.")}</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><input name="name" required minLength={2} placeholder={t("Nome")} className="min-h-11 rounded-lg border bg-white px-3 text-sm" /><input name="email" required type="email" placeholder={t("E-mail")} className="min-h-11 rounded-lg border bg-white px-3 text-sm" /><input name="role" required minLength={2} placeholder={t("Cargo")} className="min-h-11 rounded-lg border bg-white px-3 text-sm" /><input name="organization" required minLength={2} placeholder={t("Onde trabalha")} className="min-h-11 rounded-lg border bg-white px-3 text-sm" /></div><button className="mt-4 min-h-11 rounded-lg bg-[#24231F] px-5 text-sm font-bold text-white">{t("Confirmar cadastro")}</button></form> : null}
      {!isMember ? <section className="mb-4 rounded-xl border border-[#CEC8BD] bg-[#F5F1E8] p-4 text-sm text-[#625E59]">
        <h2 className="font-semibold text-[#24231F]">{t("Inscreva-se na comunidade para acessar este encontro")}</h2>
        <p className="mt-2 leading-6">{t("Fotos, documentos e discussões ficam na área dos membros. Entre na comunidade para acompanhar as conversas; participantes e organizadores também podem compartilhar os materiais do evento.")}</p>
        <Link className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-[#24231F] px-4 font-semibold text-white" href={joinUrl}>{user ? t("Completar meu cadastro") : t("Inscrever-me na comunidade")}</Link>
        {!user && <Link className="ml-3 inline-flex min-h-11 items-center font-semibold underline" href={`/login?next=${encodeURIComponent(joinUrl)}`}>{t("Já tenho conta")}</Link>}
      </section> : null}
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
