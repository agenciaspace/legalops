'use client'

import { useState, useTransition } from 'react'
import { Bot, Lock, Send, Sparkles } from 'lucide-react'
import { askCommunityAgent } from './actions'
import { getCommunityAgent } from '@/lib/community-agents'

export function CommunityAgentCard({ category, hasPaidAccess }: { category: string; hasPaidAccess: boolean }) {
  const agent = getCommunityAgent(category)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function submitQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setAnswer('')
    const formData = new FormData(event.currentTarget)
    startTransition(async () => {
      const result = await askCommunityAgent(formData)
      if (result.ok) {
        setAnswer(result.answer)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <section className="mb-4 overflow-hidden rounded-xl border border-[#D9D4C9] bg-[#FFFDF8]">
      <div className="flex items-start gap-3 border-b border-[#E9E4DA] px-4 py-4 sm:px-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#292825] text-[#FFB18F]">
          <Bot className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#D9470F]">Agente do espaço</p>
            <span className="rounded-full bg-[#EDE9E0] px-2 py-0.5 text-[8px] font-bold text-[#77746E]">{agent.name}</span>
          </div>
          <h2 className="mt-1 text-sm font-extrabold text-[#292824]">{agent.role}</h2>
          <p className="mt-1 text-[11px] leading-5 text-[#77746E]">{agent.description}</p>
        </div>
        <Sparkles className="h-4 w-4 shrink-0 text-[#FF5C1A]" />
      </div>

      {!hasPaidAccess ? (
        <div className="flex items-center gap-2 px-4 py-3 text-[10px] font-bold text-[#77746E] sm:px-5">
          <Lock className="h-3.5 w-3.5 text-[#AAA7A1]" /> Assistência dos agentes disponível para membros ativos.
        </div>
      ) : (
        <div className="p-4 sm:p-5">
          <form onSubmit={submitQuestion} className="flex flex-col gap-2 sm:flex-row">
            <input type="hidden" name="category" value={category} />
            <input
              name="question"
              value={question}
              onChange={event => setQuestion(event.target.value)}
              placeholder={`Pergunte ao ${agent.name} sobre este espaço…`}
              maxLength={2000}
              className="min-w-0 flex-1 rounded-lg border border-[#E2E1DD] bg-white px-3 py-2.5 text-xs outline-none placeholder:text-[#AAA8A2] focus:border-[#FFB99E]"
            />
            <button disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#292825] px-4 py-2.5 text-[10px] font-extrabold text-white transition hover:bg-[#FF5C1A] disabled:cursor-wait disabled:opacity-50">
              {isPending ? 'Pensando…' : 'Perguntar'} <Send className="h-3.5 w-3.5" />
            </button>
          </form>
          {error ? <p className="mt-2 text-[10px] font-bold text-[#B3412C]" role="alert">{error}</p> : null}
          {answer ? <div className="mt-4 whitespace-pre-wrap rounded-lg border-l-2 border-[#FF5C1A] bg-[#F7F5EF] px-3.5 py-3 text-xs leading-5 text-[#55524C]" role="status"><strong className="mb-1 block text-[9px] font-black uppercase tracking-[0.12em] text-[#D9470F]">{agent.name} responde</strong>{answer}</div> : null}
        </div>
      )}
    </section>
  )
}
