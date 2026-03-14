'use client'

import type { PaidAgentSettings } from '@/lib/paid-agent-settings'
import type { UserTier, PipelineStatus } from '@/lib/types'

interface Props {
  entryId: string
  userTier: UserTier
  currentStage: PipelineStatus
  settings: PaidAgentSettings
}

export function PaidPlanAgentsSection({ userTier, settings }: Props) {
  if (userTier !== 'paid') {
    return (
      <p className="text-sm text-slate-500">
        Disponível no plano Pro. Faça upgrade para acessar agentes de IA.
      </p>
    )
  }

  const agents = [
    { label: 'Preparação de entrevista', enabled: settings.interviewPrepEnabled },
    { label: 'Cover letter', enabled: settings.coverLetterEnabled },
  ]

  return (
    <div className="space-y-2">
      {agents.map(agent => (
        <div key={agent.label} className="flex items-center justify-between text-sm">
          <span className="text-slate-700">{agent.label}</span>
          <span className={agent.enabled ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
            {agent.enabled ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      ))}
    </div>
  )
}
