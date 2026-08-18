'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, ChevronDown, MessageCircle, Plus, Search, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { BrandMark, BrandWordmark } from '@/components/BrandLogo'

interface NavProps {
  discoverCount: number
  jobAlertCount: number
  hasClubAccess: boolean
}

export function Nav({ discoverCount, jobAlertCount, hasClubAccess }: NavProps) {
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
      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
        pathname === href || (href === '/community' && pathname.startsWith('/community'))
          ? 'bg-[#111111] text-white'
          : 'text-[#66615B] hover:bg-white/70 hover:text-[#111111]'
      }`}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#E88A6A] px-1 text-xs font-bold text-[#111111]">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )

  if (isCommunity) {
    return (
      <header className="sticky top-0 z-50 h-16 border-b border-[#CEC8BD] bg-[#F5F1E8]/95 backdrop-blur-xl">
        <div className="flex h-full items-center gap-3 px-4 lg:px-5">
          <Link href="/community" className="flex w-auto shrink-0 items-center gap-2.5 lg:w-[232px]" aria-label="legalops.club — início">
            <BrandMark className="h-8 w-auto text-[#111111]" />
            <div className="hidden min-w-0 sm:block">
              <BrandWordmark className="inline-flex items-baseline text-[19px] font-medium leading-none tracking-[-0.065em] text-[#111111]" />
              <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.17em] text-[#918A83]">comunidade</p>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 text-[#918A83] lg:block" />
          </Link>

          <button className="mx-auto hidden h-9 w-full max-w-md items-center gap-2 rounded-full border border-[#CEC8BD] bg-white/65 px-3 text-left text-xs text-[#77716A] transition hover:bg-white md:flex" aria-label="Buscar na comunidade">
            <Search className="h-4 w-4" />
            <span className="flex-1">Buscar na comunidade</span>
            <kbd className="rounded-md border border-[#E6DED0] bg-white px-1.5 py-0.5 font-sans text-[9px] text-[#918A83]">⌘ K</kbd>
          </button>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <Link href="/community#new-post" className="hidden h-9 items-center gap-1.5 rounded-full bg-[#E88A6A] px-3.5 text-xs font-extrabold text-[#111111] transition hover:bg-[#DE7B5C] sm:flex">
              <Plus className="h-4 w-4" /> Novo post
            </Link>
            <button className="flex h-9 w-9 items-center justify-center rounded-full text-[#69635E] transition hover:bg-white/70 hover:text-[#111111] md:hidden" aria-label="Buscar">
              <Search className="h-[18px] w-[18px]" />
            </button>
            <button className="hidden h-9 w-9 items-center justify-center rounded-full text-[#69635E] transition hover:bg-white/70 hover:text-[#111111] sm:flex" aria-label="Mensagens">
              <MessageCircle className="h-[18px] w-[18px]" />
            </button>
            <Link href={hasClubAccess ? '/community/jobs' : '/community?upgrade=1'} className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#69635E] transition hover:bg-white/70 hover:text-[#111111]" aria-label={jobAlertCount > 0 ? `${jobAlertCount} alertas de vagas` : 'Alertas de vagas'}>
              <Bell className="h-[18px] w-[18px]" />
              {jobAlertCount > 0 ? <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#E88A6A] ring-2 ring-[#F5F1E8]" /> : null}
            </Link>
            <button className="ml-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#111111] text-[10px] font-black text-white ring-2 ring-[#F5F1E8]" aria-label="Abrir menu do perfil">LO</button>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#CEC8BD]/75 bg-[#F5F1E8]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between gap-3 px-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
          <Link href="/dashboard" className="mr-6 flex items-center">
            <BrandWordmark
              suffix="work"
              className="inline-flex items-baseline text-[22px] font-medium leading-none tracking-[-0.065em] text-[#111111] sm:text-[27px]"
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
          {jobAlertCount > 0 && (
            <Link
              href="/community/jobs"
              className="relative flex items-center justify-center rounded-full p-2 text-[#69635E] transition-colors hover:bg-white/70 hover:text-[#111111]"
              title={`${jobAlertCount} alertas de vagas para o seu perfil do Club`}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#E88A6A] text-[9px] font-bold text-[#111111] ring-2 ring-[#F5F1E8]">
                {jobAlertCount > 99 ? '99+' : jobAlertCount}
              </span>
            </Link>
          )}
          <Link href="/community/members" className="hidden rounded-full p-2 text-[#69635E] transition hover:bg-white/70 hover:text-[#111111] sm:flex" title="Membros do Club">
            <Users className="h-5 w-5" />
          </Link>
          <button
            onClick={handleSignOut}
            className="rounded-full px-3 py-2 text-xs text-[#66615B] transition-colors hover:bg-white/70 hover:text-[#111111]"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}
