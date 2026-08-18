import Link from 'next/link'

type LegalOpsProduct = 'work' | 'club' | 'dev'

const products: Array<{
  key: LegalOpsProduct
  domain: string
  role: string
  description: string
  href: string
}> = [
  {
    key: 'work',
    domain: 'legalops.work',
    role: 'vagas',
    description: 'Encontre oportunidades para trabalhar e crescer no jurídico.',
    href: 'https://legalops.work',
  },
  {
    key: 'club',
    domain: 'legalops.club',
    role: 'comunidade',
    description: 'Encontre pessoas, conversas e repertório para operar melhor.',
    href: 'https://legalops.club',
  },
  {
    key: 'dev',
    domain: 'legalops.dev',
    role: 'construir',
    description: 'Aprenda a construir automações, integrações e produtos para o jurídico.',
    href: 'https://legalops.dev',
  },
]

export function LegalOpsEcosystem({ active }: { active: LegalOpsProduct }) {
  return (
    <section className="border-y border-[#111111] bg-[#111111] text-white" aria-label="Ecossistema LegalOps">
      <div className="mx-auto grid max-w-[1180px] md:grid-cols-[190px_repeat(3,1fr)]">
        <div className="flex items-center border-b border-white/10 px-5 py-5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/50 sm:px-8 md:border-b-0 md:border-r">
          ecossistema legalops
        </div>
        {products.map(product => {
          const isActive = product.key === active
          return (
            <Link
              key={product.key}
              href={product.href}
              className={`group border-b border-white/10 px-5 py-4 transition last:border-b-0 sm:px-8 md:border-b-0 md:border-r md:last:border-r-0 ${isActive ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className={`font-[var(--font-quicksand)] text-sm font-semibold ${isActive ? 'text-white' : 'text-white/75'}`}>
                  {product.domain}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#E88A6A]">{product.role}</span>
              </div>
              <p className="mt-1.5 text-[11px] leading-4 text-white/45 transition group-hover:text-white/65">
                {product.description}
              </p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
