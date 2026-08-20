import { describe, expect, it } from 'vitest'
import { extractOpenCodeGoResponseText } from '@/lib/opencode-go'

describe('OpenCode Go response helpers', () => {
  it('extracts text from string and multipart content', () => {
    expect(extractOpenCodeGoResponseText('Resumo')).toBe('Resumo')
    expect(extractOpenCodeGoResponseText([
      { type: 'text', text: 'Parte 1' },
      { type: 'reasoning', text: 'ignorar' },
      { type: 'text', text: 'Parte 2' },
    ])).toBe('Parte 1\nParte 2')
  })
})
