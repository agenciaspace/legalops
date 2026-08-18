'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { BadgeCheck, Building2, MessageCircleMore, MousePointer2, Users, X } from 'lucide-react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { getInitials } from '@/lib/community'

type MemberIdentity = {
  userId: string
  displayName: string
  currentRole: string | null
  organizationName: string | null
  publicHeadline: string | null
  verified: boolean
}

type Point = { x: number; y: number }

type OfficePresence = MemberIdentity & {
  position: Point
  workingOn: string
  availableToTalk: boolean
  onlineAt: string
}

type BroadcastMove = {
  userId: string
  position: Point
}

const DESKS = [
  { x: 13, y: 18, rotate: -2 }, { x: 30, y: 18, rotate: 2 }, { x: 70, y: 18, rotate: -2 }, { x: 87, y: 18, rotate: 2 },
  { x: 13, y: 52, rotate: 2 }, { x: 30, y: 52, rotate: -2 }, { x: 70, y: 52, rotate: 2 }, { x: 87, y: 52, rotate: -2 },
]

function deterministicPoint(seed: string): Point {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  return {
    x: 18 + Math.abs(hash % 64),
    y: 24 + Math.abs((hash >> 3) % 50),
  }
}

function normalizePoint(point: Point): Point {
  return {
    x: Math.min(94, Math.max(6, point.x)),
    y: Math.min(90, Math.max(10, point.y)),
  }
}

function parsePresenceState(state: Record<string, unknown[]>): OfficePresence[] {
  const members: OfficePresence[] = []
  for (const entries of Object.values(state)) {
    const latest = entries.at(-1) as Partial<OfficePresence> | undefined
    if (!latest?.userId || !latest.displayName || !latest.position) continue
    members.push({
      userId: latest.userId,
      displayName: latest.displayName,
      currentRole: latest.currentRole ?? null,
      organizationName: latest.organizationName ?? null,
      publicHeadline: latest.publicHeadline ?? null,
      verified: Boolean(latest.verified),
      position: normalizePoint(latest.position),
      workingOn: typeof latest.workingOn === 'string' ? latest.workingOn : '',
      availableToTalk: Boolean(latest.availableToTalk),
      onlineAt: typeof latest.onlineAt === 'string' ? latest.onlineAt : new Date().toISOString(),
    })
  }
  return members
}

