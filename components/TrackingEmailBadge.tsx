'use client'

import { useState } from 'react'

interface TrackingEmailBadgeProps {
  trackingEmail: string
  customEmail?: string | null
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="text-xs font-medium flex-shrink-0 transition-colors hover:opacity-80"
    >
      {copied ? 'Copiado!' : 'Copiar'}
    </button>
  )
}

export function TrackingEmailBadge({ trackingEmail, customEmail }: TrackingEmailBadgeProps) {
  return (
    <div className="space-y-1.5">
      {/* Custom email (tier 2) — shown first when available */}
      {customEmail && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <span className="text-xs text-blue-600 font-medium flex-shrink-0">E-mail pessoal</span>
          <code className="text-xs text-blue-900 bg-blue-100 rounded px-1.5 py-0.5 truncate">
            {customEmail}
          </code>
          <span className="text-blue-600"><CopyButton text={customEmail} /></span>
        </div>
      )}

      {/* Random email (tier 1) */}
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        <span className="text-xs text-amber-600 font-medium flex-shrink-0">
          {customEmail ? 'E-mail anonimo' : 'E-mail da vaga'}
        </span>
        <code className="text-xs text-amber-900 bg-amber-100 rounded px-1.5 py-0.5 truncate">
          {trackingEmail}
        </code>
        <span className="text-amber-600"><CopyButton text={trackingEmail} /></span>
      </div>
    </div>
  )
}
