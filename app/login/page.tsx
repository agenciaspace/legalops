'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { BrandMark } from '@/components/BrandLogo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
    <div className="min-h-screen flex items-center justify-center bg-[#F5F4F0] p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <BrandMark className="h-12 w-12 text-[#FF6A00]" />
          <span className="font-bold text-2xl tracking-tight text-[#1A1A1A]">
            legalops.work
          </span>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-6 space-y-4 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A]/70 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className="w-full border border-[#1A1A1A]/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A]/70 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border border-[#1A1A1A]/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-red-700 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF6A00] text-white rounded-xl py-2.5 text-sm font-bold hover:bg-[#E65C00] disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? 'Carregando...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="w-full text-[#1A1A1A]/60 text-xs hover:text-[#1A1A1A]/70 transition-colors"
          >
            {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
          </button>
        </form>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="bg-white/80 rounded-xl p-3 text-center border border-[#1A1A1A]/10">
            <div className="w-8 h-8 bg-[#FF6A00]/10 rounded-lg flex items-center justify-center mx-auto mb-1.5">
              <svg className="w-4 h-4 text-[#FF6A00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-xs font-medium text-[#1A1A1A]/70">Descoberta</p>
            <p className="text-xs text-[#1A1A1A]/50">Vagas automáticas</p>
          </div>
          <div className="bg-white/80 rounded-xl p-3 text-center border border-[#1A1A1A]/10">
            <div className="w-8 h-8 bg-[#FF6A00]/10 rounded-lg flex items-center justify-center mx-auto mb-1.5">
              <svg className="w-4 h-4 text-[#FF6A00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-xs font-medium text-[#1A1A1A]/70">IA</p>
            <p className="text-xs text-[#1A1A1A]/50">Prep & Cover</p>
          </div>
          <div className="bg-white/80 rounded-xl p-3 text-center border border-[#1A1A1A]/10">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto mb-1.5">
              <BrandMark className="h-4 w-4 text-emerald-700" />
            </div>
            <p className="text-xs font-medium text-[#1A1A1A]/70">Pipeline</p>
            <p className="text-xs text-[#1A1A1A]/50">Kanban visual</p>
          </div>
        </div>
      </div>
    </div>
  )
}
