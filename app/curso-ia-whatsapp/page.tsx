import type { Metadata } from 'next'
import { CourseLandingPage } from '@/components/CourseLandingPage'

export const metadata: Metadata = {
  title: 'IA no WhatsApp, do zero ao assistente funcional | LegalOps',
  description: 'Aula prática sobre como construir um assistente de IA no WhatsApp com Termius, Supabase, Hostinger e um provider de IA.',
}

export default function CoursePage() {
  return <CourseLandingPage />
}
