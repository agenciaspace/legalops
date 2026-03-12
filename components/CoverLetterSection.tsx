'use client'

import { useState } from 'react'

interface CoverLetterSectionProps {
  entryId: string
}

export function CoverLetterSection({ entryId }: CoverLetterSectionProps) {
  const [letter, setLetter] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showBackground, setShowBackground] = useState(false)
  const [background, setBackground] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/ai/cover-letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entry_id: entryId,
        user_background: background || undefined,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      setLetter(data.letter)
      setShowBackground(false)
    } else {
      setError('Erro ao gerar carta. Tente novamente.')
    }
    setLoading(false)
  }

  async function handleCopy() {
    if (!letter) return
    await navigator.clipboard.writeText(letter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!letter && !loading) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-sm text-slate-600 font-medium mb-1">Cover Letter com IA</p>
        <p className="text-xs text-slate-400 mb-3">
          Gere uma carta de apresentacao personalizada para esta vaga.
        </p>

        {showBackground ? (
          <div className="text-left space-y-2 max-w-md mx-auto">
            <label className="block text-xs font-medium text-slate-600">
              Seu background (opcional - melhora a qualidade)
            </label>
            <textarea
              value={background}
              onChange={e => setBackground(e.target.value)}
              rows={4}
              placeholder="Ex: 5 anos de experiencia em Legal Ops, conhecimento em CLM (Ironclad), gestao de contratos, compliance..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleGenerate}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Gerar carta
              </button>
              <button
                onClick={() => setShowBackground(false)}
                className="px-4 py-2 text-slate-500 text-sm rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setShowBackground(true)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Gerar cover letter
            </button>
          </div>
        )}
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-3" />
        <p className="text-sm text-slate-500">Gerando cover letter com IA...</p>
        <p className="text-xs text-slate-400 mt-1">Isso pode levar alguns segundos.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-green-600 font-medium">Gerada com sucesso</span>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
          >
            {copied ? 'Copiada!' : 'Copiar'}
          </button>
          <button
            onClick={() => { setLetter(null); setShowBackground(true) }}
            className="text-xs text-indigo-600 hover:underline"
          >
            Regenerar
          </button>
        </div>
      </div>
      <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed border border-slate-200">
        {letter}
      </div>
    </div>
  )
}
