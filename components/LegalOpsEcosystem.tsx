import Link from 'next/link'
import { BrandWordmark } from '@/components/BrandLogo'

type LegalOpsProduct = 'work' | 'club' | 'dev' | 'news' | 'chat'
const products = [
  { key: 'club', pt: 'Converse e encontre outras pessoas do jurídico.', en: 'Meet people and discuss your work in legal.' },
  { key: 'work', pt: 'Encontre vagas e organize suas candidaturas.', en: 'Find jobs and organize your applications.' },
  { key: 'dev', pt: 'Use e contribua com ferramentas abertas.', en: 'Use and contribute to open source projects.' },
  { key: 'chat', pt: 'Converse com assistentes para o trabalho jurídico.', en: 'Work with legal assistants in one conversation.' },
  { key: 'news', pt: 'Acompanhe as mudanças no trabalho jurídico.', en: 'Follow changes in legal work.' },
] as const

export function LegalOpsEcosystem({ active, locale = 'pt', descriptions }: { active: LegalOpsProduct; locale?: 'pt' | 'en'; descriptions?: Partial<Record<LegalOpsProduct, string>> }) {
  return <section className="brand-ecosystem" aria-label={locale === 'pt' ? 'Ecossistema LegalOps' : 'LegalOps ecosystem'}>
    <div className="brand-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5">{products.map(product => <Link className="brand-ecosystem-link" key={product.key} href={`https://legalops.${product.key}`} aria-current={active === product.key ? 'page' : undefined}>
      <BrandWordmark suffix={product.key} className="inline-flex items-baseline text-lg leading-none" /><p>{descriptions?.[product.key] ?? product[locale]}</p>
    </Link>)}</div>
  </section>
}
