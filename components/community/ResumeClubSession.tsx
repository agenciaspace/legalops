'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export function ResumeClubSession() {
  useEffect(() => {
    let active = true, pending = false
    async function resume() {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
      // Keep deliberate deep links, such as the Pro offer, accessible in the app.
      if (!standalone || window.location.hash || pending) return
      pending = true
      try {
        const { data: { user } } = await createClient().auth.getUser()
        if (active && user) window.location.replace('/club/entrar')
      } catch { /* The existing sign-in screen remains usable when offline. */ }
      finally { pending = false }
    }
    void resume()
    window.addEventListener('pageshow', resume)
    return () => { active = false; window.removeEventListener('pageshow', resume) }
  }, [])
  return null
}
