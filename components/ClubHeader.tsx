import Link from 'next/link'
import { BrandWordmark } from '@/components/BrandLogo'

type PublicArea = 'communities' | 'jobs' | 'employers' | 'about'
type PublicLocale = 'pt' | 'en'

const labels = {
  pt: {
    club: 'club · comunidade',
    work: 'work · vagas',
    dev: 'dev · construir',
    login: 'Entrar',
  },
  en: {
    club: 'club · community',
    work: 'work · jobs',
    dev: 'dev · build',
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

  const items = [
    { key: 'club', label: copy.club, href: 'https://legalops.club', active: !isWork },
    { key: 'work', label: copy.work, href: 'https://legalops.work', active: isWork },
    { key: 'dev', label: copy.dev, href: 'https://legalops.dev', active: false },
  ] as const

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
            className="inline-flex items-baseline text-[22px] font-semibold leading-none tracking-[-0.055em] text-[#111111] sm:text-[27px]"
          />
        </Link>

        <nav className="ml-4 flex items-center gap-0.5 font-[var(--font-inter)] text-sm sm:gap-1" aria-label="Ecossistema LegalOps">
          {items.map(item => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={item.active ? 'page' : undefined}
              className={`${item.key === 'club' ? 'hidden md:inline-flex' : item.key === 'dev' ? 'hidden sm:inline-flex' : 'inline-flex'} rounded-full px-2.5 py-2 text-xs transition sm:px-3 ${item.active ? 'bg-[#111111] font-semibold text-white' : 'text-[#66615B] hover:bg-white/70 hover:text-[#111111]'}`}
            >
              <span className="hidden lg:inline">{item.label}</span>
              <span className="lg:hidden">{item.key}</span>
            </Link>
          ))}
          <Link
            href={isWork ? '/login' : '/login?next=/community'}
            className="ml-1 rounded-full bg-[#111111] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#2A2927] sm:px-4"
          >
            {copy.login}
          </Link>
        </nav>
      </div>
    </header>
  )
}
