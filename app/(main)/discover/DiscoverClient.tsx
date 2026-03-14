'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  formatCrawlerDiscoverySource,
  getCrawlerRunHeadline,
  type CrawlerStats,
} from '@/lib/crawler-runs'
import { JobCard } from '@/components/JobCard'
import { useLocale } from '@/components/LocaleProvider'
import type { Job, RemoteReality } from '@/lib/types'

export function DiscoverClient({
  initialJobs,
  crawlerStats,
}: {
  initialJobs: Job[]
  crawlerStats: CrawlerStats
}) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [stats, setStats] = useState<CrawlerStats>(crawlerStats)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialJobs.length === 20)
  const [search, setSearch] = useState('')
  const [remoteFilter, setRemoteFilter] = useState<RemoteReality | 'all'>('all')
  const [salaryFilter, setSalaryFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'newest' | 'salary'>('newest')
  const router = useRouter()
  const { locale, t } = useLocale()

  const REMOTE_OPTIONS: { value: RemoteReality | 'all'; label: string }[] = [
    { value: 'all', label: t.discover.remoteAll },
    { value: 'fully_remote', label: t.discover.remoteFullyRemote },
    { value: 'remote_with_travel', label: t.discover.remoteWithTravel },
    { value: 'hybrid_disguised', label: t.discover.remoteHybrid },
    { value: 'onsite', label: t.discover.remoteOnsite },
  ]

  const SALARY_OPTIONS = [
    { value: 'all', label: t.discover.salaryAll },
    { value: 'disclosed', label: t.discover.salaryDisclosed },
    { value: 'high', label: t.discover.salaryHigh },
  ]

  const filteredJobs = useMemo(() => {
    let result = jobs

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q)
      )
    }

    if (remoteFilter !== 'all') {
      result = result.filter(j => j.remote_reality === remoteFilter)
    }

    if (salaryFilter === 'disclosed') {
      result = result.filter(j => j.salary_min || j.salary_max)
    } else if (salaryFilter === 'high') {
      result = result.filter(j => (j.salary_min ?? 0) >= 100000 || (j.salary_max ?? 0) >= 100000)
    }

    if (sortBy === 'salary') {
      result = [...result].sort((a, b) => (b.salary_max ?? b.salary_min ?? 0) - (a.salary_max ?? a.salary_min ?? 0))
    }

    return result
  }, [jobs, search, remoteFilter, salaryFilter, sortBy])

  const fallbackReason =
    typeof stats.latestRun?.notes?.fallbackReason === 'string'
      ? stats.latestRun.notes.fallbackReason
      : null

  const dateFmtLocale = locale === 'pt' ? 'pt-BR' : 'en-US'

  async function handleAction(jobId: string, action: 'add' | 'ignore') {
    const res = await fetch('/api/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: jobId,
        status: action === 'ignore' ? 'discarded' : 'researching',
      }),
    })
    if (res.ok) {
      setJobs(prev => prev.filter(j => j.id !== jobId))
      router.refresh()
    }
  }

  async function loadMore() {
    if (!jobs.length) return
    setLoadingMore(true)
    const last = jobs[jobs.length - 1]
    const res = await fetch(
      `/api/jobs/undiscovered?before=${encodeURIComponent(last.created_at)}`
    )
    if (res.ok) {
      const { jobs: more, crawlerStats: refreshedStats } = await res.json()
      setJobs(prev => [...prev, ...more])
      setHasMore(more.length === 20)
      if (refreshedStats) {
        setStats(refreshedStats)
      }
    }
    setLoadingMore(false)
  }

  return (
    <div className="p-6">
      <div className="mb-6 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-emerald-50 p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
              {t.discover.crawlerMonitor}
            </p>
            <h1 className="mt-1 text-lg font-semibold text-slate-900">
              {getCrawlerRunHeadline(stats)}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {stats.latestRun
                ? t.discover.lastRun
                    .replace('{date}', new Date(stats.latestRun.completed_at).toLocaleString(dateFmtLocale))
                    .replace('{source}', formatCrawlerDiscoverySource(stats.latestRun.discovery_source))
                : t.discover.noRuns}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-white/80 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{t.discover.newJobs}</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.latestRun?.inserted_count ?? 0}</p>
            </div>
            <div className="rounded-xl bg-white/80 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{t.discover.duplicates}</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">{stats.latestRun?.duplicate_count ?? 0}</p>
            </div>
            <div className="rounded-xl bg-white/80 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{t.discover.scraped}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stats.latestRun?.scraped_count ?? 0}</p>
            </div>
            <div className="rounded-xl bg-white/80 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{t.discover.last7Days}</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">{stats.insertedLast7Days}</p>
            </div>
          </div>
        </div>

        {fallbackReason && (
          <p className="mt-3 text-xs text-slate-500">Fallback: {fallbackReason}</p>
        )}
      </div>

      {/* Search & Filters Bar */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.discover.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
          <span className="text-sm text-slate-500 flex-shrink-0">
            {t.discover.jobCount
              .replace('{count}', String(filteredJobs.length))
              .replace('{plural}', filteredJobs.length !== 1 ? 's' : '')}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">{t.discover.filters}</span>
          {REMOTE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setRemoteFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                remoteFilter === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <div className="w-px h-5 bg-slate-200 mx-1" />
          <select
            value={salaryFilter}
            onChange={e => setSalaryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SALARY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'newest' | 'salary')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">{t.discover.sortNewest}</option>
            <option value="salary">{t.discover.sortSalary}</option>
          </select>
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-sm text-slate-500 font-medium">{t.discover.noJobsFound}</p>
          <p className="text-xs text-slate-400 mt-1">
            {search || remoteFilter !== 'all' || salaryFilter !== 'all'
              ? t.discover.noJobsFilterHint
              : t.discover.noJobsNextRun}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredJobs.map(job => (
              <JobCard key={job.id} job={job} onAction={handleAction} />
            ))}
          </div>
          {hasMore && !search && remoteFilter === 'all' && salaryFilter === 'all' && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 text-sm text-slate-600 border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                {loadingMore ? t.discover.loadingMore : t.discover.loadMore}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
