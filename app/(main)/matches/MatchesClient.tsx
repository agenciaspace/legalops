'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MatchStatus } from '@/lib/types'

interface MatchData {
  id: string
  score: number
  score_breakdown: Record<string, number>
  status: MatchStatus
  company_job_id: string | null
  crawled_job_id: string | null
  created_at: string
  company_job?: {
    id: string
    title: string
    description: string
    location: string | null
    remote_policy: string
    salary_min: number | null
    salary_max: number | null
    salary_currency: string | null
    benefits: string[]
    areas_of_expertise: string[]
    seniority: string | null
    contract_type: string
    featured: boolean
    company: {
      company_name: string
      logo_url: string | null
      sector: string | null
      size: string | null
    }
  } | null
  crawled_job?: {
    id: string
    title: string
    company: string
    url: string
    salary_min: number | null
    salary_max: number | null
    salary_currency: string | null
    remote_reality: string
    benefits: string[]
    created_at: string
  } | null
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'new', label: 'Novos' },
  { value: 'viewed', label: 'Visualizados' },
  { value: 'interested', label: 'Interessado' },
]

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
  if (score >= 50) return 'text-blue-600 bg-blue-50 border-blue-200'
  if (score >= 35) return 'text-amber-600 bg-amber-50 border-amber-200'
  return 'text-slate-500 bg-slate-50 border-slate-200'
}

function getScoreLabel(score: number): string {
  if (score >= 70) return 'Excelente'
  if (score >= 50) return 'Bom'
  if (score >= 35) return 'Razoavel'
  return 'Baixo'
}

function formatSalary(min: number | null, max: number | null, currency: string | null): string {
  if (!min && !max) return 'Nao divulgado'
  const cur = currency ?? ''
  if (min && max) return `${cur} ${min.toLocaleString()} – ${max.toLocaleString()}`
  return `${cur} ${(min ?? max)!.toLocaleString()}`
}

const BREAKDOWN_LABELS: Record<string, string> = {
  expertise_overlap: 'Areas de atuacao',
  experience_fit: 'Experiencia',
  professional_type_match: 'Tipo profissional',
  remote_preference: 'Formato de trabalho',
  title_relevance: 'Cargo',
}

