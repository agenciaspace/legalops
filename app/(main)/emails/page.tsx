import { EmailAliasesClient } from '@/components/EmailAliasesClient'
import { sortEmailAliases } from '@/lib/email-aliases'
import { getUserTier, listUserEmailAliases, listUserEmailMessages } from '@/lib/email-alias-store'
import { getBrevoReplyDomain, getBrevoSenderIdentity } from '@/lib/brevo'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function EmailsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [tier, aliases, messages] = await Promise.all([
    getUserTier(supabase, user!.id),
    listUserEmailAliases(supabase, user!.id),
    listUserEmailMessages(supabase, user!.id),
  ])
  const sender = getBrevoSenderIdentity()

  return (
    <EmailAliasesClient
      initialTier={tier}
      initialAliases={sortEmailAliases(aliases)}
      initialMessages={messages}
      senderEmail={sender.email}
      replyDomain={getBrevoReplyDomain()}
    />
  )
}
