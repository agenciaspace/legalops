'use client'

import { useState } from 'react'
import { Search, MapPin, Briefcase, Star } from 'lucide-react'

interface Professional {
  user_id: string
  full_name: string | null
  current_role: string | null
  professional_type: string | null
  years_experience: number | null
  areas_of_expertise: string[]
  linkedin_url: string | null
  public_headline: string | null
  skills: string[]
  tools_used: string[]
  tier: string
  is_public: boolean
}

const professionalTypeLabels: Record<string, string> = {
  law_firm: 'Law Firm',
  legal_dept: 'Legal Department',
  public_sector: 'Public Sector',
  freelance: 'Freelance',
  other: 'Other',
}

export function ProfessionalsDirectory({ professionals }: { professionals: Professional[] }) {
  const [search, setSearch] = useState('')

  const filtered = professionals.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.current_role?.toLowerCase().includes(q) ||
      p.public_headline?.toLowerCase().includes(q) ||
      p.areas_of_expertise.some((a) => a.toLowerCase().includes(q)) ||
      p.skills.some((s) => s.toLowerCase().includes(q)) ||
      p.tools_used.some((t) => t.toLowerCase().includes(q))
    )
  })

  return (
    <div className="mt-6">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nome, cargo, skill ou ferramenta..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {/* Results */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <div
            key={p.user_id}
            className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                  {p.full_name
                    ? p.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    : '?'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-slate-900">
                      {p.full_name || 'Profissional'}
                    </h3>
                    {(p.tier === 'pro' || p.tier === 'expert') && (
                      <span
                        className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                          p.tier === 'expert'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-brand-50 text-brand-700'
                        }`}
                      >
                        <Star className="h-3 w-3" />
                        {p.tier === 'expert' ? 'Expert' : 'Pro'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{p.current_role || '—'}</p>
                </div>
              </div>
            </div>

            {p.public_headline && (
              <p className="mt-3 text-sm text-slate-600 line-clamp-2">{p.public_headline}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {p.professional_type && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  <Briefcase className="h-3 w-3" />
                  {professionalTypeLabels[p.professional_type] || p.professional_type}
                </span>
              )}
              {p.years_experience && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {p.years_experience}+ anos
                </span>
              )}
            </div>

            {(p.skills.length > 0 || p.tools_used.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[...p.skills.slice(0, 3), ...p.tools_used.slice(0, 2)].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                  >
                    {tag}
                  </span>
                ))}
                {p.skills.length + p.tools_used.length > 5 && (
                  <span className="rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-400">
                    +{p.skills.length + p.tools_used.length - 5}
                  </span>
                )}
              </div>
            )}

            {p.linkedin_url && (
              <a
                href={p.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-xs text-brand-500 hover:underline"
              >
                Ver LinkedIn
              </a>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-8 text-center text-sm text-slate-500">
          {search
            ? 'Nenhum profissional encontrado com esses critérios.'
            : 'Nenhum profissional cadastrado ainda.'}
        </p>
      )}
    </div>
  )
}
