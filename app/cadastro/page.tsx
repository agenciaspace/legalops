'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { BrandWordmark } from '@/components/BrandLogo'

export default function ClubSignupPage() {
  const router = useRouter()
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true)
    const form = new FormData(event.currentTarget)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: String(form.get('email')).trim(), password: String(form.get('password')),
        options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=/club/entrar` },
      })
      if (error) { setError('Não foi possível criar a conta. Confira os dados ou tente entrar se já tiver cadastro.'); return }
      if (data.session) { router.push('/club/entrar'); router.refresh() } else setSent(true)
    } catch { setError('Não foi possível conectar. Tente novamente em alguns instantes.') }
    finally { setBusy(false) }
  }
  return <main className="min-h-screen bg-[#F5F1E8] px-5 py-12 text-[#111111] sm:py-20">
    <div className="mx-auto max-w-lg">
      <Link href="/club" aria-label="legalops.club"><BrandWordmark suffix="club" className="text-3xl" /></Link>
      <h1 className="mt-10 font-[var(--font-quicksand)] text-4xl font-semibold tracking-tight">crie sua conta<span className="text-[#E88A6A]">.</span></h1>
      <p className="mt-4 text-sm leading-7 text-[#69635E]">A comunidade é gratuita para quem tem relação com o trabalho jurídico. Depois de confirmar seu email, complete o perfil com LinkedIn, atuação e assuntos de interesse.</p>
      {sent ? <section role="status" className="mt-8 border-y border-[#CEC8BD] py-6"><h2 className="font-semibold">Confira seu email</h2><p className="mt-3 text-sm leading-6">Abra o link de confirmação para continuar o cadastro. Se você já tem conta, entre com sua senha.</p><Link href="/login?next=/club/entrar" className="mt-5 inline-block text-sm font-semibold underline">Entrar na minha conta</Link></section>
      : <form onSubmit={submit} className="mt-8 space-y-5">
        <label className="block text-sm font-semibold">Email<input name="email" type="email" autoComplete="email" required maxLength={254} className="mt-2 w-full rounded-lg border border-[#CEC8BD] bg-[#FAF7F1] px-4 py-3 font-normal" /></label>
        <label className="block text-sm font-semibold">Senha<input name="password" type="password" autoComplete="new-password" required minLength={10} maxLength={128} aria-describedby="password-help" className="mt-2 w-full rounded-lg border border-[#CEC8BD] bg-[#FAF7F1] px-4 py-3 font-normal" /></label>
        <p id="password-help" className="text-xs text-[#69635E]">Use pelo menos 10 caracteres.</p>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-[#111111] px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Criando conta…' : 'Criar conta gratuita'}</button>
        <p className="text-sm text-[#69635E]">Já tem conta? <Link href="/login?next=/club/entrar" className="font-semibold underline">Entrar</Link></p>
      </form>}
      <p className="mt-8 border-t border-[#CEC8BD] pt-5 text-xs leading-6 text-[#69635E]">O Pro é opcional: agente pessoal e integrações com Work e Dev estão em preparação. Não é preciso contratar Pro para participar da comunidade.</p>
    </div>
  </main>
}
