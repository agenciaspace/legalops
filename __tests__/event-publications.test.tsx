import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { EventPublications } from '@/components/community/EventPublications'
import { fileMatchesType, groupEventPublications, type EventResource } from '@/lib/event-publications'

afterEach(cleanup)
const resource = (id: string, overrides = {}): EventResource => ({ id, publication_id: 'batch', uploader_id: 'member', title: `Encontro · ${id}.jpg`, description: 'Uma ótima troca!', kind: 'foto', storage_path: `event/member/${id}.jpg`, resource_url: null, created_at: '2026-09-17T15:00:00Z', ...overrides })
it('renders one post with author and caption once for multiple inline photos', () => {
  render(<EventPublications resources={[resource('one'), resource('two')]} authors={[{user_id:'member',display_name:'Ana',avatar_path:null,current_role:'Jurídico',organization_name:'Empresa'}]} />)
  expect(screen.getAllByRole('article')).toHaveLength(1)
  expect(screen.getAllByText('Uma ótima troca!')).toHaveLength(1)
  expect(screen.getAllByRole('img')).toHaveLength(2)
  expect(screen.getByText('Jurídico · Empresa')).toBeInTheDocument()
  expect(screen.queryByText('Encontro · one.jpg')).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Ampliar foto 1 de 2' })).toHaveAttribute('href','/api/community/events/resources/one')
})
it('does not let a shared group ID attribute another member’s files to the author', () => {
  expect(groupEventPublications([resource('one'), resource('two', { uploader_id: 'other' })])).toHaveLength(2)
})
it('keeps separate publications and renders document downloads without photo thumbnails', () => {
  render(<EventPublications resources={[resource('one',{kind:'documento',title:'Resumo.pdf'}),resource('two',{publication_id:'other',kind:'documento',title:'Pauta.docx'})]} authors={[]} />)
  expect(screen.getAllByRole('article')).toHaveLength(2)
  expect(screen.queryAllByRole('img')).toHaveLength(0)
  expect(screen.getByRole('link',{name:/Resumo.pdf.*Abrir/})).toHaveAttribute('href','/api/community/events/resources/one?download=1')
})
it('rejects disguised content and accepts the supported binary signatures', () => {
  expect(fileMatchesType(new TextEncoder().encode('<script>'), 'image/jpeg')).toBe(false)
  expect(fileMatchesType(Uint8Array.from([255,216,255,224]), 'image/jpeg')).toBe(true)
  expect(fileMatchesType(new TextEncoder().encode('%PDF-1.7'), 'application/pdf')).toBe(true)
  expect(fileMatchesType(new Uint8Array(), 'image/png')).toBe(false)
})
