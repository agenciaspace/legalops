import {expect,it,vi} from 'vitest'
import {render,screen,cleanup} from '@testing-library/react'
const mocks=vi.hoisted(()=>({redirect:vi.fn(),rows:[] as any[]}))
vi.mock('next/navigation',()=>({redirect:mocks.redirect}))
vi.mock('@/app/(main)/community/calendar/BenchSection',()=>({default:()=> <section id="bench"><h2>Bench</h2></section>}))
vi.mock('@/lib/supabase-server',()=>({createServerSupabaseClient:async()=>({from:()=>({select:()=>({eq:()=>({gte:()=>({order:async()=>({data:mocks.rows})})})})})})}))
import EventsPage from '@/app/(main)/community/calendar/page'
import LegacyBench from '@/app/(main)/community/bench/page'
it('places Bench under Events and keeps the featured meeting out of duplicate event cards',async()=>{
 mocks.rows=[{id:'bench',slug:'bench-nubank-2026-09-17',title:'Featured Bench event'}]
 render(await EventsPage())
 expect(screen.getByRole('heading',{level:1,name:'Eventos'})).toBeInTheDocument()
 expect(screen.getByRole('heading',{level:2,name:'Bench'})).toBeInTheDocument()
 expect(screen.getByRole('link',{name:'Bench'})).toHaveAttribute('href','#bench')
 expect(screen.queryByText('Featured Bench event')).not.toBeInTheDocument()
 cleanup()
})
it('preserves the old Bench address with a redirect to its Events section',()=>{
 LegacyBench();expect(mocks.redirect).toHaveBeenCalledWith('/community/calendar#bench')
})
