import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CompanyLogo } from '@/components/CompanyLogo'
import { curatedCompanyLogoUrl, resolveCompanyLogoUrl } from '@/lib/company-logo'

describe('CompanyLogo', () => {
  it('shows the remote company logo and falls back to initials when it fails', () => {
    render(
      <CompanyLogo
        company="Acme Legal"
        logoUrl="https://media.licdn.com/acme-logo.png"
      />,
    )

    const image = screen.getByRole('img', { name: 'Logo da Acme Legal' })
    expect(image).toHaveAttribute('src', 'https://media.licdn.com/acme-logo.png')

    fireEvent.error(image)
    expect(screen.getByText('AL')).toBeInTheDocument()
  })

  it('uses initials when no logo is available', () => {
    render(<CompanyLogo company="Grupo NC" logoUrl={null} />)
    expect(screen.getByText('GN')).toBeInTheDocument()
  })

  it('uses a curated stable logo for a known company', () => {
    render(<CompanyLogo company="Wellhub" logoUrl={null} />)
    expect(screen.getByRole('img', { name: 'Logo da Wellhub' }))
      .toHaveAttribute('src', 'https://wellhub.com/image/favicon.svg')
  })

  it('uses a neutral local mark for a confidential employer', () => {
    render(<CompanyLogo company="Empresa Confidencial" logoUrl={null} />)
    expect(screen.getByRole('img', { name: 'Logo da Empresa Confidencial' }))
      .toHaveAttribute('src', '/company-logos/confidential.svg')
  })

  it('keeps curated URLs ahead of temporary discovery URLs', () => {
    expect(curatedCompanyLogoUrl('Radar da Gestão')).toBe('https://radardagestao.com.br/metadata/icon.png')
    expect(resolveCompanyLogoUrl('Natura', 'https://media.licdn.com/temporary.jpg'))
      .toBe('https://www.natura.com.br/natura/favicon.png')
  })
})
