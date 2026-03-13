import type { Metadata } from 'next'
import { LandingPage } from '@/components/LandingPage'

export const metadata: Metadata = {
  title: 'LegalOps | Search, apply, and track jobs for free',
  description:
    'Search jobs, apply, track statuses, and manage your pipeline for free. Upgrade to Pro only if you want AI-powered extras and stronger outreach.',
}

export default function EnglishHome() {
  return <LandingPage locale="en" />
}
