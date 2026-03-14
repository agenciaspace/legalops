'use client'

import type { RemoteReality } from '@/lib/types'
import { useLocale } from '@/components/LocaleProvider'

const STYLE: Record<RemoteReality, string> = {
  fully_remote: 'bg-green-100 text-green-800',
  remote_with_travel: 'bg-blue-100 text-blue-800',
  hybrid_disguised: 'bg-yellow-100 text-yellow-800',
  onsite: 'bg-slate-100 text-slate-600',
  unknown: 'bg-slate-100 text-slate-500',
}

export function RemoteBadge({ reality }: { reality: RemoteReality }) {
  const { t } = useLocale()
  const className = STYLE[reality] ?? STYLE.unknown
  const label = t.remoteBadge[reality] ?? t.remoteBadge.unknown

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
