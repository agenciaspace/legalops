'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

export function ClubWelcomeNotice() {
  const started = useRef(false)
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const send = useCallback(async () => {
    setState('sending')
    try {
      const response = await fetch('/api/auth/welcome', { method: 'POST' })
      if (!response.ok) throw new Error('welcome unavailable')
      const result = await response.json()
      setState(result.clubSent ? 'sent' : 'idle')
    } catch { setState('failed') }
  }, [])
  useEffect(() => {
    if (started.current) return
    started.current = true
    void send()
  }, [send])
  if (state === 'idle' || state === 'sending') return null
  return <div role="status" className="mx-4 mt-4 rounded-lg border border-[#CEC8BD] bg-white px-4 py-3 text-xs leading-5 text-[#625E59]">
    {state === 'sent' ? 'Boas-vindas enviadas para seu email, com o convite do WhatsApp.' : <><span>Não conseguimos enviar as boas-vindas por email. O convite do WhatsApp continua disponível no início da comunidade.</span><button onClick={() => void send()} className="ml-2 inline-flex min-h-11 items-center font-bold text-[#D9470F] underline">Tentar enviar novamente</button></>}
  </div>
}
