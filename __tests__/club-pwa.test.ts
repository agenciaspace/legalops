// @vitest-environment node
import {readFileSync} from 'node:fs'
import {runInNewContext} from 'node:vm'
import {expect,it,vi} from 'vitest'
function worker(fetchImpl=vi.fn().mockResolvedValue(new Response('authenticated content'))) {
 const listeners:Record<string,Function>={}
 const match=vi.fn().mockResolvedValue(new Response('safe offline page'))
 const cache={match,addAll:vi.fn().mockResolvedValue(undefined)}
 const self={location:{origin:'https://legalops.club'},addEventListener:(name:string,fn:Function)=>listeners[name]=fn,skipWaiting:vi.fn(),clients:{claim:vi.fn()}}
 const caches={open:vi.fn().mockResolvedValue(cache),keys:vi.fn().mockResolvedValue([]),delete:vi.fn()}
 runInNewContext(readFileSync('public/club-sw.js','utf8'),{self,caches,fetch:fetchImpl,URL,Response})
 return {listeners,cache,caches,fetchImpl}
}
it('leaves mutations, API and RSC requests to the network without caching private content',()=>{
 const w=worker()
 for(const request of [{method:'POST',url:'https://legalops.club/community/bench',mode:'navigate'},{method:'GET',url:'https://legalops.club/api/club/agent',mode:'cors'},{method:'GET',url:'https://legalops.club/community?_rsc=test',mode:'cors'}]) {
  const respondWith=vi.fn();w.listeners.fetch({request,respondWith});expect(respondWith).not.toHaveBeenCalled()
 }
 expect(w.caches.open).not.toHaveBeenCalled()
})
it('serves authenticated navigation from network without storing it',async()=>{
 const w=worker();let pending:Promise<Response>|undefined
 w.listeners.fetch({request:{method:'GET',url:'https://legalops.club/community/bench',mode:'navigate'},respondWith:(p:Promise<Response>)=>pending=p})
 expect(await (await pending!).text()).toBe('authenticated content')
 expect(w.caches.open).not.toHaveBeenCalled()
})
it('returns only the generic offline page when the network is unavailable',async()=>{
 const w=worker(vi.fn().mockRejectedValue(new Error('offline')));let pending:Promise<Response>|undefined
 w.listeners.fetch({request:{method:'GET',url:'https://legalops.club/community/bench',mode:'navigate'},respondWith:(p:Promise<Response>)=>pending=p})
 expect(await (await pending!).text()).toBe('safe offline page')
 expect(w.cache.match).toHaveBeenCalledWith('/club-pwa/offline.html')
})
it('provides an installable manifest with resolvable 192 and 512 icons',()=>{
 const m=JSON.parse(readFileSync('public/club-pwa/manifest.webmanifest','utf8'))
 expect(m.display).toBe('standalone');expect(m.start_url).toBe('/community/calendar')
 for(const size of [192,512]) {const icon=m.icons.find((i:any)=>i.sizes===`${size}x${size}` && i.purpose==='any');const png=readFileSync(`public${icon.src}`);expect(png.readUInt32BE(16)).toBe(size);expect(png.readUInt32BE(20)).toBe(size)}
})
