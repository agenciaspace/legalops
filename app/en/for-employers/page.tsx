import type { Metadata } from 'next'
import { ForEmployersPage } from '@/components/ForEmployersPage'

export const metadata: Metadata = {
  title: 'For Employers — LegalOps',
  description:
    'Hire the best Legal Ops professionals. AI-powered matching, pre-qualified candidates, and the largest specialized talent pool.',
}

export default function EnglishForEmployers() {
  return <ForEmployersPage locale="en" />
}
