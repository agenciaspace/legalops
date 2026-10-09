import Link from 'next/link'
import { BrandWordmark } from '@/components/BrandLogo'

type LegalOpsProduct = 'work' | 'club' | 'dev'
const products = [
  { key: 'club', pt: 'Converse e encontre outras pessoas do jurídico.', en: 'Meet people and discuss your work in legal.' },
  { key: 'work', pt: 'Encontre vagas e organize suas candidaturas.', en: 'Find jobs and organize your applications.' },
  { key: 'dev', pt: 'Use e contribua com projetos open source.', en: 'Use and contribute to open source projects.' },
] as const

export function LegalOpsEcosystem({ active, locale = 'pt', descriptions }: { active: LegalOpsProduct; locale?: 'pt' | 'en'; descriptions?: Partial<Record<LegalOpsProduct, string>> }) {
  return <section className="brand-ecosystem" aria-label={locale === 'pt' ? 'Ecossistema LegalOps' : 'LegalOps ecosystem'}>
    <div className="brand-container brand-ecosystem-grid">{products.map(product => <Link className="brand-ecosystem-link" key={product.key} href={`https://legalops.${product.key}`} aria-current={active === product.key ? 'page' : undefined}>
      <BrandWordmark suffix={product.key} className="inline-flex items-baseline text-lg leading-none" /><p>{descriptions?.[product.key] ?? product[locale]}</p>
    </Link>)}</div>
  </section>
}
