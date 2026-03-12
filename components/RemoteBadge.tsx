import type { RemoteReality } from '@/lib/types'

const CONFIG: Record<RemoteReality, { label: string; className: string }> = {
  fully_remote: { label: '100% Remote', className: 'bg-green-100 text-green-800' },
  remote_with_travel: { label: 'Remote + Travel', className: 'bg-blue-100 text-blue-800' },
  hybrid_disguised: { label: 'Hybrid (⚠ verify)', className: 'bg-yellow-100 text-yellow-800' },
  onsite: { label: 'On-site', className: 'bg-slate-100 text-slate-600' },
  unknown: { label: 'Remote?', className: 'bg-slate-100 text-slate-500' },
}

export function RemoteBadge({ reality }: { reality: RemoteReality }) {
  const { label, className } = CONFIG[reality] ?? CONFIG.unknown
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
