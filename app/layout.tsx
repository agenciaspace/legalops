import type { Metadata } from 'next'
import './globals.css'
import { getLocale } from '@/lib/get-locale'
import { getDictionary } from '@/lib/dictionaries'
import { LocaleProvider } from '@/components/LocaleProvider'

export const metadata: Metadata = {
  title: 'LegalOps',
  description: 'Track your job search, outreach, and application pipeline in one place.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const dictionary = getDictionary(locale)

  return (
    <html lang={locale === 'pt' ? 'pt-BR' : 'en'}>
      <body className="bg-slate-50 text-slate-900 antialiased">
        <LocaleProvider locale={locale} dictionary={dictionary}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  )
}
