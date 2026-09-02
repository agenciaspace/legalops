import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PixCheckoutCard } from '@/components/PixCheckoutCard'

describe('PixCheckoutCard', () => {
  it('copies the PIX key and exposes the proof email action', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    render(<PixCheckoutCard amount={199} />)

    fireEvent.click(screen.getByRole('button', { name: 'Copiar' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('leonhatori@gmail.com'))
    expect(screen.getByRole('button', { name: 'Copiado' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /enviar comprovante/i })).toHaveAttribute(
      'href',
      expect.stringContaining('mailto:leonhatori@gmail.com'),
    )
  })
})
