import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,expect,it,vi} from 'vitest'
vi.mock('next/navigation',()=>({usePathname:()=>'/community',useSearchParams:()=>new URLSearchParams()}))
vi.mock('next/dynamic',()=>({default:()=>function Chat(){return <textarea aria-label="Persistent draft"/>}}))
import {AgentBubble} from '@/components/community/AgentBubble'
afterEach(cleanup)
it('opens one conversation on demand and preserves its draft when closed and reopened',async()=>{
 render(<AgentBubble hasPro/>)
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
 const trigger=screen.getByRole('button',{name:'Abrir meu agente'});fireEvent.click(trigger)
 const draft=screen.getByRole('textbox',{name:'Persistent draft'});fireEvent.change(draft,{target:{value:'Contexto em andamento'}})
 fireEvent.keyDown(document,{key:'Escape'});expect(screen.queryByRole('dialog')).not.toBeInTheDocument();expect(trigger).toHaveFocus()
 fireEvent.click(trigger);expect(screen.getByRole('textbox')).toHaveValue('Contexto em andamento')
 expect(screen.getAllByRole('dialog')).toHaveLength(1)
})
it('shows availability only on opening the bubble for a member without Pro',()=>{
 render(<AgentBubble hasPro={false}/>);expect(screen.queryByText(/faz parte do Pro/)).not.toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'Abrir meu agente'}));expect(screen.getByRole('link',{name:'Consultar disponibilidade'})).toHaveAttribute('href','/club/checkout')
 expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
})
