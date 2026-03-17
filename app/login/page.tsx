'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home } from 'lucide-react'
import { BrandLogo, BrandMark } from '@/components/BrandLogo'
import { useI18n } from '@/lib/i18n'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { t } = useI18n()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()

    const { error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    router.refresh()
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-2 text-center">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors mb-4">
            <Home className="h-3 w-3" />
            {t.nav.home}
          </Link>
        </div>

        <div className="mb-8 text-center">
          <BrandLogo
            className="flex flex-col items-center gap-4"
            markClassName="h-14 w-14 text-slate-950"
            titleClassName="text-2xl font-semibold tracking-[0.18em] text-slate-950 uppercase"
            subtitle={t.login.subtitle}
            subtitleClassName="max-w-xs text-sm leading-6 text-slate-500"
          />
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.login.email}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder={t.login.emailPlaceholder}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.login.password}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? t.login.loadingText : mode === 'login' ? t.login.signIn : t.login.signUp}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="w-full text-slate-500 text-xs hover:text-slate-700 transition-colors"
          >
            {mode === 'login' ? t.login.noAccount : t.login.hasAccount}
          </button>
        </form>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="bg-white/80 rounded-xl p-3 text-center border border-slate-100">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-1.5">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-xs font-medium text-slate-700">{t.login.featureDiscovery}</p>
            <p className="text-xs text-slate-400">{t.login.featureDiscoverySub}</p>
          </div>
          <div className="bg-white/80 rounded-xl p-3 text-center border border-slate-100">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center mx-auto mb-1.5">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-xs font-medium text-slate-700">{t.login.featureAI}</p>
            <p className="text-xs text-slate-400">{t.login.featureAISub}</p>
          </div>
          <div className="bg-white/80 rounded-xl p-3 text-center border border-slate-100">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center mx-auto mb-1.5">
              <BrandMark className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-xs font-medium text-slate-700">{t.login.featurePipeline}</p>
            <p className="text-xs text-slate-400">{t.login.featurePipelineSub}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
