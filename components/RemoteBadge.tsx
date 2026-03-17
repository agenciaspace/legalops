'use client'

import { useI18n } from '@/lib/i18n'
import type { RemoteReality } from '@/lib/types'

const CLASS_MAP: Record<RemoteReality, string> = {
  fully_remote: 'bg-green-100 text-green-800',
  remote_with_travel: 'bg-blue-100 text-blue-800',
  hybrid_disguised: 'bg-yellow-100 text-yellow-800',
  onsite: 'bg-slate-100 text-slate-600',
  unknown: 'bg-slate-100 text-slate-500',
}

export function RemoteBadge({ reality }: { reality: RemoteReality }) {
  const { t } = useI18n()

  const LABEL_MAP: Record<RemoteReality, string> = {
    fully_remote: t.remote.fullyRemote,
    remote_with_travel: t.remote.remoteTravel,
    hybrid_disguised: t.remote.hybrid,
    onsite: t.remote.onsite,
    unknown: t.remote.unknown,
  }

  const className = CLASS_MAP[reality] ?? CLASS_MAP.unknown
  const label = LABEL_MAP[reality] ?? LABEL_MAP.unknown

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
