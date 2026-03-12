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
import { TrackingEmailBadge } from '@/components/TrackingEmailBadge'
import type { PipelineEntryWithJob, Leader, JobNote, Contact, ApplicationEvent } from '@/lib/types'

interface Props {
  entry: PipelineEntryWithJob
  leader: Leader | null
  notes: JobNote[]
  contacts: Contact[]
  events: ApplicationEvent[]
}

type Tab = 'overview' | 'ai-tools' | 'networking'

export function JobDetailClient({ entry, leader, notes, contacts, events }: Props) {
  const router = useRouter()
  const job = entry.job
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  async function handleApply() {
    window.open(job.url, '_blank', 'noopener')
    if (entry.status === 'researching') {
      await fetch(`/api/pipeline/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'applied' }),
      })
      router.refresh()
    }
  }

  function formatSalary(): string {
    if (!job.salary_min && !job.salary_max) return 'Nao divulgado'
    const cur = job.salary_currency ?? ''
    if (job.salary_min && job.salary_max)
      return `${cur} ${job.salary_min.toLocaleString()} – ${job.salary_max.toLocaleString()}`
    return `${cur} ${(job.salary_min ?? job.salary_max)!.toLocaleString()}`
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Visao geral' },
    { id: 'ai-tools', label: 'Ferramentas IA' },
    { id: 'networking', label: 'Networking' },
  ]

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      {/* Back link */}
      <Link href="/pipeline" className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
        ← Voltar ao pipeline
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
                Adicionada em {formatDate(entry.created_at)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusDropdown entryId={entry.id} currentStatus={entry.status} />
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Aplicar →
            </button>
          </div>
        </div>
      </div>

      {/* Tracking Emails */}
      {entry.tracking_email && (
        <TrackingEmailBadge
          trackingEmail={entry.tracking_email}
          customEmail={entry.custom_email}
        />
      )}

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm text-center">
          <p className="text-xs text-slate-500">Salario</p>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">{formatSalary()}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm text-center">
          <p className="text-xs text-slate-500">Contatos</p>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">{contacts.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm text-center">
          <p className="text-xs text-slate-500">Eventos</p>
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
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Modalidade</h2>
            <div className="flex items-center gap-2">
              <RemoteBadge reality={job.remote_reality} />
              {job.remote_notes && (
                <span className="text-xs text-slate-500">{job.remote_notes}</span>
              )}
            </div>
            {job.remote_label && (
              <p className="text-xs text-slate-400 mt-1">Publicado como: &quot;{job.remote_label}&quot;</p>
            )}
          </section>

          {/* Benefits */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Beneficios</h2>
            {job.benefits.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {job.benefits.map((b, i) => (
                  <span key={i} className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium">{b}</span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Nao divulgados</p>
            )}
          </section>

          {/* Direct Manager */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Gestor direto</h2>
            <LeaderSection entryId={entry.id} initialLeader={leader} />
          </section>

          {/* Notes */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Notas</h2>
            <NotesSection entryId={entry.id} initialNotes={notes} />
          </section>

          {/* Timeline */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Linha do tempo</h2>
            <TimelineSection entryId={entry.id} initialEvents={events} />
          </section>
        </div>
      )}

      {activeTab === 'ai-tools' && (
        <div className="space-y-4">
          {/* Interview Prep */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Preparacao para entrevista
            </h2>
            <InterviewPrepSection entryId={entry.id} />
          </section>

          {/* Cover Letter */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Cover letter
            </h2>
            <CoverLetterSection entryId={entry.id} />
          </section>
        </div>
      )}

      {activeTab === 'networking' && (
        <div className="space-y-4">
          {/* Contacts */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Contatos</h2>
            <ContactsSection entryId={entry.id} initialContacts={contacts} />
          </section>

          {/* Direct Manager */}
          <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Gestor direto</h2>
            <LeaderSection entryId={entry.id} initialLeader={leader} />
          </section>
        </div>
      )}
    </div>
  )
}
