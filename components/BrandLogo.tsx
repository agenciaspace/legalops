import Image from 'next/image'

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
    <Image
      src="/logo.svg"
      alt="LegalOps"
      width={40}
      height={40}
      className={className ?? 'h-10 w-10'}
    />
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
      <BrandMark className={markClassName ?? 'h-10 w-10'} />
      <div>
        <div className={titleClassName ?? 'font-display text-sm font-bold tracking-[0.18em] text-slate-950 uppercase'}>
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
