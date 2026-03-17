import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LegalOps',
  description: 'Track your job search, outreach, and application pipeline in one place.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-white text-slate-900 antialiased">{children}</body>
    </html>
  )
}
