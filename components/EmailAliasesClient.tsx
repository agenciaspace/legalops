'use client'

import { useMemo, useState } from 'react'
import {
  getEmailTierPolicy,
  getRemainingAliasSlots,
  sortEmailAliases,
} from '@/lib/email-aliases'
import type { EmailMessageWithAlias } from '@/lib/email-types'
import { getEmailMessageOccurredAt, getEmailMessagePreview } from '@/lib/email-messages'
import type { UserEmailAlias, UserTier } from '@/lib/types'

interface EmailAliasesClientProps {
  initialAliases: UserEmailAlias[]
  initialMessages: EmailMessageWithAlias[]
  initialTier: UserTier
}

export function EmailAliasesClient({
  initialAliases,
  initialMessages,
  initialTier,
}: EmailAliasesClientProps) {
  const [aliases, setAliases] = useState(() => sortEmailAliases(initialAliases))
  const [messages, setMessages] = useState(() => initialMessages)
  const [customLocalPart, setCustomLocalPart] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<'random' | 'custom' | null>(null)
  const [updatingAliasId, setUpdatingAliasId] = useState<string | null>(null)

  const policy = getEmailTierPolicy(initialTier)
  const activeAliases = useMemo(
    () => aliases.filter(alias => alias.status === 'active'),
    [aliases]
  )
  const remainingSlots = getRemainingAliasSlots(initialTier, activeAliases.length)

  async function createAlias(source: 'random' | 'custom') {
    setError(null)
    setSubmitting(source)

    const res = await fetch('/api/email-aliases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source,
        localPart: source === 'custom' ? customLocalPart : undefined,
      }),
    })

    const payload = await res.json().catch(() => null)
    setSubmitting(null)

    if (!res.ok) {
      setError(payload?.error ?? 'Failed to create email alias.')
      return
    }

    setAliases(current => sortEmailAliases([...current, payload.alias]))
    setCustomLocalPart('')
  }

  async function updateAlias(aliasId: string, body: Record<string, unknown>) {
    setError(null)
    setUpdatingAliasId(aliasId)

    const res = await fetch(`/api/email-aliases/${aliasId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const payload = await res.json().catch(() => null)
    setUpdatingAliasId(null)

    if (!res.ok) {
      setError(payload?.error ?? 'Failed to update email alias.')
      return
    }

    if (Array.isArray(payload?.aliases)) {
      setAliases(sortEmailAliases(payload.aliases))
      return
    }

    setAliases(current =>
      sortEmailAliases(
        current.map(alias => (alias.id === aliasId ? payload.alias : alias))
      )
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Email aliases</h1>
        <p className="text-sm text-slate-500">
          Gerencie os aliases de candidatura e acompanhe aqui as respostas recebidas em cada vaga aplicada.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Plan rules</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Current tier</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                {initialTier}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Active aliases</span>
              <span className="font-medium text-slate-900">
                {activeAliases.length} / {policy.maxActiveAliases}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Random aliases</span>
              <span className="font-medium text-slate-900">
                {policy.allowsRandomAliases ? 'Enabled' : 'Unavailable'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Custom aliases</span>
              <span className="font-medium text-slate-900">
                {policy.allowsCustomAliases ? 'Enabled' : 'Paid only'}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Create alias</h2>
          <p className="mt-1 text-sm text-slate-500">
            Remaining active slots: {remainingSlots}
          </p>

          <div className="mt-4 flex flex-col gap-3">
            <button
              onClick={() => createAlias('random')}
              disabled={submitting !== null || remainingSlots === 0}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting === 'random' ? 'Creating random alias...' : 'Create random alias'}
            </button>

            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="your-team"
                value={customLocalPart}
                onChange={event => setCustomLocalPart(event.target.value)}
                disabled={!policy.allowsCustomAliases || submitting !== null}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              />
              <button
                onClick={() => createAlias('custom')}
                disabled={!policy.allowsCustomAliases || submitting !== null || remainingSlots === 0}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting === 'custom' ? 'Creating custom alias...' : 'Create custom alias'}
              </button>
            </div>
          </div>

          {!policy.allowsCustomAliases && (
            <p className="mt-3 text-xs text-amber-700">
              Free users can provision a single random alias. Paid users can create branded custom aliases.
            </p>
          )}
        </div>
      </section>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Provisioned aliases</h2>
        </div>

        {aliases.length === 0 ? (
          <div className="px-5 py-8 text-sm text-slate-500">
            No aliases provisioned yet. Create one to start routing replies into your inbox.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {aliases.map(alias => (
              <div
                key={alias.id}
                className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">{alias.address}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-700">
                      {alias.source}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        alias.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {alias.status}
                    </span>
                    {alias.is_primary && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        primary
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Created {new Date(alias.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => updateAlias(alias.id, { makePrimary: true })}
                    disabled={
                      alias.is_primary ||
                      alias.status !== 'active' ||
                      updatingAliasId === alias.id
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Make primary
                  </button>
                  <button
                    onClick={() =>
                      updateAlias(alias.id, {
                        status: alias.status === 'active' ? 'disabled' : 'active',
                      })
                    }
                    disabled={updatingAliasId === alias.id}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updatingAliasId === alias.id
                      ? 'Saving...'
                      : alias.status === 'active'
                        ? 'Disable'
                        : 'Reactivate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Recent mailbox activity</h2>
        </div>

        {messages.length === 0 ? (
          <div className="px-5 py-8 text-sm text-slate-500">
            No inbound or outbound messages yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {messages.map(message => (
              <details key={message.id} className="group px-5 py-4">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            message.direction === 'inbound'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {message.direction}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {message.status}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {message.alias.address}
                        </span>
                      </div>
                      <p className="font-medium text-slate-900">
                        {message.subject || '(no subject)'}
                      </p>
                      <p className="text-sm text-slate-600">
                        {message.direction === 'inbound'
                          ? `From ${message.from_name ? `${message.from_name} <${message.from_address}>` : message.from_address}`
                          : `From ${message.from_address} to ${message.to_addresses.join(', ')}`}
                      </p>
                      {message.reply_to_address && message.direction === 'outbound' && (
                        <p className="text-xs text-slate-500">
                          Reply-To: {message.reply_to_address}
                        </p>
                      )}
                      <p className="text-sm text-slate-500">
                        {getEmailMessagePreview(message)}
                      </p>
                    </div>

                    <p className="text-xs text-slate-500">
                      {new Date(getEmailMessageOccurredAt(message)).toLocaleString()}
                    </p>
                  </div>
                </summary>

                <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                  <pre className="whitespace-pre-wrap font-sans leading-6">
                    {message.text_body || getEmailMessagePreview(message, 4000)}
                  </pre>
                  {message.error_message && (
                    <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {message.error_message}
                    </p>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