export function ClubOffice({ member }: { member: MemberIdentity }) {
  const supabase = useMemo(() => createClient(), [])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const selfRef = useRef<OfficePresence>({
    ...member,
    position: deterministicPoint(member.userId),
    workingOn: '',
    availableToTalk: false,
    onlineAt: new Date().toISOString(),
  })
  const [people, setPeople] = useState<OfficePresence[]>([selfRef.current])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [workingOn, setWorkingOn] = useState('')
  const [availableToTalk, setAvailableToTalk] = useState(false)
  const [connected, setConnected] = useState(false)

  const selected = people.find(person => person.userId === selectedUserId) ?? null

  async function track(next: Partial<OfficePresence> = {}) {
    selfRef.current = { ...selfRef.current, ...next, onlineAt: new Date().toISOString() }
    const channel = channelRef.current
    if (channel) await channel.track(selfRef.current)
    setPeople(current => {
      const withoutSelf = current.filter(person => person.userId !== member.userId)
      return [...withoutSelf, selfRef.current]
    })
  }

  useEffect(() => {
    const channel = supabase.channel('legalops-club-office-v1', {
      config: { presence: { key: member.userId } },
    })
    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const synced = parsePresenceState(channel.presenceState() as Record<string, unknown[]>)
        const merged = synced.some(person => person.userId === member.userId)
          ? synced
          : [...synced, selfRef.current]
        setPeople(merged)
      })
      .on('broadcast', { event: 'move' }, ({ payload }) => {
        const move = payload as BroadcastMove
        if (!move?.userId || !move?.position) return
        setPeople(current => current.map(person => person.userId === move.userId ? { ...person, position: normalizePoint(move.position) } : person))
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          setConnected(true)
          await channel.track(selfRef.current)
        }
      })

    return () => {
      channelRef.current = null
      setConnected(false)
      supabase.removeChannel(channel)
    }
  }, [member.userId, supabase])

  async function moveSelf(event: React.MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('[data-office-ui]')) return
    const rect = event.currentTarget.getBoundingClientRect()
    const position = normalizePoint({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    })
    await track({ position })
    await channelRef.current?.send({ type: 'broadcast', event: 'move', payload: { userId: member.userId, position } satisfies BroadcastMove })
  }

  async function saveStatus(event: FormEvent) {
    event.preventDefault()
    await track({ workingOn: workingOn.trim().slice(0, 100), availableToTalk })
  }

  const onlineCount = people.length

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <header className="flex flex-col gap-4 border-b border-[#D8D2C7] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#C9684F]">
            <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-[#AAA7A1]'}`} />
            escritório aberto
          </div>
          <h1 className="mt-2 text-[26px] font-extrabold tracking-[-0.035em] text-[#24231F]">Trabalhe junto, sem precisar marcar uma call.</h1>
          <p className="mt-1 max-w-[720px] text-xs leading-5 text-[#77746E]">Veja quem está por aqui, escolha onde ficar e compartilhe — se quiser — no que está trabalhando. Clique no piso para mover seu avatar.</p>
        </div>
        <div className="flex items-center gap-2 border border-[#D8D2C7] bg-[#FAF7F1] px-3 py-2 text-[10px] font-bold text-[#66635E]">
          <Users className="h-3.5 w-3.5" /> {onlineCount} {onlineCount === 1 ? 'pessoa agora' : 'pessoas agora'}
        </div>
      </header>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section
          onClick={moveSelf}
          className="relative aspect-[16/10] min-h-[500px] overflow-hidden border border-[#BEB7AA] bg-[#EEE8DC] shadow-[0_12px_40px_rgba(36,35,31,0.06)]"
          aria-label="Escritório virtual do LegalOps Club"
        >
          <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(36,35,31,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(36,35,31,.055)_1px,transparent_1px)] [background-size:32px_32px]" />
          <div className="absolute inset-x-[5%] top-[7%] h-[7%] border border-[#BFB7AA] bg-[#F8F4EC]" />
          <div className="absolute left-[43%] top-[33%] h-[24%] w-[14%] border-2 border-[#AFA79B] bg-[#D9CFC0] shadow-[5px_5px_0_rgba(36,35,31,.08)]" />
          <div className="absolute left-[46%] top-[37%] h-[3px] w-[8%] bg-[#AFA79B]" />
          <div className="absolute bottom-[7%] left-[8%] h-[13%] w-[23%] border border-[#B7AEA0] bg-[#C9B8A5]" />
          <div className="absolute bottom-[9%] left-[11%] h-[8%] w-[17%] border border-[#B7AEA0] bg-[#E88A6A]/30" />
          <div className="absolute bottom-[8%] right-[8%] h-[14%] w-[18%] rounded-[45%] border border-[#B7AEA0] bg-[#D9CFC0]" />
          <div className="absolute bottom-[12%] right-[14%] h-[6%] w-[6%] rounded-full bg-[#F5F1E8] shadow-[0_0_0_5px_rgba(175,167,155,.35)]" />

          {DESKS.map((desk, index) => (
            <div
              key={index}
              className="absolute h-[7%] w-[12%] -translate-x-1/2 -translate-y-1/2 border border-[#AFA79B] bg-[#D2C3B2] shadow-[4px_4px_0_rgba(36,35,31,.08)]"
              style={{ left: `${desk.x}%`, top: `${desk.y}%`, transform: `translate(-50%, -50%) rotate(${desk.rotate}deg)` }}
            >
              <div className="absolute left-[36%] top-[18%] h-[38%] w-[28%] border border-[#8E887F] bg-[#24231F]" />
              <div className="absolute bottom-[-22%] left-[36%] h-[30%] w-[28%] border border-[#AFA79B] bg-[#F5F1E8]" />
            </div>
          ))}

          {[{ x: 5, y: 6 }, { x: 93, y: 7 }, { x: 95, y: 88 }, { x: 5, y: 88 }].map((plant, index) => (
            <div key={index} className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#8D977E] bg-[#AEB99A] shadow-[0_5px_0_#C8B8A4]" style={{ left: `${plant.x}%`, top: `${plant.y}%` }} />
          ))}

          <div data-office-ui className="absolute left-3 top-3 border border-[#BEB7AA] bg-[#F8F4EC]/95 px-3 py-2 text-[9px] font-bold text-[#77746E] shadow-sm">
            <span className="flex items-center gap-1.5"><MousePointer2 className="h-3 w-3 text-[#C9684F]" /> clique em qualquer lugar livre</span>
          </div>

          {people.map(person => {
            const isSelf = person.userId === member.userId
            return (
              <button
                data-office-ui
                key={person.userId}
                type="button"
                onClick={() => setSelectedUserId(person.userId)}
                className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 text-left transition-[left,top] duration-500 ease-out"
                style={{ left: `${person.position.x}%`, top: `${person.position.y}%` }}
              >
                <span className={`relative flex h-9 w-9 items-center justify-center border-2 text-[10px] font-black shadow-[3px_3px_0_rgba(36,35,31,.18)] ${isSelf ? 'border-[#C9684F] bg-[#E88A6A] text-[#111]' : 'border-[#24231F] bg-[#F5F1E8] text-[#24231F]'}`}>
                  {getInitials(person.displayName)}
                  <span className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#EEE8DC] ${person.availableToTalk ? 'bg-emerald-500' : 'bg-[#A7A29A]'}`} />
                </span>
                <span className="absolute left-1/2 top-11 w-max max-w-[150px] -translate-x-1/2 border border-[#C8C0B5] bg-[#FAF7F1]/95 px-2 py-1 text-center text-[8px] font-extrabold text-[#393833] opacity-95 shadow-sm">
                  {isSelf ? 'você · ' : ''}{person.displayName.split(' ')[0]}
                </span>
                {person.workingOn ? <span className="absolute bottom-12 left-1/2 hidden w-max max-w-[190px] -translate-x-1/2 border border-[#24231F] bg-[#24231F] px-2.5 py-1.5 text-center text-[8px] font-semibold leading-3 text-white shadow-lg group-hover:block">{person.workingOn}</span> : null}
              </button>
            )
          })}
        </section>

        <aside className="space-y-4">
          <form onSubmit={saveStatus} className="border border-[#D8D2C7] bg-[#FAF7F1] p-4">
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#C9684F]">seu status</p>
            <label className="mt-3 block text-[10px] font-bold text-[#55524D]" htmlFor="office-working-on">No que você está trabalhando?</label>
            <textarea
              id="office-working-on"
              maxLength={100}
              rows={3}
              value={workingOn}
              onChange={event => setWorkingOn(event.target.value)}
              placeholder="Opcional. Escreva do seu jeito."
              className="mt-2 w-full resize-none border border-[#D8D2C7] bg-white px-3 py-2 text-xs leading-5 text-[#24231F] outline-none placeholder:text-[#AAA7A1] focus:border-[#C9684F]"
            />
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-[10px] font-semibold text-[#66635E]">
              <input type="checkbox" checked={availableToTalk} onChange={event => setAvailableToTalk(event.target.checked)} className="accent-[#C9684F]" />
              disponível para conversar
            </label>
            <button type="submit" className="mt-4 w-full bg-[#24231F] px-3 py-2.5 text-[10px] font-extrabold text-white hover:bg-black">Atualizar presença</button>
          </form>

          <div className="border border-[#D8D2C7] bg-[#F5F1E8] p-4 text-[10px] leading-5 text-[#77746E]">
            <p className="font-extrabold text-[#393833]">Sem atividades predefinidas.</p>
            <p className="mt-1">O espaço não tenta adivinhar seu trabalho. Você pode só ficar online, mover seu avatar ou compartilhar um status livre.</p>
          </div>
        </aside>
      </div>

      {selected ? (
        <div data-office-ui className="fixed inset-0 z-50 flex items-end justify-center bg-black/25 p-4 sm:items-center" onClick={() => setSelectedUserId(null)}>
          <article className="w-full max-w-[420px] border border-[#24231F] bg-[#F5F1E8] p-5 shadow-[10px_10px_0_rgba(36,35,31,.15)]" onClick={event => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center bg-[#24231F] text-xs font-black text-white">{getInitials(selected.displayName)}</div>
                <div>
                  <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-[#24231F]">{selected.displayName}{selected.verified ? <BadgeCheck className="h-4 w-4 text-[#C9684F]" /> : null}</h2>
                  <p className="mt-0.5 text-[10px] text-[#77746E]">{selected.currentRole || 'Profissional do jurídico'}</p>
                </div>
              </div>
              <button type="button" aria-label="Fechar" onClick={() => setSelectedUserId(null)} className="text-[#77746E] hover:text-[#24231F]"><X className="h-4 w-4" /></button>
            </div>
            {selected.organizationName ? <p className="mt-4 flex items-center gap-2 text-[10px] font-semibold text-[#66635E]"><Building2 className="h-3.5 w-3.5" /> {selected.organizationName}</p> : null}
            {selected.publicHeadline ? <p className="mt-3 text-xs leading-5 text-[#55524D]">{selected.publicHeadline}</p> : null}
            {selected.workingOn ? <div className="mt-4 border-l-2 border-[#E88A6A] bg-[#FAF7F1] px-3 py-2.5"><p className="text-[8px] font-black uppercase tracking-[0.12em] text-[#C9684F]">agora</p><p className="mt-1 text-xs leading-5 text-[#393833]">{selected.workingOn}</p></div> : null}
            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold">
              <span className={`h-2 w-2 rounded-full ${selected.availableToTalk ? 'bg-emerald-500' : 'bg-[#AAA7A1]'}`} />
              <span className="text-[#66635E]">{selected.availableToTalk ? 'Disponível para conversar' : 'Sem disponibilidade sinalizada'}</span>
            </div>
            {selected.userId !== member.userId ? <a href={`/community/members/${selected.userId}`} className="mt-5 inline-flex items-center gap-2 bg-[#E88A6A] px-3.5 py-2.5 text-[10px] font-extrabold text-[#24231F] hover:bg-[#DE7B5C]"><MessageCircleMore className="h-3.5 w-3.5" /> Ver perfil</a> : null}
          </article>
        </div>
      ) : null}
    </div>
  )
}
