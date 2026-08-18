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
  { key: 'ia-automacao', filter: 'technology' as const, Icon: Bot, shortLabel: 'IA' },
  { key: 'dados-metricas', filter: 'technology' as const, Icon: BarChart3, shortLabel: 'DADOS' },
  { key: 'contratos-clm', filter: 'operations' as const, Icon: FileCheck2, shortLabel: 'CLM' },
  { key: 'processos-projetos', filter: 'operations' as const, Icon: Workflow, shortLabel: 'FLUXO' },
  { key: 'ferramentas', filter: 'technology' as const, Icon: Boxes, shortLabel: 'STACK' },
  { key: 'financeiro-fornecedores', filter: 'operations' as const, Icon: Landmark, shortLabel: 'SPEND' },
  { key: 'governanca-conhecimento', filter: 'operations' as const, Icon: Library, shortLabel: 'GOV' },
  { key: 'estrategia-maturidade', filter: 'strategy' as const, Icon: ShieldCheck, shortLabel: 'ESTRATÉGIA' },
  { key: 'modelos-entrega', filter: 'strategy' as const, Icon: Network, shortLabel: 'DELIVERY' },
  { key: 'carreira', filter: 'strategy' as const, Icon: BriefcaseBusiness, shortLabel: 'PESSOAS' },
]

const roundedFont = { fontFamily: 'var(--font-quicksand), ui-rounded, sans-serif' }

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
      <div className="mx-auto max-w-[680px]">
        <label className="relative block">
          <span className="sr-only">Buscar comunidades</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77716A]" />
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Buscar por assunto"
            className="w-full rounded-lg border border-[#CEC8BD] bg-[#FAF7F1] py-3 pl-10 pr-4 text-sm text-[#111111] outline-none placeholder:text-[#918A83] focus:border-[#817A73] focus:ring-2 focus:ring-[#111111]/10"
          />
        </label>
      </div>

      <div className="mt-6 flex gap-5 overflow-x-auto border-b border-[#CEC8BD] pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center">
        {filters.map(filter => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setActiveFilter(filter.key)}
            className={`shrink-0 border-b-2 px-0 py-3 text-xs font-semibold transition ${activeFilter === filter.key ? 'border-[#E88A6A] text-[#111111]' : 'border-transparent text-[#716B65] hover:border-[#CEC8BD] hover:text-[#111111]'}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {visibleCommunities.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCommunities.map((community, index) => {
            const category = COMMUNITY_CATEGORIES[community.key]
            const Icon = community.Icon

            return (
              <Link
                key={community.key}
                href={`/community?space=${community.key}`}
                className="group flex min-h-[230px] flex-col rounded-lg border border-[#CEC8BD] bg-[#FAF7F1] p-5 transition hover:border-[#AFA79D] hover:bg-white"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[9px] font-bold tracking-[0.16em] text-[#C9684F]">{community.shortLabel}</span>
                    <h2 className="mt-2 text-base font-semibold tracking-[-0.03em] text-[#111111]" style={roundedFont}>{category.title}</h2>
                  </div>
                  <Icon className="h-5 w-5 shrink-0 text-[#817A73] transition group-hover:text-[#C9684F]" />
                </div>
                <p className="mt-4 text-sm leading-6 text-[#69635E]">{category.description}</p>
                <div className="mt-auto flex items-center justify-between border-t border-[#E6DED0] pt-4 text-[10px] font-semibold text-[#77716A]">
                  <span>{String(index + 1).padStart(2, '0')} / {String(communities.length).padStart(2, '0')}</span>
                  <span className="text-[#111111]">{annualPrice}/ano</span>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="mt-8 border-y border-dashed border-[#CEC8BD] py-12 text-center">
          <p className="text-sm font-semibold text-[#111111]">Nenhuma comunidade encontrada.</p>
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setActiveFilter('all')
            }}
            className="mt-3 text-xs font-bold text-[#C9684F] hover:underline"
          >
            Limpar busca
          </button>
        </div>
      )}
    </>
  )
}
