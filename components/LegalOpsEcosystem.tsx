import Link from 'next/link'

type LegalOpsProduct = 'work' | 'club' | 'dev'
type EcosystemLocale = 'pt' | 'en'

const products = {
  pt: [
    {
      key: 'club' as const,
      domain: 'legalops.club',
      role: 'comunidade',
      description: 'Pessoas, conversas e repertório para quem vive o jurídico.',
      href: 'https://legalops.club',
    },
    {
      key: 'work' as const,
      domain: 'legalops.work',
      role: 'vagas',
      description: 'Oportunidades para trabalhar e crescer no mercado jurídico.',
      href: 'https://legalops.work',
    },
    {
      key: 'dev' as const,
      domain: 'legalops.dev',
      role: 'construir',
      description: 'Projetos e guias para construir tecnologia para o jurídico.',
      href: 'https://legalops.dev',
    },
  ],
  en: [
    {
      key: 'club' as const,
      domain: 'legalops.club',
      role: 'community',
      description: 'People, conversations and practical legal operations knowledge.',
      href: 'https://legalops.club',
    },
    {
      key: 'work' as const,
      domain: 'legalops.work',
      role: 'jobs',
      description: 'Opportunities to work and grow across the legal market.',
      href: 'https://legalops.work',
    },
    {
      key: 'dev' as const,
      domain: 'legalops.dev',
      role: 'build',
      description: 'Projects and guides for building technology for legal.',
      href: 'https://legalops.dev',
    },
  ],
}

export function LegalOpsEcosystem({ active, locale = 'pt' }: { active: LegalOpsProduct; locale?: EcosystemLocale }) {
  const items = products[locale]

  return (
    <section className="border-y border-[#111111] bg-[#111111] text-white" aria-label={locale === 'pt' ? 'Ecossistema LegalOps' : 'LegalOps ecosystem'}>
      <div className="mx-auto grid max-w-[1180px] md:grid-cols-[170px_repeat(3,1fr)]">
        <div className="flex items-center border-b border-white/10 px-5 py-5 text-[9px] font-bold uppercase tracking-[0.16em] text-white/45 sm:px-8 md:border-b-0 md:border-r">
          {locale === 'pt' ? 'um ecossistema' : 'one ecosystem'}
        </div>
        {items.map(product => {
          const isActive = product.key === active
          return (
            <Link
              key={product.key}
              href={product.href}
              className={`group relative border-b border-white/10 px-5 py-5 transition last:border-b-0 sm:px-8 md:border-b-0 md:border-r md:last:border-r-0 ${isActive ? 'bg-white/[0.035]' : 'hover:bg-white/[0.025]'}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive ? <span className="absolute inset-x-0 top-0 h-[2px] bg-[#E88A6A]" /> : null}
              <div className="flex items-baseline justify-between gap-4">
                <span className={`font-[var(--font-quicksand)] text-sm font-semibold ${isActive ? 'text-white' : 'text-white/72'}`}>
                  {product.domain}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#E88A6A]">{product.role}</span>
              </div>
              <p className="mt-1.5 max-w-[260px] text-[11px] leading-4 text-white/42 transition group-hover:text-white/62">
                {product.description}
              </p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
