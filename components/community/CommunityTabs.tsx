'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { BadgeCheck, CalendarDays, Menu, MessageCircle, Sparkles, Users, X } from 'lucide-react'
import { COMMUNITY_CATEGORIES } from '@/lib/community'

const primary = [
  { href: '/community', label: 'Posts', icon: MessageCircle, description: 'Conversas e experiências da comunidade' },
  { href: '/community/bench', label: 'Bench', icon: Users, description: 'Encontros e comparações de ferramentas' },
  { href: '/community/pro', label: 'Pro', icon: Sparkles, description: 'Seu agente e acompanhamento pessoal' },
]
const secondary = [
  { href: '/community/calendar', label: 'Agenda', icon: CalendarDays },
  { href: '/community/members', label: 'Membros', icon: Users },
  { href: '/community/profile', label: 'Meu perfil', icon: BadgeCheck },
]

type Props = { memberName?: string; memberRole?: string | null; memberCount?: number; initials?: string; hasPaidAccess?: boolean }
export function CommunityTabs({ memberName = 'Membro LegalOps', memberRole, memberCount = 0, initials = 'LO', hasPaidAccess = false }: Props) {
  const pathname = usePathname()
  const search = useSearchParams()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const inPosts = pathname === '/community'
  const inPro = ['/community/pro','/community/assistant','/community/agents','/community/summaries','/community/jobs'].some(path => pathname === path || pathname.startsWith(path + '/'))
  const active = (href: string) => href === '/community' ? inPosts : href === '/community/pro' ? inPro : pathname === href || pathname.startsWith(href + '/')
  useEffect(() => { setMenuOpen(false) }, [pathname, search])
  useEffect(() => {
    if (!menuOpen) return
    panel.current?.querySelector<HTMLAnchorElement>('a')?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus() }
      if (event.key !== 'Tab') return
      const links = panel.current?.querySelectorAll<HTMLElement>('a,button')
      if (!links?.length) return
      const first = links[0], last = links[links.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [menuOpen])
  const linkClass = (selected: boolean) => `flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${selected ? 'bg-[#24231F] text-white' : 'text-[#625E59] hover:bg-[#E9E4D9]'}`
  const menuLinks = <>
    {secondary.map(item => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={linkClass(active(item.href))} aria-current={active(item.href) ? 'page' : undefined}><item.icon className="h-5 w-5 shrink-0" />{item.label}{item.label === 'Membros' && memberCount > 0 ? <span className="ml-auto text-xs">{memberCount}</span> : null}</Link>)}
    <Link href="/community/office" className={linkClass(active('/community/office'))} onClick={() => setMenuOpen(false)}>Escritório da comunidade</Link>
    <Link href="/dashboard" className={linkClass(false)} onClick={() => setMenuOpen(false)}>Abrir legalops.work ↗</Link>
  </>
  return <>
    <nav aria-label="Áreas do Club" className="club-bottom-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[#CEC8BD] bg-[#F5F1E8] px-2 pt-1 lg:hidden">
      {primary.map(item => <Link key={item.href} href={item.href} aria-current={active(item.href) ? 'page' : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs font-semibold ${active(item.href) ? 'bg-[#E9E4D9] text-[#A94E38]' : 'text-[#625E59]'}`}><item.icon className="h-5 w-5" />{item.label}</Link>)}
      <button ref={menuButton} type="button" aria-expanded={menuOpen} aria-controls="club-mobile-menu" onClick={() => setMenuOpen(value => !value)} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs font-semibold text-[#625E59]">{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}Mais</button>
    </nav>
    {menuOpen ? <div className="fixed inset-0 z-50 bg-black/30 lg:hidden" onClick={() => {setMenuOpen(false);menuButton.current?.focus()}}><div id="club-mobile-menu" ref={panel} role="dialog" aria-modal="true" aria-label="Mais opções do Club" className="club-mobile-menu absolute inset-x-3 bottom-3 max-h-[80dvh] overflow-y-auto rounded-2xl border border-[#CEC8BD] bg-[#F5F1E8] p-4 shadow-xl" onClick={event => event.stopPropagation()}>{menuLinks}<button className="mt-2 min-h-12 w-full rounded-lg border border-[#CEC8BD] text-sm font-semibold" onClick={() => {setMenuOpen(false);menuButton.current?.focus()}}>Fechar menu</button></div></div> : null}
    <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-60 shrink-0 flex-col border-r border-[#CEC8BD] bg-[#F3F0E8] lg:flex">
      <nav aria-label="Áreas do Club" className="min-h-0 flex-1 overflow-y-auto p-4">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-[#817A73]">Seu Club</p>
        <div className="space-y-2">{primary.map(item => <Link key={item.href} href={item.href} aria-current={active(item.href) ? 'page' : undefined} className={linkClass(active(item.href))}><item.icon className="h-5 w-5 shrink-0" /><span>{item.label}<span className={`mt-1 block text-xs font-normal leading-5 ${active(item.href) ? 'text-white/75' : 'text-[#77746E]'}`}>{item.description}</span></span></Link>)}</div>
        {inPosts ? <details className="mt-5 border-t border-[#CEC8BD] pt-3" open><summary className="min-h-11 cursor-pointer px-3 py-3 text-xs font-semibold uppercase tracking-wider text-[#817A73]">Assuntos dos posts</summary><div className="space-y-1">{Object.entries(COMMUNITY_CATEGORIES).map(([key, value]) => <Link key={key} href={`/community?space=${key}`} className={linkClass(search.get('space') === key)} aria-current={search.get('space') === key ? 'page' : undefined}>{value.label}</Link>)}</div></details> : null}
        <div className="mt-5 space-y-1 border-t border-[#CEC8BD] pt-3">{menuLinks}</div>
      </nav>
      <Link href="/community/profile" className="flex min-h-20 items-center gap-3 border-t border-[#CEC8BD] p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#24231F] text-xs font-bold text-white">{initials}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{memberName}</span><span className="block truncate text-xs text-[#817A73]">{hasPaidAccess ? 'Pro ativo' : memberRole || 'Membro do Club'}</span></span></Link>
    </aside>
  </>
}
