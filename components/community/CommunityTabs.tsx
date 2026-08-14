'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  FileText,
  Home,
  Lightbulb,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  Rocket,
  Settings,
  Trophy,
  Users,
  Wrench,
} from 'lucide-react'

const mainItems = [
  { href: '/community', label: 'Início', icon: Home, exact: true },
  { href: '/community/classroom', label: 'Trilhas', icon: BookOpen },
  { href: '/community/calendar', label: 'Eventos', icon: CalendarDays },
  { href: '/community/members', label: 'Membros', icon: Users },
  { href: '/community/leaderboard', label: 'Leaderboard', icon: Trophy },
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
    label: 'COMUNIDADE LEGAL OPS',
    items: [
      { space: 'discussao', label: 'Discussões gerais', icon: MessagesSquare },
      { space: 'cases', label: 'Cases & aprendizados', icon: FileText },
      { space: 'ferramentas', label: 'Tech & ferramentas', icon: Wrench },
      { space: 'carreira', label: 'Carreira', icon: BriefcaseBusiness },
    ],
  },
]

type CommunityTabsProps = {
  memberName?: string
  memberRole?: string | null
  memberCount?: number
  initials?: string
}

export function CommunityTabs({ memberName = 'Membro LegalOps', memberRole, memberCount = 0, initials = 'LO' }: CommunityTabsProps) {
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
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold ${active ? 'bg-[#FFF0E9] text-[#D9470F]' : 'text-[#686661]'}`}>
                <Icon className="h-3.5 w-3.5" /> {item.label}
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
              return (
                <Link key={item.href} href={item.href} className={itemClass(active)}>
                  <Icon className="h-[17px] w-[17px]" strokeWidth={active ? 2.3 : 1.8} />
                  <span className="flex-1">{item.label}</span>
                  {item.label === 'Membros' && memberCount > 0 ? <span className="text-[10px] font-bold text-[#9B9993]">{memberCount}</span> : null}
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

          <div className="rounded-xl border border-[#E3E2DD] bg-white p-3">
            <div className="flex items-center gap-2 text-[11px] font-extrabold text-[#23221F]"><Lightbulb className="h-3.5 w-3.5 text-[#FF5C1A]" /> Dica da comunidade</div>
            <p className="mt-2 text-[10px] leading-4 text-[#77746E]">Comece por uma pergunta real. Contexto gera conversas melhores.</p>
          </div>
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
