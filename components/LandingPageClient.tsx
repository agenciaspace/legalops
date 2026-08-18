'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  ExternalLink,
  MapPin,
  Search,
} from 'lucide-react'
import { ClubHeader } from '@/components/ClubHeader'
import { BrandWordmark } from '@/components/BrandLogo'
import { LegalOpsEcosystem } from '@/components/LegalOpsEcosystem'
import { formatSalary } from '@/lib/format-salary'
import type { RemoteReality } from '@/lib/types'

type LandingLocale = 'pt' | 'en'
type JobFilter = 'all' | 'remote' | 'hybrid' | 'onsite'

export interface LandingJob {
  id: string
  title: string
  company: string
  url: string
  source_board: string
  remote_reality: string | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  url_status: string | null
  url_checked_at: string | null
  created_at: string
}

export interface LandingCrawlerRun {
  completed_at: string
  discovery_source: string
  scraped_count: number
  inserted_count: number
}

const remoteLabels: Record<RemoteReality, Record<LandingLocale, string>> = {
  fully_remote: { pt: 'Remoto', en: 'Remote' },
  remote_with_travel: { pt: 'Remoto com viagens', en: 'Remote with travel' },
  hybrid_disguised: { pt: 'Híbrido', en: 'Hybrid' },
  onsite: { pt: 'Presencial', en: 'On-site' },
  unknown: { pt: 'Local não informado', en: 'Location not listed' },
}

const content = {
  pt: {
    eyebrow: 'LEGALOPS.WORK · VAGAS',
    title: 'encontre sua próxima oportunidade no jurídico.',
    subtitle: 'Vagas verificadas em Legal Ops, Legal Tech, contratos, CLM, dados, operações e gestão jurídica. Busque por função, empresa e modelo de trabalho.',
    employerPrompt: 'Seu jurídico ou escritório está contratando?',
    employerLink: 'Publicar uma vaga',
    searchLabel: 'Buscar vagas jurídicas e de Legal Ops',
    searchPlaceholder: 'Legal Ops, CLM, contratos, legal tech, empresa...',
    filters: {
      all: 'Todas',
      remote: 'Remotas',
      hybrid: 'Híbridas',
      onsite: 'Presenciais',
    },
    count: (count: number) => `${count} ${count === 1 ? 'vaga' : 'vagas'}`,
    source: 'Abrir vaga',
    empty: 'Nenhuma vaga encontrada.',
    clear: 'Limpar busca',
    memberTitle: 'Organize sua próxima candidatura',
    memberText: 'Salve vagas, acompanhe candidaturas e mantenha sua busca por uma nova oportunidade em um só lugar.',
    login: 'Entrar gratuitamente',
    pricing: 'Ver planos',
    employers: 'Para empresas',
    manifesto: 'Sobre o Work',
    updatedDaily: 'Vagas verificadas diariamente',
    lastScan: 'Última varredura',
    company: 'Empresa',
    verifiedCompany: 'Empresa verificada',
    activeJob: 'Vaga ativa',
    checked: 'Checada',
  },
  en: {
    eyebrow: 'LEGALOPS.WORK · JOBS',
    title: 'find your next opportunity in legal.',
    subtitle: 'Verified roles across Legal Operations, Legal Tech, contracts, CLM, data, operations and legal management. Search by role, company and work model.',
    employerPrompt: 'Is your legal team or law firm hiring?',
    employerLink: 'Post a role',
    searchLabel: 'Search legal operations jobs',
    searchPlaceholder: 'Legal Ops, CLM, contracts, legal tech, company...',
    filters: {
      all: 'All',
      remote: 'Remote',
      hybrid: 'Hybrid',
      onsite: 'On-site',
    },
    count: (count: number) => `${count} ${count === 1 ? 'job' : 'jobs'}`,
    source: 'Open job',
    empty: 'No jobs found.',
    clear: 'Clear search',
    memberTitle: 'Organize your next application',
    memberText: 'Save roles, track applications and keep your search for a new opportunity in one place.',
    login: 'Sign in for free',
    pricing: 'View plans',
    employers: 'For employers',
    manifesto: 'About Work',
    updatedDaily: 'Jobs verified daily',
    lastScan: 'Last scan',
    company: 'Company',
    verifiedCompany: 'Verified company',
    activeJob: 'Active job',
    checked: 'Checked',
  },
} as const

const filterOrder: JobFilter[] = ['all', 'remote', 'hybrid', 'onsite']

