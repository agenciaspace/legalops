import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,expect,it,vi} from 'vitest'
vi.mock('next/navigation',()=>({usePathname:()=>'/community',useSearchParams:()=>new URLSearchParams(),useRouter:()=>({push:vi.fn(),refresh:vi.fn()})}))
vi.mock('next/dynamic',()=>({default:()=>function Chat(){return <textarea aria-label="Persistent draft"/>}}))
vi.mock('@/components/community/MapNotifications',()=>({MapNotifications:()=>null}))
vi.mock('@/components/community/MemberAvatar',()=>({MemberAvatar:()=> <span>LH</span>}))
import {Nav} from '@/components/Nav'
import {AgentBubble} from '@/components/community/AgentBubble'
afterEach(cleanup)
it('opens one conversation from the header and preserves its draft when closed and reopened',async()=>{
 render(<><Nav isClubMember discoverCount={0} jobAlertCount={0} hasClubAccess/><AgentBubble hasPro/></>)
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
 const trigger=screen.getByRole('button',{name:'Abrir meu agente'});trigger.focus();fireEvent.click(trigger)
 const draft=screen.getByRole('textbox',{name:'Persistent draft'});fireEvent.change(draft,{target:{value:'Contexto em andamento'}})
 fireEvent.keyDown(document,{key:'Escape'});expect(screen.queryByRole('dialog')).not.toBeInTheDocument();expect(trigger).toHaveFocus()
 fireEvent.click(trigger);expect(screen.getByRole('textbox')).toHaveValue('Contexto em andamento')
 expect(screen.getAllByRole('dialog')).toHaveLength(1)
})
it('shows availability only on opening the header agent for a member without Pro',()=>{
 render(<><Nav isClubMember discoverCount={0} jobAlertCount={0} hasClubAccess={false}/><AgentBubble hasPro={false}/></>);expect(screen.queryByText(/faz parte do Pro/)).not.toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'Abrir meu agente'}));expect(screen.getByRole('link',{name:'Consultar disponibilidade'})).toHaveAttribute('href','/club/checkout')
 expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
})

it('keeps the agent launcher out of incomplete community onboarding',()=>{
 render(<Nav discoverCount={0} jobAlertCount={0} hasClubAccess={false} isClubMember={false}/>)
 expect(screen.queryByRole('button',{name:'Abrir meu agente'})).not.toBeInTheDocument()
})
