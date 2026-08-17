'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  BarChart3,
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  Home,
  Lightbulb,
  Lock,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react'

const mainItems = [
  { href: '/community', label: 'Início', icon: Home, exact: true },
  { href: '/community/summaries', label: 'Resumos IA', icon: Sparkles },
  { href: '/community/calendar', label: 'Lives', icon: CalendarDays },
  { href: '/community/members', label: 'Membros', icon: Users },
  { href: '/community/profile', label: 'Meu perfil', icon: BadgeCheck },
]

const spaceGroups = [
  {
    label: 'Comece aqui',
    items: [
      { space: 'anuncio', label: 'Anúncios' },
      { space: 'apresentacoes', label: 'Apresente-se' },
    ],
  },
  {
    label: 'Conversas centrais',
    items: [
      { space: 'discussao', label: 'Discussões gerais' },
      { space: 'cases', label: 'Cases & playbooks' },
    ],
  },
  {
    label: 'Temas latentes',
    items: [
      { space: 'ia-automacao', label: 'IA & automação' },
      { space: 'dados-metricas', label: 'Dados, métricas & BI' },
      { space: 'contratos-clm', label: 'Contratos & CLM' },
    ],
  },
  {
    label: 'Operação',
    items: [
      { space: 'processos-projetos', label: 'Processos & projetos' },
      { space: 'ferramentas', label: 'Tech stack & integrações' },
      { space: 'financeiro-fornecedores', label: 'Spend & fornecedores' },
      { space: 'governanca-conhecimento', label: 'Governança & conhecimento' },
    ],
  },
  {
    label: 'Estratégia & pessoas',
    items: [
      { space: 'estrategia-maturidade', label: 'Estratégia & maturidade' },
      { space: 'modelos-entrega', label: 'Modelos de entrega' },
      { space: 'carreira', label: 'Pessoas & liderança' },
    ],
  },
]

type CommunityTabsProps = {
  memberName?: string
  memberRole?: string | null
  memberCount?: number
  initials?: string
  hasPaidAccess?: boolean
}

export function CommunityTabs({ memberName = 'Membro LegalOps', memberRole, memberCount = 0, initials = 'LO', hasPaidAccess = false }: CommunityTabsProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selectedSpace = searchParams.get('space')

  const itemClass = (active: boolean) => `group flex items-center gap-2.5 border-l-2 px-2.5 py-2 text-[13px] font-semibold transition ${
    active
      ? 'border-[#DF4D1E] bg-[#E9E4D9] text-[#1F211E]'
      : 'border-transparent text-[#66645E] hover:border-[#BCB7AB] hover:text-[#1F211E]'
  }`

  return (
    <>
      <nav aria-label="Navegação móvel do Club" className="fixed inset-x-0 top-16 z-40 overflow-x-auto border-b border-[#1F211E] bg-[#F3F0E8] px-3 lg:hidden">
        <div className="flex min-w-max items-center gap-1 py-2">
          {mainItems.map(item => {
            const active = item.exact ? pathname === item.href && !selectedSpace : pathname.startsWith(item.href)
            const Icon = item.icon
            const locked = !hasPaidAccess && !item.exact
            return (
              <Link key={item.href} href={locked ? '/community?upgrade=1' : item.href} className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-bold ${active ? 'border-[#DF4D1E] text-[#1F211E]' : 'border-transparent text-[#686661]'}`}>
                <Icon className="h-3.5 w-3.5" /> {item.label} {locked ? <Lock className="h-3 w-3 text-[#AAA7A1]" /> : null}
              </Link>
            )
          })}
        </div>
      </nav>

      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[252px] shrink-0 flex-col border-r border-[#1F211E] bg-[#F3F0E8] lg:flex">
        <nav aria-label="Navegação do Club" className="min-h-0 flex-1 overflow-y-auto px-3 pb-5 pt-4">
          <div className="space-y-0.5">
            {mainItems.map(item => {
              const active = item.exact ? pathname === item.href && !selectedSpace : pathname.startsWith(item.href)
              const Icon = item.icon
              const locked = !hasPaidAccess && !item.exact
              return (
                <Link key={item.href} href={locked ? '/community?upgrade=1' : item.href} className={itemClass(active)}>
                  <Icon className="h-[17px] w-[17px]" strokeWidth={active ? 2.3 : 1.8} />
                  <span className="flex-1">{item.label}</span>
                  {item.label === 'Membros' && memberCount > 0 ? <span className="text-[10px] font-bold text-[#9B9993]">{memberCount}</span> : null}
                  {locked ? <Lock className="h-3 w-3 text-[#AAA7A1]" /> : null}
                </Link>
              )
            })}
          </div>

          <div className="my-4 h-px bg-[#1F211E]/20" />

          {spaceGroups.map(group => (
            <div key={group.label} className="mb-5">
              <button className="mb-1.5 flex w-full items-center gap-1 px-2.5 text-left text-[9px] font-black uppercase tracking-[0.12em] text-[#8A867D]">
                <ChevronDown className="h-3 w-3" /> {group.label}
              </button>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const active = pathname === '/community' && selectedSpace === item.space
                  return (
                    <Link key={item.space} href={`/community?space=${item.space}`} className={itemClass(active)}>
                      <span className={`h-1.5 w-1.5 shrink-0 ${active ? 'bg-[#DF4D1E]' : 'bg-[#BCB7AB]'}`} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          {hasPaidAccess ? (
            <div className="border-t border-[#1F211E]/25 pt-3">
              <div className="flex items-center gap-2 text-[11px] font-extrabold text-[#23221F]"><Lightbulb className="h-3.5 w-3.5 text-[#FF5C1A]" /> Dica da comunidade</div>
              <p className="mt-2 text-[10px] leading-4 text-[#77746E]">Comece por uma pergunta real. Contexto gera conversas melhores.</p>
            </div>
          ) : (
            <div className="border-t-2 border-[#DF4D1E] bg-[#1F211E] p-3 text-white">
              <div className="flex items-center gap-2 text-[11px] font-extrabold"><Lock className="h-3.5 w-3.5 text-[#FF7A45]" /> Acesso completo</div>
              <p className="mt-2 text-[10px] leading-4 text-white/60">Desbloqueie conversas, resumos por IA, lives e a rede validada.</p>
              <Link href="/club#planos" className="mt-3 inline-flex text-[10px] font-extrabold text-[#FF8B5D] hover:text-white">Ver planos →</Link>
            </div>
          )}
        </nav>

        <div className="border-t border-[#1F211E] p-3">
          <div className="flex items-center gap-2.5 px-2 py-2 hover:bg-[#E9E4D9]">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#1F211E] text-[10px] font-black text-white">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-extrabold text-[#272622]">{memberName}</p>
              <p className="truncate text-[9px] text-[#8C8983]">{memberRole || 'Membro do LegalOps Club'}</p>
            </div>
            <Settings className="h-3.5 w-3.5 text-[#8C8983]" />
          </div>
          <Link href="/dashboard" className="mt-1 flex items-center gap-2 px-2 py-1.5 text-[10px] font-bold text-[#898681] hover:text-[#D9470F]">
            <BarChart3 className="h-3.5 w-3.5" /> Abrir plataforma de carreira
          </Link>
        </div>
      </aside>
    </>
  )
}
