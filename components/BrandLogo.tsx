interface BrandMarkProps {
  className?: string
}

interface BrandWordmarkProps {
  className?: string
  suffix?: 'club' | 'work' | 'dev'
  accentClassName?: string
  inverse?: boolean
}

interface BrandLogoProps {
  className?: string
  markClassName?: string
  subtitle?: string
  subtitleClassName?: string
  titleClassName?: string
  suffix?: 'club' | 'work' | 'dev'
}

const BRAND_INK = '#111111'
const BRAND_CORAL = '#E88A6A'

function BrandOpLigature({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 124 72"
      fill="none"
      aria-hidden="true"
      className={className}
      style={{ width: '1.55em', height: '1.05em', marginInline: '-0.06em -0.03em', transform: 'translateY(0.16em)' }}
    >
      <path d="M49 48C44 54 37 58 29 58C15 58 6 49 6 36C6 22 16 12 30 12C43 12 52 20 54 32" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
      <path d="M49 48L72 22" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
      <path d="M69 36C69 22 79 12 93 12C107 12 117 22 117 36C117 50 107 59 93 59C80 59 71 51 69 39M69 36V69" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg viewBox="0 0 144 104" fill="none" aria-hidden="true" className={className ?? 'h-12 w-auto'}>
      <path d="M58 68C51 77 41 82 30 82C13 82 4 70 4 53C4 34 17 21 35 21C51 21 63 31 66 46" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
      <path d="M58 68L86 35" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
      <path d="M82 53C82 34 95 21 113 21C131 21 143 34 143 53C143 71 131 83 113 83C96 83 84 72 82 56M82 53V98" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="116" cy="98" r="6.5" fill={BRAND_CORAL} />
    </svg>
  )
}

export function BrandWordmark({
  className,
  suffix = 'club',
  accentClassName,
  inverse = false,
}: BrandWordmarkProps) {
  const wrapperClass = className ?? 'inline-flex items-center text-[24px] font-medium leading-none text-[#111111]'
  const needsInverse = inverse || className?.includes('text-white')

  // The light-background Club wordmark is the traced vector from the approved artwork,
  // so the live site uses the selected logo itself rather than a font approximation.
  if (suffix === 'club' && !needsInverse) {
    return (
      <span className={wrapperClass} aria-label="legalops.club">
        <img
          src="/brand/legalops-club-wordmark.svg"
          alt=""
          aria-hidden="true"
          // The traced SVG only has a viewBox (no intrinsic width/height). An
          // auto width collapses to zero in the header; keep its 1068:203 ratio.
          style={{ height: '1em', width: '5.26em', display: 'block' }}
        />
      </span>
    )
  }

  return (
    <span
      className={wrapperClass}
      style={{ fontFamily: 'var(--font-quicksand), ui-rounded, sans-serif' }}
      aria-label={`legalops.${suffix}`}
    >
      <span>legal</span>
      <BrandOpLigature />
      <span>s</span>
      <span className={accentClassName ?? 'text-[#E88A6A]'}>.</span>
      <span>{suffix}</span>
    </span>
  )
}

export function BrandLogo({
  className,
  markClassName,
  subtitle,
  subtitleClassName,
  titleClassName,
  suffix = 'club',
}: BrandLogoProps) {
  return (
    <div className={className ?? 'flex items-center gap-3'}>
      <BrandMark className={markClassName ?? 'h-10 w-auto text-[#111111]'} />
      <div>
        <BrandWordmark suffix={suffix} className={titleClassName ?? 'inline-flex items-center text-[24px] font-medium leading-none text-[#111111]'} />
        {subtitle ? (
          <div className={subtitleClassName ?? 'mt-1 text-xs text-[#111111]/55'} style={{ fontFamily: 'var(--font-inter), sans-serif' }}>
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export const brandColors = {
  ink: BRAND_INK,
  coral: BRAND_CORAL,
  cream: '#F5F1E8',
  warmGray: '#CEC8BD',
  soft: '#E6DED0',
} as const
