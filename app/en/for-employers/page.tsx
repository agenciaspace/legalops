import type { Metadata } from 'next'
import { ForEmployersPage } from '@/components/ForEmployersPage'

export const metadata: Metadata = {
  title: 'LegalOps | For Employers — Hire Legal Ops professionals',
  description:
    'Access the largest pool of talent specialized in legal operations. AI-powered matching. Pre-qualified and filtered candidates.',
}

export default function Page() {
  return <ForEmployersPage locale="en" />
}
