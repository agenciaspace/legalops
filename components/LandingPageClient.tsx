'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Globe, ExternalLink, Search, ChevronDown } from 'lucide-react'
import { BrandMark } from '@/components/BrandLogo'
import { TypingText } from '@/components/TypingText'
import { formatSalary as formatSalaryUtil } from '@/lib/format-salary'
import type { RemoteReality, UrlStatus } from '@/lib/types'

type LandingLocale = 'pt' | 'en'

export interface LandingJob {
  id: string
  title: string
  company: string
  url: string
  remote_reality: string | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  url_status: string | null
  created_at: string
}

const remoteLabels: Record<RemoteReality, string> = {
  fully_remote: '100% Remote',
  remote_with_travel: 'Remote + Travel',
  hybrid_disguised: 'Hybrid',
  onsite: 'On-site',
  unknown: '—',
}

const content = {
  pt: {
    signIn: 'Entrar',
    heroTitle: 'A plataforma de Legal Ops',
    heroDescription: 'A rede profissional para quem constrói operações jurídicas. Vagas curadas, match com IA, e a maior comunidade de Legal Ops do mercado.',
    heroPrimaryCta: 'Criar conta grátis',
    heroSecondaryCta: 'Para Empresas',
    heroSecondaryHref: '/for-employers',
    jobsTitle: 'Vagas recentes',
    jobsSubtitle: 'Pesquise vagas de Legal Ops direto aqui. Clique em qualquer vaga para ver detalhes.',
    jobsEmpty: 'Nenhuma vaga encontrada no momento.',
    tableHeaders: { title: 'Vaga', company: 'Empresa', remote: 'Remoto', salary: 'Salário' },
    closingTitle: 'Comece grátis. Decida depois.',
    closingPrimaryCta: 'Começar grátis',
    manifestoLink: 'Leia nosso manifesto',
    manifestoHref: '/manifesto',
    pricingCta: 'Ver planos',
    pricingHref: '/pricing',
    salaryUndisclosed: 'Não divulgado',
    jobExpired: 'Possivelmente encerrada',
    forEmployersLabel: 'Empresas',
    forEmployersHref: '/for-employers',
    postJobCta: 'Anunciar Vaga',
  },
  en: {
    signIn: 'Sign in',
    heroTitle: 'The Legal Ops Platform',
    heroDescription: 'The professional network for legal operations builders. Curated jobs, AI-powered matching, and the largest Legal Ops community.',
    heroPrimaryCta: 'Create free account',
    heroSecondaryCta: 'For Employers',
    heroSecondaryHref: '/en/for-employers',
    jobsTitle: 'Recent jobs',
    jobsSubtitle: 'Browse Legal Ops jobs right here. Click any role for details.',
    jobsEmpty: 'No jobs found at the moment.',
    tableHeaders: { title: 'Role', company: 'Company', remote: 'Remote', salary: 'Salary' },
    closingTitle: 'Start free. Decide later.',
    closingPrimaryCta: 'Start free',
    manifestoLink: 'Read our manifesto',
    manifestoHref: '/en/manifesto',
    pricingCta: 'View plans',
    pricingHref: '/en/pricing',
    salaryUndisclosed: 'Undisclosed',
    jobExpired: 'Possibly closed',
    forEmployersLabel: 'Companies',
    forEmployersHref: '/en/for-employers',
    postJobCta: 'Post a Job',
  },
}

function formatSalary(min: number | null, max: number | null, currency: string | null, fallback: string): string {
  return formatSalaryUtil({ salary_min: min, salary_max: max, salary_currency: currency }, fallback)
}

