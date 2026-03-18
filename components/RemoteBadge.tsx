import type { RemoteReality } from '@/lib/types'

const CONFIG: Record<RemoteReality, { label: string; className: string }> = {
  fully_remote: { label: '100% Remote', className: 'bg-emerald-50 text-emerald-700' },
  remote_with_travel: { label: 'Remote + Travel', className: 'bg-[#FF6A00]/10 text-[#FF6A00]' },
  hybrid_disguised: { label: 'Hybrid (⚠ verify)', className: 'bg-amber-50 text-amber-700' },
  onsite: { label: 'On-site', className: 'bg-[#1A1A1A]/5 text-[#1A1A1A]/70' },
  unknown: { label: 'Remote?', className: 'bg-[#1A1A1A]/5 text-[#1A1A1A]/60' },
}

export function RemoteBadge({ reality }: { reality: RemoteReality }) {
  const { label, className } = CONFIG[reality] ?? CONFIG.unknown
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
