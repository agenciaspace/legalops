import { generateOpenRouterText } from '@/lib/openrouter'

export type LocalGeneration = { model: 'claude-cli/sonnet', text: string }
type GenerationInput = Parameters<typeof generateOpenRouterText>[0]

export function isLocalGeneration(value: unknown): value is LocalGeneration {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return item.model === 'claude-cli/sonnet' && typeof item.text === 'string'
    && item.text.trim().length > 0 && item.text.length <= 12000
}

// Only the bearer-protected runner receives this request, never a public reader.
export class LocalGenerationRequired extends Error {
  constructor(readonly request: { system: string, prompt: string }) {
    super('Scheduled generation requires the configured local fallback')
  }
}

export async function generateWhatsAppText(input: GenerationInput, local?: LocalGeneration): Promise<string> {
  if (local) return local.text
  try {
    return await generateOpenRouterText(input)
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error && error.status === 402) {
      throw new LocalGenerationRequired({ system: input.systemPrompt ?? '', prompt: input.userPrompt })
    }
    throw error
  }
}
