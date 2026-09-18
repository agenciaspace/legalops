import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
const mocks=vi.hoisted(()=>({signUp:vi.fn(),push:vi.fn(),refresh:vi.fn()}))
vi.mock('@/lib/supabase',()=>({createClient:()=>({auth:{signUp:mocks.signUp}})}))
vi.mock('next/navigation',()=>({useRouter:()=>({push:mocks.push,refresh:mocks.refresh})}))
import Signup from '@/app/cadastro/page'
const next='/contact/42499cb1-fd6f-4b45-aeac-9d10eea4c94d'
beforeEach(()=>{vi.clearAllMocks();window.history.replaceState({},'',`/cadastro?next=${encodeURIComponent(next)}`);mocks.signUp.mockResolvedValue({data:{session:{}},error:null})})
afterEach(cleanup)
it('submits signup and returns through membership onboarding to the scanned contact',async()=>{
  render(<Signup/> )
  fireEvent.change(screen.getByLabelText('Email'),{target:{value:'test@example.com'}})
  fireEvent.change(screen.getByLabelText('Senha'),{target:{value:'testing-12345'}})
  fireEvent.click(screen.getByRole('button',{name:'Criar conta gratuita'}))
  await waitFor(()=>expect(mocks.signUp).toHaveBeenCalledTimes(1))
  const options=mocks.signUp.mock.calls[0][0].options
  const destination=`/club/entrar?next=${encodeURIComponent(next)}`
  expect(new URL(options.emailRedirectTo).searchParams.get('next')).toBe(destination)
  expect(mocks.push).toHaveBeenCalledWith(destination)
})
