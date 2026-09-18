import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { hasActiveClubAccess } from '@/lib/community'
import { registerPublicEvent } from '../../actions'
import { EventUpload } from '@/components/community/EventUpload'
import { EventPublications } from '@/components/community/EventPublications'
import BenchClient from '../../bench/BenchClient'
import { EventShare } from '@/components/community/EventShare'

export const dynamic = 'force-dynamic'

export default async function EventPage({ params, searchParams }: { params: { slug: string }, searchParams?: { registered?: string, shared?: string, tab?: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: event } = await supabase.from('community_events').select('id,slug,title,description,host_name,starts_at,ends_at,location_label,location_url,event_type,is_published').eq('slug', params.slug).eq('is_published', true).maybeSingle()
  if (!event) return <div className="mx-auto max-w-2xl px-5 py-16"><h1 className="text-2xl font-bold">Evento não encontrado</h1><Link className="mt-4 inline-flex underline" href="/community/calendar">Voltar para eventos</Link></div>
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
  const activeTab = searchParams?.tab === 'documentos' ? 'documentos' : 'fotos'
  const visibleResources = resources?.filter(item => activeTab === 'fotos' ? item.kind === 'foto' : item.kind !== 'foto') ?? []
  return <main className="mx-auto w-full max-w-3xl px-4 py-7 sm:px-6 lg:py-12">
    <Link href="/community/calendar" className="text-xs font-bold text-[#D9470F]">← Eventos</Link>
    {isMember && <Link href="/community/contact" className="ml-4 inline-flex min-h-11 items-center rounded-lg border border-[#CEC8BD] bg-white px-3 text-xs font-semibold">Meu QR code de contato</Link>}
    <article className="mt-5 rounded-2xl border border-[#E1E1DD] bg-white p-5 sm:p-8">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#D9470F]">{past ? 'Evento realizado' : 'Próximo evento'} · {event.event_type}</p>
      <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.03em] text-[#24231F] sm:text-3xl">{event.title}</h1>
      <div className="mt-4"><EventShare slug={event.slug} title={event.title} /></div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#625E59]">{event.description}</p>
      <dl className="mt-6 grid gap-3 border-t border-[#ECECE8] pt-5 text-sm text-[#625E59] sm:grid-cols-2"><div><dt className="text-[9px] font-black uppercase tracking-wider text-[#999690]">Quando</dt><dd className="mt-1 font-semibold">{new Intl.DateTimeFormat('pt-BR',{dateStyle:'full',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(event.starts_at))}</dd></div><div><dt className="text-[9px] font-black uppercase tracking-wider text-[#999690]">Onde</dt><dd className="mt-1 font-semibold">{event.location_label}</dd></div><div><dt className="text-[9px] font-black uppercase tracking-wider text-[#999690]">Organização</dt><dd className="mt-1 font-semibold">{event.host_name}</dd></div></dl>
      {searchParams?.registered ? <p role="status" className="mt-6 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Cadastro recebido. Para acessar materiais e discussões, entre na comunidade.</p> : null}
      {!isMember && !past ? <form action={registerPublicEvent} className="mt-7 rounded-xl bg-[#F5F1E8] p-4 sm:p-5"><input type="hidden" name="event_id" value={event.id} /><h2 className="font-bold">Reserve sua vaga</h2><p className="mt-1 text-xs leading-5 text-[#716B65]">O cadastro é público. Seu acesso aos materiais depois do encontro depende de uma conta da comunidade.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><input name="name" required minLength={2} placeholder="Nome" className="min-h-11 rounded-lg border bg-white px-3 text-sm" /><input name="email" required type="email" placeholder="E-mail" className="min-h-11 rounded-lg border bg-white px-3 text-sm" /><input name="role" required minLength={2} placeholder="Cargo" className="min-h-11 rounded-lg border bg-white px-3 text-sm" /><input name="organization" required minLength={2} placeholder="Onde trabalha" className="min-h-11 rounded-lg border bg-white px-3 text-sm" /></div><button className="mt-4 min-h-11 rounded-lg bg-[#24231F] px-5 text-sm font-bold text-white">Confirmar cadastro</button></form> : null}
      {!isMember ? <section className="mt-6 rounded-xl border border-[#CEC8BD] bg-[#F5F1E8] p-4 text-sm text-[#625E59]">
        <h2 className="font-semibold text-[#24231F]">Inscreva-se na comunidade para acessar este encontro</h2>
        <p className="mt-2 leading-6">Fotos, documentos e discussões ficam na área dos membros. Entre na comunidade para acompanhar as conversas; participantes e organizadores também podem compartilhar os materiais do evento.</p>
        <Link className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-[#24231F] px-4 font-semibold text-white" href={joinUrl}>{user ? 'Completar meu cadastro' : 'Inscrever-me na comunidade'}</Link>
        {!user && <Link className="ml-3 inline-flex min-h-11 items-center font-semibold underline" href={`/login?next=${encodeURIComponent(joinUrl)}`}>Já tenho conta</Link>}
      </section> : null}
      {isMember && user && !past && <details className="mt-6 rounded-xl border border-[#CEC8BD] bg-[#F5F1E8] p-4"><summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold">{attendance?.response === 'confirmed' ? 'Revisar minha participação' : 'Confirmar minha participação'}</summary><div className="mt-4"><BenchClient eventId={event.id} initial={attendance} member={{ name: member?.display_name || '', role: member?.current_role || '', email: user.email || '' }} /></div></details>}
      {isMember && !canContribute && past && <p className="mt-6 rounded-lg border border-[#CEC8BD] p-4 text-sm leading-6 text-[#625E59]">As fotos e documentos são exclusivos de participantes confirmados e organizadores. Se você participou e não tem acesso, peça à organização para conferir sua inscrição.</p>}
      {canContribute ? <section id="publicacoes" className="mt-8 border-t border-[#E6DED0] pt-6">
        <h2 className="text-lg font-bold">Publicações do evento</h2>
        <nav className="mt-4 flex gap-2" aria-label="Conteúdo do evento">
          {(['fotos', 'documentos'] as const).map(tab => <Link key={tab} href={`/community/events/${event.slug}?tab=${tab}#publicacoes`} aria-current={activeTab === tab ? 'page' : undefined} className={`min-h-11 rounded-lg px-4 py-3 text-sm font-semibold ${activeTab === tab ? 'bg-[#24231F] text-white' : 'border border-[#CEC8BD] bg-white'}`}>{tab === 'fotos' ? 'Fotos' : 'Documentos'}</Link>)}
        </nav>
        <EventUpload key={activeTab} eventId={event.id} photos={activeTab === 'fotos'} />
        <EventPublications resources={visibleResources} authors={authors ?? []} />
      </section> : null}
      {isMember ? <section className="mt-8 border-t border-[#ECECE8] pt-6"><h2 className="text-lg font-bold">Discussões do evento</h2>{discussions?.length ? <div className="mt-3 space-y-3">{discussions.map(post => <Link key={post.id} href={`/community?post=${post.id}`} className="block rounded-lg border border-[#E4E2DD] p-3 hover:border-[#FFB99E]"><p className="text-sm font-bold">{post.title}</p><p className="mt-1 line-clamp-2 text-xs text-[#716B65]">{post.body}</p></Link>)}</div> : <p className="mt-2 text-sm text-[#77746E]">A discussão será criada pelos participantes.</p>}</section> : null}
    </article>
  </main>
}
