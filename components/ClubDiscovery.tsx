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
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#77716A]" />
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Buscar por assunto"
            className="w-full rounded-2xl border border-[#CEC8BD] bg-white/75 py-3.5 pl-11 pr-4 text-sm text-[#111111] shadow-[0_8px_30px_rgba(17,17,17,0.035)] outline-none placeholder:text-[#918A83] focus:border-[#111111]/40 focus:ring-4 focus:ring-[#E88A6A]/10"
          />
        </label>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:justify-center">
        {filters.map(filter => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setActiveFilter(filter.key)}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${activeFilter === filter.key ? 'border-[#111111] bg-[#111111] text-white' : 'border-[#CEC8BD] bg-[#FAF7F1] text-[#66615B] hover:border-[#AFA79D] hover:bg-white hover:text-[#111111]'}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {visibleCommunities.length > 0 ? (
        <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCommunities.map((community, index) => {
            const category = COMMUNITY_CATEGORIES[community.key]
            const Icon = community.Icon

            return (
              <Link
                key={community.key}
                href={`/community?space=${community.key}`}
                className="group overflow-hidden rounded-[22px] border border-[#CEC8BD] bg-white shadow-[0_8px_30px_rgba(17,17,17,0.035)] transition duration-300 hover:-translate-y-1 hover:border-[#AFA79D] hover:shadow-[0_16px_40px_rgba(17,17,17,0.07)]"
              >
                <div className="relative aspect-[16/8.7] overflow-hidden border-b border-[#E6DED0] bg-[#F5F1E8] p-5 text-[#111111] transition group-hover:bg-[#F1EBDD]">
                  <div className="absolute inset-0 opacity-45 [background-image:radial-gradient(rgba(17,17,17,.12)_0.7px,transparent_0.7px)] [background-size:18px_18px]" />
                  <div className="absolute -right-10 -top-12 h-28 w-28 rounded-full border-[18px] border-[#E88A6A]/12" />
                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-[0.16em] text-[#C9684F]">LEGALOPS.CLUB</span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#CEC8BD] bg-white/75 shadow-sm">
                        <Icon className="h-[18px] w-[18px] text-[#111111]" />
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-4">
                      <p className="text-3xl font-black tracking-[-0.055em]" style={roundedFont}>{community.shortLabel}</p>
                      <span className="pb-1 text-[10px] font-semibold text-[#918A83]">
                        {String(index + 1).padStart(2, '0')} / {String(communities.length).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E88A6A]/15 text-[#C9684F]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <h2 className="line-clamp-1 text-sm font-bold text-[#111111]">{category.title}</h2>
                  </div>
                  <p className="mt-3 min-h-[3.75rem] text-sm leading-5 text-[#69635E]">{category.description}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-[#E6DED0] pt-3 text-[11px] text-[#77716A]">
                    <span className="flex items-center gap-1.5"><UsersRound className="h-3.5 w-3.5" /> comunidade</span>
                    <span className="font-semibold text-[#111111]">{annualPrice}/ano</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="mt-10 rounded-[22px] border border-dashed border-[#CEC8BD] bg-white px-6 py-14 text-center">
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
