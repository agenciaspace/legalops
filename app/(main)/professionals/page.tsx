import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ProfessionalsDirectory } from '@/components/ProfessionalsDirectory'

export default async function ProfessionalsPage({ searchParams }: { searchParams?: { type?: string } }) {
  const supabase = await createServerSupabaseClient()
  const initialType = searchParams?.type === 'law_firm' || searchParams?.type === 'legal_dept'
    ? searchParams.type
    : 'all'

  const { data: professionals } = await supabase
    .from('account_profiles')
    .select('user_id, full_name, current_role, professional_type, years_experience, areas_of_expertise, linkedin_url, public_headline, skills, tools_used, tier, is_public')
    .eq('is_public', true)
    .order('tier', { ascending: false })
    .order('years_experience', { ascending: false, nullsFirst: false })
    .limit(50)

  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">Encontre pessoas</h1>
          <p className="mt-1 text-sm text-[#1A1A1A]/60">
            Perfis que autorizaram a exibição para escritórios e departamentos jurídicos.
          </p>
        </div>
      </div>

      <ProfessionalsDirectory professionals={professionals ?? []} initialType={initialType} />
    </div>
  )
}
