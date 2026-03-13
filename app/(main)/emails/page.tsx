import { EmailAliasesClient } from '@/components/EmailAliasesClient'
import { sortEmailAliases } from '@/lib/email-aliases'
import { getUserTier, listUserEmailAliases } from '@/lib/email-alias-store'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function EmailsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [tier, aliases] = await Promise.all([
    getUserTier(supabase, user!.id),
    listUserEmailAliases(supabase, user!.id),
  ])

  return (
    <EmailAliasesClient
      initialTier={tier}
      initialAliases={sortEmailAliases(aliases)}
    />
  )
}
