import Link from 'next/link'
import { BrandWordmark } from '@/components/BrandLogo'

type PublicArea = 'communities' | 'jobs' | 'employers' | 'about'
type PublicLocale = 'pt' | 'en'

const labels = {
  pt: {
    club: 'comunidade',
    work: 'vagas',
    dev: 'construir',
    login: 'Entrar',
  },
  en: {
    club: 'community',
    work: 'jobs',
    dev: 'build',
    login: 'Sign in',
  },
} as const

export function ClubHeader({
  active,
  locale = 'pt',
  product,
}: {
  active?: PublicArea
  locale?: PublicLocale
  product?: 'club' | 'work'
}) {
  const isWork = product === 'work' || active === 'jobs' || active === 'employers'
  const currentProduct = isWork ? 'work' : 'club'
  const copy = labels[locale]

  const items = [
    { key: 'club', label: copy.club, href: 'https://legalops.club' },
    { key: 'work', label: copy.work, href: 'https://legalops.work' },
    { key: 'dev', label: copy.dev, href: 'https://legalops.dev' },
  ] as const

  return (
    <header className="sticky top-0 z-50 border-b border-[#CEC8BD] bg-[#F5F1E8]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href={isWork ? '/' : '/club'}
          className="min-w-0 shrink-0"
          aria-label={isWork ? 'legalops.work' : 'legalops.club'}
        >
          <BrandWordmark
            suffix={currentProduct}
            className="inline-flex items-baseline text-[22px] font-semibold leading-none tracking-[-0.055em] text-[#111111] sm:text-[27px]"
          />
        </Link>

        <nav className="flex min-w-0 items-center gap-1 font-[var(--font-inter)]" aria-label={locale === 'pt' ? 'Ecossistema LegalOps' : 'LegalOps ecosystem'}>
          {items.map(item => {
            const selected = item.key === currentProduct
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={selected ? 'page' : undefined}
                className={`border-b-2 px-2 py-2 text-[11px] font-semibold transition sm:px-3 sm:text-xs ${selected ? 'border-[#E88A6A] text-[#111111]' : 'border-transparent text-[#716B65] hover:border-[#CEC8BD] hover:text-[#111111]'}`}
              >
                <span className="hidden lg:inline">{item.key} / </span>{item.label}
              </Link>
            )
          })}
          <Link
            href={isWork ? '/login' : '/login?next=/community'}
            className="ml-1 rounded-lg bg-[#111111] px-3.5 py-2 text-[11px] font-semibold text-white transition hover:bg-[#2A2927] sm:px-4 sm:text-xs"
          >
            {copy.login}
          </Link>
        </nav>
      </div>
    </header>
  )
}
