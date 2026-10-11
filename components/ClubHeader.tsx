import Link from 'next/link'
import { BrandWordmark } from '@/components/BrandLogo'

type PublicArea = 'communities' | 'jobs' | 'employers' | 'about'
type PublicLocale = 'pt' | 'en'

const labels = {
  pt: {
    club: 'comunidade',
    work: 'vagas',
    dev: 'open source',
    login: 'Entrar',
  },
  en: {
    club: 'community',
    work: 'jobs',
    dev: 'open source',
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
    <header className="sticky top-0 z-50 border-b border-[#CEC8BD] bg-[#F5F1E8]">
      <div className="brand-container flex min-h-[72px] items-center justify-between gap-4">
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

        <nav className="flex min-w-0 items-center gap-2" aria-label={locale === 'pt' ? 'Ecossistema LegalOps' : 'LegalOps ecosystem'}>
          {items.map(item => {
            const selected = item.key === currentProduct
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={selected ? 'page' : undefined}
                className={`hidden min-h-11 items-center border-b-2 px-3 text-xs font-medium transition sm:inline-flex ${selected ? 'border-[#E88A6A] text-[#111111]' : 'border-transparent text-[#716B65] hover:border-[#CEC8BD] hover:text-[#111111]'}`}
              >
                {item.label}
              </Link>
            )
          })}
          <Link
            href={isWork ? '/login' : '/login?next=/community'}
            className="ml-2 inline-flex min-h-11 items-center text-sm font-medium hover:underline"
          >
            {copy.login} <span className="ml-2" aria-hidden="true">↗</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
