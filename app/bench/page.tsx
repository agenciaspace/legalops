import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CalendarDays, Lightbulb, MapPin, UsersRound } from 'lucide-react'
import { ClubHeader } from '@/components/ClubHeader'
import { BrandWordmark } from '@/components/BrandLogo'
import { createAdminClient } from '@/lib/supabase-admin'
import { submitBenchSuggestion } from './actions'

export const metadata: Metadata = {
  title: 'bench — legalops.club',
  description: 'Benchs gratuitos entre profissionais de Legal e Legal Ops: compare práticas, processos, ferramentas e resultados.',
  openGraph: {
    title: 'bench — legalops.club',
    description: 'Compare como outros times jurídicos trabalham. Sessões gratuitas, práticas e sem pitch.',
    url: 'https://legalops.club/bench',
    siteName: 'legalops.club',
    type: 'website',
  },
}

export const dynamic = 'force-dynamic'

const roundedFont = { fontFamily: 'var(--font-quicksand), ui-rounded, sans-serif' }
const bodyFont = { fontFamily: 'var(--font-inter), sans-serif' }

const statusCopy: Record<string, string> = {
  forming: 'formando grupo',
  scheduled: 'agendado',
  completed: 'realizado',
}

function formatSessionDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(value)).replace('.', '')
}

