import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Globe, ExternalLink } from 'lucide-react'
import { createServerClient } from '@supabase/ssr'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { BrandLogo } from '@/components/BrandLogo'
import type { RemoteReality } from '@/lib/types'

type LandingLocale = 'pt' | 'en'

const remoteLabels: Record<RemoteReality, string> = {
  fully_remote: '100% Remote',
  remote_with_travel: 'Remote + Travel',
  hybrid_disguised: 'Hybrid',
  onsite: 'On-site',
  unknown: '—',
}

const content = {
  pt: {
    languageHref: '/en',
    languageLabel: 'English',
    languageCompact: 'EN',
    signIn: 'Entrar',
    heroTitle: 'Vagas de Legal Ops',
    heroDescription: 'Busque, aplique e acompanhe vagas de Legal Ops, CLM e operações jurídicas.',
    heroPrimaryCta: 'Criar conta grátis',
    jobsTitle: 'Vagas recentes',
    jobsEmpty: 'Nenhuma vaga encontrada no momento.',
    tableHeaders: { title: 'Vaga', company: 'Empresa', remote: 'Remoto', salary: 'Salário' },
    closingTitle: 'Comece grátis. Decida depois.',
    closingPrimaryCta: 'Começar grátis',
    salaryUndisclosed: 'Não divulgado',
  },
  en: {
    languageHref: '/',
    languageLabel: 'Português',
    languageCompact: 'PT',
    signIn: 'Sign in',
    heroTitle: 'Legal Ops Jobs',
    heroDescription: 'Search, apply, and track Legal Ops, CLM, and legal operations jobs.',
    heroPrimaryCta: 'Create free account',
    jobsTitle: 'Recent jobs',
    jobsEmpty: 'No jobs found at the moment.',
    tableHeaders: { title: 'Role', company: 'Company', remote: 'Remote', salary: 'Salary' },
    closingTitle: 'Start free. Decide later.',
    closingPrimaryCta: 'Start free',
    salaryUndisclosed: 'Undisclosed',
  },
} as const

function formatSalary(min: number | null, max: number | null, currency: string | null, fallback: string): string {
  if (!min && !max) return fallback
  const cur = currency ?? ''
  if (min && max) return `${cur} ${min.toLocaleString()} – ${max.toLocaleString()}`
  return `${cur} ${(min ?? max)!.toLocaleString()}`
}

async function fetchPublicJobs() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceRoleKey || !supabaseUrl) return []

  const supabase = createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  })

  const { data } = await supabase
    .from('jobs')
    .select('id, title, company, url, remote_reality, salary_min, salary_max, salary_currency, created_at')
    .eq('enrichment_status', 'done')
    .order('created_at', { ascending: false })
    .limit(20)

  return data ?? []
}

export async function LandingPage({ locale }: { locale: LandingLocale }) {
  const copy = content[locale]
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  const jobs = await fetchPublicJobs()

  return (
    <div lang={locale === 'pt' ? 'pt-BR' : 'en'} className="min-h-screen bg-stone-50 text-slate-950">
      <header className="border-b border-stone-200 bg-stone-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href={locale === 'pt' ? '/' : '/en'}>
            <BrandLogo className="flex items-center gap-3" markClassName="h-10 w-10 text-slate-950" />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href={copy.languageHref}
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-3 py-2 text-sm text-slate-700 transition-colors hover:border-slate-950"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{copy.languageLabel}</span>
              <span className="sm:hidden">{copy.languageCompact}</span>
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-950 hover:text-slate-950"
            >
              {copy.signIn}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <section className="max-w-3xl">
          <h1
            className="text-5xl leading-tight text-slate-950 sm:text-6xl"
            style={{
              fontFamily:
                '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
            }}
          >
            {copy.heroTitle}
          </h1>

          <p className="mt-4 text-lg leading-8 text-slate-600">
            {copy.heroDescription}
          </p>

          <div className="mt-6">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              {copy.heroPrimaryCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mt-16">
          <h2
            className="text-3xl text-slate-950 sm:text-4xl"
            style={{
              fontFamily:
                '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
            }}
          >
            {copy.jobsTitle}
          </h2>

          {jobs.length > 0 ? (
            <div className="mt-6 overflow-hidden rounded-[20px] border border-stone-200 bg-white">
              <div className="hidden sm:grid sm:grid-cols-[2fr_1.2fr_1fr_1fr] gap-4 border-b border-stone-200 px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-400">
                <div>{copy.tableHeaders.title}</div>
                <div>{copy.tableHeaders.company}</div>
                <div>{copy.tableHeaders.remote}</div>
                <div>{copy.tableHeaders.salary}</div>
              </div>

              {jobs.map((job, index) => (
                <a
                  key={job.id}
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group grid gap-1 sm:gap-4 sm:grid-cols-[2fr_1.2fr_1fr_1fr] px-6 py-4 text-sm transition-colors hover:bg-stone-50 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'
                  }`}
                >
                  <div className="font-medium text-slate-900 flex items-center gap-2">
                    {job.title}
                    <ExternalLink className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-slate-600">{job.company}</div>
                  <div className="text-slate-500">{remoteLabels[job.remote_reality as RemoteReality] ?? '—'}</div>
                  <div className="text-slate-500">{formatSalary(job.salary_min, job.salary_max, job.salary_currency, copy.salaryUndisclosed)}</div>
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-500">{copy.jobsEmpty}</p>
          )}
        </section>

        <section className="mt-16 rounded-[24px] border border-stone-200 bg-white px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <h2
              className="text-3xl text-slate-950 sm:text-4xl"
              style={{
                fontFamily:
                  '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
              }}
            >
              {copy.closingTitle}
            </h2>

            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              {copy.closingPrimaryCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
