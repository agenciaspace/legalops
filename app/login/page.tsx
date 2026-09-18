'use client'
import { ClubLanguageSelect, useClubLanguage } from '@/components/community/ClubLanguage'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { BrandLogo, BrandWordmark } from '@/components/BrandLogo'
import Link from 'next/link'
import { GoogleSignIn } from '@/components/community/GoogleSignIn'

export default function LoginPage() {
  const { t, locale } = useClubLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [recovering, setRecovering] = useState(false)
  const [recoverySent, setRecoverySent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isClub, setIsClub] = useState(false)
  const [signupHref, setSignupHref] = useState('/cadastro')
  const router = useRouter()

  useEffect(() => {
    setIsClub(window.location.hostname.endsWith('legalops.club'))
    const next = new URLSearchParams(window.location.search).get('next')
    if (next) setSignupHref(`/cadastro?next=${encodeURIComponent(next)}`)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const requestedPath = new URLSearchParams(window.location.search).get('next')
    const safePath = requestedPath?.startsWith('/') && !requestedPath.startsWith('//') && !requestedPath.includes('\\')
      ? requestedPath
      : window.location.hostname.endsWith('legalops.club') ? '/community' : '/dashboard'

    if (recovering) {
      const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/confirm?next=%2Fset-password%3Fnext%3D%2Fcommunity` })
      setLoading(false)
      if (recoveryError) setError(t("Não foi possível conectar. Tente novamente em alguns instantes."))
      else setRecoverySent(true)
      return
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (error) {
      setError(error.code === 'email_not_confirmed' ? t("Confira seu email") : t("Email ou senha incorretos."))
      return
    }

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
            subtitle={isClub ? t("Sua entrada para a comunidade de Legal Operations") : t("Sua conta para vagas, conteúdo e carreira em Legal Operations")}
            subtitleClassName="mt-4 max-w-sm text-sm leading-6 text-[#6D6761]"
          />
        </div>

        <div className="mb-4 flex justify-end"><ClubLanguageSelect /></div>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-[26px] border border-[#CEC8BD] bg-white/75 p-6 shadow-[0_20px_60px_rgba(17,17,17,0.06)] backdrop-blur sm:p-7">
          {isClub && <GoogleSignIn />}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#69635E]">{t("Email")}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-[#CEC8BD] bg-[#FAF7F1] px-4 py-3 text-sm outline-none transition placeholder:text-[#9A938C] focus:border-[#E88A6A] focus:ring-4 focus:ring-[#E88A6A]/10"
            />
          </div>
          {!recovering && <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#69635E]">{t("Senha")}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-2xl border border-[#CEC8BD] bg-[#FAF7F1] px-4 py-3 text-sm outline-none transition placeholder:text-[#9A938C] focus:border-[#E88A6A] focus:ring-4 focus:ring-[#E88A6A]/10"
            />
          </div>}
          {recoverySent && <p role="status" className="text-sm text-emerald-700">{t("Confira seu email para redefinir a senha.")}</p>}

          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{t(error)}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#111111] py-3 text-sm font-bold text-white transition hover:bg-[#2A2927] disabled:opacity-50"
          >
            {loading ? t('Aguarde…') : t(recovering ? 'Enviar link de recuperação' : 'Entrar')}
          </button>
          <button type="button" className="min-h-11 w-full text-sm underline" onClick={() => { setRecovering(value => !value); setRecoverySent(false); setError(null) }}>{t(recovering ? "Entrar" : "Esqueci minha senha")}</button>
          <p className="text-center text-xs leading-5 text-[#77716A]"> {t("Ainda não tem conta?")} <Link href={signupHref} className="font-semibold underline">{t("Cadastre-se gratuitamente no Club.")}</Link>
          </p>
        </form>

        <div className="mt-6 flex items-center justify-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#918A83]">
          <span>{t("community")}</span>
          <span className="h-1 w-1 rounded-full bg-[#E88A6A]" />
          <span>{t("knowledge")}</span>
          <span className="h-1 w-1 rounded-full bg-[#E88A6A]" />
          <span>{t("connection")}</span>
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
