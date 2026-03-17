import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ProfessionalsDirectory } from '@/components/ProfessionalsDirectory'

export default async function ProfessionalsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: professionals } = await supabase
    .from('account_profiles')
    .select('user_id, full_name, current_role, professional_type, years_experience, areas_of_expertise, linkedin_url, public_headline, skills, tools_used, tier, is_public')
    .eq('is_public', true)
    .order('tier', { ascending: false })
    .order('years_experience', { ascending: false, nullsFirst: false })
    .limit(50)

  return (
    <div className="px-6 py-8">
      <ProfessionalsDirectory professionals={professionals ?? []} />
    </div>
  )
}