export function LandingPageClient({
  locale,
  jobs,
}: {
  locale: LandingLocale
  jobs: LandingJob[]
}) {
  const [lang, setLang] = useState<LandingLocale>(locale)
  const copy = content[lang]

  return (
    <div lang={lang === 'pt' ? 'pt-BR' : 'en'} className="min-h-screen bg-[#F5F4F0] text-[#1A1A1A]">
      <header className="border-b border-[#1A1A1A]/5 bg-[#F5F4F0]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href={lang === 'pt' ? '/' : '/en'} className="flex items-center gap-3">
            <BrandMark className="h-8 w-8 md:h-10 md:w-10 text-[#FF6A00]" />
            <span className="font-bold text-xl md:text-2xl tracking-tight text-[#1A1A1A]">
              legalops.work
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link
              href={copy.pricingHref}
              className="text-sm font-medium text-[#1A1A1A]/70 hover:text-[#FF6A00] transition-colors"
            >
              {copy.pricingCta}
            </Link>
            <Link
              href={copy.forEmployersHref}
              className="text-sm font-medium text-[#1A1A1A]/70 hover:text-[#FF6A00] transition-colors"
            >
              {copy.forEmployersLabel}
            </Link>
            <div className="h-4 w-px bg-[#1A1A1A]/10" />
            <button
              onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
              className="flex items-center gap-1.5 text-sm font-medium text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors"
            >
              <Globe className="h-4 w-4" />
              <span className="uppercase">{lang}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            <Link
              href="/login"
              className="text-sm font-bold text-[#1A1A1A] hover:text-[#FF6A00] transition-colors"
            >
              {copy.signIn}
            </Link>
            <Link
              href={copy.forEmployersHref}
              className="bg-[#FF6A00] hover:bg-[#E65C00] text-white px-6 py-3 rounded-lg text-sm font-bold transition-colors"
            >
              {copy.postJobCta}
            </Link>
          </div>

          {/* Mobile nav */}
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
              className="flex items-center gap-1.5 text-sm text-[#1A1A1A]/70"
            >
              <Globe className="h-4 w-4" />
              <span className="uppercase">{lang}</span>
            </button>
            <Link
              href="/login"
              className="text-sm font-bold text-[#1A1A1A]"
            >
              {copy.signIn}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <section className="max-w-3xl">
          <h1
            className="text-5xl leading-tight text-[#1A1A1A] sm:text-6xl"
            style={{
              fontFamily:
                '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
            }}
          >
            {copy.heroTitle}
          </h1>

          <p className="mt-4 text-lg leading-8 text-[#1A1A1A]/60">
            <TypingText text={copy.heroDescription} delay={300} speed={25} />
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1A1A1A] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1A1A1A]/80"
            >
              {copy.heroPrimaryCta}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={copy.heroSecondaryHref}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#1A1A1A]/15 px-6 py-3 text-sm font-medium text-[#1A1A1A]/70 transition-colors hover:border-[#1A1A1A]"
            >
              {copy.heroSecondaryCta}
            </Link>
          </div>
        </section>

        <section className="mt-16">
          <h2
            className="text-3xl text-[#1A1A1A] sm:text-4xl"
            style={{
              fontFamily:
                '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
            }}
          >
            {copy.jobsTitle}
          </h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-[#1A1A1A]/50">
            <Search className="h-4 w-4" />
            {copy.jobsSubtitle}
          </p>

          {jobs.length > 0 ? (
            <div className="mt-6 overflow-hidden rounded-2xl border border-[#1A1A1A]/10 bg-white">
              <div className="hidden sm:grid sm:grid-cols-[2fr_1.2fr_1fr_1fr] gap-4 border-b border-[#1A1A1A]/10 px-6 py-3 text-xs font-medium uppercase tracking-wider text-[#1A1A1A]/40">
                <div>{copy.tableHeaders.title}</div>
                <div>{copy.tableHeaders.company}</div>
                <div>{copy.tableHeaders.remote}</div>
                <div>{copy.tableHeaders.salary}</div>
              </div>

              {jobs.map((job, index) => {
                const isDead = (job.url_status as UrlStatus) === 'dead'
                const salaryFallback = isDead ? '—' : copy.salaryUndisclosed
                return (
                  <a
                    key={job.id}
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group grid gap-1 sm:gap-4 sm:grid-cols-[2fr_1.2fr_1fr_1fr] px-6 py-4 text-sm transition-colors hover:bg-[#F5F4F0] ${
                      index % 2 === 0 ? 'bg-white' : 'bg-[#F5F4F0]/50'
                    } ${isDead ? 'opacity-60' : ''}`}
                  >
                    <div className="font-medium text-[#1A1A1A] flex items-center gap-2">
                      {job.title}
                      {isDead && (
                        <span className="text-xs font-normal text-amber-500">{copy.jobExpired}</span>
                      )}
                      <ExternalLink className="h-3 w-3 text-[#1A1A1A]/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-[#1A1A1A]/60">{job.company}</div>
                    <div className="text-[#1A1A1A]/50">{remoteLabels[job.remote_reality as RemoteReality] ?? '—'}</div>
                    <div className="text-[#1A1A1A]/50">{formatSalary(job.salary_min, job.salary_max, job.salary_currency, salaryFallback)}</div>
                  </a>
                )
              })}
            </div>
          ) : (
            <p className="mt-6 text-sm text-[#1A1A1A]/50">{copy.jobsEmpty}</p>
          )}
        </section>

        <section className="mt-16 rounded-2xl border border-[#1A1A1A]/10 bg-white px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2
                className="text-3xl text-[#1A1A1A] sm:text-4xl"
                style={{
                  fontFamily:
                    '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
                }}
              >
                {copy.closingTitle}
              </h2>
              <Link
                href={copy.manifestoHref}
                className="mt-2 inline-block text-sm text-[#1A1A1A]/50 underline decoration-[#1A1A1A]/20 underline-offset-4 transition-colors hover:text-[#1A1A1A] hover:decoration-[#1A1A1A]"
              >
                {copy.manifestoLink}
              </Link>
            </div>

            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1A1A1A] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1A1A1A]/80"
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
