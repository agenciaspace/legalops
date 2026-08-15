interface BrandMarkProps {
  className?: string
}

interface BrandWordmarkProps {
  className?: string
  suffix?: 'club' | 'work'
  accentClassName?: string
}

interface BrandLogoProps {
  className?: string
  markClassName?: string
  subtitle?: string
  subtitleClassName?: string
  titleClassName?: string
  suffix?: 'club' | 'work'
}

const brandFont = {
  fontFamily: 'ui-rounded, "Avenir Next Rounded", "Nunito", "Quicksand", system-ui, sans-serif',
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 80 48"
      fill="none"
      aria-hidden="true"
      className={className ?? 'h-10 w-auto'}
    >
      <path
        d="M7 24c0-8.4 6.3-14.5 14.2-14.5 9.1 0 14.1 14.5 18.8 14.5S49.7 9.5 58.8 9.5C66.7 9.5 73 15.6 73 24s-6.3 14.5-14.2 14.5C49.7 38.5 44.7 24 40 24S30.3 38.5 21.2 38.5C13.3 38.5 7 32.4 7 24Z"
        stroke="currentColor"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="76" cy="38" r="3.2" fill="#E86A4A" />
    </svg>
  )
}

export function BrandWordmark({
  className,
  suffix = 'club',
  accentClassName,
}: BrandWordmarkProps) {
  return (
    <span
      className={className ?? 'text-[22px] font-medium leading-none tracking-[-0.055em] text-[#111827]'}
      style={brandFont}
    >
      legalops<span className={accentClassName ?? 'text-[#E86A4A]'}>.</span>{suffix}
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
      <BrandMark className={markClassName ?? 'h-9 w-auto text-[#111827]'} />
      <div>
        <BrandWordmark
          suffix={suffix}
          className={titleClassName ?? 'text-[22px] font-medium leading-none tracking-[-0.055em] text-[#111827]'}
        />
        {subtitle ? (
          <div className={subtitleClassName ?? 'mt-1 text-xs text-[#111827]/55'}>
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  )
}
