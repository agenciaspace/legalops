'use client'

import { useEffect, useState } from 'react'
import { companyLogoDisplayUrl } from '@/lib/company-logo'

function companyInitials(company: string): string {
  return company
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0]?.toLocaleUpperCase('pt-BR'))
    .join('') || '?'
}

export function CompanyLogo({
  company,
  logoUrl,
  className = 'h-10 w-10',
}: {
  company: string
  logoUrl?: string | null
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const resolvedLogoUrl = companyLogoDisplayUrl(company, logoUrl)

  useEffect(() => setFailed(false), [resolvedLogoUrl])

  if (resolvedLogoUrl && !failed) {
    return (
      <img
        src={resolvedLogoUrl}
        alt={`Logo da ${company}`}
        className={`${className} shrink-0 rounded-lg border border-[#CEC8BD] bg-white object-contain p-0.5`}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <span
      role="img"
      aria-label={`Iniciais da ${company}`}
      className={`${className} inline-flex shrink-0 items-center justify-center rounded-lg border border-[#CEC8BD] bg-[#EEE8DD] text-[10px] font-bold tracking-[0.04em] text-[#625E59]`}
    >
      {companyInitials(company)}
    </span>
  )
}
