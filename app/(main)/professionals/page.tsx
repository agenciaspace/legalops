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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Diretório de Profissionais</h1>
          <p className="mt-1 text-sm text-slate-500">
            Conecte-se com profissionais de Legal Ops do mundo todo.
          </p>
        </div>
      </div>

      <ProfessionalsDirectory professionals={professionals ?? []} />
    </div>
  )
}
