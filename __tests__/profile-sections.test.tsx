import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { ProfileSections } from '@/components/community/ProfileSections'

afterEach(cleanup)
function profileForm() {
  return render(<form aria-label="Perfil"><ProfileSections
    publicFields={<label>Nome<input name="full_name" required defaultValue="Ana" /></label>}
    careerFields={<label>CV<textarea name="base_cv_text" defaultValue="Experiência profissional" /></label>}
    preferences={<label><input type="checkbox" name="job_alerts_enabled" defaultChecked />Alertas</label>}
  /><button>Salvar perfil</button></form>)
}
it('keeps public, career and preference values in the same submission when switching tabs', () => {
  profileForm()
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Ana Bento' } })
  fireEvent.click(screen.getByRole('tab', { name: 'Carreira' }))
  fireEvent.change(screen.getByLabelText('CV'), { target: { value: 'Novo resumo de carreira' } })
  fireEvent.click(screen.getByRole('tab', { name: 'Preferências' }))
  const data = new FormData(screen.getByRole('form', { name: 'Perfil' }) as HTMLFormElement)
  expect(data.get('full_name')).toBe('Ana Bento')
  expect(data.get('base_cv_text')).toBe('Novo resumo de carreira')
  expect(data.get('job_alerts_enabled')).toBe('on')
  expect(screen.getByRole('button', { name: 'Salvar perfil' })).toBeVisible()
})
it('opens the public panel and focuses a missing required field from another tab', async () => {
  profileForm()
  const name = screen.getByLabelText('Nome')
  fireEvent.change(name, { target: { value: '' } })
  fireEvent.click(screen.getByRole('tab', { name: 'Carreira' }))
  fireEvent.invalid(name)
  await waitFor(() => expect(name).toHaveFocus())
  expect(screen.getByRole('tab', { name: 'Perfil público' })).toHaveAttribute('aria-selected', 'true')
})
it('supports keyboard navigation between profile panels', () => {
  profileForm()
  fireEvent.keyDown(screen.getByRole('tab', { name: 'Perfil público' }), { key: 'End' })
  expect(screen.getByRole('tab', { name: 'Preferências' })).toHaveFocus()
  expect(screen.getByRole('tab', { name: 'Preferências' })).toHaveAttribute('aria-selected', 'true')
})
it('keeps the first invalid visible field active when another panel also has an invalid field', () => {
  render(<form><ProfileSections publicFields={<input aria-label="Nome" required />} careerFields={<input aria-label="Cargo desejado" required />} preferences={null} /></form>)
  fireEvent.invalid(screen.getByLabelText('Nome'))
  fireEvent.invalid(screen.getByLabelText('Cargo desejado'))
  expect(screen.getByRole('tab', { name: 'Perfil público' })).toHaveAttribute('aria-selected', 'true')
})
