'use client'

import { useState } from 'react'
import { Search, Briefcase, Star } from 'lucide-react'

type ProfessionalTypeFilter = 'all' | 'law_firm' | 'legal_dept'

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
  law_firm: 'Escritório de advocacia',
  legal_dept: 'Departamento jurídico',
  public_sector: 'Setor público',
  freelance: 'Autônomo ou consultoria',
  other: 'Outro',
}

const typeFilters: Array<{ value: ProfessionalTypeFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'law_firm', label: 'Escritórios' },
  { value: 'legal_dept', label: 'Departamentos jurídicos' },
]

export function ProfessionalsDirectory({
  professionals,
  initialType = 'all',
}: {
  professionals: Professional[]
  initialType?: ProfessionalTypeFilter
}) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ProfessionalTypeFilter>(initialType)

  const filtered = professionals.filter((p) => {
    if (typeFilter !== 'all' && p.professional_type !== typeFilter) return false
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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1A1A1A]/50" />
          <input
            type="search"
            placeholder="Nome, cargo, competência ou ferramenta"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[#1A1A1A]/10 bg-white py-2.5 pl-10 pr-4 text-sm text-[#1A1A1A] placeholder-[#1A1A1A]/50 focus:border-[#FF6A00] focus:outline-none focus:ring-1 focus:ring-[#FF6A00]"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {typeFilters.map(filter => (
            <button key={filter.value} type="button" onClick={() => setTypeFilter(filter.value)} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-medium ${typeFilter === filter.value ? 'border-[#20201D] bg-[#20201D] text-white' : 'border-[#DEDEDA] bg-white text-[#666661] hover:border-[#B9B9B4]'}`}>
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <div
            key={p.user_id}
            className="rounded-2xl border border-[#1A1A1A]/10 bg-white p-5 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1A1A1A]/5 text-sm font-semibold text-[#1A1A1A]/70">
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
                    <h3 className="font-medium text-[#1A1A1A]">
                      {p.full_name || 'Profissional'}
                    </h3>
                    {(p.tier === 'pro' || p.tier === 'expert') && (
                      <span
                        className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                          p.tier === 'expert'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-[#FF6A00]/10 text-[#FF6A00]'
                        }`}
                      >
                        <Star className="h-3 w-3" />
                        {p.tier === 'expert' ? 'Expert' : 'Pro'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#1A1A1A]/60">{p.current_role || '—'}</p>
                </div>
              </div>
            </div>

            {p.public_headline && (
              <p className="mt-3 text-sm text-[#1A1A1A]/70 line-clamp-2">{p.public_headline}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {p.professional_type && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#1A1A1A]/5 px-2 py-0.5 text-xs text-[#1A1A1A]/70">
                  <Briefcase className="h-3 w-3" />
                  {professionalTypeLabels[p.professional_type] || p.professional_type}
                </span>
              )}
              {p.years_experience && (
                <span className="rounded-full bg-[#1A1A1A]/5 px-2 py-0.5 text-xs text-[#1A1A1A]/70">
                  {p.years_experience}+ anos
                </span>
              )}
            </div>

            {(p.skills.length > 0 || p.tools_used.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[...p.skills.slice(0, 3), ...p.tools_used.slice(0, 2)].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-[#FF6A00]/10 px-2 py-0.5 text-xs text-[#FF6A00]"
                  >
                    {tag}
                  </span>
                ))}
                {p.skills.length + p.tools_used.length > 5 && (
                  <span className="rounded-md bg-[#1A1A1A]/5 px-2 py-0.5 text-xs text-[#1A1A1A]/50">
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
                className="mt-3 inline-block text-xs text-[#FF6A00] hover:text-[#E65C00]"
              >
                Ver LinkedIn
              </a>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-8 text-center text-sm text-[#1A1A1A]/60">
          {search
            ? 'Nenhum perfil corresponde a essa busca.'
            : 'Nenhum perfil autorizou a exibição neste filtro.'}
        </p>
      )}
    </div>
  )
}
