'use client'
import { ClubLanguageSelect, useClubLanguage } from '@/components/community/ClubLanguage'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BrandWordmark } from '@/components/BrandLogo'
import { GoogleSignIn } from '@/components/community/GoogleSignIn'
import { clubReturnPath } from '@/lib/club-return-path'

export default function ClubSignupPage() {
  const { t, locale } = useClubLanguage()
  const [returnPath,setReturnPath] = useState('/club/entrar')
  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get('next')
    if (next === '/club/checkout') setReturnPath('/club/entrar?next=/club/checkout')
    else if (clubReturnPath(next)) setReturnPath(`/club/entrar?next=${encodeURIComponent(next!)}`)
  }, [])
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true)
    const form = new FormData(event.currentTarget)
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: String(form.get('email')).trim(),
          password: String(form.get('password')),
          next: returnPath,
          locale,
        }),
      })
      const result = await response.json().catch(() => ({})) as { code?: string }
      if (!response.ok) {
        if (result.code === 'weak_password') setError(t("Escolha outra senha com pelo menos 8 caracteres. Evite senhas muito comuns."))
        else if (result.code === 'email_address_invalid') setError(t("Confira se o endereço de email está correto."))
        else if (result.code === 'over_email_send_rate_limit' || result.code === 'over_request_rate_limit') setError(t("Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente."))
        else if (result.code === 'email_delivery_failed') setError(t("Não conseguimos enviar o email de confirmação. Tente novamente em alguns instantes."))
        else setError(t("Não foi possível criar a conta. Confira os dados ou tente entrar se já tiver cadastro."))
        return
      }
      setSent(true)
    } catch { setError(t("Não foi possível conectar. Tente novamente em alguns instantes.")) }
    finally { setBusy(false) }
  }
  return <main className="min-h-screen bg-[#F5F1E8] px-5 py-12 text-[#111111] sm:py-20">
    <div className="mx-auto max-w-lg">
      <Link href="/club" aria-label="legalops.club"><BrandWordmark suffix="club" className="text-3xl" /></Link>
      <div className="mt-5"><ClubLanguageSelect /></div>
      <h1 className="mt-10 font-[var(--font-quicksand)] text-4xl font-semibold tracking-tight">{t("crie sua conta")}<span className="text-[#E88A6A]">.</span></h1>
      <p className="mt-4 text-sm leading-7 text-[#69635E]">{t("A comunidade é gratuita para quem tem relação com o trabalho jurídico. Depois de confirmar seu email, complete o perfil com LinkedIn, atuação e assuntos de interesse.")}</p>
      {sent ? <section role="status" className="mt-8 border-y border-[#CEC8BD] py-6"><h2 className="font-semibold">{t("Confira seu email")}</h2><p className="mt-3 text-sm leading-6">{t("Abra o link de confirmação para continuar o cadastro. Já tinha conta? Entre com sua senha para acessar a comunidade e receber as boas-vindas.")}</p><Link href={`/login?next=${encodeURIComponent(returnPath)}`} className="mt-5 inline-block text-sm font-semibold underline">{t("Entrar na minha conta")}</Link></section>
      : <form onSubmit={submit} className="mt-8 space-y-5">
        <GoogleSignIn />
        <label className="block text-sm font-semibold">{t("Email")}<input name="email" type="email" autoComplete="email" required maxLength={254} className="mt-2 w-full rounded-lg border border-[#CEC8BD] bg-[#FAF7F1] px-4 py-3 font-normal" /></label>
        <label className="block text-sm font-semibold">{t("Senha")}<input name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} maxLength={128} aria-describedby="password-help" className="mt-2 w-full rounded-lg border border-[#CEC8BD] bg-[#FAF7F1] px-4 py-3 font-normal" /></label>
        <div className="flex items-center justify-between gap-3">
          <p id="password-help" className="text-xs text-[#69635E]">{t("Use pelo menos 8 caracteres. Sem obrigação de maiúsculas, números ou símbolos.")}</p>
          <button type="button" aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)} className="min-h-11 shrink-0 text-sm font-semibold underline">{showPassword ? t("Ocultar senha") : t("Mostrar senha")}</button>
        </div>
        {error && <p role="alert" className="text-sm text-red-700">{t(error)}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-[#111111] px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? t("Criando conta…") : t("Criar conta gratuita")}</button>
        <p className="text-sm text-[#69635E]">{t("Já tem conta?")} <Link href={`/login?next=${encodeURIComponent(returnPath)}`} className="font-semibold underline">{t("Entrar")}</Link></p>
      </form>}
      <aside className="mt-8 rounded-xl bg-[#111111] p-5 text-[#F5F1E8]">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#E88A6A]">{t("Club Pro")}</p>
        <h2 className="mt-2 text-lg font-semibold">{t("Seu agente para acompanhar o que importa.")}</h2>
        <p className="mt-3 text-sm leading-6 text-[#CEC8BD]">{t("Converse com seu histórico salvo e consulte discussões, vagas e materiais de apoio.")}</p>
        <Link href="/club/checkout" className="mt-4 inline-flex min-h-11 items-center font-semibold text-[#E88A6A] underline underline-offset-4">{t("Conhecer o plano Pro →")}</Link>
      </aside>
    </div>
  </main>
}
