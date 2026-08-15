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
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777B78]" />
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Buscar por assunto"
            className="h-13 w-full rounded-2xl border border-[#D9D0C3] bg-white/90 py-3.5 pl-11 pr-4 text-sm text-[#111827] shadow-[0_8px_30px_rgba(17,24,39,0.04)] outline-none placeholder:text-[#8E918F] focus:border-[#111827]/40 focus:ring-4 focus:ring-[#E86A4A]/10"
          />
        </label>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:justify-center">
        {filters.map(filter => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setActiveFilter(filter.key)}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${activeFilter === filter.key ? 'border-[#111827] bg-[#111827] text-white' : 'border-[#D9D0C3] bg-[#FBF8F2] text-[#626662] hover:border-[#B9B0A4] hover:bg-white hover:text-[#111827]'}`}
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
                className="group overflow-hidden rounded-[22px] border border-[#DED7CC] bg-white shadow-[0_8px_30px_rgba(17,24,39,0.045)] transition duration-300 hover:-translate-y-1 hover:border-[#C9BDAE] hover:shadow-[0_16px_40px_rgba(17,24,39,0.08)]"
              >
                <div className="relative aspect-[16/8.7] overflow-hidden border-b border-[#E7DFD4] bg-[#F8F3EA] p-5 text-[#111827] transition group-hover:bg-[#F5EEE3]">
                  <div className="absolute inset-0 opacity-55 [background-image:radial-gradient(rgba(17,24,39,.12)_0.7px,transparent_0.7px)] [background-size:18px_18px]" />
                  <div className="absolute -right-10 -top-12 h-28 w-28 rounded-full border-[18px] border-[#E86A4A]/10" />
                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-[0.16em] text-[#E86A4A]">LEGALOPS.CLUB</span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D9D0C3] bg-white/80 shadow-sm">
                        <Icon className="h-[18px] w-[18px] text-[#111827]" />
                      </span>
                    </div>
                    <div className="flex items-end justify-between gap-4">
                      <p className="text-3xl font-black tracking-[-0.055em]">{community.shortLabel}</p>
                      <span className="pb-1 text-[10px] font-semibold text-[#8E918F]">
                        {String(index + 1).padStart(2, '0')} / {String(communities.length).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E86A4A]/10 text-[#D9593C]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <h2 className="line-clamp-1 text-sm font-bold text-[#111827]">{category.title}</h2>
                  </div>
                  <p className="mt-3 min-h-[3.75rem] text-sm leading-5 text-[#666B67]">{category.description}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-[#EEE7DE] pt-3 text-[11px] text-[#777B78]">
                    <span className="flex items-center gap-1.5"><UsersRound className="h-3.5 w-3.5" /> comunidade</span>
                    <span className="font-semibold text-[#111827]">{annualPrice}/ano</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="mt-10 rounded-[22px] border border-dashed border-[#CFC5B8] bg-white px-6 py-14 text-center">
          <p className="text-sm font-semibold text-[#111827]">Nenhuma comunidade encontrada.</p>
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setActiveFilter('all')
            }}
            className="mt-3 text-xs font-bold text-[#E86A4A] hover:underline"
          >
            Limpar busca
          </button>
        </div>
      )}
    </>
  )
}
