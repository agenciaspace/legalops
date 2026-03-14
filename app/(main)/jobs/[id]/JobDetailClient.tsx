'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RemoteBadge } from '@/components/RemoteBadge'
import { StatusDropdown } from '@/components/StatusDropdown'
import { LeaderSection } from '@/components/LeaderSection'
import { NotesSection } from '@/components/NotesSection'
import { ContactsSection } from '@/components/ContactsSection'
import { TimelineSection } from '@/components/TimelineSection'
import { InterviewPrepSection } from '@/components/InterviewPrepSection'
import { CoverLetterSection } from '@/components/CoverLetterSection'
import { PaidPlanAgentsSection } from '@/components/PaidPlanAgentsSection'
import { useLocale } from '@/components/LocaleProvider'
import type { PaidAgentSettings } from '@/lib/paid-agent-settings'
import type {
  PipelineEntryWithJob,
  Leader,
  JobNote,
  Contact,
  ApplicationEvent,
  UserTier,
} from '@/lib/types'

interface Props {
  entry: PipelineEntryWithJob
  leader: Leader | null
  notes: JobNote[]
  contacts: Contact[]
  events: ApplicationEvent[]
  userTier: UserTier
  agentSettings: PaidAgentSettings
}

type Tab = 'overview' | 'ai-tools' | 'networking'

export function JobDetailClient({
  entry,
  leader,
  notes,
  contacts,
  events,
  userTier,
  agentSettings,
}: Props) {
  const router = useRouter()
  const job = entry.job
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [copiedAlias, setCopiedAlias] = useState(false)
  const { locale, t } = useLocale()

  const dateFmtLocale = locale === 'pt' ? 'pt-BR' : 'en-US'

  async function copyApplicationAlias() {
    if (!entry.email_alias?.address) return
    try {
      await navigator.clipboard.writeText(entry.email_alias.address)
      setCopiedAlias(true)
      window.setTimeout(() => setCopiedAlias(false), 2000)
    } catch {}
  }

  async function handleApply() {
    window.open(job.url, '_blank', 'noopener')
    if (entry.status === 'researching' || !entry.email_alias_id) {
      const res = await fetch(`/api/pipeline/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'applied' }),
      })
      if (res.ok) router.refresh()
    }
  }

  function formatSalary(): string {
    if (!job.salary_min && !job.salary_max) return t.common.salaryNotDisclosed
    const cur = job.salary_currency ?? ''
    if (job.salary_min && job.salary_max)
      return `${cur} ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}`
    return `${cur} ${(job.salary_min ?? job.salary_max)!.toLocaleString()}`
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(dateFmtLocale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: t.jobDetail.tabOverview },
    { id: 'ai-tools', label: t.jobDetail.tabAITools },
    { id: 'networking', label: t.jobDetail.tabNetworking },
  ]

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      {/* Back link */}
      <Link href="/pipeline" className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
        {t.jobDetail.backToPipeline}
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{job.title}</h1>
            <p className="text-slate-500 text-sm">{job.company}</p>
            <div className="flex items-center gap-3 mt-2">
              <RemoteBadge reality={job.remote_reality} />
              <span className="text-xs text-slate-400">
                {t.jobDetail.addedOn.replace('{date}', formatDate(entry.created_at))}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusDropdown entryId={entry.id} currentStatus={entry.status} />
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t.jobDetail.apply}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm text-center">
          <p className="text-xs text-slate-500">{t.jobDetail.salary}</p>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">{formatSalary()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm text-center">
          <p className="text-xs text-slate-500">{t.jobDetail.contacts}</p>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">{contacts.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm text-center">
          <p className="text-xs text-slate-500">{t.jobDetail.events}</p>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">{events.length}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Remote */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t.jobDetail.modality}</h2>
            <div className="flex items-center gap-2">
              <RemoteBadge reality={job.remote_reality} />
              {job.remote_notes && (
                <span className="text-xs text-slate-500">{job.remote_notes}</span>
              )}
            </div>
            {job.remote_label && (
              <p className="text-xs text-slate-400 mt-1">{t.jobDetail.publishedAs.replace('{label}', job.remote_label)}</p>
            )}
          </section>

          {/* Benefits */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t.jobDetail.benefits}</h2>
            {job.benefits.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {job.benefits.map((b, i) => (
                  <span key={i} className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium">{b}</span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">{t.common.benefitsNotDisclosed}</p>
            )}
          </section>

          {/* Direct Manager */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t.jobDetail.directManager}</h2>
            <LeaderSection entryId={entry.id} initialLeader={leader} />
          </section>

          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              {t.jobDetail.applicationEmail}
            </h2>
            {entry.email_alias?.address ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{entry.email_alias.address}</p>
                  <p className="text-xs text-slate-500 mt-1">{t.jobDetail.aliasHint}</p>
                </div>
                <button
                  onClick={() => void copyApplicationAlias()}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  {copiedAlias ? t.jobDetail.copied : t.jobDetail.copyAlias}
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500">{t.jobDetail.aliasAutoAssign}</p>
            )}
          </section>

          {/* Notes */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t.jobDetail.notes}</h2>
            <NotesSection entryId={entry.id} initialNotes={notes} />
          </section>

          {/* Timeline */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t.jobDetail.timeline}</h2>
            <TimelineSection entryId={entry.id} initialEvents={events} />
          </section>
        </div>
      )}

      {activeTab === 'ai-tools' && (
        <div className="space-y-4">
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              {t.jobDetail.specialistAgents}
            </h2>
            <PaidPlanAgentsSection
              entryId={entry.id}
              userTier={userTier}
              currentStage={entry.status}
              settings={agentSettings}
            />
          </section>

          {/* Interview Prep */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              {t.jobDetail.interviewPrep}
            </h2>
            <InterviewPrepSection entryId={entry.id} />
          </section>

          {/* Cover Letter */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              {t.jobDetail.coverLetterQuick}
            </h2>
            <CoverLetterSection entryId={entry.id} />
          </section>
        </div>
      )}

      {activeTab === 'networking' && (
        <div className="space-y-4">
          {/* Contacts */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t.jobDetail.contacts}</h2>
            <ContactsSection entryId={entry.id} initialContacts={contacts} />
          </section>

          {/* Direct Manager */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t.jobDetail.directManager}</h2>
            <LeaderSection entryId={entry.id} initialLeader={leader} />
          </section>
        </div>
      )}
    </div>
  )
}
