import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
const mocks=vi.hoisted(()=>({fetch:vi.fn()}))
vi.mock('@/lib/supabase',()=>({createClient:()=>({auth:{signInWithOAuth:vi.fn()}})}))
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:vi.fn()})}))
import Signup from '@/app/cadastro/page'
const next='/contact/42499cb1-fd6f-4b45-aeac-9d10eea4c94d'
const signupCall=()=>mocks.fetch.mock.calls.find(call=>call[0]==='/api/auth/signup')
beforeEach(()=>{vi.clearAllMocks();window.history.replaceState({},'',`/cadastro?next=${encodeURIComponent(next)}`);mocks.fetch.mockResolvedValue(new Response(JSON.stringify({ok:true}),{status:200,headers:{'Content-Type':'application/json'}}));vi.stubGlobal('fetch',mocks.fetch)})
afterEach(()=>{cleanup();vi.unstubAllGlobals()})
it.each([next, '/community/events/bench-nubank-2026'])('returns through membership onboarding to %s',async(destinationPath)=>{
  window.history.replaceState({},'',`/cadastro?next=${encodeURIComponent(destinationPath)}`)
  render(<Signup/> )
  fireEvent.change(screen.getByLabelText('Email'),{target:{value:'test@example.com'}})
  fireEvent.change(screen.getByLabelText('Senha'),{target:{value:'testing-12345'}})
  fireEvent.click(screen.getByRole('button',{name:'Criar conta gratuita'}))
  await waitFor(()=>expect(signupCall()).toBeTruthy())
  const payload=JSON.parse(signupCall()![1].body)
  const destination=`/club/entrar?next=${encodeURIComponent(destinationPath)}`
  expect(payload.next).toBe(destination)
  expect(screen.getByRole('status').textContent).toContain('Confira seu email')
})
it('accepts eight lowercase characters and preserves the password when showing it',async()=>{
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
  expect(JSON.parse(signupCall()![1].body).password).toBe('floresta')
})
it.each([
  ['weak_password','Escolha outra senha'],
  ['over_email_send_rate_limit','Aguarde alguns minutos'],
  ['email_address_invalid','endereço de email'],
  ['email_delivery_failed','Não conseguimos enviar o email de confirmação'],
])('explains signup failure %s',async(code,message)=>{
  mocks.fetch.mockResolvedValue(new Response(JSON.stringify({code}),{status:400,headers:{'Content-Type':'application/json'}}))
  render(<Signup/> )
  fireEvent.change(screen.getByLabelText('Email'),{target:{value:'test@example.com'}})
  fireEvent.change(screen.getByLabelText('Senha'),{target:{value:'floresta'}})
  fireEvent.click(screen.getByRole('button',{name:'Criar conta gratuita'}))
  await waitFor(()=>expect(screen.getByRole('alert').textContent).toContain(message))
  expect(screen.getByRole('button',{name:'Criar conta gratuita'}).hasAttribute('disabled')).toBe(false)
})
