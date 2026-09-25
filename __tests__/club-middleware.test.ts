// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const state = vi.hoisted(() => ({ user: null as { id: string } | null, member: {} as Record<string, unknown>, authReads: 0, profileReads: 0, refresh: false }))
vi.mock('@supabase/ssr', () => ({ createServerClient: (_url: string, _key: string, options: any) => ({
  auth: { getUser: async () => { state.authReads++; if(state.refresh)options.cookies.setAll([{name:'refreshed-session',value:'test-token',options:{path:'/',httpOnly:true}}]); return { data: { user: state.user } } } },
  from: (table: string) => {
    if (table === 'account_profiles') state.profileReads++
    const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: state.member }), single: async () => ({ data: { onboarding_completed: false } }) }
    return query
  },
}) }))
import { middleware } from '../middleware'
const request = (path: string) => middleware(new NextRequest(`https://legalops.club${path}`, { headers: { host: 'legalops.club' } }))
beforeEach(() => { state.user = null; state.member = {}; state.authReads = 0; state.profileReads = 0; state.refresh = false })
it('resumes installed root launches automatically and preserves refreshed session cookies',async()=>{
  state.user={id:'member'};state.member={club_access_status:'active',avatar_path:'member/photo.jpg'};state.refresh=true
  const root=await request('/')
  expect(root.headers.get('location')).toBe('https://legalops.club/community')
  expect(root.cookies.get('refreshed-session')?.value).toBe('test-token')
  expect((await request('/login')).cookies.get('refreshed-session')?.value).toBe('test-token')
  // Pricing links remain accessible to signed-in members.
  expect((await request('/club')).status).toBe(200)
})
it('keeps the public landing for guests and sends incomplete accounts to admission',async()=>{
  expect((await request('/')).headers.get('x-middleware-rewrite')).toBe('https://legalops.club/club')
  state.user={id:'new'}
  expect((await request('/')).headers.get('location')).toBe('https://legalops.club/club/entrar')
})
it('allows QR landing and downloads to enforce their own contact privacy, while keeping settings private', async () => {
  const id = '42499cb1-fd6f-4b45-aeac-9d10eea4c94d'
  for (const suffix of ['', '/qr', '/vcard']) expect((await request(`/contact/${id}${suffix}`)).status).toBe(200)
  expect((await request('/community/contact')).headers.get('location')).toContain('/login')
  expect((await request(`/contact/${id}/admin`)).headers.get('location')).toContain('/login')
})
describe('Club admission and Pro routing', () => {
  it('allows signup and requires login for member content', async () => {
    expect((await request('/cadastro')).status).toBe(200)
    expect((await request('/api/auth/signup')).status).toBe(200)
    expect((await request('/community')).headers.get('location')).toContain('/login?next=')
  })
  it('sends accounts without membership to the professional profile', async () => {
    state.user = { id: 'new' }
    expect((await request('/community')).headers.get('location')).toBe('https://legalops.club/club/entrar')
  })
  it('allows free community access without career onboarding', async () => {
    state.user = { id: 'free' }; state.member = { club_access_status: 'active', club_pro_status: 'inactive', avatar_path:'free/photo.jpg' }
    for (const path of ['/community', '/community/members', '/community/profile', '/club/entrar']) expect((await request(path)).status).toBe(200)
    expect(state.profileReads).toBe(4) // Locale preferences are read; career onboarding is not required.
  })
  it('keeps legacy members without a photo active while they complete their profile', async () => {
    state.user = { id: 'legacy' }; state.member = { club_access_status: 'active', club_pro_status: 'inactive', avatar_path:null }
    for (const path of ['/', '/community', '/community/members', '/community/profile', '/api/club/avatar']) {
      const response = await request(path)
      if (path === '/') expect(response.headers.get('location')).toBe('https://legalops.club/community')
      else expect(response.status).toBe(200)
    }
  })
  it('blocks free users from Pro pages and AI APIs', async () => {
    state.user = { id: 'free' }; state.member = { club_access_status: 'active', club_pro_status: 'inactive', avatar_path:'free/photo.jpg' }
    expect((await request('/community/jobs')).headers.get('location')).toBe('https://legalops.club/club#pro')
    expect((await request('/api/ai/cover-letter')).status).toBe(403)
    expect((await request('/api/pipeline/job/cv')).status).toBe(403)
  })
  it('allows Pro but keeps community access after Pro expires', async () => {
    state.user = { id: 'pro' }; state.member = { club_access_status: 'active', club_pro_status: 'active', avatar_path:'pro/photo.jpg' }
    expect((await request('/community/jobs')).status).toBe(200)
    state.member.club_pro_expires_at = '2000-01-01'
    expect((await request('/community/jobs')).status).toBe(307)
    expect((await request('/community')).status).toBe(200)
  })
})

it('exposes only the exact Bench intake path and keeps moderation authenticated', async () => {
  expect((await request('/api/bench/contributions')).status).toBe(200)
  expect((await request('/api/bench/contributions/admin')).status).toBe(401)
  expect((await request('/club/admin/bench')).headers.get('location')).toContain('/login?next=')
})

it('serves the reviewed public event snapshot without waiting for Supabase', async () => {
  const response = await request('/community/events/bench-honorarios-exito-2026')
  expect(response.status).toBe(200)
  expect(response.headers.get('x-middleware-request-x-public-event-fallback')).toBe('bench-honorarios-exito-2026')
  expect(state.authReads).toBe(0)
})

it('serves public PWA assets without exposing community data', async () => {
  for (const path of ['/icon.svg','/icon.svg?brand=current','/club-sw.js','/club-pwa/manifest.webmanifest','/club-pwa/offline.html','/club-pwa/icon-192.png']) expect((await request(path)).status).toBe(200)
  expect((await request('/club-pwa/private')).headers.get('location')).toContain('/login')
  expect((await request('/community/bench')).headers.get('location')).toContain('/login')
  state.user={id:'free'};state.member={club_access_status:'active',club_pro_status:'inactive',avatar_path:'free/photo.jpg'}
  expect((await request('/community/pro')).status).toBe(200)
  expect((await request('/community/assistant')).status).toBe(200)
})
