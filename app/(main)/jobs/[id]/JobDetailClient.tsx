'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RemoteBadge } from '@/components/RemoteBadge'
import { formatSalary } from '@/lib/format-salary'
import { StatusDropdown } from '@/components/StatusDropdown'
import { LeaderSection } from '@/components/LeaderSection'
import { NotesSection } from '@/components/NotesSection'
import { ContactsSection } from '@/components/ContactsSection'
import { TimelineSection } from '@/components/TimelineSection'
import { InterviewPrepSection } from '@/components/InterviewPrepSection'
import { CoverLetterSection } from '@/components/CoverLetterSection'
import { PaidPlanAgentsSection } from '@/components/PaidPlanAgentsSection'
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

  async function copyApplicationAlias() {
    if (!entry.email_alias?.address) {
      return
    }

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

      if (res.ok) {
        router.refresh()
      }
    }
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
      <Link href="/pipeline" className="text-xs text-[#FF6A00] hover:text-[#E65C00] transition-colors">
        ← Voltar ao pipeline
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-[#1A1A1A]">{job.title}</h1>
            <p className="text-[#1A1A1A]/60 text-sm">{job.company}</p>
            <div className="flex items-center gap-3 mt-2">
              <RemoteBadge reality={job.remote_reality} />
              <span className="text-xs text-[#1A1A1A]/50">
                Adicionada em {formatDate(entry.created_at)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusDropdown entryId={entry.id} currentStatus={entry.status} />
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-[#FF6A00] text-white text-sm font-bold rounded-xl hover:bg-[#E65C00] transition-colors"
            >
              Aplicar →
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-3 shadow-sm text-center">
          <p className="text-xs text-[#1A1A1A]/60">Salario</p>
          <p className="text-sm font-semibold text-[#1A1A1A] mt-0.5">{formatSalary(job)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-3 shadow-sm text-center">
          <p className="text-xs text-[#1A1A1A]/60">Contatos</p>
          <p className="text-sm font-semibold text-[#1A1A1A] mt-0.5">{contacts.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-3 shadow-sm text-center">
          <p className="text-xs text-[#1A1A1A]/60">Eventos</p>
          <p className="text-sm font-semibold text-[#1A1A1A] mt-0.5">{events.length}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-[#1A1A1A]/5 rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-[#1A1A1A] shadow-sm'
                : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]/70'
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
          <section className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-[#1A1A1A]/60 uppercase tracking-wider mb-3">Modalidade</h2>
            <div className="flex items-center gap-2">
              <RemoteBadge reality={job.remote_reality} />
              {job.remote_notes && (
                <span className="text-xs text-[#1A1A1A]/60">{job.remote_notes}</span>
              )}
            </div>
            {job.remote_label && (
              <p className="text-xs text-[#1A1A1A]/50 mt-1">Publicado como: &quot;{job.remote_label}&quot;</p>
            )}
          </section>

          {/* Benefits */}
          <section className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-[#1A1A1A]/60 uppercase tracking-wider mb-3">Beneficios</h2>
            {job.benefits.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {job.benefits.map((b, i) => (
                  <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium">{b}</span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#1A1A1A]/50">Nao divulgados</p>
            )}
          </section>

          {/* Direct Manager */}
          <section className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-[#1A1A1A]/60 uppercase tracking-wider mb-3">Gestor direto</h2>
            <LeaderSection entryId={entry.id} initialLeader={leader} />
          </section>

          <section className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-[#1A1A1A]/60 uppercase tracking-wider mb-3">
              Email da candidatura
            </h2>
            {entry.email_alias?.address ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">{entry.email_alias.address}</p>
                  <p className="text-xs text-[#1A1A1A]/60 mt-1">
                    Use este alias em formulários e replies desta vaga. O histórico chega na aba Emails.
                  </p>
                </div>
                <button
                  onClick={() => void copyApplicationAlias()}
                  className="rounded-xl border border-[#1A1A1A]/20 px-3 py-2 text-xs font-medium text-[#1A1A1A]/70 transition-colors hover:bg-[#1A1A1A]/5"
                >
                  {copiedAlias ? 'Copiado' : 'Copiar alias'}
                </button>
              </div>
            ) : (
              <p className="text-xs text-[#1A1A1A]/60">
                O alias será atribuído automaticamente quando a vaga for marcada como aplicada.
              </p>
            )}
          </section>

          {/* Notes */}
          <section className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-[#1A1A1A]/60 uppercase tracking-wider mb-3">Notas</h2>
            <NotesSection entryId={entry.id} initialNotes={notes} />
          </section>

          {/* Timeline */}
          <section className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-[#1A1A1A]/60 uppercase tracking-wider mb-3">Linha do tempo</h2>
            <TimelineSection entryId={entry.id} initialEvents={events} />
          </section>
        </div>
      )}

      {activeTab === 'ai-tools' && (
        <div className="space-y-4">
          <section className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-[#1A1A1A]/60 uppercase tracking-wider mb-3">
              Agentes especialistas
            </h2>
            <PaidPlanAgentsSection
              entryId={entry.id}
              userTier={userTier}
              currentStage={entry.status}
              settings={agentSettings}
            />
          </section>

          {/* Interview Prep */}
          <section className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-[#1A1A1A]/60 uppercase tracking-wider mb-3">
              Preparacao para entrevista
            </h2>
            <InterviewPrepSection entryId={entry.id} />
          </section>

          {/* Cover Letter */}
          <section className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-[#1A1A1A]/60 uppercase tracking-wider mb-3">
              Cover letter rapida
            </h2>
            <CoverLetterSection entryId={entry.id} />
          </section>
        </div>
      )}

      {activeTab === 'networking' && (
        <div className="space-y-4">
          {/* Contacts */}
          <section className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-[#1A1A1A]/60 uppercase tracking-wider mb-3">Contatos</h2>
            <ContactsSection entryId={entry.id} initialContacts={contacts} />
          </section>

          {/* Direct Manager */}
          <section className="bg-white rounded-2xl border border-[#1A1A1A]/10 p-5 shadow-sm">
            <h2 className="text-xs font-semibold text-[#1A1A1A]/60 uppercase tracking-wider mb-3">Gestor direto</h2>
            <LeaderSection entryId={entry.id} initialLeader={leader} />
          </section>
        </div>
      )}
    </div>
  )
}
