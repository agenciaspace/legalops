// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const state=vi.hoisted(()=>({authReads:0}))
vi.mock('@supabase/ssr',()=>({createServerClient:()=>({auth:{getUser:async()=>{state.authReads++;return {data:{user:null}}}}})}))
import { middleware } from '@/middleware'
beforeEach(()=>{state.authReads=0})
it('serves the News host without an Auth dependency and preserves filters',async()=>{
 const response=await middleware(new NextRequest('https://legalops.news/escritorios?assunto=governanca',{headers:{host:'legalops.news'}}))
 expect(response.headers.get('x-middleware-rewrite')).toBe('https://legalops.news/news/escritorios?assunto=governanca')
 expect(response.headers.get('x-middleware-request-x-club-locale')).toBe('pt-BR')
 expect(state.authReads).toBe(0)
})
it('keeps the public Club fallback reachable and moderation authenticated',async()=>{
 for(const path of ['/news','/news/noticias/some-story','/api/news/subscribe'])expect((await middleware(new NextRequest(`https://legalops.club${path}`,{headers:{host:'legalops.club'}}))).status).toBe(200)
 expect(state.authReads).toBe(0)
 expect((await middleware(new NextRequest('https://legalops.club/api/news/admin',{headers:{host:'legalops.club'}}))).status).toBe(401)
 expect((await middleware(new NextRequest('https://legalops.club/community/news',{headers:{host:'legalops.club'}}))).headers.get('location')).toContain('/login')
})
