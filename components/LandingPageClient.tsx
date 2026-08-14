'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  ExternalLink,
  MapPin,
  Search,
} from 'lucide-react'
import { ClubHeader } from '@/components/ClubHeader'
import { formatSalary } from '@/lib/format-salary'
import type { RemoteReality } from '@/lib/types'

type LandingLocale = 'pt' | 'en'
type JobFilter = 'all' | 'remote' | 'hybrid' | 'onsite'

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

const remoteLabels: Record<RemoteReality, Record<LandingLocale, string>> = {
  fully_remote: { pt: 'Remoto', en: 'Remote' },
  remote_with_travel: { pt: 'Remoto com viagens', en: 'Remote with travel' },
  hybrid_disguised: { pt: 'Híbrido', en: 'Hybrid' },
  onsite: { pt: 'Presencial', en: 'On-site' },
  unknown: { pt: 'Local não informado', en: 'Location not listed' },
}

const content = {
  pt: {
    eyebrow: 'LEGALOPS WORK',
    title: 'Explore as vagas',
    subtitle: 'Oportunidades em operações jurídicas, tecnologia, dados e contratos.',
    employerPrompt: 'Sua empresa está contratando?',
    employerLink: 'Anunciar uma vaga',
    searchLabel: 'Buscar vagas',
    searchPlaceholder: 'Cargo, empresa ou palavra-chave',
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
    memberTitle: 'Organize suas candidaturas',
    memberText: 'Entre para salvar vagas e acompanhar cada processo no seu pipeline.',
    login: 'Entrar gratuitamente',
    pricing: 'Ver planos',
    employers: 'Para empresas',
    manifesto: 'Sobre o Work',
  },
  en: {
    eyebrow: 'LEGALOPS WORK',
    title: 'Explore jobs',
    subtitle: 'Open roles in legal operations, technology, data, and contracts.',
    employerPrompt: 'Is your company hiring?',
    employerLink: 'Post a job',
    searchLabel: 'Search jobs',
    searchPlaceholder: 'Role, company, or keyword',
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
    memberTitle: 'Keep your applications organized',
    memberText: 'Sign in to save jobs and track every application in your pipeline.',
    login: 'Sign in for free',
    pricing: 'View plans',
    employers: 'For employers',
    manifesto: 'About Work',
  },
} as const

const filterOrder: JobFilter[] = ['all', 'remote', 'hybrid', 'onsite']

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

