import { BrandWordmark } from './BrandLogo'

type Props = {
  product: 'work' | 'chat'
  label: string
  description: string
  navigation: { href: string; label: string }[]
  action: { href: string; label: string }
  communityLabel?: string
}

export function ProductMasthead({ product, label, description, navigation, action, communityLabel = 'Comunidade' }: Props) {
  return <header className="product-masthead"><div className="brand-container">
    <div className="product-masthead-top"><span>{label}</span><a href="https://legalops.club">{communityLabel} ↗</a></div>
    <div className="product-masthead-name"><a href="/" aria-label={`legalops.${product}`}><BrandWordmark suffix={product} className="inline-flex items-baseline leading-none" /></a><p>{description}</p></div>
    <div className="product-masthead-nav"><nav aria-label={`Navegação do ${product}`}>{navigation.map(link=><a key={link.href} href={link.href}>{link.label}</a>)}</nav><a href={action.href} className="brand-action">{action.label} <span aria-hidden="true">↗</span></a></div>
  </div></header>
}
