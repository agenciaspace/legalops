'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  Bot,
  Boxes,
  BriefcaseBusiness,
  FileCheck2,
  Landmark,
  Library,
  Network,
  Search,
  ShieldCheck,
  UsersRound,
  Workflow,
} from 'lucide-react'
import { COMMUNITY_CATEGORIES } from '@/lib/community'

type FilterKey = 'all' | 'technology' | 'operations' | 'strategy'

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'Todas' },
  { key: 'technology', label: 'Tecnologia e dados' },
  { key: 'operations', label: 'Operação' },
  { key: 'strategy', label: 'Estratégia e carreira' },
]

const communities = [
  {
    key: 'ia-automacao',
    filter: 'technology' as const,
    Icon: Bot,
    shortLabel: 'IA',
  },
  {
    key: 'dados-metricas',
    filter: 'technology' as const,
    Icon: BarChart3,
    shortLabel: 'DADOS',
  },
  {
    key: 'contratos-clm',
    filter: 'operations' as const,
    Icon: FileCheck2,
    shortLabel: 'CLM',
  },
  {
    key: 'processos-projetos',
    filter: 'operations' as const,
    Icon: Workflow,
    shortLabel: 'FLUXO',
  },
  {
    key: 'ferramentas',
    filter: 'technology' as const,
    Icon: Boxes,
    shortLabel: 'STACK',
  },
  {
    key: 'financeiro-fornecedores',
    filter: 'operations' as const,
    Icon: Landmark,
    shortLabel: 'SPEND',
  },
  {
    key: 'governanca-conhecimento',
    filter: 'operations' as const,
    Icon: Library,
    shortLabel: 'GOV',
  },
  {
    key: 'estrategia-maturidade',
    filter: 'strategy' as const,
    Icon: ShieldCheck,
    shortLabel: 'ESTRATÉGIA',
  },
  {
    key: 'modelos-entrega',
    filter: 'strategy' as const,
    Icon: Network,
    shortLabel: 'DELIVERY',
  },
  {
    key: 'carreira',
    filter: 'strategy' as const,
    Icon: BriefcaseBusiness,
    shortLabel: 'PESSOAS',
  },
]

export function ClubDiscovery({ annualPrice }: { annualPrice: string }) {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

  const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
  const visibleCommunities = communities.filter(community => {
    if (activeFilter !== 'all' && community.filter !== activeFilter) return false

    const category = COMMUNITY_CATEGORIES[community.key]
    if (!normalizedQuery) return true

    return `${category.title} ${category.description}`
      .toLocaleLowerCase('pt-BR')
      .includes(normalizedQuery)
  })

  return (
    <>
      <div className="mx-auto max-w-[660px]">
        <label className="relative block">
          <span className="sr-only">Buscar comunidades</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#92928D]" />
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Buscar por assunto"
            className="h-12 w-full rounded-lg border border-[#D8D8D4] bg-white pl-11 pr-4 text-sm text-[#20201D] shadow-sm outline-none placeholder:text-[#9A9A95] focus:border-[#92928D] focus:ring-2 focus:ring-[#20201D]/10"
          />
        </label>
      </div>

      <div className="mt-7 flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:justify-center">
        {filters.map(filter => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setActiveFilter(filter.key)}
            className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition ${activeFilter === filter.key ? 'border-[#20201D] bg-[#20201D] text-white' : 'border-[#DEDEDA] bg-white text-[#666661] hover:border-[#B9B9B4] hover:text-[#20201D]'}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {visibleCommunities.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCommunities.map((community, index) => {
            const category = COMMUNITY_CATEGORIES[community.key]
            const Icon = community.Icon

            return (
              <Link
                key={community.key}
                href={`/community?space=${community.key}`}
                className="group overflow-hidden rounded-lg border border-[#DFDFDB] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:border-[#C3C3BE] hover:shadow-md"
              >
                <div className="relative aspect-[16/8.5] overflow-hidden border-b border-[#DFDFDB] bg-[#F0F0ED] p-5 text-[#20201D] transition group-hover:bg-[#ECECE8]">
                  <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(32,32,29,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(32,32,29,.06)_1px,transparent_1px)] [background-size:28px_28px]" />
                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold tracking-[0.16em] text-[#E45220]">LEGALOPS CLUB</span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-md border border-[#D4D4CF] bg-white/70">
                        <Icon className="h-[18px] w-[18px] text-[#53534F]" />
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-4">
                      <p className="text-3xl font-black tracking-[-0.04em]">{community.shortLabel}</p>
                      <span className="pb-1 text-[10px] font-semibold text-[#90908B]">{String(index + 1).padStart(2, '0')} / {String(communities.length).padStart(2, '0')}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#D9D9D4] bg-[#F3F3F0] text-[#E45220]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <h2 className="line-clamp-1 text-sm font-semibold text-[#20201D]">{category.title}</h2>
                  </div>
                  <p className="mt-3 min-h-[3.75rem] text-sm leading-5 text-[#666661]">{category.description}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-[#ECECE8] pt-3 text-[11px] text-[#777772]">
                    <span className="flex items-center gap-1.5"><UsersRound className="h-3.5 w-3.5" /> Grupo do Club</span>
                    <span>{annualPrice}/ano</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="mt-10 rounded-lg border border-dashed border-[#CECEC9] bg-white px-6 py-14 text-center">
          <p className="text-sm font-medium text-[#30302D]">Nenhuma comunidade encontrada.</p>
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setActiveFilter('all')
            }}
            className="mt-3 text-xs font-semibold text-[#E45220] hover:underline"
          >
            Limpar busca
          </button>
        </div>
      )}
    </>
  )
}
