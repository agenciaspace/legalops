'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, ChevronDown, MessageCircle, Plus, Search, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { BrandLogo } from '@/components/BrandLogo'

interface NavProps {
  discoverCount: number
  newJobsCount: number
}

export function Nav({ discoverCount, newJobsCount }: NavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isCommunity = pathname.startsWith('/community')

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const navLink = (href: string, label: string, badge?: number) => (
    <Link
      href={href}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
        pathname === href || (href === '/community' && pathname.startsWith('/community'))
          ? 'bg-[#FF6A00]/10 text-[#FF6A00]'
          : 'text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/5'
      }`}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF6A00] text-white text-xs font-bold">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )

  if (isCommunity) {
    return (
      <header className="sticky top-0 z-50 h-16 border-b border-[#E6E6E3] bg-white/95 backdrop-blur-xl">
        <div className="flex h-full items-center gap-3 px-4 lg:px-5">
          <Link href="/community" className="flex w-auto shrink-0 items-center gap-2.5 lg:w-[232px]" aria-label="LegalOps Club — início">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF5C1A] text-[11px] font-black tracking-tight text-white">LO</div>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-[13px] font-extrabold leading-4 tracking-[-0.01em]">LegalOps Club</p>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#8A8883]">Comunidade</p>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 text-[#9A9892] lg:block" />
          </Link>

          <button className="mx-auto hidden h-9 w-full max-w-md items-center gap-2 rounded-lg border border-[#DEDEDA] bg-[#F8F8F6] px-3 text-left text-xs text-[#8B8984] transition hover:border-[#C9C8C3] hover:bg-white md:flex" aria-label="Buscar na comunidade">
            <Search className="h-4 w-4" />
            <span className="flex-1">Buscar na comunidade</span>
            <kbd className="rounded border border-[#D8D7D2] bg-white px-1.5 py-0.5 font-sans text-[9px] text-[#9A9892]">⌘ K</kbd>
          </button>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <Link href="/community#new-post" className="hidden h-9 items-center gap-1.5 rounded-lg bg-[#FF5C1A] px-3.5 text-xs font-extrabold text-white transition hover:bg-[#E84D10] sm:flex">
              <Plus className="h-4 w-4" /> Novo post
            </Link>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg text-[#696762] transition hover:bg-[#F2F2EF] hover:text-[#1D1C1A] md:hidden" aria-label="Buscar">
              <Search className="h-[18px] w-[18px]" />
            </button>
            <button className="hidden h-9 w-9 items-center justify-center rounded-lg text-[#696762] transition hover:bg-[#F2F2EF] hover:text-[#1D1C1A] sm:flex" aria-label="Mensagens">
              <MessageCircle className="h-[18px] w-[18px]" />
            </button>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[#696762] transition hover:bg-[#F2F2EF] hover:text-[#1D1C1A]" aria-label="Notificações">
              <Bell className="h-[18px] w-[18px]" />
              {newJobsCount > 0 ? <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#FF5C1A] ring-2 ring-white" /> : null}
            </button>
            <button className="ml-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#292825] text-[10px] font-black text-white ring-2 ring-white" aria-label="Abrir menu do perfil">LO</button>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#1A1A1A]/10 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
          <Link href="/dashboard" className="flex items-center gap-2 mr-6">
            <BrandLogo
              className="flex items-center gap-2"
              markClassName="h-7 w-7 text-[#1A1A1A]"
              titleClassName="text-sm font-semibold tracking-[0.18em] text-[#1A1A1A] uppercase"
            />
          </Link>
          {navLink('/community', 'Club')}
          {navLink('/dashboard', 'Dashboard')}
          {navLink('/discover', 'Descobrir', discoverCount)}
          {navLink('/pipeline', 'Pipeline')}
          {navLink('/professionals', 'Profissionais')}
          {navLink('/emails', 'Emails')}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {newJobsCount > 0 && (
            <Link
              href="/discover"
              className="relative flex items-center justify-center p-2 rounded-xl text-[#1A1A1A]/60 hover:text-[#FF6A00] hover:bg-[#1A1A1A]/5 transition-colors"
              title={`${newJobsCount} vagas novas adicionadas pelo crawler`}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF6A00] text-[9px] font-bold text-white ring-2 ring-white">
                {newJobsCount > 99 ? '99+' : newJobsCount}
              </span>
            </Link>
          )}
          <Link href="/community/members" className="hidden rounded-xl p-2 text-[#1A1A1A]/50 transition hover:bg-[#1A1A1A]/5 hover:text-[#FF6A00] sm:flex" title="Membros do Club">
            <Users className="h-5 w-5" />
          </Link>
          <button
            onClick={handleSignOut}
            className="text-xs text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors px-3 py-1.5 rounded-xl hover:bg-[#1A1A1A]/5"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}
