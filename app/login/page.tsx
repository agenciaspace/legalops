'use client'
import { ClubLanguageSelect, useClubLanguage } from '@/components/community/ClubLanguage'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { BrandLogo, BrandWordmark } from '@/components/BrandLogo'
import Link from 'next/link'
import { authNextPath, authEmailError } from '@/lib/auth-login'
import { GoogleSignIn } from '@/components/community/GoogleSignIn'

export default function LoginPage() {
  const { t } = useClubLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'link' | 'password' | 'recovery'>('link')
  const [linkSent, setLinkSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [canResendConfirmation, setCanResendConfirmation] = useState(false)
  const [confirmationResent, setConfirmationResent] = useState(false)
  const [isClub, setIsClub] = useState(false)
  const [signupHref, setSignupHref] = useState('/cadastro')
  const router = useRouter()

  useEffect(() => {
    setIsClub(window.location.hostname.endsWith('legalops.club'))
    const next = new URLSearchParams(window.location.search).get('next')
    const linkError = new URLSearchParams(window.location.search).get('error')
    if (linkError === 'invalid_confirmation' || linkError === 'confirmation_failed') setError('Este link expirou ou já foi usado. Peça um novo link abaixo.')
    if (next) setSignupHref(`/cadastro?next=${encodeURIComponent(next)}`)
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown(value => Math.max(0, value - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  function changeMode(value: 'link' | 'password' | 'recovery') {
    setMode(value)
    setError(null)
    setLinkSent(false)
    setCanResendConfirmation(false)
    setConfirmationResent(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading || (mode !== 'password' && cooldown > 0)) return
    setError(null)
    setLinkSent(false)
    setCanResendConfirmation(false)
    setConfirmationResent(false)
    setLoading(true)
    try {
      const supabase = createClient()
      const address = email.trim().toLowerCase()
      const safePath = authNextPath(new URLSearchParams(window.location.search).get('next'), window.location.hostname.endsWith('legalops.club') ? '/community' : '/dashboard')
      if (mode !== 'password') {
        const next = mode === 'recovery' ? `/set-password?next=${encodeURIComponent(safePath)}` : safePath
        const redirectTo = `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`
        const { error } = mode === 'recovery'
          ? await supabase.auth.resetPasswordForEmail(address, { redirectTo })
          : await supabase.auth.signInWithOtp({ email: address, options: { shouldCreateUser: false, emailRedirectTo: redirectTo } })
        if (error) {
          setError(authEmailError(error))
          if (error.status === 429) setCooldown(60)
        } else {
          setLinkSent(true)
          setCooldown(60)
        }
        return
      }
      const { error } = await supabase.auth.signInWithPassword({ email: address, password })
      if (error) {
        setError(error.code === 'email_not_confirmed' ? 'Confira seu email' : error.code === 'invalid_credentials' ? 'Email ou senha incorretos.' : authEmailError(error))
        setCanResendConfirmation(error.code === 'email_not_confirmed')
        return
      }
      router.push(safePath)
      router.refresh()
    } catch {
      setError('Não foi possível conectar. Tente novamente em alguns instantes.')
    } finally {
      setLoading(false)
    }
  }

  async function resendConfirmation() {
    setLoading(true); setError(null); setConfirmationResent(false)
    try {
      const requestedPath = new URLSearchParams(window.location.search).get('next')
      const next = requestedPath?.startsWith('/') && !requestedPath.startsWith('//') && !requestedPath.includes('\\') ? `/club/entrar?next=${encodeURIComponent(requestedPath)}` : '/club/entrar'
      const response = await fetch('/api/auth/resend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, next }) })
      if (response.ok) { setConfirmationResent(true); setCooldown(60) }
      else setError(t('Não conseguimos reenviar agora. Aguarde alguns minutos e tente novamente.'))
    } catch { setError(t('Não foi possível conectar. Tente novamente em alguns instantes.')) }
    finally { setLoading(false) }
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
          <h1 className="text-xl font-semibold">{t(mode === 'recovery' ? 'Redefinir senha' : 'Entre na sua conta')}</h1>
          {mode !== 'recovery' && <div className="flex gap-2 rounded-2xl bg-[#F5F1E8] p-1" aria-label={t('Como entrar')}>
            {(['link', 'password'] as const).map(value => <button key={value} type="button" aria-pressed={mode === value} disabled={loading} onClick={() => changeMode(value)} className={`min-h-11 flex-1 rounded-xl px-2 text-sm font-semibold ${mode === value ? 'bg-white shadow-sm' : 'text-[#69635E]'}`}>{t(value === 'link' ? 'Link por email' : 'Usar senha')}</button>)}
          </div>}
          {mode === 'link' && <p className="text-sm text-[#69635E]">{t('Receba um link para entrar, sem precisar de senha.')}</p>}
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold text-[#69635E]">{t("Email")}</label>
            <input
              id="login-email"
              autoComplete="email"
              autoCapitalize="none"
              disabled={loading}
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setLinkSent(false); setConfirmationResent(false); setCanResendConfirmation(false); setError(null) }}
              required
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-[#CEC8BD] bg-[#FAF7F1] px-4 py-3 text-sm outline-none transition placeholder:text-[#9A938C] focus:border-[#E88A6A] focus:ring-4 focus:ring-[#E88A6A]/10"
            />
          </div>
          {mode === 'password' && <div>
            <label htmlFor="login-password" className="mb-1.5 block text-xs font-semibold text-[#69635E]">{t("Senha")}</label>
            <input
              id="login-password"
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-2xl border border-[#CEC8BD] bg-[#FAF7F1] px-4 py-3 text-sm outline-none transition placeholder:text-[#9A938C] focus:border-[#E88A6A] focus:ring-4 focus:ring-[#E88A6A]/10"
            />
          </div>}
          {linkSent && <div role="status" className="space-y-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"><p>{t(mode === 'recovery' ? 'Se este email tem uma conta, você receberá um link para redefinir a senha.' : 'Se este email tem uma conta, você receberá um link para entrar.')}</p><p>{t('Confira também o spam. Use o email do cadastro e abra o link mais recente.')}</p></div>}

          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{t(error)}</p>
          )}
          {confirmationResent && <p role="status" className="text-sm text-emerald-700">{t('Email de confirmação reenviado.')}</p>}
          {canResendConfirmation && <button type="button" disabled={loading || cooldown > 0} onClick={resendConfirmation} className="min-h-11 w-full text-sm font-semibold underline disabled:opacity-50">{t('Reenviar email de confirmação')}</button>}
          <button
            type="submit"
            disabled={loading || (mode !== 'password' && cooldown > 0)}
            className="w-full rounded-full bg-[#111111] py-3 text-sm font-bold text-white transition hover:bg-[#2A2927] disabled:opacity-50"
          >
            {loading ? t('Aguarde…') : mode !== 'password' && cooldown > 0 ? t('Reenviar em {seconds}s', { seconds: cooldown }) : t(mode === 'password' ? 'Entrar' : linkSent ? 'Reenviar link' : mode === 'recovery' ? 'Enviar link de recuperação' : 'Receber link por email')}
          </button>
          {mode === 'password' && <button type="button" disabled={loading} className="min-h-11 w-full text-sm underline" onClick={() => changeMode('recovery')}>{t('Esqueci minha senha')}</button>}
          {mode === 'recovery' && <button type="button" disabled={loading} className="min-h-11 w-full text-sm underline" onClick={() => changeMode('link')}>{t('Voltar para o login')}</button>}
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