export function MatchesClient({
  initialMatches,
  hasProfile,
}: {
  initialMatches: MatchData[]
  hasProfile: boolean
}) {
  const [matches, setMatches] = useState<MatchData[]>(initialMatches)
  const [filter, setFilter] = useState('all')
  const [generating, setGenerating] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const router = useRouter()

  const filteredMatches = filter === 'all'
    ? matches
    : matches.filter(m => m.status === filter)

  async function generateMatches() {
    setGenerating(true)
    const res = await fetch('/api/matches/generate', { method: 'POST' })
    if (res.ok) {
      router.refresh()
      // Reload matches
      const listRes = await fetch('/api/matches?limit=30')
      if (listRes.ok) {
        const { matches: fresh } = await listRes.json()
        setMatches(fresh)
      }
    }
    setGenerating(false)
  }

  async function updateStatus(matchId: string, status: MatchStatus) {
    const res = await fetch(`/api/matches/${matchId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      if (status === 'dismissed') {
        setMatches(prev => prev.filter(m => m.id !== matchId))
      } else {
        setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status } : m))
      }
    }
  }

  async function addToPipeline(jobId: string, matchId: string) {
    const res = await fetch('/api/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId, status: 'researching' }),
    })
    if (res.ok) {
      await updateStatus(matchId, 'applied')
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50 via-white to-blue-50 p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-700">
              Match automatico
            </p>
            <h1 className="mt-1 text-lg font-semibold text-slate-900">
              Vagas compatíveis com seu perfil
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {matches.length > 0
                ? `${matches.length} match${matches.length !== 1 ? 'es' : ''} encontrado${matches.length !== 1 ? 's' : ''} — vagas de empresas e do crawler combinadas.`
                : 'Gere matches para encontrar vagas alinhadas ao seu perfil.'}
            </p>
          </div>
          <button
            onClick={generateMatches}
            disabled={generating || !hasProfile}
            className="px-5 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors flex-shrink-0"
          >
            {generating ? 'Gerando...' : 'Gerar matches'}
          </button>
        </div>
        {!hasProfile && (
          <p className="mt-3 text-xs text-amber-600">
            Complete seu perfil (cargo, areas de atuacao) no onboarding para gerar matches.
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs text-slate-500 font-medium">Status:</span>
        {STATUS_FILTERS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === opt.value
                ? 'bg-purple-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Match cards */}
      {filteredMatches.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <p className="text-sm text-slate-500 font-medium">Nenhum match encontrado</p>
          <p className="text-xs text-slate-400 mt-1">
            Clique em &quot;Gerar matches&quot; para encontrar vagas compatíveis.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map(match => {
            const isCompanyJob = !!match.company_job
            const title = isCompanyJob ? match.company_job!.title : match.crawled_job?.title ?? ''
            const company = isCompanyJob
              ? match.company_job!.company.company_name
              : match.crawled_job?.company ?? ''
            const salary = isCompanyJob
              ? formatSalary(match.company_job!.salary_min, match.company_job!.salary_max, match.company_job!.salary_currency)
              : formatSalary(match.crawled_job?.salary_min ?? null, match.crawled_job?.salary_max ?? null, match.crawled_job?.salary_currency ?? null)
            const areas = isCompanyJob ? match.company_job!.areas_of_expertise : []
            const benefits = isCompanyJob ? match.company_job!.benefits : (match.crawled_job?.benefits ?? [])
            const isExpanded = expandedId === match.id

            return (
              <div
                key={match.id}
                className={`bg-white rounded-xl border p-4 shadow-sm transition-all ${
                  match.company_job?.featured
                    ? 'border-purple-200 ring-1 ring-purple-100'
                    : 'border-slate-200 hover:border-blue-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Score badge */}
                  <div className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-xl border ${getScoreColor(match.score)}`}>
                    <span className="text-lg font-bold">{Math.round(match.score)}</span>
                    <span className="text-[10px] font-medium">{getScoreLabel(match.score)}</span>
                  </div>

                  {/* Job info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                          {match.company_job?.featured && (
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-semibold">
                              Destaque
                            </span>
                          )}
                          {isCompanyJob && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-semibold">
                              Empresa
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{company}</p>
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">{salary}</span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {areas.slice(0, 4).map((area, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded text-[10px] font-medium">
                          {area}
                        </span>
                      ))}
                      {benefits.slice(0, 2).map((b, i) => (
                        <span key={`b${i}`} className="px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded text-[10px]">
                          {b}
                        </span>
                      ))}
                    </div>

                    {/* Expanded breakdown */}
                    {isExpanded && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs font-semibold text-slate-700 mb-2">Detalhes do match</p>
                        <div className="space-y-1.5">
                          {Object.entries(match.score_breakdown).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-500 w-32">{BREAKDOWN_LABELS[key] ?? key}</span>
                              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-purple-500 rounded-full"
                                  style={{ width: `${(value as number) * 100}%` }}
                                />
                              </div>
                              <span className="text-[11px] text-slate-600 font-medium w-8 text-right">
                                {Math.round((value as number) * 100)}%
                              </span>
                            </div>
                          ))}
                        </div>
                        {isCompanyJob && match.company_job?.description && (
                          <p className="mt-3 text-xs text-slate-600 line-clamp-3">
                            {match.company_job.description}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : match.id)}
                        className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        {isExpanded ? 'Menos' : 'Detalhes'}
                      </button>
                      <div className="w-px h-4 bg-slate-200" />
                      {match.crawled_job_id && (
                        <button
                          onClick={() => addToPipeline(match.crawled_job_id!, match.id)}
                          className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Adicionar ao pipeline
                        </button>
                      )}
                      {match.status !== 'interested' && (
                        <button
                          onClick={() => updateStatus(match.id, 'interested')}
                          className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          Tenho interesse
                        </button>
                      )}
                      <button
                        onClick={() => updateStatus(match.id, 'dismissed')}
                        className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        Dispensar
                      </button>
                      {match.crawled_job?.url && (
                        <a
                          href={match.crawled_job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Ver vaga
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
