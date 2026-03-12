'use client'

import { useState } from 'react'

interface TrackingEmailBadgeProps {
  email: string
}

export function TrackingEmailBadge({ email }: TrackingEmailBadgeProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
      <span className="text-xs text-amber-600 font-medium flex-shrink-0">E-mail da vaga</span>
      <code className="text-xs text-amber-900 bg-amber-100 rounded px-1.5 py-0.5 truncate">
        {email}
      </code>
      <button
        onClick={handleCopy}
        className="text-xs text-amber-600 hover:text-amber-800 font-medium flex-shrink-0 transition-colors"
      >
        {copied ? 'Copiado!' : 'Copiar'}
      </button>
    </div>
  )
}
