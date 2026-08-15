import Link from 'next/link'
import { BrandWordmark } from '@/components/BrandLogo'

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
    <header className="sticky top-0 z-50 border-b border-[#DED7CC]/90 bg-[#F6F0E5]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-[1180px] items-center justify-between px-4 sm:px-8">
        <Link
          href={isWork ? '/' : '/club'}
          className="flex min-w-0 shrink items-center"
          aria-label={isWork ? 'legalops.work' : 'legalops.club'}
        >
          <BrandWordmark
            suffix={isWork ? 'work' : 'club'}
            className="text-[20px] font-medium leading-none tracking-[-0.055em] text-[#111827] sm:text-[24px]"
          />
        </Link>

        <nav className="ml-4 flex items-center gap-0.5 text-sm sm:gap-1" aria-label="Navegação principal">
          {items.map(item => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active === item.key ? 'page' : undefined}
              className={`${item.key === 'about' ? 'hidden lg:inline-flex' : item.key === 'communities' ? 'hidden md:inline-flex' : item.key === 'employers' ? 'hidden sm:inline-flex' : 'inline-flex'} rounded-full px-2.5 py-2 text-xs transition sm:px-3 sm:text-sm ${active === item.key ? 'bg-[#111827] font-semibold text-white' : 'text-[#5F625F] hover:bg-white/75 hover:text-[#111827]'}`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={isWork ? '/login' : '/login?next=/community'}
            className="ml-1 rounded-full border border-[#111827] bg-[#111827] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#252D3D] sm:px-4 sm:text-sm"
          >
            {copy.login}
          </Link>
        </nav>
      </div>
    </header>
  )
}
