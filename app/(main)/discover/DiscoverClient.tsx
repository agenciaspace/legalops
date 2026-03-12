'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { JobCard } from '@/components/JobCard'
import type { Job } from '@/lib/types'

export function DiscoverClient({ initialJobs }: { initialJobs: Job[] }) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialJobs.length === 20)
  const router = useRouter()

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
      const { jobs: more } = await res.json()
      setJobs(prev => [...prev, ...more])
      setHasMore(more.length === 20)
    }
    setLoadingMore(false)
  }

  if (jobs.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p className="text-sm">No new jobs found.</p>
        <p className="text-xs mt-1 text-slate-400">Next search runs tomorrow at 7am.</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        New Jobs ({jobs.length})
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {jobs.map(job => (
          <JobCard key={job.id} job={job} onAction={handleAction} />
        ))}
      </div>
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}
