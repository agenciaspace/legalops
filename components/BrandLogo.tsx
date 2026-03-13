interface BrandMarkProps {
  className?: string
}

interface BrandLogoProps {
  className?: string
  markClassName?: string
  subtitle?: string
  subtitleClassName?: string
  titleClassName?: string
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={className ?? 'h-10 w-10'}
    >
      <rect x="4.5" y="4.5" width="31" height="31" rx="10" className="stroke-current" strokeWidth="2.5" />
      <path d="M14 11.5v17h11" className="stroke-current" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="27" cy="13" r="2.5" className="fill-current" />
    </svg>
  )
}

export function BrandLogo({
  className,
  markClassName,
  subtitle,
  subtitleClassName,
  titleClassName,
}: BrandLogoProps) {
  return (
    <div className={className ?? 'flex items-center gap-3'}>
      <BrandMark className={markClassName ?? 'h-10 w-10 text-slate-950'} />
      <div>
        <div className={titleClassName ?? 'text-sm font-semibold tracking-[0.22em] text-slate-950 uppercase'}>
          LegalOps
        </div>
        {subtitle ? (
          <div className={subtitleClassName ?? 'text-sm text-slate-500'}>
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  )
}
