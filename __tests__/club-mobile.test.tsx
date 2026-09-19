import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react'
const state=vi.hoisted(()=>({path:'/community/calendar',search:new URLSearchParams(),confirm:vi.fn(),decline:vi.fn()}))
vi.mock('next/navigation',()=>({usePathname:()=>state.path,useSearchParams:()=>state.search}))
vi.mock('@/app/(main)/community/actions',()=>({confirmBenchAttendance:state.confirm,declineBenchAttendance:state.decline}))
import {CommunityTabs} from '@/components/community/CommunityTabs'
import BenchClient from '@/app/(main)/community/bench/BenchClient'
import {ClubPwa} from '@/components/community/ClubPwa'
afterEach(cleanup)
beforeEach(()=>{vi.clearAllMocks();state.path='/community/calendar';state.search=new URLSearchParams()})
it('keeps Community, Events and Resources in the primary navigation',()=>{
 render(<CommunityTabs />)
 const nav=within(screen.getByRole('navigation',{name:'Áreas do Club'}))
 expect(nav.getAllByRole('link')).toHaveLength(3)
 expect(nav.getByRole('link',{name:'Recursos'})).toHaveAttribute('href','/community/tools')
 expect(nav.getByRole('link',{name:'Comunidade'})).toHaveAttribute('href','/community')
 expect(nav.getByRole('link',{name:'Eventos'})).toHaveAttribute('aria-current','page')
 expect(screen.queryByText('Assuntos dos posts')).not.toBeInTheDocument()
 expect(screen.queryByRole('link',{name:'Pro'})).not.toBeInTheDocument()
 expect(screen.queryByRole('link',{name:'Meu agente'})).not.toBeInTheDocument()
})
it('preserves confirmed attendance and form values after a failed cancellation',async()=>{
  state.decline.mockRejectedValue(new Error('offline'))
  render(<BenchClient eventId="event" initial={{response:'confirmed',organization_name:'Example'}} member={{name:'Synthetic',role:'Legal Ops',email:'test@example.invalid'}} />)
  fireEvent.click(screen.getByRole('button',{name:'Não poderei ir'}))
  await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível salvar'))
  expect(screen.getByRole('button',{name:'Atualizar confirmação'})).toBeEnabled()
  expect(screen.getByRole('textbox',{name:/Empresa/})).toHaveValue('Example')
})
it('does not claim cancellation succeeded when the server denies it',async()=>{
  state.decline.mockResolvedValue({ok:false,message:'Não foi possível atualizar agora.'})
  render(<BenchClient eventId="event" initial={{response:'confirmed'}} member={{name:'Synthetic',role:'Legal Ops',email:'test@example.invalid'}} />)
  fireEvent.click(screen.getByRole('button',{name:'Não poderei ir'}))
  await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível atualizar'))
  expect(screen.getByRole('button',{name:'Atualizar confirmação'})).toBeInTheDocument()
})
it('offers installation instructions when no native prompt is available',()=>{
  Object.defineProperty(window,'matchMedia',{configurable:true,value:()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()})})
  state.path='/community/profile';render(<ClubPwa />);fireEvent.click(screen.getByRole('button',{name:'Instalar app'}))
  expect(screen.getByText(/No iPhone/)).toBeInTheDocument()
})
