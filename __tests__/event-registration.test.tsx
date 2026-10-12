import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { EventRegistrationForm } from '@/components/community/EventRegistrationForm'
vi.mock('react-dom', async importOriginal => ({ ...await importOriginal<typeof import('react-dom')>(), useFormStatus: () => ({ pending: false }) }))
afterEach(cleanup)

it('validates each stage and preserves all fields and optional consent when going back', () => {
  const { container } = render(<EventRegistrationForm action={vi.fn()} intro={<input type="hidden" name="event_id" value="event" />} contact={<><label>Email<input name="email" type="email" required /></label></>} professional={<><label>Cargo<input name="role" required /></label><label>Club<input type="checkbox" name="join_club" /></label></>} footer={null} />)
  const form = container.querySelector('form')!
  expect(fireEvent.submit(form)).toBe(false)
  expect(screen.getByRole('textbox', { name: 'Email' })).toBeVisible()
  expect(screen.queryByRole('textbox', { name: 'Cargo' })).toBeNull()
  fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), { target: { value: 'teste@example.com' } })
  expect(fireEvent.submit(form)).toBe(false)
  expect(screen.getByRole('heading', { name: 'Seu contexto profissional' })).toHaveFocus()
  expect(fireEvent.submit(form)).toBe(false)
  fireEvent.change(screen.getByRole('textbox', { name: 'Cargo' }), { target: { value: 'Advogado' } })
  expect(screen.getByRole('checkbox')).not.toBeChecked()
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
  expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('teste@example.com')
  fireEvent.submit(form)
  expect(screen.getByRole('textbox', { name: 'Cargo' })).toHaveValue('Advogado')
  expect(Object.fromEntries(new FormData(form))).toEqual({ event_id: 'event', email: 'teste@example.com', role: 'Advogado', join_club: 'on' })
  expect(fireEvent.submit(form)).toBe(true)
})
