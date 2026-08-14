import Link from 'next/link'
import { BrandMark } from '@/components/BrandLogo'

type PublicArea = 'communities' | 'jobs' | 'employers' | 'about'
type PublicLocale = 'pt' | 'en'

const labels = {
  pt: {
    communities: 'Comunidades',
    jobs: 'Vagas',
    employers: 'Empresas',
    about: 'Sobre',
    login: 'Entrar',
  },
  en: {
    communities: 'Communities',
    jobs: 'Jobs',
    employers: 'Employers',
    about: 'About',
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
  const copy = labels[locale]

  const items: Array<{ key: PublicArea; label: string; href: string }> = [
    {
      key: 'communities',
      label: copy.communities,
      href: isWork ? 'https://legalops.club' : '/club',
    },
    {
      key: 'jobs',
      label: copy.jobs,
      href: isWork ? '/' : 'https://legalops.work',
    },
    {
      key: 'employers',
      label: copy.employers,
      href: isWork ? '/for-employers' : 'https://legalops.work/for-employers',
    },
    {
      key: 'about',
      label: copy.about,
      href: isWork ? 'https://legalops.club/club/about' : '/club/about',
    },
  ]

  return (
    <header className="border-b border-[#E4E4E0] bg-white">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-3 sm:px-8">
        <Link
          href={isWork ? '/' : '/club'}
          className="flex shrink-0 items-center gap-2.5"
          aria-label={isWork ? 'LegalOps Work' : 'LegalOps Club'}
        >
          <BrandMark className="h-8 w-8 text-[#20201D]" />
          <span className="hidden text-[13px] font-bold tracking-[0.07em] text-[#20201D] sm:inline">
            LEGALOPS <span className="text-[#E45220]">{isWork ? 'WORK' : 'CLUB'}</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm sm:gap-2" aria-label="Navegação principal">
          {items.map(item => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active === item.key ? 'page' : undefined}
              className={`${item.key === 'about' ? 'hidden lg:inline-flex' : item.key === 'communities' ? 'hidden min-[360px]:inline-flex' : 'inline-flex'} rounded-md px-1.5 py-2 text-xs sm:px-3 sm:text-sm ${active === item.key ? 'bg-[#F0F0ED] font-semibold text-[#20201D]' : 'text-[#686863] hover:bg-[#F5F5F2] hover:text-[#20201D]'}`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={isWork ? '/login' : '/login?next=/community'}
            className="rounded-md border border-[#D8D8D4] bg-white px-2.5 py-2 text-xs font-semibold text-[#20201D] shadow-sm hover:bg-[#F7F7F5] sm:px-4"
          >
            {copy.login}
          </Link>
        </nav>
      </div>
    </header>
  )
}
