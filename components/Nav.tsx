'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Globe, Home } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { BrandLogo } from '@/components/BrandLogo'
import { useI18n } from '@/lib/i18n'

interface NavProps {
  discoverCount: number
}

export function Nav({ discoverCount }: NavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { locale, setLocale, t } = useI18n()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function toggleLocale() {
    setLocale(locale === 'pt' ? 'en' : 'pt')
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
          <Link href="/dashboard" className="flex items-center gap-2 mr-6" title={t.nav.home}>
            <BrandLogo
              className="flex items-center gap-2"
              markClassName="h-7 w-7 text-slate-950"
              titleClassName="text-sm font-semibold tracking-[0.18em] text-slate-900 uppercase"
            />
          </Link>
          {navLink('/dashboard', t.nav.dashboard)}
          {navLink('/discover', t.nav.discover, discoverCount)}
          {navLink('/pipeline', t.nav.pipeline)}
          {navLink('/professionals', t.nav.professionals)}
          {navLink('/emails', t.nav.emails)}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLocale}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50 border border-slate-200"
            title={t.nav.switchLang}
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.nav.switchLang}</span>
            <span className="sm:hidden">{t.nav.switchLangCompact}</span>
          </button>
          <button
            onClick={handleSignOut}
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50"
          >
            {t.nav.signOut}
          </button>
        </div>
      </div>
    </header>
  )
}
