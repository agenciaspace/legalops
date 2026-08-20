'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { BrandLogo, BrandWordmark } from '@/components/BrandLogo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isClub, setIsClub] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsClub(window.location.hostname.endsWith('legalops.club'))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)
    const supabase = createClient()
    const requestedPath = new URLSearchParams(window.location.search).get('next')
    const safePath = requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
      ? requestedPath
      : window.location.hostname.endsWith('legalops.club') ? '/community' : '/dashboard'

    const { data, error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(safePath)}`,
            },
          })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    if (mode === 'signup' && !data.session) {
      setNotice('Conta criada. Confira seu email para confirmar o acesso e depois entre aqui.')
      setMode('login')
      return
    }

    await fetch('/api/auth/welcome', { method: 'POST' }).catch(() => undefined)

    router.push(safePath)
    router.refresh()
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F5F1E8] p-4 font-[var(--font-inter)] text-[#111111]">
      <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:radial-gradient(rgba(17,17,17,.08)_0.7px,transparent_0.7px)] [background-size:20px_20px]" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border-[56px] border-[#E88A6A]/10" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <BrandLogo
            suffix={isClub ? 'club' : 'work'}
            className="flex flex-col items-center"
            titleClassName="inline-flex items-baseline text-[34px] font-semibold leading-none tracking-[-0.055em] text-[#111111]"
            subtitle={isClub ? 'Sua entrada para a comunidade de Legal Operations' : 'Sua conta para vagas, conteúdo e carreira em Legal Operations'}
            subtitleClassName="mt-4 max-w-sm text-sm leading-6 text-[#6D6761]"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-[26px] border border-[#CEC8BD] bg-white/75 p-6 shadow-[0_20px_60px_rgba(17,17,17,0.06)] backdrop-blur sm:p-7">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#69635E]">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className="w-full rounded-2xl border border-[#CEC8BD] bg-[#FAF7F1] px-4 py-3 text-sm outline-none transition placeholder:text-[#9A938C] focus:border-[#E88A6A] focus:ring-4 focus:ring-[#E88A6A]/10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#69635E]">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-2xl border border-[#CEC8BD] bg-[#FAF7F1] px-4 py-3 text-sm outline-none transition placeholder:text-[#9A938C] focus:border-[#E88A6A] focus:ring-4 focus:ring-[#E88A6A]/10"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          )}
          {notice ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{notice}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#111111] py-3 text-sm font-bold text-white transition hover:bg-[#2A2927] disabled:opacity-50"
          >
            {loading ? 'Carregando...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="w-full text-xs font-medium text-[#77716A] transition hover:text-[#111111]"
          >
            {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#918A83]">
          <span>community</span>
          <span className="h-1 w-1 rounded-full bg-[#E88A6A]" />
          <span>knowledge</span>
          <span className="h-1 w-1 rounded-full bg-[#E88A6A]" />
          <span>connection</span>
        </div>

        <div className="mt-5 flex justify-center opacity-35">
          <BrandWordmark
            suffix={isClub ? 'club' : 'work'}
            className="inline-flex items-baseline text-[14px] font-semibold leading-none tracking-[-0.04em] text-[#111111]"
          />
        </div>
      </div>
    </div>
  )
}
