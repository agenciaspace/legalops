import type { Metadata } from 'next'
import { PricingPage } from '@/components/PricingPage'

export const metadata: Metadata = {
  title: 'Pricing — LegalOps',
  description:
    'Plans for every stage of your Legal Ops career. Start free, upgrade when you are ready.',
}

export default function EnglishPricing() {
  return <PricingPage locale="en" />
}
