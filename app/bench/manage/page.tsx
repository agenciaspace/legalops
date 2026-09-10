import Link from 'next/link'
import { ArrowLeft, CalendarDays, CheckCircle2, MapPin, Settings2, UsersRound } from 'lucide-react'
import { BrandWordmark } from '@/components/BrandLogo'
import { createBenchTopic, scheduleBench } from '@/app/bench/actions'
import { isGoogleCalendarConfigured } from '@/lib/google-calendar'
import { requireCommunityManager } from '@/lib/legalops-admin'

export const dynamic = 'force-dynamic'

const roundedFont = { fontFamily: 'var(--font-quicksand), ui-rounded, sans-serif' }
const bodyFont = { fontFamily: 'var(--font-inter), sans-serif' }

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value)).replace('.', '')
}

export default async function BenchManagePage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const manager = await requireCommunityManager('/bench/manage')
  const regionIds = manager.isAdmin ? null : Array.from(manager.managedRegionIds)

  let topicsQuery = manager.admin
    .from('bench_topics')
    .select('id, slug, title, description, category, region_id, status, interest_count, min_participants, ideal_participants, created_at')
    .neq('status', 'archived')
    .order('created_at', { ascending: false })
  if (regionIds) topicsQuery = topicsQuery.in('region_id', regionIds.length ? regionIds : ['00000000-0000-0000-0000-000000000000'])

  let regionsQuery = manager.admin
    .from('community_regions')
    .select('id, name, slug, state_code, status, timezone')
    .neq('status', 'archived')
    .order('name')
  if (regionIds) regionsQuery = regionsQuery.in('id', regionIds.length ? regionIds : ['00000000-0000-0000-0000-000000000000'])

  const [{ data: topics }, { data: regions }] = await Promise.all([topicsQuery, regionsQuery])
  const topicIds = (topics ?? []).map(topic => topic.id)
  const [{ data: sessions }, { data: registrations }] = topicIds.length ? await Promise.all([
    manager.admin.from('bench_sessions').select('id, topic_id, starts_at, status, capacity, calendar_sync_status, calendar_sync_error').in('topic_id', topicIds).order('starts_at', { ascending: false }),
    manager.admin.from('bench_registrations').select('id, topic_id, status').in('topic_id', topicIds),
  ]) : [{ data: [] }, { data: [] }]

  const regionById = new Map((regions ?? []).map(region => [region.id, region]))
  const registrationCounts = new Map<string, { total: number; registered: number; waitlist: number }>()
  ;(registrations ?? []).forEach(item => {
    const current = registrationCounts.get(item.topic_id) ?? { total: 0, registered: 0, waitlist: 0 }
    if (item.status !== 'canceled') current.total += 1
    if (item.status === 'registered') current.registered += 1
    if (item.status === 'waitlist') current.waitlist += 1
    registrationCounts.set(item.topic_id, current)
  })
  const latestSession = new Map<string, NonNullable<typeof sessions>[number]>()
  ;(sessions ?? []).forEach(session => { if (!latestSession.has(session.topic_id)) latestSession.set(session.topic_id, session) })

  const calendarConfigured = isGoogleCalendarConfigured()
  const calendarState = typeof searchParams?.calendar === 'string' ? searchParams.calendar : null
  const scheduled = typeof searchParams?.scheduled === 'string' ? searchParams.scheduled : null

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#111111]" style={bodyFont}>
      <header className="border-b border-[#CEC8BD] bg-[#FAF7F1]"><div className="mx-auto flex h-[68px] max-w-[1180px] items-center justify-between px-5 sm:px-8"><BrandWordmark suffix="club" className="inline-flex items-baseline text-[24px] font-semibold leading-none tracking-[-0.055em]" /><div className="flex gap-4 text-xs font-bold"><Link href="/bench">Ver bench</Link><Link href="/regions/manage">Regiões</Link></div></div></header>
      <main className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8 sm:py-14">
        <Link href="/bench" className="inline-flex items-center gap-2 text-xs font-bold text-[#716B65]"><ArrowLeft className="h-3.5 w-3.5" /> Voltar</Link>
        <div className="mt-7 flex flex-col gap-5 border-b border-[#CEC8BD] pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9684F]">gestão</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.055em] sm:text-5xl" style={roundedFont}>bench<span className="text-[#E88A6A]">.</span></h1><p className="mt-2 text-sm text-[#69635E]">{manager.isAdmin ? 'Visão global de todos os benchs.' : 'Você pode gerir benchs das regiões que lidera.'}</p></div>
          <div className={`rounded-lg border px-4 py-3 text-xs font-semibold ${calendarConfigured ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>{calendarConfigured ? 'Google Calendar conectado' : 'Google Calendar ainda não configurado'}</div>
        </div>

        {calendarState === 'not-configured' ? <div className="mt-5 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">O bench foi mantido como rascunho. Configure as credenciais do Google Calendar antes de agendar.</div> : null}
        {calendarState === 'error' ? <div className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">A sincronização com o Google Calendar falhou. O evento ficou em rascunho para evitar divulgar uma reunião sem convite.</div> : null}
        {scheduled ? <div className="mt-5 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Bench agendado. Os participantes registrados receberam o convite do Google Calendar.</div> : null}

        <section className="mt-10 grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <div className="border border-[#CEC8BD] bg-[#FAF7F1] p-5">
              <div className="flex items-center gap-2"><Settings2 className="h-4 w-4 text-[#C9684F]" /><h2 className="text-sm font-bold">Criar bench</h2></div>
              <form action={createBenchTopic} className="mt-5 space-y-3">
                <input name="title" required minLength={3} maxLength={180} placeholder="Tema" className="w-full rounded-lg border border-[#CEC8BD] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#E88A6A]" />
                <textarea name="description" required minLength={10} maxLength={3000} rows={4} placeholder="O que será comparado?" className="w-full rounded-lg border border-[#CEC8BD] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#E88A6A]" />
                <input name="category" maxLength={80} placeholder="Categoria (ex.: contratos-clm)" className="w-full rounded-lg border border-[#CEC8BD] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#E88A6A]" />
                <select name="region_id" required={!manager.isAdmin} className="w-full rounded-lg border border-[#CEC8BD] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#E88A6A]"><option value="">{manager.isAdmin ? 'Brasil / sem região' : 'Escolha sua região'}</option>{(regions ?? []).map(region => <option key={region.id} value={region.id}>{region.name}</option>)}</select>
                <div className="grid grid-cols-2 gap-3"><label className="text-[10px] font-bold text-[#716B65]">Mínimo<input name="min_participants" type="number" min={2} max={100} defaultValue={5} className="mt-1 w-full rounded-lg border border-[#CEC8BD] bg-white px-3 py-2.5 text-sm" /></label><label className="text-[10px] font-bold text-[#716B65]">Ideal<input name="ideal_participants" type="number" min={2} max={250} defaultValue={12} className="mt-1 w-full rounded-lg border border-[#CEC8BD] bg-white px-3 py-2.5 text-sm" /></label></div>
                <button className="w-full rounded-lg bg-[#111111] px-4 py-3 text-sm font-bold text-white">Criar bench</button>
              </form>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between"><h2 className="text-sm font-bold">Benchs sob sua gestão</h2><span className="text-xs text-[#817A73]">{topics?.length ?? 0}</span></div>
            <div className="mt-4 space-y-4">
              {(topics ?? []).map(topic => {
                const region = topic.region_id ? regionById.get(topic.region_id) : null
                const counts = registrationCounts.get(topic.id) ?? { total: 0, registered: 0, waitlist: 0 }
                const session = latestSession.get(topic.id)
                return (
                  <article key={topic.id} className="border border-[#CEC8BD] bg-[#FAF7F1] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="text-[9px] font-bold uppercase tracking-wide text-[#C9684F]">{topic.status}</span>{region ? <span className="flex items-center gap-1 text-[9px] font-semibold text-[#817A73]"><MapPin className="h-3 w-3" />{region.name}</span> : null}</div><Link href={`/bench/${topic.slug}`} className="mt-2 block text-lg font-bold tracking-[-0.03em] hover:text-[#C9684F]">{topic.title}</Link></div><div className="flex items-center gap-1 text-xs font-bold text-[#716B65]"><UsersRound className="h-3.5 w-3.5" /> {counts.total}</div></div>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#77716A]">{topic.description}</p>
                    {session ? <div className="mt-4 flex flex-wrap items-center gap-4 border-y border-[#E6DED0] py-3 text-[10px] font-semibold text-[#716B65]"><span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatDate(session.starts_at)}</span><span>{session.status}</span><span>{session.calendar_sync_status}</span>{counts.waitlist ? <span>{counts.waitlist} na espera</span> : null}</div> : null}
                    {topic.status === 'forming' ? (
                      <form action={scheduleBench} className="mt-4 grid gap-3 sm:grid-cols-2">
                        <input type="hidden" name="topic_id" value={topic.id} />
                        <label className="text-[10px] font-bold text-[#716B65] sm:col-span-2">Data e hora local<input name="starts_at" type="datetime-local" required className="mt-1 w-full rounded-lg border border-[#CEC8BD] bg-white px-3 py-2.5 text-sm" /></label>
                        <label className="text-[10px] font-bold text-[#716B65]">Duração (min)<input name="duration_minutes" type="number" min={20} max={180} defaultValue={60} className="mt-1 w-full rounded-lg border border-[#CEC8BD] bg-white px-3 py-2.5 text-sm" /></label>
                        <label className="text-[10px] font-bold text-[#716B65]">Vagas<input name="capacity" type="number" min={1} max={250} defaultValue={topic.ideal_participants} className="mt-1 w-full rounded-lg border border-[#CEC8BD] bg-white px-3 py-2.5 text-sm" /></label>
                        <button disabled={!calendarConfigured} className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-lg bg-[#111111] px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"><CalendarDays className="h-3.5 w-3.5" /> Criar Meet + enviar convites</button>
                      </form>
                    ) : topic.status === 'scheduled' ? <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> {counts.registered} participantes confirmados no evento</div> : null}
                  </article>
                )
              })}
              {!topics?.length ? <div className="border border-dashed border-[#CEC8BD] p-8 text-center text-sm text-[#817A73]">Nenhum bench sob sua gestão ainda.</div> : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
