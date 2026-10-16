// @vitest-environment node
import { expect, it, vi } from 'vitest'
vi.mock('@/lib/supabase-admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/openrouter', () => ({ generateOpenRouterText: vi.fn() }))
import { chatFailureCode, chatStepFailureMessage } from '@/lib/chat/engine'
it('classifies failures without exposing provider bodies or document text', () => {
  expect(
    chatFailureCode(
      new Error('OpenRouter request failed with 429: private provider body'),
    ),
  ).toBe('provider_429')
  expect(
    chatFailureCode(new SyntaxError('Unexpected token near private document')),
  ).toBe('invalid_json')
  expect(chatFailureCode(new Error('private source body'))).toBe(
    'unexpected_error',
  )
  expect(chatFailureCode(new Error('invalid_citation'))).toBe(
    'invalid_citation',
  )
  const timeout = new Error('upstream delay')
  timeout.name = 'TimeoutError'
  expect(chatFailureCode(timeout)).toBe('provider_timeout')
})
it('does not promise another retry after the third attempt', () => {
  expect(chatStepFailureMessage('invalid_citation', 2)).toContain(
    'tentar novamente',
  )
  expect(chatStepFailureMessage('invalid_citation', 3)).toContain(
    'três tentativas terminaram',
  )
  expect(chatStepFailureMessage('invalid_json', 3)).not.toContain(
    'Vamos tentar',
  )
})
