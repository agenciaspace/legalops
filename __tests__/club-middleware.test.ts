// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const state = vi.hoisted(() => ({ user: null as { id: string } | null, member: {} as Record<string, unknown>, profileReads: 0 }))
vi.mock('@supabase/ssr', () => ({ createServerClient: () => ({
  auth: { getUser: async () => ({ data: { user: state.user } }) },
  from: (table: string) => {
    if (table === 'account_profiles') state.profileReads++
    const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: state.member }), single: async () => ({ data: { onboarding_completed: false } }) }
    return query
  },
}) }))
import { middleware } from '../middleware'
const request = (path: string) => middleware(new NextRequest(`https://legalops.club${path}`, { headers: { host: 'legalops.club' } }))
beforeEach(() => { state.user = null; state.member = {}; state.profileReads = 0 })
describe('Club admission and Pro routing', () => {
  it('allows signup and requires login for member content', async () => {
    expect((await request('/cadastro')).status).toBe(200)
    expect((await request('/community')).headers.get('location')).toContain('/login?next=')
  })
  it('sends accounts without membership to the professional profile', async () => {
    state.user = { id: 'new' }
    expect((await request('/community')).headers.get('location')).toBe('https://legalops.club/club/entrar')
  })
  it('allows free community access without career onboarding', async () => {
    state.user = { id: 'free' }; state.member = { club_access_status: 'active', club_pro_status: 'inactive' }
    for (const path of ['/community', '/community/members', '/community/profile', '/club/entrar']) expect((await request(path)).status).toBe(200)
    expect(state.profileReads).toBe(0)
  })
  it('blocks free users from Pro pages and AI APIs', async () => {
    state.user = { id: 'free' }; state.member = { club_access_status: 'active', club_pro_status: 'inactive' }
    expect((await request('/community/agents')).headers.get('location')).toBe('https://legalops.club/club#pro')
    expect((await request('/api/ai/cover-letter')).status).toBe(403)
    expect((await request('/api/pipeline/job/cv')).status).toBe(403)
  })
  it('allows Pro but keeps community access after Pro expires', async () => {
    state.user = { id: 'pro' }; state.member = { club_access_status: 'active', club_pro_status: 'active' }
    expect((await request('/community/agents')).status).toBe(200)
    state.member.club_pro_expires_at = '2000-01-01'
    expect((await request('/community/agents')).status).toBe(307)
    expect((await request('/community')).status).toBe(200)
  })
})