const sourceLabels: Record<string, string> = {
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  workable: 'Workable',
  gupy: 'Gupy',
  firecrawl: 'Firecrawl',
  company_site: 'Company site',
}

function remoteLabel(remoteReality: string | null, locale: LandingLocale) {
  const key = (remoteReality ?? 'unknown') as RemoteReality
  return remoteLabels[key]?.[locale] ?? remoteLabels.unknown[locale]
}

function matchesFilter(job: LandingJob, filter: JobFilter) {
  if (filter === 'all') return true
  if (filter === 'remote') {
    return job.remote_reality === 'fully_remote' || job.remote_reality === 'remote_with_travel'
  }
  if (filter === 'hybrid') return job.remote_reality === 'hybrid_disguised'
  return job.remote_reality === 'onsite'
}

function formatCheckedAt(value: string | null, locale: LandingLocale) {
  if (!value) return null
  return new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'en-US', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'short',
  }).format(new Date(value))
}

export function LandingPageClient({
  locale,
  jobs,
  jobCount,
  crawlerRun,
}: {
  locale: LandingLocale
  jobs: LandingJob[]
  jobCount: number
  crawlerRun: LandingCrawlerRun | null
}) {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<JobFilter>('all')
  const copy = content[locale]

  const normalizedQuery = query.trim().toLocaleLowerCase(locale === 'pt' ? 'pt-BR' : 'en-US')
  const visibleJobs = jobs.filter(job => {
    if (!matchesFilter(job, activeFilter)) return false
    if (!normalizedQuery) return true

    return `${job.title} ${job.company} ${remoteLabel(job.remote_reality, locale)}`
      .toLocaleLowerCase(locale === 'pt' ? 'pt-BR' : 'en-US')
      .includes(normalizedQuery)
  })

  return (
    <div
      lang={locale === 'pt' ? 'pt-BR' : 'en'}
      className="min-h-screen bg-[#F5F1E8] text-[#111111] selection:bg-[#E88A6A] selection:text-white"
    >
      <ClubHeader active="jobs" locale={locale} product="work" />
      <LegalOpsEcosystem active="work" locale={locale} />

      <main className="mx-auto max-w-[1120px] px-5 pb-20 pt-14 sm:px-8 sm:pt-20">
        <section className="text-center">
          <p className="text-[11px] font-bold tracking-[0.18em] text-[#C9684F]">
            {copy.eyebrow}
          </p>
          <h1 className="mt-4 font-[var(--font-quicksand)] text-3xl font-semibold tracking-[-0.05em] text-[#111111] sm:text-5xl">
            {copy.title}
          </h1>
          <p className="mx-auto mt-4 max-w-[700px] text-sm leading-6 text-[#69635E] sm:text-base">
            {copy.subtitle}
          </p>
          <p className="mt-4 text-xs text-[#77716A]">
            {copy.employerPrompt}{' '}
            <Link href="/for-employers" className="font-semibold text-[#111111] underline underline-offset-4 hover:text-[#C9684F]">
              {copy.employerLink}
            </Link>
          </p>
        </section>

        <section className="mt-10" aria-label={copy.searchLabel}>
          <div className="mx-auto max-w-[660px]">
            <label className="relative block">
              <span className="sr-only">{copy.searchLabel}</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817A73]" />
              <input
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder={copy.searchPlaceholder}
                className="h-12 w-full rounded-lg border border-[#CEC8BD] bg-[#FAF7F1] pl-11 pr-4 text-sm text-[#111111] shadow-sm outline-none placeholder:text-[#928B84] focus:border-[#817A73] focus:ring-2 focus:ring-[#111111]/10"
              />
            </label>
          </div>

          <div className="mt-7 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:justify-center">
            {filterOrder.map(filter => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition ${activeFilter === filter ? 'border-[#111111] bg-[#111111] text-white' : 'border-[#CEC8BD] bg-[#FAF7F1] text-[#66615B] hover:border-[#AFA79C] hover:text-[#111111]'}`}
              >
                {copy.filters[filter]}
              </button>
            ))}
          </div>

          <div className="mt-7 flex items-center justify-between border-b border-[#CEC8BD] pb-3">
            <p className="text-xs font-medium text-[#77716A]">
              {copy.count(normalizedQuery || activeFilter !== 'all' ? visibleJobs.length : jobCount)}
            </p>
            <p className="text-right text-[10px] text-[#817A73]">
              {copy.updatedDaily}
              {crawlerRun ? ` · ${copy.lastScan}: ${new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'en-US', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'short' }).format(new Date(crawlerRun.completed_at))}` : ''}
            </p>
          </div>

          {visibleJobs.length > 0 ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleJobs.map((job, index) => {
                const salary = formatSalary(job, '')
                const checkedAt = formatCheckedAt(job.url_checked_at, locale)

                return (
                  <a
                    key={job.id}
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group overflow-hidden rounded-lg border border-[#CEC8BD] bg-[#FAF7F1] shadow-[0_1px_2px_rgba(17,17,17,0.04)] transition hover:-translate-y-0.5 hover:border-[#AFA79C] hover:shadow-md"
                  >
                    <div className="relative aspect-[16/8.5] overflow-hidden border-b border-[#CEC8BD] bg-[#EEE8DE] p-5 text-[#111111] transition group-hover:bg-[#E9E2D7]">
                      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(17,17,17,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,.05)_1px,transparent_1px)] [background-size:28px_28px]" />
                      <div className="relative flex h-full flex-col justify-between">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] font-semibold tracking-[0.16em] text-[#77716A]">
                            {copy.verifiedCompany}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50/90 px-2 py-1 text-[9px] font-semibold text-emerald-700">
                            <BadgeCheck className="h-3 w-3" aria-hidden="true" /> {copy.activeJob}
                          </span>
                        </div>
                        <div className="flex items-end justify-between gap-4">
                          <p className="line-clamp-2 max-w-[78%] font-[var(--font-quicksand)] text-2xl font-bold leading-7 tracking-[-0.045em]">
                            {job.company}
                          </p>
                          <span className="pb-1 text-[10px] font-semibold text-[#817A73]">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#D8D0C4] bg-[#F5F1E8] text-[#C9684F]">
                          <BriefcaseBusiness className="h-4 w-4" />
                        </span>
                        <h2 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-[#111111]">
                          {job.title}
                        </h2>
                      </div>
                      <div className="mt-3 flex min-h-10 flex-wrap content-start gap-1.5 text-[11px] text-[#66615B]">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#F0EAE1] px-2 py-1">
                          <MapPin className="h-3 w-3" /> {remoteLabel(job.remote_reality, locale)}
                        </span>
                        {salary && <span className="rounded-full bg-[#F0EAE1] px-2 py-1">{salary}</span>}
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-[#E6DED0] pt-3 text-[11px] text-[#77716A]">
                        <span>
                          {sourceLabels[job.source_board] ?? job.source_board}
                          {checkedAt ? ` · ${copy.checked} ${checkedAt}` : ''}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-[#44403C]">
                          {copy.source} <ExternalLink className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-lg border border-dashed border-[#CEC8BD] bg-[#FAF7F1] px-6 py-14 text-center">
              <p className="text-sm font-medium text-[#2A2927]">{copy.empty}</p>
              {(query || activeFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setActiveFilter('all')
                  }}
                  className="mt-3 text-xs font-semibold text-[#C9684F] hover:underline"
                >
                  {copy.clear}
                </button>
              )}
            </div>
          )}
        </section>

        <section className="mt-14 rounded-lg border border-[#CEC8BD] bg-[#FAF7F1] px-6 py-7 sm:flex sm:items-center sm:justify-between sm:px-8">
          <div>
            <h2 className="font-[var(--font-quicksand)] text-base font-semibold text-[#111111]">{copy.memberTitle}</h2>
            <p className="mt-1 max-w-[580px] text-sm leading-6 text-[#69635E]">{copy.memberText}</p>
          </div>
          <Link
            href="/login"
            className="mt-5 inline-flex shrink-0 items-center gap-2 rounded-full bg-[#111111] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#2A2927] sm:ml-8 sm:mt-0"
          >
            {copy.login} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      </main>

      <footer className="border-t border-[#CEC8BD] bg-[#FAF7F1]">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-4 px-5 py-7 text-xs text-[#716B65] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <BrandWordmark
            suffix="work"
            className="inline-flex items-baseline text-[21px] font-semibold leading-none tracking-[-0.055em] text-[#111111]"
          />
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Links do LegalOps Work">
            <Link href="https://legalops.club" className="hover:text-[#111111]">club · {locale === 'pt' ? 'comunidade' : 'community'}</Link>
            <Link href="https://legalops.dev" className="hover:text-[#111111]">dev · {locale === 'pt' ? 'construir' : 'build'}</Link>
            <Link href="/for-employers" className="hover:text-[#111111]">{copy.employers}</Link>
            <Link href="/manifesto" className="hover:text-[#111111]">{copy.manifesto}</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
