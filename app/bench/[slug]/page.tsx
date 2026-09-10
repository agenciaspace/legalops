import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarDays, Check, Clock3, MapPin, UsersRound } from 'lucide-react'
import { ClubHeader } from '@/components/ClubHeader'
import { createAdminClient } from '@/lib/supabase-admin'
import { registerBenchInterest } from '../actions'

export const dynamic = 'force-dynamic'

const roundedFont = { fontFamily: 'var(--font-quicksand), ui-rounded, sans-serif' }
const bodyFont = { fontFamily: 'var(--font-inter), sans-serif' }

type PageProps = {
  params: { slug: string }
  searchParams?: Record<string, string | string[] | undefined>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const admin = createAdminClient()
  const { data } = await admin.from('bench_topics').select('title, description').eq('slug', params.slug).maybeSingle()
  return data ? { title: `${data.title} — bench | legalops.club`, description: data.description } : { title: 'bench — legalops.club' }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long', day: '2-digit', month: 'long',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(value))
}

export default async function BenchTopicPage({ params, searchParams }: PageProps) {
  const admin = createAdminClient()
  const { data: topic } = await admin
    .from('bench_topics')
    .select('id, slug, title, description, category, region_id, status, interest_count, min_participants, ideal_participants, summary, key_findings')
    .eq('slug', params.slug)
    .eq('is_public', true)
    .neq('status', 'archived')
    .maybeSingle()
  if (!topic) notFound()

  const [{ data: region }, { data: session }, { data: leaders }] = await Promise.all([
    topic.region_id
      ? admin.from('community_regions').select('id, name, slug, state_code').eq('id', topic.region_id).maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from('bench_sessions')
      .select('id, starts_at, ends_at, capacity, status')
      .eq('topic_id', topic.id)
      .eq('status', 'scheduled')
      .gte('ends_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    topic.region_id
      ? admin
          .from('community_regional_leaders')
          .select('id, display_name, title, organization, linkedin_url, role')
          .eq('region_id', topic.region_id)
          .eq('status', 'active')
          .order('role')
      : Promise.resolve({ data: [] }),
  ])

  const success = searchParams?.registered === '1' || searchParams?.interested === '1' || searchParams?.waitlist === '1'
  const waitlist = searchParams?.waitlist === '1'
  const calendarError = searchParams?.calendar === 'error'
  const progress = Math.min(100, Math.round((topic.interest_count / Math.max(topic.min_participants, 1)) * 100))

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#111111]" style={bodyFont}>
      <ClubHeader active="communities" />
      <main className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-16">
        <Link href="/bench" className="inline-flex items-center gap-2 text-xs font-bold text-[#716B65] hover:text-[#111111]"><ArrowLeft className="h-3.5 w-3.5" /> Todos os benchs</Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_390px] lg:gap-16">
          <section>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9684F]">bench / {topic.status === 'forming' ? 'formando grupo' : topic.status === 'scheduled' ? 'agendado' : 'realizado'}</span>
              {region ? <Link href="/regions" className="rounded-full border border-[#CEC8BD] bg-[#FAF7F1] px-2.5 py-1 text-[9px] font-semibold text-[#716B65]">{region.name}</Link> : <span className="rounded-full border border-[#CEC8BD] bg-[#FAF7F1] px-2.5 py-1 text-[9px] font-semibold text-[#716B65]">Brasil</span>}
            </div>
            <h1 className="mt-5 max-w-[760px] text-[42px] font-semibold leading-[1.02] tracking-[-0.06em] sm:text-[60px]" style={roundedFont}>{topic.title}<span className="text-[#E88A6A]">.</span></h1>
            <p className="mt-6 max-w-[760px] text-base leading-8 text-[#625E59]">{topic.description}</p>

            {session ? (
              <div className="mt-8 grid gap-3 border-y border-[#CEC8BD] py-5 sm:grid-cols-3">
                <div className="flex items-center gap-2 text-sm font-semibold"><CalendarDays className="h-4 w-4 text-[#C9684F]" /> {formatDate(session.starts_at)}</div>
                <div className="flex items-center gap-2 text-sm font-semibold"><Clock3 className="h-4 w-4 text-[#C9684F]" /> {Math.round((new Date(session.ends_at).getTime() - new Date(session.starts_at).getTime()) / 60000)} min</div>
                <div className="flex items-center gap-2 text-sm font-semibold"><MapPin className="h-4 w-4 text-[#C9684F]" /> Online · Google Meet</div>
              </div>
            ) : (
              <div className="mt-8 border-y border-[#CEC8BD] py-5">
                <div className="flex items-center justify-between gap-4"><span className="text-sm font-bold">{topic.interest_count} interessados</span><span className="text-xs font-semibold text-[#817A73]">meta inicial: {topic.min_participants}</span></div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#DED8CE]"><div className="h-full bg-[#E88A6A]" style={{ width: `${progress}%` }} /></div>
                <p className="mt-3 text-xs leading-5 text-[#77716A]">Você não precisa esperar uma data existir. Entre agora e receba o convite quando o grupo for agendado.</p>
              </div>
            )}

            {leaders && leaders.length > 0 ? (
              <section className="mt-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#817A73]">liderança regional</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {leaders.map(leader => (
                    <a key={leader.id} href={leader.linkedin_url || undefined} target={leader.linkedin_url ? '_blank' : undefined} rel="noreferrer" className="border border-[#CEC8BD] bg-[#FAF7F1] px-4 py-3">
                      <p className="text-sm font-bold">{leader.display_name}</p>
                      <p className="mt-1 text-xs text-[#77716A]">{[leader.title, leader.organization].filter(Boolean).join(' · ') || 'Liderança regional'}</p>
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            {topic.status === 'completed' && (topic.summary || topic.key_findings?.length) ? (
              <section className="mt-10 border-t border-[#CEC8BD] pt-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#C9684F]">o que saiu do bench</p>
                {topic.summary ? <p className="mt-4 max-w-3xl text-sm leading-7 text-[#625E59]">{topic.summary}</p> : null}
                {topic.key_findings?.length ? <ul className="mt-5 space-y-2">{topic.key_findings.map((finding: string) => <li key={finding} className="flex gap-2 text-sm text-[#514D48]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#C9684F]" />{finding}</li>)}</ul> : null}
              </section>
            ) : null}
          </section>

          <aside>
            <div className="sticky top-24 border border-[#BEB7AA] bg-[#FAF7F1] p-5 sm:p-6">
              {success ? (
                <div className="py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E88A6A]/15"><Check className="h-5 w-5 text-[#C9684F]" /></div>
                  <h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em]" style={roundedFont}>{waitlist ? 'você está na lista de espera.' : session ? 'você está dentro.' : 'interesse registrado.'}</h2>
                  <p className="mt-3 text-sm leading-6 text-[#69635E]">{waitlist ? 'Se surgir vaga, sua inscrição pode ser promovida para a sessão.' : session ? 'O convite do calendário foi enviado para o email informado, com o link da reunião.' : 'Quando uma sessão for marcada, usaremos este email para enviar o convite automaticamente.'}</p>
                  {calendarError ? <p className="mt-3 text-xs leading-5 text-[#A24D36]">Sua inscrição foi salva, mas houve falha ao sincronizar o convite. A organização consegue reenviar pelo painel.</p> : null}
                  <Link href="/bench" className="mt-6 inline-flex text-xs font-bold text-[#111111] underline decoration-[#E88A6A] underline-offset-4">Ver outros benchs</Link>
                </div>
              ) : topic.status !== 'completed' ? (
                <>
                  <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#C9684F]">{session ? 'participar' : 'tenho interesse'}</p><span className="flex items-center gap-1 text-xs font-semibold text-[#716B65]"><UsersRound className="h-3.5 w-3.5" /> {topic.interest_count}</span></div>
                  <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em]" style={roundedFont}>{session ? 'entre nesta sessão.' : 'entre no grupo.'}</h2>
                  <p className="mt-2 text-xs leading-5 text-[#77716A]">Gratuito. Não é necessário assinar o Club.</p>
                  <form action={registerBenchInterest} className="mt-5 space-y-3">
                    <input type="hidden" name="topic_id" value={topic.id} />
                    <input name="full_name" required minLength={2} maxLength={120} placeholder="Nome" className="w-full rounded-lg border border-[#CEC8BD] bg-white px-4 py-3 text-sm outline-none focus:border-[#E88A6A]" />
                    <input name="email" type="email" required maxLength={254} placeholder="Email" className="w-full rounded-lg border border-[#CEC8BD] bg-white px-4 py-3 text-sm outline-none focus:border-[#E88A6A]" />
                    <input name="organization" maxLength={120} placeholder="Empresa / organização" className="w-full rounded-lg border border-[#CEC8BD] bg-white px-4 py-3 text-sm outline-none focus:border-[#E88A6A]" />
                    <input name="current_role" maxLength={120} placeholder="Cargo / função" className="w-full rounded-lg border border-[#CEC8BD] bg-white px-4 py-3 text-sm outline-none focus:border-[#E88A6A]" />
                    <button className="w-full rounded-lg bg-[#111111] px-5 py-3 text-sm font-bold text-white hover:bg-[#2A2927]">{session ? 'Participar do bench' : 'Tenho interesse'}</button>
                  </form>
                  <p className="mt-4 text-[10px] leading-4 text-[#918A83]">Seu email não é exibido publicamente. Ele é usado para a gestão do bench e para o convite da reunião.</p>
                </>
              ) : (
                <div className="py-4"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#817A73]">bench realizado</p><h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em]" style={roundedFont}>sessão encerrada.</h2><Link href="/bench" className="mt-5 inline-flex text-xs font-bold underline decoration-[#E88A6A] underline-offset-4">Explorar próximos temas</Link></div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
