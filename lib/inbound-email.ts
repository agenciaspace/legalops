import { listAliasesByAddresses } from '@/lib/email-alias-store'
import type { BrevoNormalizedInboundMessage } from '@/lib/brevo'

type InboundEmailClient = {
  from: (table: string) => any
}

export async function storeInboundEmailMessages(
  supabase: InboundEmailClient,
  messages: BrevoNormalizedInboundMessage[],
  provider: string
) {
  const now = new Date().toISOString()
  let inserted = 0
  let matchedAliases = 0

  for (const normalized of messages) {
    if (!normalized.fromAddress || normalized.toAddresses.length === 0) continue

    const aliases = await listAliasesByAddresses(supabase, normalized.toAddresses)
    if (aliases.length === 0) continue

    matchedAliases += aliases.length

    for (const alias of aliases) {
      const { error } = await supabase
        .from('email_messages')
        .insert({
          user_id: alias.user_id,
          alias_id: alias.id,
          provider,
          provider_message_id: normalized.providerMessageId,
          direction: 'inbound',
          status: 'received',
          from_name: normalized.fromName,
          from_address: normalized.fromAddress,
          to_addresses: normalized.toAddresses,
          cc_addresses: normalized.ccAddresses,
          bcc_addresses: normalized.bccAddresses,
          subject: normalized.subject,
          text_body: normalized.textBody,
          html_body: normalized.htmlBody,
          headers: normalized.headers,
          provider_payload: normalized.rawPayload,
          received_at: normalized.sentAt ?? now,
        })

      if (!error) {
        inserted += 1
        continue
      }

      if (error.code === '23505') continue
      throw new Error(error.message)
    }
  }

  return { inserted, matchedAliases }
}
