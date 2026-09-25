import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

vi.mock('@/lib/club-locale-server', () => ({
  getClubTranslator: () => (text: string) => text,
}))

import { ProfileCompletionNotice } from '@/components/community/ProfileCompletionNotice'

afterEach(cleanup)

it('reminds incomplete members without blocking the community', () => {
  render(<ProfileCompletionNotice visible />)
  expect(screen.getByRole('status')).toHaveTextContent('Complete seu perfil')
  expect(screen.getByRole('link', { name: /Completar agora/ })).toHaveAttribute('href', '/community/profile#verification')
})

it('stays hidden after the profile becomes complete', () => {
  render(<ProfileCompletionNotice visible={false} />)
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})
