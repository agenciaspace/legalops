'use client'

import { useState, useCallback } from 'react'

interface Prefs {
  email_enabled: boolean
  whatsapp_enabled: boolean
  push_enabled: boolean
  email_address: string | null
  whatsapp_number: string | null
  notify_new_jobs: boolean
  notify_status_change: boolean
  notify_interview_reminder: boolean
  notify_follow_up_reminder: boolean
  notify_weekly_summary: boolean
  quiet_start_hour: number
  quiet_end_hour: number
}

interface LogEntry {
  id: string
  channel: string
  event_type: string
  title: string
  status: string
  error_message: string | null
  created_at: string
}

interface Props {
  initialPrefs: Prefs | null
  initialLogs: LogEntry[]
  userEmail: string
  vapidPublicKey: string
}

const DEFAULT_PREFS: Prefs = {
  email_enabled: false,
  whatsapp_enabled: false,
  push_enabled: false,
  email_address: null,
  whatsapp_number: null,
  notify_new_jobs: true,
  notify_status_change: true,
  notify_interview_reminder: true,
  notify_follow_up_reminder: true,
  notify_weekly_summary: true,
  quiet_start_hour: 22,
  quiet_end_hour: 8,
}

const CHANNEL_LABELS: Record<string, string> = {
  email: 'Email',
  whatsapp: 'WhatsApp',
  push: 'Push',
}

const CHANNEL_COLORS: Record<string, string> = {
  email: 'bg-blue-100 text-blue-700',
  whatsapp: 'bg-green-100 text-green-700',
  push: 'bg-purple-100 text-purple-700',
}

