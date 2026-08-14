import { BadgeCheck, Building2, Check, Clock3, Linkedin, ShieldCheck, UserRound } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { updateCommunityProfile } from '../actions'

type Profile = {
  full_name: string | null
  current_role: string | null
  public_headline: string | null
  public_bio: string | null
  organization_name: string | null
  linkedin_url: string | null
  areas_of_expertise: string[] | null
}

type Verification = {
  profile_verification_status: string
  profile_verified_at: string | null
}

const verificationCopy: Record<string, { label: string; description: string; tone: string }> = {
  verified: {
    label: 'Perfil validado',
    description: 'Identidade profissional conferida. Seu selo aparece no diretório.',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  pending: {
    label: 'Validação em análise',
    description: 'Seu perfil está completo e entrou na fila de conferência.',
    tone: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  rejected: {
    label: 'Revisão necessária',
    description: 'Revise os dados profissionais e envie novamente.',
    tone: 'border-rose-200 bg-rose-50 text-rose-800',
  },
  unverified: {
    label: 'Perfil não validado',
    description: 'Complete os dados e informe seu LinkedIn para solicitar validação.',
    tone: 'border-stone-200 bg-stone-50 text-stone-700',
  },
}

export const dynamic = 'force-dynamic'

export default async function CommunityProfilePage({ searchParams }: { searchParams?: { saved?: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: rawProfile }, { data: rawVerification }] = await Promise.all([
    supabase
      .from('account_profiles')
      .select('full_name, current_role, public_headline, public_bio, organization_name, linkedin_url, areas_of_expertise')
      .eq('user_id', user?.id ?? '')
      .maybeSingle(),
    supabase
      .from('community_members')
      .select('profile_verification_status, profile_verified_at')
      .eq('user_id', user?.id ?? '')
      .maybeSingle(),
  ])

  const profile = rawProfile as Profile | null
  const verification = rawVerification as Verification | null
  const status = verificationCopy[verification?.profile_verification_status ?? 'unverified'] ?? verificationCopy.unverified
  const completedFields = [
    profile?.full_name,
    profile?.current_role,
    profile?.public_headline,
    profile?.organization_name,
    profile?.public_bio,
    profile?.linkedin_url,
    profile?.areas_of_expertise?.length,
  ].filter(Boolean).length
  const completeness = Math.round((completedFields / 7) * 100)

  return (
    <div className="mx-auto w-full max-w-[980px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <header>
        <h1 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#24231F]">Meu perfil</h1>
        <p className="mt-1 text-xs text-[#77746E]">Um perfil claro ajuda os membros certos a encontrar você e dá contexto às suas contribuições.</p>
      </header>

      {searchParams?.saved ? (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[11px] font-bold text-emerald-800">
          <Check className="h-4 w-4" /> Perfil salvo e enviado para validação.
        </div>
      ) : null}

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <form action={updateCommunityProfile} className="rounded-xl border border-[#E1E1DD] bg-white p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-[10px] font-extrabold text-[#4D4B46]">
              Nome completo
              <input name="full_name" required minLength={3} maxLength={120} defaultValue={profile?.full_name ?? ''} className="mt-1.5 h-10 w-full rounded-lg border border-[#DFDFDB] px-3 text-xs font-medium outline-none focus:border-[#FF9E77]" />
            </label>
            <label className="text-[10px] font-extrabold text-[#4D4B46]">
              Cargo atual
              <input name="current_role" required minLength={2} maxLength={120} defaultValue={profile?.current_role ?? ''} placeholder="Ex.: Legal Operations Manager" className="mt-1.5 h-10 w-full rounded-lg border border-[#DFDFDB] px-3 text-xs font-medium outline-none focus:border-[#FF9E77]" />
            </label>
            <label className="text-[10px] font-extrabold text-[#4D4B46] sm:col-span-2">
              Headline profissional
              <input name="public_headline" required minLength={3} maxLength={160} defaultValue={profile?.public_headline ?? ''} placeholder="O que você constrói e em que contexto" className="mt-1.5 h-10 w-full rounded-lg border border-[#DFDFDB] px-3 text-xs font-medium outline-none focus:border-[#FF9E77]" />
            </label>
            <label className="text-[10px] font-extrabold text-[#4D4B46]">
              Organização
              <input name="organization_name" required minLength={2} maxLength={120} defaultValue={profile?.organization_name ?? ''} className="mt-1.5 h-10 w-full rounded-lg border border-[#DFDFDB] px-3 text-xs font-medium outline-none focus:border-[#FF9E77]" />
            </label>
            <label className="text-[10px] font-extrabold text-[#4D4B46]">
              LinkedIn
              <input name="linkedin_url" type="url" required pattern="https://(www\.)?linkedin\.com/.*" defaultValue={profile?.linkedin_url ?? ''} placeholder="https://linkedin.com/in/..." className="mt-1.5 h-10 w-full rounded-lg border border-[#DFDFDB] px-3 text-xs font-medium outline-none focus:border-[#FF9E77]" />
            </label>
            <label className="text-[10px] font-extrabold text-[#4D4B46] sm:col-span-2">
              Temas de experiência
              <input name="areas_of_expertise" required defaultValue={(profile?.areas_of_expertise ?? []).join(', ')} placeholder="CLM, dados, gestão de escritórios" className="mt-1.5 h-10 w-full rounded-lg border border-[#DFDFDB] px-3 text-xs font-medium outline-none focus:border-[#FF9E77]" />
              <span className="mt-1 block text-[8px] font-medium text-[#999690]">Separe os temas por vírgulas.</span>
            </label>
            <label className="text-[10px] font-extrabold text-[#4D4B46] sm:col-span-2">
              Sobre sua atuação
              <textarea name="public_bio" required minLength={20} maxLength={1200} rows={6} defaultValue={profile?.public_bio ?? ''} placeholder="Conte o tipo de operação em que atua, desafios que conhece e trocas que procura." className="mt-1.5 w-full resize-y rounded-lg border border-[#DFDFDB] px-3 py-2.5 text-xs leading-5 outline-none focus:border-[#FF9E77]" />
            </label>
          </div>
          <div className="mt-5 flex justify-end border-t border-[#ECECE8] pt-4">
            <button className="rounded-lg bg-[#FF5C1A] px-4 py-2.5 text-[11px] font-extrabold text-white hover:bg-[#E84D10]">Salvar e solicitar validação</button>
          </div>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <section className={`rounded-xl border p-4 ${status.tone}`}>
            <div className="flex items-center gap-2">
              {verification?.profile_verification_status === 'verified' ? <BadgeCheck className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
              <h2 className="text-xs font-extrabold">{status.label}</h2>
            </div>
            <p className="mt-2 text-[10px] leading-4 opacity-75">{status.description}</p>
          </section>

          <section className="rounded-xl border border-[#E1E1DD] bg-white p-4">
            <div className="flex items-center justify-between text-[10px] font-extrabold"><span>Completude</span><span>{completeness}%</span></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#ECECE8]"><div className="h-full rounded-full bg-[#FF5C1A]" style={{ width: `${completeness}%` }} /></div>
            <div className="mt-4 space-y-2 text-[9px] text-[#77746E]">
              <p className="flex items-center gap-2"><UserRound className="h-3.5 w-3.5" /> Identidade e contexto profissional</p>
              <p className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5" /> Organização e cargo atual</p>
              <p className="flex items-center gap-2"><Linkedin className="h-3.5 w-3.5" /> LinkedIn para conferência</p>
              <p className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> Selo visível após validação</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
