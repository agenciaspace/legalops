import { describe, expect, it } from 'vitest'
import { COMMUNITY_AGENTS, getCommunityAgent } from '@/lib/community-agents'

describe('Community agents', () => {
  it('assigns exactly one specialist to every community category', () => {
    expect(COMMUNITY_AGENTS).toHaveLength(14)
    expect(new Set(COMMUNITY_AGENTS.map(agent => agent.category)).size).toBe(14)
  })

  it('falls back to the general operator for unknown spaces', () => {
    expect(getCommunityAgent('unknown-space').category).toBe('discussao')
  })
})
