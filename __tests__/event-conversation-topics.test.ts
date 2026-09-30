import { expect, it } from 'vitest'
import { NETLEX_EVENT_CONVERSATION_TOPICS } from '@/lib/event-conversation-topics'

it('organizes the NetLex Bench into focused conversations while WhatsApp remains general', () => {
  expect(NETLEX_EVENT_CONVERSATION_TOPICS).toHaveLength(5)
  expect(new Set(NETLEX_EVENT_CONVERSATION_TOPICS.map(topic => topic.title)).size).toBe(5)
  expect(NETLEX_EVENT_CONVERSATION_TOPICS.map(topic => topic.title)).toEqual(expect.arrayContaining([
    'Implantação e roll-out',
    'Integrações e dados',
    'Governançã, segurança e permissões',
    'Adoção, suporte e valor',
  ]))
})
