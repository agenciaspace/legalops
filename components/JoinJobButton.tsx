'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function JoinJobButton({ jobId }: { jobId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  async function join() {
    setLoading(true)
    setError(false)
    const response = await fetch('/api/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId, status: 'researching' }),
    })
    const data = await response.json().catch(() => ({}))
    setLoading(false)
    if (!response.ok || !data.entry?.id) {
      setError(true)
      return
    }
    router.push(`/jobs/${data.entry.id}`)
    router.refresh()
  }

  return (
    <div className="mt-3">
      <button onClick={join} disabled={loading} className="w-full rounded-lg bg-[#FF5C1A] px-3 py-2.5 text-[10px] font-extrabold text-white hover:bg-[#E84D10] disabled:opacity-60">
        {loading ? 'Criando seu CV...' : 'Quero participar'}
      </button>
      {error ? <p className="mt-1.5 text-[9px] text-red-700">Não foi possível adicionar agora. Tente novamente.</p> : null}
    </div>
  )
}
