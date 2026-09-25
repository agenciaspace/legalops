import { COUNTRY_CODES } from '@/lib/club-countries'
import { verificationState, verificationMissing } from '@/lib/member-verification'
import { ClubRegionPreferences } from '@/components/community/ClubRegionPreferences'
import { getClubTranslator, getClubLocale } from '@/lib/club-locale-server'
import { ProfileContactCode } from '@/components/community/ProfileContactCode'
import { ProfilePhoto } from '@/components/community/ProfilePhoto'
import Link from 'next/link'
import { BadgeCheck, Building2, Check, Clock3, Linkedin, ShieldCheck, UserRound } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { updateCommunityProfile } from '../actions'

type Profile = {
  directory_country: string | null
  directory_region: string | null
  directory_city: string | null
  directory_qualifications: string[]
  country_code: string | null
  timezone: string | null
  avatar_path: string | null
  organization_description: string | null
  full_name: string | null
  current_role: string | null
  public_headline: string | null
  public_bio: string | null
  organization_name: string | null
  linkedin_url: string | null
  areas_of_expertise: string[] | null
  professional_type: string | null
  desired_roles: string[] | null
  preferred_remote: string | null
  preferred_locations: string[] | null
  skills: string[] | null
  tools_used: string[] | null
  career_summary: string | null
  career_highlights: string[] | null
  base_cv_text: string | null
  open_to_opportunities: boolean
  job_alerts_enabled: boolean
  cv_suggestions_enabled: boolean
  is_public: boolean
}

type Verification = {
  profile_verification_status: string
  profile_verified_at: string | null
}

export const dynamic = 'force-dynamic'

