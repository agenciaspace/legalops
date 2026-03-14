'use client'

import type { PaidAgentSettings } from '@/lib/paid-agent-settings'
import type { PipelineStatus, UserTier } from '@/lib/types'
import { useLocale } from '@/components/LocaleProvider'

interface Props {
  entryId: string
  userTier: UserTier
  currentStage: PipelineStatus
  settings: PaidAgentSettings
}

export function PaidPlanAgentsSection({ userTier }: Props) {
  const { t } = useLocale()

  return (
    <div className="text-center py-6">
      <p className="text-sm text-slate-500">
        {userTier === 'free' ? t.paidAgents.proOnly : t.paidAgents.comingSoon}
      </p>
    </div>
  )
}
