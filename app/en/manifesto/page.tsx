import type { Metadata } from 'next'
import { ManifestoPage } from '@/components/ManifestoPage'

export const metadata: Metadata = {
  title: 'Manifesto — LegalOps',
  description:
    'Why we built the platform Legal Ops deserved from day one.',
}

export default function EnglishManifesto() {
  return <ManifestoPage locale="en" />
}
