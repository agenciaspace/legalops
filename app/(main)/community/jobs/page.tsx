import Link from 'next/link'
import {
  ArrowRight,
  BellRing,
  BriefcaseBusiness,
  CheckCircle2,
  ExternalLink,
  FileText,
  MapPin,
  MessagesSquare,
  UserRound,
} from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { formatSalary } from '@/lib/format-salary'
import { remoteRealityLabel } from '@/lib/club-job-matching'
import { markClubJobAlertsRead } from '../actions'

type AlertJob = {
  id: string
  title: string
  company: string
  url: string
  source_board: string
  remote_reality: string | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  url_status: string | null
  url_checked_at: string | null
}

type JobAlert = {
  id: string
  match_score: number
  match_reasons: string[]
  cv_suggestions: string[]
  read_at: string | null
  created_at: string
  jobs: AlertJob
}

const sourceLabels: Record<string, string> = {
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  workable: 'Workable',
  gupy: 'Gupy',
  firecrawl: 'Firecrawl',
  company_site: 'Site da empresa',
}

export const dynamic = 'force-dynamic'

export default async function CommunityJobsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: rawProfile }, { data: rawAlerts }] = await Promise.all([
    supabase
      .from('account_profiles')
      .select('current_role, desired_roles, areas_of_expertise, preferred_remote, open_to_opportunities, job_alerts_enabled')
      .eq('user_id', user?.id ?? '')
      .maybeSingle(),
    supabase
      .from('club_job_alerts')
      .select('id, match_score, match_reasons, cv_suggestions, read_at, created_at, jobs!inner(id, title, company, url, source_board, remote_reality, salary_min, salary_max, salary_currency, url_status, url_checked_at)')
      .eq('jobs.url_status', 'live')
      .not('jobs.url_checked_at', 'is', null)
      .is('dismissed_at', null)
      .order('created_at', { ascending: false })
      .order('match_score', { ascending: false })
      .limit(50),
  ])

  const profile = rawProfile as {
    current_role: string | null
    desired_roles: string[]
    areas_of_expertise: string[]
    preferred_remote: string | null
    open_to_opportunities: boolean
    job_alerts_enabled: boolean
  } | null
  const alerts = (rawAlerts ?? []) as unknown as JobAlert[]
  const unreadCount = alerts.filter(alert => !alert.read_at).length
  const profileReady = Boolean(
    profile?.open_to_opportunities
    && profile?.job_alerts_enabled
    && ((profile.desired_roles?.length ?? 0) > 0 || profile.current_role)
    && (profile.areas_of_expertise?.length ?? 0) > 0,
  )

  return (
    <div className="mx-auto w-full max-w-[1080px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <header className="flex flex-col gap-4 border-b border-[#D8D5CD] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#D9470F]">Club + Work</p>
          <h1 className="mt-1.5 text-[22px] font-extrabold tracking-[-0.025em] text-[#24231F]">Vagas para você</h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[#77746E]">As vagas vêm dos crawlers do LegalOps Work. A ordem e as recomendações usam os campos que você salvou no perfil.</p>
        </div>
        {unreadCount > 0 ? (
          <form action={markClubJobAlertsRead}>
            <button className="rounded-lg border border-[#CAC7BF] bg-white px-3 py-2 text-[10px] font-extrabold text-[#4D4B46] hover:border-[#A9A69F]">
              Marcar {unreadCount} como {unreadCount === 1 ? 'lida' : 'lidas'}
            </button>
          </form>
        ) : null}
      </header>

      <section className="mt-5 grid overflow-hidden rounded-xl border border-[#D8D5CD] bg-white md:grid-cols-3">
        <Link href="/community/profile" className="group border-b border-[#E4E2DC] p-4 hover:bg-[#FAF8F3] md:border-b-0 md:border-r">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.12em] text-[#8A867D]"><UserRound className="h-3.5 w-3.5 text-[#D9470F]" /> 01 Perfil</div>
          <p className="mt-2 text-xs font-extrabold text-[#292824]">Defina cargo, temas e preferências</p>
          <p className="mt-1 text-[10px] leading-4 text-[#77746E]">Esses campos controlam a comparação com as vagas.</p>
        </Link>
        <Link href="/community" className="group border-b border-[#E4E2DC] p-4 hover:bg-[#FAF8F3] md:border-b-0 md:border-r">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.12em] text-[#8A867D]"><MessagesSquare className="h-3.5 w-3.5 text-[#D9470F]" /> 02 Comunidades</div>
          <p className="mt-2 text-xs font-extrabold text-[#292824]">Aprofunde os temas que aparecem nas vagas</p>
          <p className="mt-1 text-[10px] leading-4 text-[#77746E]">Use os grupos para trocar referências e casos práticos.</p>
        </Link>
        <div className="bg-[#292825] p-4 text-white">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.12em] text-[#FF9A72]"><BriefcaseBusiness className="h-3.5 w-3.5" /> 03 Vagas</div>
          <p className="mt-2 text-xs font-extrabold">Receba oportunidades e revise o CV</p>
          <p className="mt-1 text-[10px] leading-4 text-white/60">Cada alerta explica a aderência e o que vale ajustar.</p>
        </div>
      </section>

      {!profileReady ? (
        <section className="mt-5 rounded-xl border border-[#FFD0BD] bg-[#FFF6F1] p-4 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h2 className="text-xs font-extrabold text-[#292824]">Complete as preferências de vagas</h2>
            <p className="mt-1 text-[10px] leading-4 text-[#77746E]">Informe os cargos procurados, marque que está aberto a oportunidades e mantenha os alertas ativos.</p>
          </div>
          <Link href="/community/profile" className="mt-3 inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#FF5C1A] px-3 py-2 text-[10px] font-extrabold text-white hover:bg-[#E84D10] sm:mt-0">
            Configurar perfil <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      ) : null}

      {alerts.length > 0 ? (
        <div className="mt-5 space-y-4">
          {alerts.map(alert => {
            const salary = formatSalary(alert.jobs, '')
            return (
              <article key={alert.id} className="overflow-hidden rounded-xl border border-[#DEDBD4] bg-white">
                <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {!alert.read_at ? <span className="rounded bg-[#FFF0E9] px-2 py-1 text-[8px] font-black uppercase tracking-wider text-[#D9470F]">Nova</span> : null}
                      <span className="text-[9px] font-bold text-[#8A8782]">{sourceLabels[alert.jobs.source_board] ?? alert.jobs.source_board}</span>
                    </div>
                    <h2 className="mt-2 text-lg font-extrabold tracking-[-0.02em] text-[#292824]">{alert.jobs.title}</h2>
                    <p className="mt-1 text-xs font-semibold text-[#5F5C56]">{alert.jobs.company}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[9px] font-bold text-[#77746E]">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F4F2EC] px-2.5 py-1.5"><MapPin className="h-3 w-3" /> {remoteRealityLabel(alert.jobs.remote_reality)}</span>
                      {salary ? <span className="rounded-lg bg-[#F4F2EC] px-2.5 py-1.5">{salary}</span> : null}
                    </div>
                    <div className="mt-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#8A867D]">Por que apareceu</p>
                      <ul className="mt-2 space-y-1.5">
                        {alert.match_reasons.map(reason => <li key={reason} className="flex gap-2 text-[10px] leading-4 text-[#68655F]"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D9470F]" /> {reason}</li>)}
                      </ul>
                    </div>
                  </div>

                  <aside className="rounded-lg border border-[#E4E1D9] bg-[#FAF8F3] p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] font-extrabold text-[#292824]"><FileText className="h-3.5 w-3.5 text-[#D9470F]" /> Ajustes no CV</div>
                      <span className="rounded-md bg-[#292825] px-2 py-1 text-[9px] font-black text-white">{alert.match_score}%</span>
                    </div>
                    {alert.cv_suggestions.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {alert.cv_suggestions.map(suggestion => <li key={suggestion} className="text-[10px] leading-4 text-[#68655F]">{suggestion}</li>)}
                      </ul>
                    ) : (
                      <p className="mt-3 text-[10px] leading-4 text-[#8A8782]">As sugestões de CV estão desativadas no seu perfil.</p>
                    )}
                    <a href={alert.jobs.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#D9470F] hover:underline">
                      Abrir vaga <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </aside>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <section className="mt-5 rounded-xl border border-dashed border-[#D6D3CB] bg-white/60 px-6 py-14 text-center">
          <BellRing className="mx-auto h-7 w-7 text-[#D9470F]" />
          <h2 className="mt-4 text-sm font-extrabold text-[#292824]">Nenhum alerta por enquanto</h2>
          <p className="mx-auto mt-2 max-w-md text-[10px] leading-5 text-[#77746E]">Quando o crawler encontrar vagas, esta página mostra a comparação com o seu perfil.</p>
        </section>
      )}
    </div>
  )
}
