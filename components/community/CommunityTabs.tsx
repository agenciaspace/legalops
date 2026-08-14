'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  BarChart3,
  BadgeCheck,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Database,
  FileText,
  FileCheck2,
  Home,
  Library,
  Lightbulb,
  Lock,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  Network,
  Rocket,
  Settings,
  Sparkles,
  Target,
  Users,
  Workflow,
  Wrench,
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
    label: 'COMECE AQUI',
    items: [
      { space: 'anuncio', label: 'Anúncios', icon: Megaphone },
      { space: 'apresentacoes', label: 'Apresente-se', icon: Rocket },
    ],
  },
  {
    label: 'CONVERSAS CENTRAIS',
    items: [
      { space: 'discussao', label: 'Discussões gerais', icon: MessagesSquare },
      { space: 'cases', label: 'Cases & playbooks', icon: FileText },
    ],
  },
  {
    label: 'TEMAS LATENTES',
    items: [
      { space: 'ia-automacao', label: 'IA & automação', icon: Bot },
      { space: 'dados-metricas', label: 'Dados, métricas & BI', icon: Database },
      { space: 'contratos-clm', label: 'Contratos & CLM', icon: FileCheck2 },
    ],
  },
  {
    label: 'OPERAÇÃO',
    items: [
      { space: 'processos-projetos', label: 'Processos & projetos', icon: Workflow },
      { space: 'ferramentas', label: 'Tech stack & integrações', icon: Wrench },
      { space: 'financeiro-fornecedores', label: 'Spend & fornecedores', icon: CircleDollarSign },
      { space: 'governanca-conhecimento', label: 'Governança & conhecimento', icon: Library },
    ],
  },
  {
    label: 'ESTRATÉGIA & PESSOAS',
    items: [
      { space: 'estrategia-maturidade', label: 'Estratégia & maturidade', icon: Target },
      { space: 'modelos-entrega', label: 'Modelos de entrega', icon: Network },
      { space: 'carreira', label: 'Pessoas & liderança', icon: BriefcaseBusiness },
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

  const itemClass = (active: boolean) => `group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold transition ${
    active
      ? 'bg-[#FFF0E9] text-[#D9470F]'
      : 'text-[#5F5D58] hover:bg-[#F1F1EE] hover:text-[#1F1E1B]'
  }`

  return (
    <>
      <nav aria-label="Navegação móvel do Club" className="fixed inset-x-0 top-16 z-40 overflow-x-auto border-b border-[#E6E6E3] bg-white px-3 lg:hidden">
        <div className="flex min-w-max items-center gap-1 py-2">
          {mainItems.map(item => {
            const active = item.exact ? pathname === item.href && !selectedSpace : pathname.startsWith(item.href)
            const Icon = item.icon
            const locked = !hasPaidAccess && !item.exact
            return (
              <Link key={item.href} href={locked ? '/community?upgrade=1' : item.href} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold ${active ? 'bg-[#FFF0E9] text-[#D9470F]' : 'text-[#686661]'}`}>
                <Icon className="h-3.5 w-3.5" /> {item.label} {locked ? <Lock className="h-3 w-3 text-[#AAA7A1]" /> : null}
              </Link>
            )
          })}
        </div>
      </nav>

      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[252px] shrink-0 flex-col border-r border-[#E4E4E0] bg-[#F7F7F5] lg:flex">
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

          <div className="my-4 h-px bg-[#E4E4E0]" />

          {spaceGroups.map(group => (
            <div key={group.label} className="mb-5">
              <button className="mb-1.5 flex w-full items-center gap-1 px-2.5 text-left text-[9px] font-extrabold tracking-[0.12em] text-[#96948E]">
                <ChevronDown className="h-3 w-3" /> {group.label}
              </button>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const active = pathname === '/community' && selectedSpace === item.space
                  const Icon = item.icon
                  return (
                    <Link key={item.space} href={`/community?space=${item.space}`} className={itemClass(active)}>
                      <span className={`flex h-6 w-6 items-center justify-center rounded-md ${active ? 'bg-[#FFDACC]' : 'bg-[#ECECE8] group-hover:bg-white'}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          {hasPaidAccess ? (
            <div className="rounded-xl border border-[#E3E2DD] bg-white p-3">
              <div className="flex items-center gap-2 text-[11px] font-extrabold text-[#23221F]"><Lightbulb className="h-3.5 w-3.5 text-[#FF5C1A]" /> Dica da comunidade</div>
              <p className="mt-2 text-[10px] leading-4 text-[#77746E]">Comece por uma pergunta real. Contexto gera conversas melhores.</p>
            </div>
          ) : (
            <div className="rounded-xl bg-[#292825] p-3 text-white">
              <div className="flex items-center gap-2 text-[11px] font-extrabold"><Lock className="h-3.5 w-3.5 text-[#FF7A45]" /> Acesso completo</div>
              <p className="mt-2 text-[10px] leading-4 text-white/60">Desbloqueie conversas, resumos por IA, lives e a rede validada.</p>
              <Link href="/club#planos" className="mt-3 inline-flex text-[10px] font-extrabold text-[#FF8B5D] hover:text-white">Ver planos →</Link>
            </div>
          )}
        </nav>

        <div className="border-t border-[#E4E4E0] p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-[#EFEFEB]">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#292825] text-[10px] font-black text-white">{initials}</div>
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
