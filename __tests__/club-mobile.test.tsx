import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
const state=vi.hoisted(()=>({path:'/community/bench',search:new URLSearchParams(),confirm:vi.fn(),decline:vi.fn()}))
vi.mock('next/navigation',()=>({usePathname:()=>state.path,useSearchParams:()=>state.search}))
vi.mock('@/app/(main)/community/actions',()=>({confirmBenchAttendance:state.confirm,declineBenchAttendance:state.decline}))
import {CommunityTabs} from '@/components/community/CommunityTabs'
import BenchClient from '@/app/(main)/community/bench/BenchClient'
import {ClubPwa} from '@/components/community/ClubPwa'
afterEach(cleanup)
beforeEach(()=>{vi.clearAllMocks();state.path='/community/bench';state.search=new URLSearchParams()})
it('separates Posts, Bench and Pro, and limits post categories to the feed',()=>{
  const {rerender}=render(<CommunityTabs />)
  expect(screen.getAllByRole('link',{name:/Bench/})[0]).toHaveAttribute('aria-current','page')
  expect(screen.queryByText('Assuntos dos posts')).not.toBeInTheDocument()
  expect(screen.queryByText('Assinar Pro →')).not.toBeInTheDocument()
  state.path='/community';rerender(<CommunityTabs />)
  expect(screen.getByText('Assuntos dos posts')).toBeInTheDocument()
  state.path='/community/assistant';rerender(<CommunityTabs />)
  expect(screen.getAllByRole('link',{name:/Pro/})[0]).toHaveAttribute('aria-current','page')
})
it('opens the mobile menu and restores focus on Escape',()=>{
  render(<CommunityTabs />)
  const button=screen.getByRole('button',{name:'Mais'});fireEvent.click(button)
  expect(screen.getByRole('dialog',{name:'Mais opções do Club'})).toBeInTheDocument()
  fireEvent.keyDown(document,{key:'Escape'})
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();expect(button).toHaveFocus()
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
  render(<ClubPwa />);fireEvent.click(screen.getByRole('button',{name:'Instalar app'}))
  expect(screen.getByText(/No iPhone/)).toBeInTheDocument()
})