export function LandingPageClient({
  locale,
  jobs,
  jobCount,
}: {
  locale: LandingLocale
  jobs: LandingJob[]
  jobCount: number
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
      className="min-h-screen bg-[#F7F7F5] text-[#20201D] selection:bg-[#E45220] selection:text-white"
    >
      <ClubHeader active="jobs" locale={locale} />

      <main className="mx-auto max-w-[1120px] px-5 pb-20 pt-14 sm:px-8 sm:pt-20">
        <section className="text-center">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-[#E45220]">
            {copy.eyebrow}
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-[-0.035em] text-[#20201D] sm:text-5xl">
            {copy.title}
          </h1>
          <p className="mx-auto mt-4 max-w-[620px] text-sm leading-6 text-[#686863] sm:text-base">
            {copy.subtitle}
          </p>
          <p className="mt-4 text-xs text-[#777772]">
            {copy.employerPrompt}{' '}
            <Link href="/for-employers" className="font-semibold text-[#20201D] underline underline-offset-4 hover:text-[#E45220]">
              {copy.employerLink}
            </Link>
          </p>
        </section>

        <section className="mt-10" aria-label={copy.searchLabel}>
          <div className="mx-auto max-w-[660px]">
            <label className="relative block">
              <span className="sr-only">{copy.searchLabel}</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#92928D]" />
              <input
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder={copy.searchPlaceholder}
                className="h-12 w-full rounded-lg border border-[#D8D8D4] bg-white pl-11 pr-4 text-sm text-[#20201D] shadow-sm outline-none placeholder:text-[#9A9A95] focus:border-[#92928D] focus:ring-2 focus:ring-[#20201D]/10"
              />
            </label>
          </div>

          <div className="mt-7 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:justify-center">
            {filterOrder.map(filter => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition ${activeFilter === filter ? 'border-[#20201D] bg-[#20201D] text-white' : 'border-[#DEDEDA] bg-white text-[#666661] hover:border-[#B9B9B4] hover:text-[#20201D]'}`}
              >
                {copy.filters[filter]}
              </button>
            ))}
          </div>

          <div className="mt-7 flex items-center justify-between border-b border-[#DFDFDB] pb-3">
            <p className="text-xs font-medium text-[#777772]">
              {copy.count(normalizedQuery || activeFilter !== 'all' ? visibleJobs.length : jobCount)}
            </p>
          </div>

          {visibleJobs.length > 0 ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleJobs.map((job, index) => {
                const salary = formatSalary(job, '')

                return (
                  <a
                    key={job.id}
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group overflow-hidden rounded-lg border border-[#DFDFDB] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:border-[#C3C3BE] hover:shadow-md"
                  >
                    <div className="relative aspect-[16/8.5] overflow-hidden border-b border-[#DFDFDB] bg-[#F0F0ED] p-5 text-[#20201D] transition group-hover:bg-[#ECECE8]">
                      <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(32,32,29,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(32,32,29,.06)_1px,transparent_1px)] [background-size:28px_28px]" />
                      <div className="relative flex h-full flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold tracking-[0.16em] text-[#E45220]">LEGALOPS WORK</span>
                          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-[#D4D4CF] bg-white/70">
                            <BriefcaseBusiness className="h-[18px] w-[18px] text-[#53534F]" />
                          </span>
                        </div>
                        <div className="flex items-end justify-between gap-4">
                          <p className="line-clamp-2 max-w-[78%] text-2xl font-black leading-7 tracking-[-0.04em]">
                            {job.company}
                          </p>
                          <span className="pb-1 text-[10px] font-semibold text-[#90908B]">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#D9D9D4] bg-[#F3F3F0] text-[#E45220]">
                          <Building2 className="h-4 w-4" />
                        </span>
                        <h2 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-[#20201D]">
                          {job.title}
                        </h2>
                      </div>
                      <div className="mt-3 flex min-h-10 flex-wrap content-start gap-1.5 text-[11px] text-[#666661]">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F3F0] px-2 py-1">
                          <MapPin className="h-3 w-3" /> {remoteLabel(job.remote_reality, locale)}
                        </span>
                        {salary && <span className="rounded-full bg-[#F3F3F0] px-2 py-1">{salary}</span>}
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-[#ECECE8] pt-3 text-[11px] text-[#777772]">
                        <span>{job.company}</span>
                        <span className="flex items-center gap-1 font-medium text-[#444440]">
                          {copy.source} <ExternalLink className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-lg border border-dashed border-[#CECEC9] bg-white px-6 py-14 text-center">
              <p className="text-sm font-medium text-[#30302D]">{copy.empty}</p>
              {(query || activeFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setActiveFilter('all')
                  }}
                  className="mt-3 text-xs font-semibold text-[#E45220] hover:underline"
                >
                  {copy.clear}
                </button>
              )}
            </div>
          )}
        </section>

        <section className="mt-14 rounded-lg border border-[#DFDFDB] bg-white px-6 py-7 sm:flex sm:items-center sm:justify-between sm:px-8">
          <div>
            <h2 className="text-base font-semibold text-[#20201D]">{copy.memberTitle}</h2>
            <p className="mt-1 max-w-[580px] text-sm leading-6 text-[#686863]">{copy.memberText}</p>
          </div>
          <Link
            href="/login"
            className="mt-5 inline-flex shrink-0 items-center gap-2 rounded-md bg-[#20201D] px-4 py-2.5 text-xs font-semibold text-white hover:bg-black sm:ml-8 sm:mt-0"
          >
            {copy.login} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      </main>

      <footer className="border-t border-[#E4E4E0] bg-white">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-4 px-5 py-7 text-xs text-[#777772] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>LEGALOPS <span className="font-semibold text-[#E45220]">WORK</span></span>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Links do LegalOps Work">
            <Link href="/pricing" className="hover:text-[#20201D]">{copy.pricing}</Link>
            <Link href="/for-employers" className="hover:text-[#20201D]">{copy.employers}</Link>
            <Link href="/manifesto" className="hover:text-[#20201D]">{copy.manifesto}</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
