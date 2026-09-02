'use client'

import { useState } from 'react'
import type { PersonalizedCv } from '@/lib/types'

const trackLabels: Record<PersonalizedCv['job_track'], string> = {
  technical: 'Técnica',
  strategic: 'Estratégica',
  hybrid: 'Técnica + estratégica',
  operational: 'Operacional',
}

export function PersonalizedCvSection({ entryId, initialCv }: { entryId: string; initialCv: PersonalizedCv | null }) {
  const [cv, setCv] = useState(initialCv)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(false)

  async function regenerate() {
    setLoading(true)
    setError(false)
    const response = await fetch(`/api/pipeline/${entryId}/cv`, { method: 'POST' })
    const data = await response.json().catch(() => ({}))
    setLoading(false)
    if (!response.ok || !data.cv) {
      setError(true)
      return
    }
    setCv(data.cv)
  }

  async function copy() {
    if (!cv?.markdown) return
    await navigator.clipboard.writeText(cv.markdown)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  function download() {
    if (!cv?.markdown) return
    const blob = new Blob([cv.markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'cv-personalizado.md'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="rounded-2xl border border-[#FF6A00]/20 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#FF6A00]">CV personalizado para esta vaga</p>
          <h2 className="mt-1 text-base font-bold text-[#1A1A1A]">{cv?.headline ?? 'Preparar currículo'}</h2>
          {cv ? <p className="mt-1 text-xs text-[#1A1A1A]/60">Ênfase {trackLabels[cv.job_track].toLowerCase()} · sem inventar experiências</p> : null}
        </div>
        <button onClick={regenerate} disabled={loading} className="rounded-xl border border-[#1A1A1A]/15 px-3 py-2 text-xs font-semibold text-[#1A1A1A]/70 disabled:opacity-50">
          {loading ? 'Gerando...' : cv ? 'Gerar nova versão' : 'Gerar CV'}
        </button>
      </div>
      {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">Não foi possível gerar agora.</p> : null}
      {cv?.markdown ? (
        <>
          <div className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-[#F7F6F2] p-4 text-xs leading-5 text-[#34322F]">{cv.markdown}</div>
          <div className="mt-3 flex gap-2">
            <button onClick={copy} className="rounded-xl bg-[#1A1A1A] px-3 py-2 text-xs font-bold text-white">{copied ? 'Copiado' : 'Copiar'}</button>
            <button onClick={download} className="rounded-xl border border-[#1A1A1A]/15 px-3 py-2 text-xs font-semibold">Baixar .md</button>
          </div>
        </>
      ) : <p className="mt-3 text-xs text-[#1A1A1A]/60">Use seu perfil e o texto da vaga para criar uma versão alinhada ao tipo de posição.</p>}
    </section>
  )
}
