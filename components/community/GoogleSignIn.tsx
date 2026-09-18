'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { googleReturnPath } from '@/lib/google-login'
// Uses only the Google OAuth client configured for this Supabase project.
export function GoogleSignIn() {
  const [available, setAvailable] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! }, signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(settings => setAvailable(settings?.external?.google === true))
      .catch(() => {})
    return () => controller.abort()
  }, [])
  async function signIn() {
    setBusy(true); setError('')
    try {
      const next = googleReturnPath(new URLSearchParams(window.location.search).get('next'))
      const { error } = await createClient().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`, scopes: 'openid email profile' } })
      if (error) throw error
    } catch {
      setError('Não foi possível entrar com Google. Tente novamente ou use email e senha.'); setBusy(false)
    }
  }
  if (!available) return null
  return <div className="space-y-3"><button type="button" disabled={busy} onClick={signIn} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#CEC8BD] bg-white px-4 py-3 text-sm font-semibold disabled:opacity-50"><span aria-hidden="true" className="text-lg font-bold">G</span>{busy ? 'Abrindo Google…' : 'Continuar com Google'}</button>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<p className="text-center text-xs text-[#69635E]">ou continue com email</p></div>
}
