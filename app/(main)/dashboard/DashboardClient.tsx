'use client'

import Link from 'next/link'
import { formatSalary, hasSalary } from '@/lib/format-salary'
import type { DashboardStats, PipelineStatus } from '@/lib/types'

interface ActivityItem {
  id: string
  status: string
  job: { title: string; company: string; remote_reality: string; salary_min: number | null; salary_max: number | null; salary_currency: string | null }
  created_at: string
}

interface Props {
  stats: DashboardStats
  recentActivity: ActivityItem[]
}

const STATUS_LABELS: Record<PipelineStatus, string> = {
  researching: 'Pesquisando',
  applied: 'Aplicada',
  interview: 'Entrevista',
  offer: 'Oferta',
  discarded: 'Descartada',
}

const STATUS_COLORS: Record<PipelineStatus, string> = {
  researching: 'bg-slate-100 text-slate-700',
  applied: 'bg-blue-100 text-blue-700',
  interview: 'bg-purple-100 text-purple-700',
  offer: 'bg-green-100 text-green-700',
  discarded: 'bg-red-100 text-red-700',
}

function StatCard({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${accent ?? 'text-slate-900'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

function FunnelBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-600 w-24 text-right">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500 flex items-center px-2`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        >
          {pct > 10 && <span className="text-xs font-medium text-white">{count}</span>}
        </div>
      </div>
      {pct <= 10 && <span className="text-xs text-slate-500 w-8">{count}</span>}
    </div>
  )
}

export function DashboardClient({ stats, recentActivity }: Props) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Sua visao geral da busca de emprego</p>
        </div>
        <Link
          href="/discover"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Descobrir vagas
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total rastreadas" value={stats.total_tracked} />
        <StatCard label="Aplicadas esta semana" value={stats.applied_this_week} accent="text-blue-600" />
        <StatCard label="Entrevistas esta semana" value={stats.interviews_this_week} accent="text-purple-600" />
        <StatCard label="Taxa de resposta" value={`${stats.response_rate}%`} accent="text-green-600" sub="Entrevistas + Ofertas / Total ativo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Funil do Pipeline</h2>
          <div className="space-y-3">
            <FunnelBar label="Pesquisando" count={stats.researching} total={stats.total_tracked} color="bg-slate-500" />
            <FunnelBar label="Aplicada" count={stats.applied} total={stats.total_tracked} color="bg-blue-500" />
            <FunnelBar label="Entrevista" count={stats.interview} total={stats.total_tracked} color="bg-purple-500" />
            <FunnelBar label="Oferta" count={stats.offer} total={stats.total_tracked} color="bg-green-500" />
            <FunnelBar label="Descartada" count={stats.discarded} total={stats.total_tracked} color="bg-red-400" />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-700">Atividade recente</h2>
            <Link href="/pipeline" className="text-xs text-blue-600 hover:underline">Ver pipeline</Link>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhuma atividade ainda. Comece adicionando vagas!</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map(item => (
                <Link key={item.id} href={`/jobs/${item.id}`}>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{item.job.title}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-500 truncate">{item.job.company}</p>
                        {hasSalary(item.job) && (
                          <span className="text-xs font-medium text-emerald-600 flex-shrink-0">
                            {formatSalary(item.job)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${STATUS_COLORS[item.status as PipelineStatus] ?? ''}`}>
                      {STATUS_LABELS[item.status as PipelineStatus] ?? item.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-5">
        <h2 className="text-sm font-semibold text-blue-900 mb-2">Dicas para sua busca</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-xs text-blue-800">
            <p className="font-medium mb-1">Mantenha o ritmo</p>
            <p className="text-blue-600">Tente aplicar para pelo menos 5 vagas por semana para manter um fluxo constante.</p>
          </div>
          <div className="text-xs text-blue-800">
            <p className="font-medium mb-1">Follow-up importa</p>
            <p className="text-blue-600">Acompanhe suas aplicacoes 5-7 dias apos o envio. Use as notas para registrar cada interacao.</p>
          </div>
          <div className="text-xs text-blue-800">
            <p className="font-medium mb-1">Prepare-se com IA</p>
            <p className="text-blue-600">Use nosso prep de entrevista com IA para se preparar antes de cada conversa.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