export default async function CommunityProfilePage({ searchParams }: { searchParams?: { saved?: string; error?: string; photo?: string } }) {
  const t = getClubTranslator()
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: rawProfile }, { data: rawVerification }] = await Promise.all([
    supabase
      .from('account_profiles')
      .select('directory_country,directory_region,directory_city,directory_qualifications,country_code, timezone, avatar_path, organization_description, full_name, current_role, public_headline, public_bio, organization_name, linkedin_url, areas_of_expertise, professional_type, desired_roles, preferred_remote, preferred_locations, skills, tools_used, career_summary, career_highlights, base_cv_text, open_to_opportunities, job_alerts_enabled, cv_suggestions_enabled, is_public')
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
  const status = verificationState(verification?.profile_verification_status)
  const missing = verificationMissing(profile)
  const countryNames = new Intl.DisplayNames([getClubLocale()], { type: 'region' })
  const completedFields = [
    profile?.avatar_path,
    profile?.organization_description,
    profile?.full_name,
    profile?.current_role,
    profile?.public_headline,
    profile?.organization_name,
    profile?.public_bio,
    profile?.linkedin_url,
    profile?.areas_of_expertise?.length,
  ].filter(Boolean).length
  const completeness = Math.round((completedFields / 9) * 100)

  return (
    <div className="mx-auto w-full max-w-[980px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <header>
        <h1 className="text-[22px] font-extrabold tracking-[-0.025em] text-[#24231F]">{t("Meu perfil")}</h1>
        <details className="mt-3 max-w-sm"><summary className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-[#CEC8BD] bg-white px-4 text-sm font-semibold">{t("Meu QR code de contato")}</summary>{user && <div className="mt-3"><ProfileContactCode userId={user.id} own /></div>}</details>
        <p className="mt-1 text-xs text-[#77746E]">{t("Apresente seu contexto à comunidade. Os campos de carreira são opcionais e podem apoiar os recursos personalizados do Pro.")}</p>
      </header>
      <ClubRegionPreferences country={profile?.country_code} timezone={profile?.timezone} />

      {searchParams?.saved ? (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[11px] font-bold text-emerald-800">
          <Check className="h-4 w-4" /> {t("Perfil salvo. Sua apresentação foi atualizada na comunidade.")} </div>
      ) : null}

      {searchParams?.error ? <p role="alert" className="mt-4 text-sm text-red-700">{t("Não conseguimos salvar. Confira a foto, o contexto profissional e os campos obrigatórios.")}</p> : null}
      {searchParams?.photo === 'required' ? <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">{t('Adicione uma foto para completar seu perfil.')}</p> : null}
      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <form action={updateCommunityProfile} className="rounded-xl border border-[#E1E1DD] bg-white p-5 sm:p-6">
          <ProfilePhoto userId={user?.id ?? ""} path={profile?.avatar_path ?? null} name={profile?.full_name ?? t("Seu perfil")} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-[10px] font-extrabold text-[#4D4B46]"> {t("Nome completo")} <input name="full_name" required minLength={3} maxLength={120} defaultValue={profile?.full_name ?? ''} className="mt-1.5 h-10 w-full rounded-lg border border-[#DFDFDB] px-3 text-xs font-medium outline-none focus:border-[#FF9E77]" />
            </label>
            <label className="text-[10px] font-extrabold text-[#4D4B46]"> {t("Cargo atual")} <input name="current_role" required minLength={2} maxLength={120} defaultValue={profile?.current_role ?? ''} placeholder={t("Ex.: Legal Operations Manager")} className="mt-1.5 h-10 w-full rounded-lg border border-[#DFDFDB] px-3 text-xs font-medium outline-none focus:border-[#FF9E77]" />
            </label>
            <label className="text-[10px] font-extrabold text-[#4D4B46] sm:col-span-2"> {t("Headline profissional")} <input name="public_headline" required minLength={3} maxLength={160} defaultValue={profile?.public_headline ?? ''} placeholder={t("O que você constrói e em que contexto")} className="mt-1.5 h-10 w-full rounded-lg border border-[#DFDFDB] px-3 text-xs font-medium outline-none focus:border-[#FF9E77]" />
            </label>
            <label className="text-[10px] font-extrabold text-[#4D4B46]"> {t("Organização")} <input name="organization_name" required minLength={2} maxLength={120} defaultValue={profile?.organization_name ?? ''} className="mt-1.5 h-10 w-full rounded-lg border border-[#DFDFDB] px-3 text-xs font-medium outline-none focus:border-[#FF9E77]" />
            </label>
            <label className="text-sm font-medium text-[#4D4B46] sm:col-span-2">{t("Onde você trabalha e o que faz nesse contexto")}<textarea name="organization_description" required minLength={20} maxLength={700} rows={3} defaultValue={profile?.organization_description ?? ''} placeholder={t("Ex.: atuo no jurídico de uma empresa de tecnologia, cuidando de contratos comerciais e operações. Também pode descrever atuação autônoma ou transição profissional.")} className="mt-2 w-full rounded-xl border border-[#CEC8BD] px-3 py-3 text-base"/><span className="mt-2 block text-xs leading-5 text-[#625E59]">{t("Esse contexto aparece em destaque nas suas publicações para os membros do Club.")}</span></label>
            <label className="text-[10px] font-extrabold text-[#4D4B46]"> {t("LinkedIn")} <input name="linkedin_url" type="url" required pattern="https://([a-zA-Z]{2,3}\.)?linkedin\.com/in/.*" defaultValue={profile?.linkedin_url ?? ''} placeholder="https://linkedin.com/in/..." className="mt-1.5 h-10 w-full rounded-lg border border-[#DFDFDB] px-3 text-xs font-medium outline-none focus:border-[#FF9E77]" />
            </label>
            <label className="text-[10px] font-extrabold text-[#4D4B46] sm:col-span-2"> {t("Temas de experiência")} <input name="areas_of_expertise" required defaultValue={(profile?.areas_of_expertise ?? []).join(', ')} placeholder={t("CLM, dados, gestão de escritórios")} className="mt-1.5 h-10 w-full rounded-lg border border-[#DFDFDB] px-3 text-xs font-medium outline-none focus:border-[#FF9E77]" />
              <span className="mt-1 block text-[8px] font-medium text-[#999690]">{t("Separe os temas por vírgulas.")}</span>
            </label>
            <label className="text-[10px] font-extrabold text-[#4D4B46] sm:col-span-2"> {t("Sobre sua atuação")} <textarea name="public_bio" required minLength={20} maxLength={1200} rows={6} defaultValue={profile?.public_bio ?? ''} placeholder={t("Conte o tipo de operação em que atua, desafios que conhece e trocas que procura.")} className="mt-1.5 w-full resize-y rounded-lg border border-[#DFDFDB] px-3 py-2.5 text-xs leading-5 outline-none focus:border-[#FF9E77]" />
            </label>

            <fieldset className="grid gap-4 rounded-xl border border-[#CEC8BD] p-4 sm:col-span-2 sm:grid-cols-2"><legend className="px-2 text-sm font-semibold">{t('Localização e qualificações no diretório')}</legend><p className="text-xs leading-5 sm:col-span-2">{t('Campos opcionais visíveis aos membros e usados nos filtros de busca. Informe apenas o que deseja compartilhar; preferências de vagas e currículo continuam separados.')}</p>
              <label className="text-sm">{t('País')}<select name="directory_country" defaultValue={profile?.directory_country ?? ''} className="mt-2 min-h-11 w-full rounded-lg border bg-white px-3"><option value="">{t('Não informar')}</option>{COUNTRY_CODES.map(code=><option key={code} value={code}>{countryNames.of(code)}</option>)}</select></label>
              <label className="text-sm">{t('Estado / região')}<input name="directory_region" maxLength={120} defaultValue={profile?.directory_region ?? ''} placeholder="São Paulo, Cataluña…" className="mt-2 min-h-11 w-full rounded-lg border px-3"/></label>
              <label className="text-sm">{t('Cidade')}<input name="directory_city" maxLength={120} defaultValue={profile?.directory_city ?? ''} className="mt-2 min-h-11 w-full rounded-lg border px-3"/></label>
              <label className="text-sm sm:col-span-2">{t('Qualificações públicas')}<input name="directory_qualifications" maxLength={2400} defaultValue={(profile?.directory_qualifications ?? []).join(', ')} placeholder={t('Ex.: Direito, MBA, gestão de projetos, análise de dados')} className="mt-2 min-h-11 w-full rounded-lg border px-3"/><span className="mt-2 block text-xs">{t('Separe por vírgulas. São informações declaradas por você, sem certificação pelo Club.')}</span></label>
            </fieldset>
            <div className="border-t border-[#ECECE8] pt-5 sm:col-span-2">
              <h2 className="text-sm font-extrabold text-[#292824]">{t("Vagas e currículo")}</h2>
              <p className="mt-1 text-[10px] leading-4 text-[#77746E]">{t("O crawler compara estes campos com as vagas publicadas no LegalOps Work.")}</p>
            </div>

            <label className="text-[10px] font-extrabold text-[#4D4B46]"> {t("Ambiente profissional")} <select name="professional_type" required defaultValue={profile?.professional_type ?? ''} className="mt-1.5 h-10 w-full rounded-lg border border-[#DFDFDB] bg-white px-3 text-xs font-medium outline-none focus:border-[#FF9E77]">
                <option value="" disabled>{t("Selecione")}</option>
                <option value="law_firm">{t("Escritório de advocacia")}</option>
                <option value="legal_dept">{t("Departamento jurídico")}</option>
                <option value="public_sector">{t("Setor público")}</option>
                <option value="freelance">{t("Autônomo ou consultoria")}</option>
                <option value="other">{t("Outro")}</option>
              </select>
            </label>
            <label className="text-[10px] font-extrabold text-[#4D4B46]"> {t("Modelo de trabalho")} <select name="preferred_remote" required defaultValue={profile?.preferred_remote ?? 'any'} className="mt-1.5 h-10 w-full rounded-lg border border-[#DFDFDB] bg-white px-3 text-xs font-medium outline-none focus:border-[#FF9E77]">
                <option value="any">{t("Qualquer modelo")}</option>
                <option value="remote">{t("Remoto")}</option>
                <option value="hybrid">{t("Híbrido")}</option>
                <option value="onsite">{t("Presencial")}</option>
              </select>
            </label>
            <label className="text-[10px] font-extrabold text-[#4D4B46] sm:col-span-2"> {t("Cargos que procura")} <input name="desired_roles" defaultValue={(profile?.desired_roles ?? []).join(', ')} placeholder={t("Legal Ops Manager, CLM Manager")} className="mt-1.5 h-10 w-full rounded-lg border border-[#DFDFDB] px-3 text-xs font-medium outline-none focus:border-[#FF9E77]" />
            </label>
            <label className="text-[10px] font-extrabold text-[#4D4B46] sm:col-span-2"> {t("Localidades")} <input name="preferred_locations" defaultValue={(profile?.preferred_locations ?? []).join(', ')} placeholder={t("São Paulo, Brasil, América Latina")} className="mt-1.5 h-10 w-full rounded-lg border border-[#DFDFDB] px-3 text-xs font-medium outline-none focus:border-[#FF9E77]" />
            </label>
            <label className="text-[10px] font-extrabold text-[#4D4B46]"> {t("Competências")} <input name="skills" defaultValue={(profile?.skills ?? []).join(', ')} placeholder={t("Gestão de projetos, analytics")} className="mt-1.5 h-10 w-full rounded-lg border border-[#DFDFDB] px-3 text-xs font-medium outline-none focus:border-[#FF9E77]" />
            </label>
            <label className="text-[10px] font-extrabold text-[#4D4B46]"> {t("Ferramentas")} <input name="tools_used" defaultValue={(profile?.tools_used ?? []).join(', ')} placeholder={t("Ironclad, Power BI")} className="mt-1.5 h-10 w-full rounded-lg border border-[#DFDFDB] px-3 text-xs font-medium outline-none focus:border-[#FF9E77]" />
            </label>
            <label className="text-[10px] font-extrabold text-[#4D4B46] sm:col-span-2"> {t("Resumo de carreira (opcional)")} <textarea name="career_summary" minLength={20} maxLength={3000} rows={4} defaultValue={profile?.career_summary ?? ''} placeholder={t("Seu nível, escopo, setores e tipo de impacto.")} className="mt-1.5 w-full resize-y rounded-lg border border-[#DFDFDB] px-3 py-2.5 text-xs leading-5 outline-none focus:border-[#FF9E77]" />
            </label>
            <label className="text-[10px] font-extrabold text-[#4D4B46] sm:col-span-2"> {t("Resultados comprovados")} <textarea name="career_highlights" rows={5} defaultValue={(profile?.career_highlights ?? []).join('\n')} placeholder={t("Um resultado por linha. Ex.:\nReduzi o ciclo contratual em 30%.")} className="mt-1.5 w-full resize-y rounded-lg border border-[#DFDFDB] px-3 py-2.5 text-xs leading-5 outline-none focus:border-[#FF9E77]" />
            </label>
            <label className="text-[10px] font-extrabold text-[#4D4B46] sm:col-span-2"> {t("CV base (opcional, para personalização)")} <textarea name="base_cv_text" minLength={50} maxLength={30000} rows={10} defaultValue={profile?.base_cv_text ?? ''} placeholder={t("Cole cargos, empresas, datas, responsabilidades e formação. O sistema adapta a ênfase sem inventar fatos.")} className="mt-1.5 w-full resize-y rounded-lg border border-[#DFDFDB] px-3 py-2.5 text-xs leading-5 outline-none focus:border-[#FF9E77]" />
            </label>

            <div className="grid gap-2.5 sm:col-span-2">
              <label className="flex items-start gap-3 rounded-lg border border-[#E4E3DF] bg-[#FAFAF8] p-3 text-[10px] leading-4 text-[#5F5C56]">
                <input type="checkbox" name="open_to_opportunities" defaultChecked={profile?.open_to_opportunities ?? false} className="mt-0.5 h-4 w-4 accent-[#FF5C1A]" />
                <span><strong className="block text-[#292824]">{t("Estou aberto a oportunidades")}</strong>{t("Use meu perfil para calcular aderência com novas vagas.")}</span>
              </label>
              <label className="flex items-start gap-3 rounded-lg border border-[#E4E3DF] bg-[#FAFAF8] p-3 text-[10px] leading-4 text-[#5F5C56]">
                <input type="checkbox" name="job_alerts_enabled" defaultChecked={profile?.job_alerts_enabled ?? true} className="mt-0.5 h-4 w-4 accent-[#FF5C1A]" />
                <span><strong className="block text-[#292824]">{t("Receber alertas no Club Pro")}</strong>{t("Preferência usada quando o Pro estiver ativo: vagas novas na área “Vagas para você”.")}</span>
              </label>
              <label className="flex items-start gap-3 rounded-lg border border-[#E4E3DF] bg-[#FAFAF8] p-3 text-[10px] leading-4 text-[#5F5C56]">
                <input type="checkbox" name="cv_suggestions_enabled" defaultChecked={profile?.cv_suggestions_enabled ?? true} className="mt-0.5 h-4 w-4 accent-[#FF5C1A]" />
                <span><strong className="block text-[#292824]">{t("Receber ajustes de CV")}</strong>{t("Compare as palavras da vaga com as competências que você informou.")}</span>
              </label>
              <label className="flex items-start gap-3 rounded-lg border border-[#E4E3DF] bg-[#FAFAF8] p-3 text-[10px] leading-4 text-[#5F5C56]">
                <input type="checkbox" name="is_public" defaultChecked={profile?.is_public ?? false} className="mt-0.5 h-4 w-4 accent-[#FF5C1A]" />
                <span><strong className="block text-[#292824]">{t("Aparecer para empresas")}</strong>{t("Inclua meu perfil no diretório usado por escritórios e departamentos jurídicos.")}</span>
              </label>
            </div>
          </div>
          <div className="mt-5 flex justify-end border-t border-[#ECECE8] pt-4">
            <button className="rounded-lg bg-[#FF5C1A] px-4 py-2.5 text-[11px] font-extrabold text-white hover:bg-[#E84D10]">{t("Salvar perfil")}</button>
          </div>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <section id="verification" className={`scroll-mt-24 rounded-xl border p-4 ${status.tone}`}>
            <div className="flex items-center gap-2">
              {verification?.profile_verification_status === 'verified' ? <BadgeCheck className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
              <h2 className="text-xs font-extrabold">{t(status.label)}</h2>
            </div>
            <p className="mt-2 text-sm leading-6">{t(status.description)}</p>
            {!!missing.length && <p className="mt-3 text-sm">{t('Falta completar')}: {missing.map(field => t(field)).join(', ')}.</p>}
            <p className="mt-3 text-xs leading-5">{t('O selo é atualizado automaticamente quando a foto e os campos profissionais obrigatórios estão completos.')}</p>
          </section>

          <section className="rounded-xl border border-[#E1E1DD] bg-white p-4">
            <div className="flex items-center justify-between text-[10px] font-extrabold"><span>{t("Completude")}</span><span>{completeness}%</span></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#ECECE8]"><div className="h-full rounded-full bg-[#FF5C1A]" style={{ width: `${completeness}%` }} /></div>
            <div className="mt-4 space-y-2 text-[9px] text-[#77746E]">
              <p className="flex items-center gap-2"><UserRound className="h-3.5 w-3.5" /> {t("Identidade e contexto profissional")}</p>
              <p className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5" /> {t("Organização e cargo atual")}</p>
              <p className="flex items-center gap-2"><Linkedin className="h-3.5 w-3.5" /> {t("LinkedIn profissional")}</p>
              <p className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> {t("Selo automático de cadastro completo")}</p>
              <p className="flex items-center gap-2"><BadgeCheck className="h-3.5 w-3.5" /> {t("Vagas e ajustes de CV pelo perfil")}</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
