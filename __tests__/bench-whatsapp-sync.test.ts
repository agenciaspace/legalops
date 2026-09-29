import { describe, expect, it } from 'vitest'
import { benchSchedulePrompt, extractExplicitBenchSchedule, parseBenchScheduleDecision, validateBenchSyncInput } from '@/lib/bench-whatsapp-sync'

const now = new Date('2026-09-29T18:00:00Z')
const messages = [
  { id: '1', at: '2026-09-25T23:20:35Z', author: 'Alexander', text: 'Vamos de 15/10 as 19h então' },
  { id: '2', at: '2026-09-29T17:36:04Z', author: 'Alexander', text: 'Prezados, na sequência o invite será enviado. Ficamos para dia 14, as 19' },
]

describe('Bench WhatsApp schedule sync', () => {
  it('accepts only the allowlisted group and recent source messages', () => {
    expect(validateBenchSyncInput({ action: 'sync-bench-event', group_id: '120363412671923182@g.us', messages }, now)?.messages).toHaveLength(2)
    expect(validateBenchSyncInput({ action: 'sync-bench-event', group_id: 'other-group', messages }, now)).toBeNull()
  })

  it('keeps source content fenced and asks for the latest final decision', () => {
    const prompt = benchSchedulePrompt(messages, now, 'America/Sao_Paulo')
    expect(prompt).toContain('A confirmação mais recente substitui datas cogitadas antes')
    expect(prompt).toContain('Ficamos para dia 14')
  })

  it('deterministically resolves the latest explicit confirmation from earlier month context', () => {
    expect(extractExplicitBenchSchedule(messages, 'America/Sao_Paulo')).toEqual({
      confirmed: true,
      startsAt: '2026-10-14T22:00:00.000Z',
      endsAt: null,
      sourceMessageIds: ['1', '2'],
    })
  })

  it('parses a sourced future decision and rejects invented sources', () => {
    expect(parseBenchScheduleDecision(JSON.stringify({ confirmed: true, starts_at: '2026-10-14T19:00:00-03:00', ends_at: null, source_message_ids: ['1', '2'] }), messages, now)).toEqual({
      confirmed: true,
      startsAt: '2026-10-14T22:00:00.000Z',
      endsAt: null,
      sourceMessageIds: ['1', '2'],
    })
    expect(parseBenchScheduleDecision(JSON.stringify({ confirmed: true, starts_at: '2026-10-14T19:00:00-03:00', ends_at: null, source_message_ids: ['missing'] }), messages, now)).toBeNull()
  })
})
