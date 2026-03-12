'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface NavProps {
  discoverCount: number
}

export function Nav({ discoverCount }: NavProps) {
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
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        pathname === href
          ? 'bg-blue-50 text-blue-700'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
      }`}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-xs font-bold">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Link href="/dashboard" className="flex items-center gap-2 mr-6">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">LO</span>
            </div>
            <span className="text-sm font-bold text-slate-900">LegalOps</span>
          </Link>
          {navLink('/dashboard', 'Dashboard')}
          {navLink('/discover', 'Descobrir', discoverCount)}
          {navLink('/pipeline', 'Pipeline')}
          {navLink('/settings', 'Alertas')}
        </div>
        <button
          onClick={handleSignOut}
          className="text-xs text-slate-500 hover:text-slate-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50"
        >
          Sair
        </button>
      </div>
    </header>
  )
}
