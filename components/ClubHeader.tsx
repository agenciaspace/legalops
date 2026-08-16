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
    { key: 'communities', label: copy.communities, href: isWork ? 'https://legalops.club' : '/club' },
    { key: 'jobs', label: copy.jobs, href: isWork ? '/' : 'https://legalops.work' },
    { key: 'employers', label: copy.employers, href: isWork ? '/for-employers' : 'https://legalops.work/for-employers' },
    { key: 'about', label: copy.about, href: isWork ? 'https://legalops.club/club/about' : '/club/about' },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-[#CEC8BD]/75 bg-[#F5F1E8]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-4 sm:px-8">
        <Link
          href={isWork ? '/' : '/club'}
          className="flex min-w-0 shrink items-center"
          aria-label={isWork ? 'legalops.work' : 'legalops.club'}
        >
          <BrandWordmark
            suffix={isWork ? 'work' : 'club'}
            className="inline-flex items-baseline text-[22px] font-medium leading-none tracking-[-0.065em] text-[#111111] sm:text-[27px]"
          />
        </Link>

        <nav className="ml-4 flex items-center gap-0.5 font-[var(--font-inter)] text-sm sm:gap-1" aria-label="Navegação principal">
          {items.map(item => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active === item.key ? 'page' : undefined}
              className={`${item.key === 'about' ? 'hidden lg:inline-flex' : item.key === 'communities' ? 'hidden md:inline-flex' : item.key === 'employers' ? 'hidden sm:inline-flex' : 'inline-flex'} rounded-full px-2.5 py-2 text-xs transition sm:px-3 sm:text-sm ${active === item.key ? 'bg-[#111111] font-semibold text-white' : 'text-[#66615B] hover:bg-white/70 hover:text-[#111111]'}`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={isWork ? '/login' : '/login?next=/community'}
            className="ml-1 rounded-full bg-[#111111] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#2A2927] sm:px-4 sm:text-sm"
          >
            {copy.login}
          </Link>
        </nav>
      </div>
    </header>
  )
}
