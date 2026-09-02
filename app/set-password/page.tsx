'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BrandLogo } from '@/components/BrandLogo'
import { createClient } from '@/lib/supabase'

export default function SetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (password.length < 8 || password !== confirmation) {
      setError(password.length < 8 ? 'Use pelo menos 8 caracteres.' : 'As senhas não conferem.')
      return
    }
    setLoading(true)
    setError(null)
    const { error: updateError } = await createClient().auth.updateUser({ password })
    setLoading(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    const requested = new URLSearchParams(window.location.search).get('next')
    router.push(requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/onboard')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F1E8] p-4">
      <div className="w-full max-w-md">
        <BrandLogo suffix="club" className="mb-8 flex flex-col items-center" titleClassName="text-3xl font-semibold tracking-tight" subtitle="Ative seu acesso" />
        <form onSubmit={submit} className="space-y-4 rounded-[26px] border border-[#CEC8BD] bg-white p-7 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-[#111]">Crie sua senha</h1>
            <p className="mt-1 text-sm text-[#6D6761]">Depois vamos montar seu perfil para vagas e currículos personalizados.</p>
          </div>
          <input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Senha (mínimo 8 caracteres)" required className="w-full rounded-2xl border border-[#CEC8BD] px-4 py-3 text-sm outline-none focus:border-[#E88A6A]" />
          <input type="password" value={confirmation} onChange={event => setConfirmation(event.target.value)} placeholder="Repita a senha" required className="w-full rounded-2xl border border-[#CEC8BD] px-4 py-3 text-sm outline-none focus:border-[#E88A6A]" />
          {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}
          <button disabled={loading} className="w-full rounded-full bg-[#111] py-3 text-sm font-bold text-white disabled:opacity-50">{loading ? 'Salvando...' : 'Continuar'}</button>
        </form>
      </div>
    </main>
  )
}
