import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
const mocks=vi.hoisted(()=>({signUp:vi.fn(),push:vi.fn(),refresh:vi.fn()}))
vi.mock('@/lib/supabase',()=>({createClient:()=>({auth:{signUp:mocks.signUp}})}))
vi.mock('next/navigation',()=>({useRouter:()=>({push:mocks.push,refresh:mocks.refresh})}))
import Signup from '@/app/cadastro/page'
const next='/contact/42499cb1-fd6f-4b45-aeac-9d10eea4c94d'
beforeEach(()=>{vi.clearAllMocks();window.history.replaceState({},'',`/cadastro?next=${encodeURIComponent(next)}`);mocks.signUp.mockResolvedValue({data:{session:{}},error:null})})
afterEach(cleanup)
it.each([next, '/community/events/bench-nubank-2026'])('returns through membership onboarding to %s',async(destinationPath)=>{
  window.history.replaceState({},'',`/cadastro?next=${encodeURIComponent(destinationPath)}`)
  render(<Signup/> )
  fireEvent.change(screen.getByLabelText('Email'),{target:{value:'test@example.com'}})
  fireEvent.change(screen.getByLabelText('Senha'),{target:{value:'testing-12345'}})
  fireEvent.click(screen.getByRole('button',{name:'Criar conta gratuita'}))
  await waitFor(()=>expect(mocks.signUp).toHaveBeenCalledTimes(1))
  const options=mocks.signUp.mock.calls[0][0].options
  const destination=`/club/entrar?next=${encodeURIComponent(destinationPath)}`
  expect(new URL(options.emailRedirectTo).searchParams.get('next')).toBe(destination)
  expect(mocks.push).toHaveBeenCalledWith(destination)
})
it('accepts eight lowercase characters and preserves the password when showing it',async()=>{
  mocks.signUp.mockResolvedValue({data:{session:null},error:null})
  render(<Signup/> )
  fireEvent.change(screen.getByLabelText('Email'),{target:{value:'test@example.com'}})
  const password=screen.getByLabelText('Senha') as HTMLInputElement
  fireEvent.change(password,{target:{value:'floresta'}})
  expect(password.checkValidity()).toBe(true)
  fireEvent.click(screen.getByRole('button',{name:'Mostrar senha'}))
  expect(password.type).toBe('text')
  expect(password.value).toBe('floresta')
  fireEvent.click(screen.getByRole('button',{name:'Criar conta gratuita'}))
  await waitFor(()=>expect(screen.getByRole('status').textContent).toContain('Confira seu email'))
  expect(mocks.signUp.mock.calls[0][0].password).toBe('floresta')
})
it.each([
  [{code:'weak_password',message:'weak'},'Escolha outra senha'],
  [{code:'over_email_send_rate_limit',message:'limit'},'Aguarde alguns minutos'],
  [{code:'email_address_invalid',message:'invalid'},'endereço de email'],
  [{status:500,message:'Error sending confirmation email'},'Não conseguimos enviar o email de confirmação'],
])('explains signup failure %j',async(error,message)=>{
  mocks.signUp.mockResolvedValue({data:{session:null},error})
  render(<Signup/> )
  fireEvent.change(screen.getByLabelText('Email'),{target:{value:'test@example.com'}})
  fireEvent.change(screen.getByLabelText('Senha'),{target:{value:'floresta'}})
  fireEvent.click(screen.getByRole('button',{name:'Criar conta gratuita'}))
  await waitFor(()=>expect(screen.getByRole('alert').textContent).toContain(message))
  expect(screen.getByRole('button',{name:'Criar conta gratuita'}).hasAttribute('disabled')).toBe(false)
})
