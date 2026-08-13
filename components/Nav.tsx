'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { BrandLogo } from '@/components/BrandLogo'

interface NavProps {
  discoverCount: number
  newJobsCount: number
}

export function Nav({ discoverCount, newJobsCount }: NavProps) {
  const pathname = usePathname()
  const router = useRouter()

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