export default async function BenchPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const admin = createAdminClient()
  const [{ data: rawTopics }, { data: rawRegions }, { data: rawSessions }] = await Promise.all([
    admin
      .from('bench_topics')
      .select('id, slug, title, description, category, region_id, status, interest_count, min_participants, ideal_participants')
      .eq('is_public', true)
      .neq('status', 'archived')
      .order('status', { ascending: true })
      .order('interest_count', { ascending: false }),
    admin
      .from('community_regions')
      .select('id, name, slug, state_code, status')
      .eq('is_public', true)
      .neq('status', 'archived')
      .order('name'),
    admin
      .from('bench_sessions')
      .select('id, topic_id, starts_at, ends_at, capacity, status')
      .eq('status', 'scheduled')
      .gte('ends_at', new Date().toISOString())
      .order('starts_at'),
  ])

  const topics = rawTopics ?? []
  const regions = rawRegions ?? []
  const sessions = rawSessions ?? []
  const regionById = new Map(regions.map(region => [region.id, region]))
  const sessionByTopic = new Map(sessions.map(session => [session.topic_id, session]))
  const forming = topics.filter(topic => topic.status === 'forming')
  const scheduled = topics.filter(topic => topic.status === 'scheduled')
  const completed = topics.filter(topic => topic.status === 'completed')
  const suggested = searchParams?.suggested === '1'

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#111111]" style={bodyFont}>
      <ClubHeader active="communities" />
      <main>
        <section className="border-b border-[#CEC8BD]">
          <div className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8 sm:py-24">
            <div className="max-w-[820px]">
              <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#C9684F]">legalops.club / bench</p>
              <h1 className="mt-5 text-[44px] font-semibold leading-[0.98] tracking-[-0.065em] sm:text-[68px]" style={roundedFont}>
                compare como outros times jurídicos trabalham<span className="text-[#E88A6A]">.</span>
              </h1>
              <p className="mt-6 max-w-[720px] text-base leading-7 text-[#625E59] sm:text-lg sm:leading-8">
                Benchs gratuitos entre profissionais de Legal e Legal Ops. Entre em um tema, ajude a formar o grupo e receba o convite da reunião quando a sessão for marcada. Sem pitch comercial.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#temas" className="inline-flex items-center gap-2 rounded-lg bg-[#111111] px-5 py-3 text-sm font-bold text-white hover:bg-[#2A2927]">
                  Ver temas <ArrowRight className="h-4 w-4" />
                </a>
                <Link href="/regions" className="inline-flex items-center gap-2 rounded-lg border border-[#BEB7AA] px-5 py-3 text-sm font-bold hover:bg-[#FAF7F1]">
                  <MapPin className="h-4 w-4" /> Comunidades regionais
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#CEC8BD] bg-[#FAF7F1]">
          <div className="mx-auto grid max-w-[1180px] sm:grid-cols-3">
            {[
              ['01', 'mostre interesse', 'Você entra no tema antes mesmo de existir data.'],
              ['02', 'o grupo se forma', 'Quando há demanda suficiente, um host define data e capacidade.'],
              ['03', 'o convite chega', 'A reunião e o Google Meet são criados e o convite vai para o seu calendário.'],
            ].map(([number, title, copy], index) => (
              <div key={number} className={`px-5 py-9 sm:px-8 ${index ? 'border-t border-[#E6DED0] sm:border-l sm:border-t-0' : ''}`}>
                <span className="text-[10px] font-bold text-[#C9684F]">{number}</span>
                <h2 className="mt-5 text-lg font-semibold tracking-[-0.03em]" style={roundedFont}>{title}<span className="text-[#E88A6A]">.</span></h2>
                <p className="mt-2 text-sm leading-6 text-[#69635E]">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="temas" className="mx-auto max-w-[1180px] scroll-mt-24 px-5 py-16 sm:px-8 sm:py-20">
          <div className="flex flex-col gap-4 border-b border-[#CEC8BD] pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9684F]">em formação</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl" style={roundedFont}>entre no próximo bench<span className="text-[#E88A6A]">.</span></h2>
            </div>
            <span className="text-xs font-semibold text-[#817A73]">{forming.length} temas abertos</span>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {forming.map(topic => {
              const region = topic.region_id ? regionById.get(topic.region_id) : null
              return (
                <Link key={topic.id} href={`/bench/${topic.slug}`} className="group flex min-h-[250px] flex-col border border-[#CEC8BD] bg-[#FAF7F1] p-5 transition hover:-translate-y-0.5 hover:border-[#E88A6A]">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#C9684F]">{statusCopy[topic.status]}</span>
                    {region ? <span className="rounded-full border border-[#D8D2C7] px-2 py-1 text-[9px] font-semibold text-[#716B65]">{region.name}</span> : <span className="text-[9px] font-semibold text-[#918A83]">Brasil</span>}
                  </div>
                  <h3 className="mt-8 text-xl font-semibold leading-tight tracking-[-0.04em]" style={roundedFont}>{topic.title}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#69635E]">{topic.description}</p>
                  <div className="mt-auto flex items-center justify-between border-t border-[#E6DED0] pt-4">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[#716B65]"><UsersRound className="h-3.5 w-3.5" /> {topic.interest_count} interessados</span>
                    <span className="text-xs font-bold text-[#111111] group-hover:text-[#C9684F]">Tenho interesse →</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {scheduled.length > 0 ? (
          <section className="border-y border-[#CEC8BD] bg-[#FAF7F1]">
            <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8">
              <div className="flex items-center gap-3"><CalendarDays className="h-5 w-5 text-[#C9684F]" /><h2 className="text-2xl font-semibold tracking-[-0.04em]" style={roundedFont}>próximos benchs.</h2></div>
              <div className="mt-6 divide-y divide-[#E6DED0] border-y border-[#CEC8BD]">
                {scheduled.map(topic => {
                  const session = sessionByTopic.get(topic.id)
                  return (
                    <Link key={topic.id} href={`/bench/${topic.slug}`} className="grid gap-3 py-5 sm:grid-cols-[180px_1fr_auto] sm:items-center">
                      <span className="text-xs font-bold text-[#C9684F]">{session ? formatSessionDate(session.starts_at) : 'data confirmada'}</span>
                      <div><p className="text-sm font-bold">{topic.title}</p><p className="mt-1 text-xs text-[#77716A]">{topic.interest_count} interessados</p></div>
                      <span className="text-xs font-bold">Participar →</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        ) : null}

        {completed.length > 0 ? (
          <section className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#817A73]">arquivo</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {completed.map(topic => <Link key={topic.id} href={`/bench/${topic.slug}`} className="border border-[#CEC8BD] bg-[#FAF7F1] px-4 py-2 text-xs font-semibold hover:border-[#E88A6A]">{topic.title}</Link>)}
            </div>
          </section>
        ) : null}

        <section className="border-t border-[#CEC8BD] bg-[#111111] text-white">
          <div className="mx-auto grid max-w-[1080px] gap-10 px-5 py-16 sm:px-8 md:grid-cols-[.8fr_1.2fr] md:items-start">
            <div>
              <Lightbulb className="h-5 w-5 text-[#E88A6A]" />
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl" style={roundedFont}>não encontrou o tema?</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[#BEB7AA]">Sugira um bench. A demanda da comunidade vira a próxima agenda.</p>
              {suggested ? <p className="mt-5 text-sm font-bold text-[#E88A6A]">Sugestão recebida.</p> : null}
            </div>
            <form action={submitBenchSuggestion} className="grid gap-3 sm:grid-cols-2">
              <input name="title" required minLength={3} maxLength={180} placeholder="Tema do bench" className="sm:col-span-2 rounded-lg border border-[#3A3936] bg-[#1D1C1A] px-4 py-3 text-sm outline-none focus:border-[#E88A6A]" />
              <input name="full_name" required placeholder="Seu nome" className="rounded-lg border border-[#3A3936] bg-[#1D1C1A] px-4 py-3 text-sm outline-none focus:border-[#E88A6A]" />
              <input name="email" type="email" required placeholder="Seu email" className="rounded-lg border border-[#3A3936] bg-[#1D1C1A] px-4 py-3 text-sm outline-none focus:border-[#E88A6A]" />
              <input name="organization" placeholder="Empresa / organização (opcional)" className="rounded-lg border border-[#3A3936] bg-[#1D1C1A] px-4 py-3 text-sm outline-none focus:border-[#E88A6A]" />
              <select name="region_id" className="rounded-lg border border-[#3A3936] bg-[#1D1C1A] px-4 py-3 text-sm text-[#D7D1C8] outline-none focus:border-[#E88A6A]">
                <option value="">Brasil / sem região</option>
                {regions.map(region => <option key={region.id} value={region.id}>{region.name}</option>)}
              </select>
              <textarea name="context" rows={4} maxLength={2000} placeholder="O que você gostaria de comparar? (opcional)" className="sm:col-span-2 rounded-lg border border-[#3A3936] bg-[#1D1C1A] px-4 py-3 text-sm outline-none focus:border-[#E88A6A]" />
              <button className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-lg bg-[#E88A6A] px-5 py-3 text-sm font-bold text-[#111111] hover:bg-[#F09A7D]">Sugerir bench <ArrowRight className="h-4 w-4" /></button>
            </form>
          </div>
        </section>
      </main>
      <footer className="border-t border-[#CEC8BD] bg-[#FAF7F1] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <BrandWordmark suffix="club" className="inline-flex items-baseline text-[23px] font-semibold leading-none tracking-[-0.055em] text-[#111111]" />
          <div className="flex flex-wrap gap-5 text-xs font-semibold text-[#716B65]"><Link href="/regions" className="hover:text-[#111111]">regiões</Link><Link href="/club" className="hover:text-[#111111]">comunidade</Link><Link href="/login?next=/bench/manage" className="hover:text-[#111111]">gerir bench</Link></div>
        </div>
      </footer>
    </div>
  )
}
