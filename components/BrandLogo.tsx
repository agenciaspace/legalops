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
      <path
        d="M16 4H10A4 4 0 0 0 6 8V30A4 4 0 0 0 10 34H30A4 4 0 0 0 34 30V28A4 4 0 0 0 30 24H18A2 2 0 0 1 16 22V8A4 4 0 0 0 12 4H16Z"
        className="fill-current"
      />
      <circle cx="27" cy="12" r="4" className="fill-current" />
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
