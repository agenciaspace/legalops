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
    eyebrow: 'LEGALOPS.WORK / VAGAS',
    title: 'encontre sua próxima oportunidade no jurídico.',
    subtitle: 'Vagas verificadas em Legal Ops, Legal Tech, contratos, CLM, dados, operações e gestão jurídica — com informação suficiente para decidir onde vale aplicar.',
    heroPrimary: 'Ver vagas',
    heroSecondary: 'Publicar uma vaga',
    recent: 'vagas verificadas recentemente',
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
    login: 'Criar meu perfil',
    employers: 'Para empresas',
    manifesto: 'Sobre o Work',
    updatedDaily: 'Vagas verificadas diariamente',
    lastScan: 'Última varredura',
    activeJob: 'Vaga ativa',
    checked: 'Checada',
  },
  en: {
    eyebrow: 'LEGALOPS.WORK / JOBS',
    title: 'find your next opportunity in legal.',
    subtitle: 'Verified roles across Legal Operations, Legal Tech, contracts, CLM, data, operations and legal management — with enough context to decide where to apply.',
    heroPrimary: 'View jobs',
    heroSecondary: 'Post a role',
    recent: 'recently verified jobs',
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
    login: 'Create my profile',
    employers: 'For employers',
    manifesto: 'About Work',
    updatedDaily: 'Jobs verified daily',
    lastScan: 'Last scan',
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
  ashby: 'Ashby',
  jooble: 'Jooble',
  adzuna: 'Adzuna',
  company_site: 'Site da empresa',
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  cloc: 'CLOC',
  legalio: 'Legal.io',
  legaloperators: 'Legal Operators',
  goinhouse: 'GoInhouse',
  firecrawl: 'Firecrawl (legado)',
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

  const recentJobs = jobs.slice(0, 3)

  return (
    <div
      lang={locale === 'pt' ? 'pt-BR' : 'en'}
      className="min-h-screen bg-[#F5F1E8] text-[#111111] selection:bg-[#E88A6A] selection:text-white"
    >
      <ClubHeader active="jobs" locale={locale} product="work" />

      <main>
        <section className="border-b border-[#CEC8BD]">
          <div className="mx-auto grid max-w-[1180px] gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:gap-16 lg:py-28">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#C9684F]">{copy.eyebrow}</p>
              <h1 className="mt-5 max-w-[700px] font-[var(--font-quicksand)] text-[42px] font-semibold leading-[.98] tracking-[-0.065em] sm:text-[62px] lg:text-[72px]">
                {copy.title}
              </h1>
              <p className="mt-6 max-w-[660px] text-base leading-7 text-[#625E59] sm:text-lg sm:leading-8">
                {copy.subtitle}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#vagas" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#111111] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#2A2927]">
                  {copy.heroPrimary} <ArrowRight className="h-4 w-4" />
                </a>
                <Link href="/for-employers" className="inline-flex items-center justify-center rounded-lg border border-[#BEB7AA] px-5 py-3 text-sm font-bold text-[#111111] transition hover:bg-[#FAF7F1]">
                  {copy.heroSecondary}
                </Link>
              </div>
            </div>

            <div className="border border-[#BEB7AA] bg-[#FAF7F1]">
              <div className="flex items-center justify-between border-b border-[#CEC8BD] px-4 py-3">
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#C9684F]">{copy.recent}</span>
                <span className="text-[10px] font-semibold text-[#817A73]">{copy.count(jobCount)}</span>
              </div>
              {recentJobs.length > 0 ? (
                <div className="divide-y divide-[#E6DED0]">
                  {recentJobs.map(job => {
                    const salary = formatSalary(job, '')
                    return (
                      <a key={job.id} href={job.url} target="_blank" rel="noopener noreferrer" className="group grid grid-cols-[1fr_auto] gap-4 px-4 py-4 hover:bg-white">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#817A73]">{job.company}</p>
                          <p className="mt-1 text-sm font-semibold leading-5 text-[#111111]">{job.title}</p>
                          <p className="mt-2 text-[10px] text-[#69635E]">{remoteLabel(job.remote_reality, locale)}{salary ? ` · ${salary}` : ''}</p>
                        </div>
                        <ArrowRight className="mt-1 h-4 w-4 text-[#817A73] transition group-hover:translate-x-0.5 group-hover:text-[#C9684F]" />
                      </a>
                    )
                  })}
                </div>
              ) : (
                <p className="px-4 py-10 text-center text-xs text-[#817A73]">{copy.empty}</p>
              )}
            </div>
          </div>
        </section>

        <LegalOpsEcosystem active="work" locale={locale} />

        <section id="vagas" className="mx-auto max-w-[1120px] scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24" aria-label={copy.searchLabel}>
          <div className="grid gap-6 border-b border-[#CEC8BD] pb-10 md:grid-cols-[.75fr_1.25fr] md:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#C9684F]">legalops.work / vagas</p>
              <h2 className="mt-3 font-[var(--font-quicksand)] text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">busque pelo trabalho que faz sentido para você<span className="text-[#E88A6A]">.</span></h2>
            </div>
            <div>
              <label className="relative block">
                <span className="sr-only">{copy.searchLabel}</span>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817A73]" />
                <input
                  type="search"
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder={copy.searchPlaceholder}
                  className="h-12 w-full rounded-lg border border-[#CEC8BD] bg-[#FAF7F1] pl-10 pr-4 text-sm text-[#111111] outline-none placeholder:text-[#928B84] focus:border-[#817A73] focus:ring-2 focus:ring-[#111111]/10"
                />
              </label>
            </div>
          </div>

          <div className="flex items-end justify-between gap-5 border-b border-[#CEC8BD]">
            <div className="flex gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {filterOrder.map(filter => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`shrink-0 border-b-2 py-4 text-xs font-semibold transition ${activeFilter === filter ? 'border-[#E88A6A] text-[#111111]' : 'border-transparent text-[#716B65] hover:border-[#CEC8BD] hover:text-[#111111]'}`}
                >
                  {copy.filters[filter]}
                </button>
              ))}
            </div>
            <p className="hidden pb-4 text-right text-[10px] text-[#817A73] sm:block">
              {copy.updatedDaily}
              {crawlerRun ? ` · ${copy.lastScan}: ${new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'en-US', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'short' }).format(new Date(crawlerRun.completed_at))}` : ''}
            </p>
          </div>

          <div className="flex items-center justify-between py-5">
            <p className="text-xs font-semibold text-[#77716A]">
              {copy.count(normalizedQuery || activeFilter !== 'all' ? visibleJobs.length : jobCount)}
            </p>
            <p className="text-xs text-[#77716A]">
              {copy.employerPrompt}{' '}
              <Link href="/for-employers" className="font-semibold text-[#111111] underline underline-offset-4 hover:text-[#C9684F]">{copy.employerLink}</Link>
            </p>
          </div>

          {visibleJobs.length > 0 ? (
            <div className="border-t border-[#CEC8BD]">
              {visibleJobs.map(job => {
                const salary = formatSalary(job, '')
                const checkedAt = formatCheckedAt(job.url_checked_at, locale)

                return (
                  <a
                    key={job.id}
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group grid gap-4 border-b border-[#CEC8BD] py-5 transition hover:bg-[#FAF7F1] sm:grid-cols-[1fr_auto] sm:px-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#817A73]">{job.company}</span>
                        <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700"><BadgeCheck className="h-3 w-3" /> {copy.activeJob}</span>
                      </div>
                      <h3 className="mt-1.5 font-[var(--font-quicksand)] text-lg font-semibold tracking-[-0.025em] text-[#111111]">{job.title}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#69635E]">
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {remoteLabel(job.remote_reality, locale)}</span>
                        {salary ? <span>{salary}</span> : null}
                        <span>{sourceLabels[job.source_board] ?? job.source_board}{checkedAt ? ` · ${copy.checked} ${checkedAt}` : ''}</span>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 self-center text-[11px] font-semibold text-[#44403C] group-hover:text-[#C9684F]">
                      {copy.source} <ExternalLink className="h-3.5 w-3.5" />
                    </span>
                  </a>
                )
              })}
            </div>
          ) : (
            <div className="border-y border-dashed border-[#CEC8BD] py-14 text-center">
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

        <section className="border-y border-[#CEC8BD] bg-[#FAF7F1]">
          <div className="mx-auto grid max-w-[1120px] gap-6 px-5 py-12 sm:px-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#C9684F]">sua busca, organizada</p>
              <h2 className="mt-2 font-[var(--font-quicksand)] text-2xl font-semibold tracking-[-0.04em] text-[#111111]">{copy.memberTitle}</h2>
              <p className="mt-2 max-w-[620px] text-sm leading-6 text-[#69635E]">{copy.memberText}</p>
            </div>
            <Link href="/login" className="inline-flex items-center gap-2 border-b border-[#111111] pb-1 text-sm font-bold hover:text-[#C9684F]">
              {copy.login} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#CEC8BD] bg-[#FAF7F1]">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-4 px-5 py-7 text-xs text-[#716B65] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <BrandWordmark
            suffix="work"
            className="inline-flex items-baseline text-[21px] font-semibold leading-none tracking-[-0.055em] text-[#111111]"
          />
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Links do LegalOps Work">
            <Link href="https://legalops.club" className="hover:text-[#111111]">club / {locale === 'pt' ? 'comunidade' : 'community'}</Link>
            <Link href="https://legalops.dev" className="hover:text-[#111111]">dev / {locale === 'pt' ? 'construir' : 'build'}</Link>
            <Link href="/for-employers" className="hover:text-[#111111]">{copy.employers}</Link>
            <Link href="/manifesto" className="hover:text-[#111111]">{copy.manifesto}</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
