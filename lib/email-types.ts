import type { UserEmailAlias } from '@/lib/types'

export type EmailMessageDirection = 'inbound' | 'outbound'
export type EmailMessageStatus = 'queued' | 'sent' | 'failed' | 'received'

export interface EmailMessage {
  id: string
  user_id: string
  alias_id: string
  provider: string
  provider_message_id: string | null
  direction: EmailMessageDirection
  status: EmailMessageStatus
  from_name: string | null
  from_address: string
  reply_to_address: string | null
  to_addresses: string[]
  cc_addresses: string[]
  bcc_addresses: string[]
  subject: string | null
  text_body: string | null
  html_body: string | null
  error_message: string | null
  headers: Record<string, unknown>
  provider_payload: Record<string, unknown>
  sent_at: string | null
  received_at: string | null
  created_at: string
  updated_at: string
}

export interface EmailMessageWithAlias extends EmailMessage {
  alias: UserEmailAlias
}