export function SettingsClient({ initialPrefs, initialLogs, userEmail, vapidPublicKey }: Props) {
  const [prefs, setPrefs] = useState<Prefs>(initialPrefs ?? { ...DEFAULT_PREFS, email_address: userEmail })
  const [logs] = useState<LogEntry[]>(initialLogs)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [pushStatus, setPushStatus] = useState<string | null>(null)

  const updatePref = useCallback(<K extends keyof Prefs>(key: K, value: Prefs[K]) => {
    setPrefs(p => ({ ...p, [key]: value }))
    setSaved(false)
  }, [])

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/notifications/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  async function handleTest(channel: string) {
    setTesting(channel)
    await fetch('/api/notifications/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel }),
    })
    setTesting(null)
  }

  async function handlePushSubscribe() {
    if (!vapidPublicKey) {
      setPushStatus('VAPID keys nao configuradas no servidor.')
      return
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setPushStatus('Permissao de notificacao negada.')
        return
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      const res = await fetch('/api/notifications/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      })

      if (res.ok) {
        updatePref('push_enabled', true)
        setPushStatus('Push notifications ativadas com sucesso!')
      } else {
        setPushStatus('Erro ao registrar push subscription.')
      }
    } catch (err) {
      setPushStatus('Erro: ' + (err as Error).message)
    }
  }

  function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
      <label className="flex items-center justify-between cursor-pointer">
        <span className="text-sm text-slate-700">{label}</span>
        <button
          type="button"
          onClick={() => onChange(!checked)}
          className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
              checked ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </label>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Configuracoes</h1>
        <p className="text-sm text-slate-500">Gerencie suas notificacoes e alertas</p>
      </div>

      {/* Channels */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
        <h2 className="text-sm font-semibold text-slate-700">Canais de notificacao</h2>

        {/* Email */}
        <div className="space-y-2 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <Toggle checked={prefs.email_enabled} onChange={v => updatePref('email_enabled', v)} label="Email" />
            </div>
          </div>
          {prefs.email_enabled && (
            <div className="ml-10 flex gap-2">
              <input
                type="email"
                value={prefs.email_address ?? ''}
                onChange={e => updatePref('email_address', e.target.value)}
                placeholder="seu@email.com"
                className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleTest('email')}
                disabled={testing !== null || !prefs.email_address}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
              >
                {testing === 'email' ? '...' : 'Testar'}
              </button>
            </div>
          )}
        </div>

        {/* WhatsApp */}
        <div className="space-y-2 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.96 7.96 0 01-4.19-1.19l-.3-.18-3.12.82.83-3.04-.2-.31A7.96 7.96 0 014 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z" />
              </svg>
            </div>
            <div className="flex-1">
              <Toggle checked={prefs.whatsapp_enabled} onChange={v => updatePref('whatsapp_enabled', v)} label="WhatsApp" />
            </div>
          </div>
          {prefs.whatsapp_enabled && (
            <div className="ml-10 space-y-1">
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={prefs.whatsapp_number ?? ''}
                  onChange={e => updatePref('whatsapp_number', e.target.value)}
                  placeholder="+5511999999999"
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={() => handleTest('whatsapp')}
                  disabled={testing !== null || !prefs.whatsapp_number}
                  className="px-3 py-1.5 text-xs font-medium text-green-600 border border-green-200 rounded-lg hover:bg-green-50 disabled:opacity-50 transition-colors"
                >
                  {testing === 'whatsapp' ? '...' : 'Testar'}
                </button>
              </div>
              <p className="text-xs text-slate-400">Formato E.164: +55 + DDD + numero</p>
            </div>
          )}
        </div>

        {/* Push */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="flex-1">
              <Toggle checked={prefs.push_enabled} onChange={v => updatePref('push_enabled', v)} label="Push Notifications" />
            </div>
          </div>
          {prefs.push_enabled && (
            <div className="ml-10 space-y-2">
              <button
                onClick={handlePushSubscribe}
                className="px-3 py-1.5 text-xs font-medium text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
              >
                Ativar push neste navegador
              </button>
              {pushStatus && <p className="text-xs text-slate-500">{pushStatus}</p>}
              <button
                onClick={() => handleTest('push')}
                disabled={testing !== null}
                className="px-3 py-1.5 text-xs font-medium text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 disabled:opacity-50 transition-colors ml-2"
              >
                {testing === 'push' ? '...' : 'Testar'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Event Types */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Tipos de alerta</h2>
        <Toggle checked={prefs.notify_new_jobs} onChange={v => updatePref('notify_new_jobs', v)} label="Novas vagas descobertas" />
        <Toggle checked={prefs.notify_status_change} onChange={v => updatePref('notify_status_change', v)} label="Mudancas de status no pipeline" />
        <Toggle checked={prefs.notify_interview_reminder} onChange={v => updatePref('notify_interview_reminder', v)} label="Lembretes de entrevista" />
        <Toggle checked={prefs.notify_follow_up_reminder} onChange={v => updatePref('notify_follow_up_reminder', v)} label="Lembretes de follow-up" />
        <Toggle checked={prefs.notify_weekly_summary} onChange={v => updatePref('notify_weekly_summary', v)} label="Resumo semanal" />
      </section>

      {/* Quiet Hours */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-slate-700">Horario silencioso (UTC)</h2>
        <p className="text-xs text-slate-400">Nenhuma notificacao sera enviada durante este periodo.</p>
        <div className="flex items-center gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Inicio</label>
            <select
              value={prefs.quiet_start_hour}
              onChange={e => updatePref('quiet_start_hour', parseInt(e.target.value))}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
          <span className="text-slate-400 mt-5">ate</span>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Fim</label>
            <select
              value={prefs.quiet_end_hour}
              onChange={e => updatePref('quiet_end_hour', parseInt(e.target.value))}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {saving ? 'Salvando...' : 'Salvar configuracoes'}
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">Salvo com sucesso!</span>}
      </div>

      {/* Notification History */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Historico de notificacoes</h2>
        {logs.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Nenhuma notificacao enviada ainda.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {logs.map(log => (
              <div key={log.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${CHANNEL_COLORS[log.channel] ?? 'bg-slate-100 text-slate-600'}`}>
                  {CHANNEL_LABELS[log.channel] ?? log.channel}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 truncate">{log.title}</p>
                  <p className="text-xs text-slate-400">{log.event_type}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-xs font-medium ${log.status === 'sent' ? 'text-green-600' : 'text-red-500'}`}>
                    {log.status === 'sent' ? 'Enviada' : 'Falhou'}
                  </span>
                  <p className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}
