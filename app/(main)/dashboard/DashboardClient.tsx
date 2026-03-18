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
  researching: 'bg-[#1A1A1A]/5 text-[#1A1A1A]/70',
  applied: 'bg-[#FF6A00]/10 text-[#FF6A00]',
  interview: 'bg-[#FF6A00]/10 text-[#FF6A00]',
  offer: 'bg-emerald-50 text-emerald-700',
  discarded: 'bg-red-50 text-red-700',
}

function StatCard({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-5 shadow-sm">
      <p className="text-xs font-medium text-[#1A1A1A]/60 uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${accent ?? 'text-[#1A1A1A]'}`}>{value}</p>
      {sub && <p className="text-xs text-[#1A1A1A]/50 mt-1">{sub}</p>}
    </div>
  )
}

function FunnelBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#1A1A1A]/70 w-24 text-right">{label}</span>
      <div className="flex-1 bg-[#1A1A1A]/5 rounded-full h-6 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500 flex items-center px-2`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        >
          {pct > 10 && <span className="text-xs font-medium text-white">{count}</span>}
        </div>
      </div>
      {pct <= 10 && <span className="text-xs text-[#1A1A1A]/60 w-8">{count}</span>}
    </div>
  )
}

export function DashboardClient({ stats, recentActivity }: Props) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Dashboard</h1>
          <p className="text-sm text-[#1A1A1A]/60">Sua visao geral da busca de emprego</p>
        </div>
        <Link
          href="/discover"
          className="px-4 py-2 bg-[#FF6A00] text-white text-sm font-bold rounded-xl hover:bg-[#E65C00] transition-colors"
        >
          Descobrir vagas
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total rastreadas" value={stats.total_tracked} />
        <StatCard label="Aplicadas esta semana" value={stats.applied_this_week} accent="text-[#FF6A00]" />
        <StatCard label="Entrevistas esta semana" value={stats.interviews_this_week} accent="text-[#FF6A00]" />
        <StatCard label="Taxa de resposta" value={`${stats.response_rate}%`} accent="text-emerald-600" sub="Entrevistas + Ofertas / Total ativo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <div className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[#1A1A1A]/70 mb-4">Funil do Pipeline</h2>
          <div className="space-y-3">
            <FunnelBar label="Pesquisando" count={stats.researching} total={stats.total_tracked} color="bg-[#1A1A1A]/60" />
            <FunnelBar label="Aplicada" count={stats.applied} total={stats.total_tracked} color="bg-[#FF6A00]" />
            <FunnelBar label="Entrevista" count={stats.interview} total={stats.total_tracked} color="bg-[#1A1A1A]" />
            <FunnelBar label="Oferta" count={stats.offer} total={stats.total_tracked} color="bg-emerald-500" />
            <FunnelBar label="Descartada" count={stats.discarded} total={stats.total_tracked} color="bg-red-500" />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#1A1A1A]/70">Atividade recente</h2>
            <Link href="/pipeline" className="text-xs text-[#FF6A00] hover:underline">Ver pipeline</Link>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-[#1A1A1A]/50 text-center py-8">Nenhuma atividade ainda. Comece adicionando vagas!</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map(item => (
                <Link key={item.id} href={`/jobs/${item.id}`}>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1A1A1A]/5 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A] truncate">{item.job.title}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-[#1A1A1A]/60 truncate">{item.job.company}</p>
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
      <div className="bg-gradient-to-r from-[#FF6A00]/5 to-[#FF6A00]/10 rounded-2xl border border-[#FF6A00]/20 p-5">
        <h2 className="text-sm font-semibold text-[#1A1A1A] mb-2">Dicas para sua busca</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-xs text-[#1A1A1A]/70">
            <p className="font-medium mb-1">Mantenha o ritmo</p>
            <p className="text-[#1A1A1A]/60">Tente aplicar para pelo menos 5 vagas por semana para manter um fluxo constante.</p>
          </div>
          <div className="text-xs text-[#1A1A1A]/70">
            <p className="font-medium mb-1">Follow-up importa</p>
            <p className="text-[#1A1A1A]/60">Acompanhe suas aplicacoes 5-7 dias apos o envio. Use as notas para registrar cada interacao.</p>
          </div>
          <div className="text-xs text-[#1A1A1A]/70">
            <p className="font-medium mb-1">Prepare-se com IA</p>
            <p className="text-[#1A1A1A]/60">Use nosso prep de entrevista com IA para se preparar antes de cada conversa.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
