'use client'

import { useState } from 'react'
import { useLocale } from '@/components/LocaleProvider'

interface InterviewPrepSectionProps {
  entryId: string
}

export function InterviewPrepSection({ entryId }: InterviewPrepSectionProps) {
  const [prep, setPrep] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t } = useLocale()

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/ai/interview-prep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry_id: entryId }),
    })
    if (res.ok) {
      const data = await res.json()
      setPrep(data.prep)
    } else {
      setError(t.interviewPrep.error)
    }
    setLoading(false)
  }

  if (!prep && !loading) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <p className="text-sm text-slate-600 font-medium mb-1">{t.interviewPrep.title}</p>
        <p className="text-xs text-slate-400 mb-3">{t.interviewPrep.description}</p>
        <button
          onClick={handleGenerate}
          className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
        >
          {t.interviewPrep.generate}
        </button>
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-3" />
        <p className="text-sm text-slate-500">{t.interviewPrep.generating}</p>
        <p className="text-xs text-slate-400 mt-1">{t.interviewPrep.generatingHint}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-green-600 font-medium">{t.interviewPrep.success}</span>
        <button
          onClick={handleGenerate}
          className="text-xs text-purple-600 hover:underline"
        >
          {t.interviewPrep.regenerate}
        </button>
      </div>
      <div
        className="prose prose-sm max-w-none text-slate-700 [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-medium [&_p]:text-sm [&_li]:text-sm [&_strong]:text-slate-900"
        dangerouslySetInnerHTML={{ __html: formatMarkdown(prep!) }}
      />
    </div>
  )
}

function formatMarkdown(text: string): string {
  return text
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.*$)/gm, '<li>$2</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
}
