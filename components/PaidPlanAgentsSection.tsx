'use client'

import type { PaidAgentSettings } from '@/lib/paid-agent-settings'
import type { PipelineStatus, UserTier } from '@/lib/types'

interface Props {
  entryId: string
  userTier: UserTier
  currentStage: PipelineStatus
  settings: PaidAgentSettings
}

export function PaidPlanAgentsSection({ userTier, settings }: Props) {
  if (userTier === 'free') {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="text-sm text-slate-600 font-medium mb-1">Agentes especializados</p>
        <p className="text-xs text-slate-400 mb-3">
          Disponível no plano Pro. Agentes de IA para outreach, análise de fit e estratégia de candidatura.
        </p>
        <a
          href="/login"
          className="inline-block px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
        >
          Upgrade para Pro
        </a>
      </div>
    )
  }

  const agents = [
    {
      key: 'outreach_enabled',
      label: 'Agente de Outreach',
      description: 'Gera mensagens personalizadas para contatos da empresa.',
      enabled: settings.outreach_enabled,
    },
    {
      key: 'interview_prep_enabled',
      label: 'Agente de Entrevista',
      description: 'Prepara perguntas e respostas customizadas para a vaga.',
      enabled: settings.interview_prep_enabled,
    },
    {
      key: 'cover_letter_enabled',
      label: 'Agente de Cover Letter',
      description: 'Escreve cartas de apresentação alinhadas ao perfil da empresa.',
      enabled: settings.cover_letter_enabled,
    },
  ]

  return (
    <div className="space-y-3">
      {agents.map(agent => (
        <div
          key={agent.key}
          className={`flex items-start gap-3 p-3 rounded-lg border ${
            agent.enabled ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'
          }`}
        >
          <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800">{agent.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{agent.description}</p>
          </div>
          {!agent.enabled && (
            <span className="text-xs text-slate-400 flex-shrink-0">Desativado</span>
          )}
        </div>
      ))}
    </div>
  )
}
