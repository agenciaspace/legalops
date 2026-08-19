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
const BRAND_WORDMARK_FONT = 'var(--font-quicksand), Quicksand, ui-rounded, sans-serif'
const BRAND_WORDMARK_WEIGHT = 600
const BRAND_WORDMARK_TRACKING = '-0.055em'

// Legacy symbol kept only for backwards compatibility with internal screens.
// Public brand surfaces should use BrandWordmark instead.
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
  const wrapperClass = className ?? `inline-flex items-baseline text-[24px] leading-none ${inverse ? 'text-white' : 'text-[#111111]'}`

  return (
    <span
      className={wrapperClass}
      style={{
        fontFamily: BRAND_WORDMARK_FONT,
        fontWeight: BRAND_WORDMARK_WEIGHT,
        letterSpacing: BRAND_WORDMARK_TRACKING,
      }}
      aria-label={`legalops.${suffix}`}
    >
      <span>legalops</span>
      <span className={accentClassName ?? 'text-[#E88A6A]'}>.</span>
      <span>{suffix}</span>
    </span>
  )
}

export function BrandLogo({
  className,
  subtitle,
  subtitleClassName,
  titleClassName,
  suffix = 'club',
}: BrandLogoProps) {
  return (
    <div className={className ?? 'flex items-center'}>
      <div>
        <BrandWordmark suffix={suffix} className={titleClassName ?? 'inline-flex items-baseline text-[24px] leading-none text-[#111111]'} />
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
