import type { Metadata } from 'next'
import { LandingPage } from '@/components/LandingPage'

export const metadata: Metadata = {
  title: 'LegalOps | Find and track Legal Ops jobs for free',
  description:
    'Find Legal Ops, CLM, and legal operations roles, apply, track statuses, and manage your pipeline for free. Upgrade to Pro only if you want AI-powered extras and stronger outreach.',
}

export const revalidate = 60

export default function EnglishHome() {
  return <LandingPage locale="en" />
}
