'use client'

import { useClubLanguage } from '@/components/community/ClubLanguage'
import { COMMUNITY_CATEGORIES } from '@/lib/community'
import {
  CalendarDays,
  FileText,
  MessageCircle,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  Wrench,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const mobileItems = [
  { href: '/community', label: 'Comunidade', icon: MessageCircle },
  { href: '/community/calendar', label: 'Eventos', icon: CalendarDays },
  { href: '/community/tools', label: 'Recursos', icon: Wrench },
]

const forumKeys = [
  'discussao', 'contratos-clm', 'ia-automacao', 'dados-metricas', 'cases', 'processos-projetos',
  'ferramentas', 'financeiro-fornecedores', 'governanca-conhecimento', 'estrategia-maturidade',
  'modelos-entrega', 'carreira',
]

export function CommunityTabs() {
  const { t } = useClubLanguage()
  const path = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try { setCollapsed(localStorage.getItem('club-sidebar-collapsed') === '1') } catch {}
  }, [])

  const toggle = () => {
    const value = !collapsed
    setCollapsed(value)
    try { localStorage.setItem('club-sidebar-collapsed', value ? '1' : '0') } catch {}
  }

  const desktopItems = [
    ['/community', t('Comunidade'), MessageCircle],
    ['/community/calendar', t('Eventos'), CalendarDays],
    ['/community/tools', t('Recursos'), Wrench],
    ['/community/members', t('Membros'), Users],
    ['/community/summaries', t('Resumos do WhatsApp'), FileText],
  ] as const

  return <>
    <aside aria-label={t('Menu lateral')} className={`hidden lg:sticky lg:top-16 lg:block lg:h-[calc(100dvh-4rem)] lg:shrink-0 lg:self-start lg:overflow-y-auto lg:border-r lg:border-[#CEC8BD] lg:bg-[#F5F1E8] lg:py-4 ${collapsed ? 'lg:w-20 lg:px-3' : 'lg:w-52 lg:px-4'}`}>
      <button type="button" onClick={toggle} aria-expanded={!collapsed} aria-controls="club-sidebar-content" aria-label={t(collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral')} title={t(collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral')} className="sticky top-0 z-20 mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-[#CEC8BD] bg-[#FAF7F1] text-[#625E59] hover:bg-[#E9E4D9]">
        {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
      </button>
      <div id="club-sidebar-content">
        <p hidden={collapsed} className="mt-3 px-3 text-[11px] font-medium uppercase tracking-[0.13em] text-[#625E59]">{t('Navegação')}</p>
        <div className="mt-2 space-y-1">
          {desktopItems.map(([href, label, Icon]) => <Link key={href} href={href} aria-label={label} title={collapsed ? label : undefined} aria-current={(href === '/community' ? path === '/community' : path.startsWith(href)) ? 'page' : undefined} className={`flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium ${(href === '/community' ? path === '/community' : path.startsWith(href)) ? 'bg-[#EDE5D8] text-[#A24D36]' : 'text-[#625E59]'}`}><Icon className="h-4 w-4 shrink-0" />{!collapsed && label}</Link>)}
        </div>
        <p hidden={collapsed} className="mt-3 px-3 text-[11px] font-medium uppercase tracking-[0.13em] text-[#625E59]">{t('Fóruns por assunto')}</p>
        <div hidden={collapsed} className="mt-2 space-y-1">
          {forumKeys.slice(0,4).map(key => <Link key={key} href={`/community?space=${key}`} className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-medium text-[#625E59]"><MessageSquareText className="h-3.5 w-3.5 text-[#C9684F]" />{t(COMMUNITY_CATEGORIES[key].label)}</Link>)}
          <details><summary className="min-h-11 cursor-pointer px-3 py-3 text-xs text-[#A24D36]">{t('Mais assuntos')}</summary>          {forumKeys.slice(4).map(key => <Link key={key} href={`/community?space=${key}`} className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-medium text-[#625E59]"><MessageSquareText className="h-3.5 w-3.5 text-[#C9684F]" />{t(COMMUNITY_CATEGORIES[key].label)}</Link>)}
          </details>
        </div>
        <p hidden={collapsed} className="mt-7 border-t border-[#CEC8BD] px-3 pt-5 text-xs leading-5 text-[#625E59]">legalops.club<br />{t('Comunidade')}</p>
      </div>
    </aside>
    <nav aria-label={t('Áreas do Club')} className="club-bottom-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-[#CEC8BD] bg-[#F5F1E8] px-2 pt-1 lg:hidden">
      {mobileItems.map(item => {
        const active = item.href === '/community' ? path === item.href : path.startsWith(item.href) || (item.href === '/community/calendar' && path.startsWith('/community/events/'))
        return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`flex min-h-14 items-center justify-center gap-2 rounded-lg text-xs font-medium sm:text-sm ${active ? 'bg-[#EDE5D8] text-[#A24D36]' : 'text-[#625E59]'}`}>{t(item.label)}</Link>
      })}
    </nav>
  </>
}
