import type { Metadata } from 'next'
import { LocaleProvider } from '@/lib/i18n'
import './globals.css'

export const metadata: Metadata = {
  title: 'LegalOps',
  description: 'Track your job search, outreach, and application pipeline in one place.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  )
}
