'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, CalendarDays, MessageCircle, Trophy, Users } from 'lucide-react'

const tabs = [
  { href: '/community', label: 'Comunidade', icon: MessageCircle, exact: true },
  { href: '/community/classroom', label: 'Trilhas', icon: BookOpen },
  { href: '/community/calendar', label: 'Agenda', icon: CalendarDays },
  { href: '/community/members', label: 'Membros', icon: Users },
  { href: '/community/leaderboard', label: 'Ranking', icon: Trophy },
]

export function CommunityTabs() {
  const pathname = usePathname()

  return (
    <nav aria-label="Navegação do Club" className="overflow-x-auto border-t border-white/10">
      <div className="mx-auto flex min-w-max max-w-7xl items-center gap-1 px-4 sm:px-6">
        {tabs.map(tab => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 border-b-2 px-3 py-3 text-xs font-bold transition sm:text-sm ${
                active
                  ? 'border-[#FF6A00] text-white'
                  : 'border-transparent text-white/55 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
