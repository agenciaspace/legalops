'use client'
import { ClubRegionPreferences } from '@/components/community/ClubRegionPreferences'
import { ClubLanguageSelect, useClubLanguage } from '@/components/community/ClubLanguage'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BrandWordmark } from '@/components/BrandLogo'
import { CLUB_INTERESTS, CLUB_SECTORS } from '@/lib/club-membership'
import { joinClub } from './actions'
type Profile = { country_code?: string | null; timezone?: string | null; full_name?: string | null; current_role?: string | null; organization_name?: string | null; linkedin_url?: string | null; public_bio?: string | null; preferred_locations?: string[] | null; areas_of_expertise?: string[] | null }
const input = 'mt-2 w-full rounded-lg border border-[#CEC8BD] bg-[#FAF7F1] px-3 py-3 text-sm font-normal'
export function ClubJoinForm({ profile, destination = '/community' }: { profile: Profile; destination?: string }) {
  const { t } = useClubLanguage()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('')
    const form = new FormData(event.currentTarget)
    try {
      const result = await joinClub({ ...Object.fromEntries(form.entries()), interests: form.getAll('interests'), accepted_rules: form.get('accepted_rules') === 'on' })
      if (!result.ok) { setError(result.error ?? t("Confira os dados.")); return }
      router.push(destination); router.refresh()
    } catch { setError(t("Não foi possível salvar. Tente novamente.")) }
    finally { setBusy(false) }
  }
  return <main className="min-h-screen bg-[#F5F1E8] px-5 py-12 text-[#111111]">
    <div className="mx-auto max-w-2xl"><Link href="/club"><BrandWordmark suffix="club" className="text-3xl" /></Link>
      <div className="mt-5"><ClubLanguageSelect /></div>
      <h1 className="mt-10 font-[var(--font-quicksand)] text-4xl font-semibold tracking-tight">{t("conte um pouco sobre você")}<span className="text-[#E88A6A]">.</span></h1>
      <p className="mt-4 text-sm leading-7 text-[#69635E]">{t("O Club reúne quem trabalha, estuda ou desenvolve soluções para o jurídico. Seu perfil ajuda os outros membros a entender seu contexto. Não precisamos de currículo nem de pagamento para sua entrada.")}</p>
      <ClubRegionPreferences country={profile.country_code} timezone={profile.timezone} />
      <form onSubmit={submit} className="mt-8 space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-semibold">{t("Nome completo")}<input className={input} name="full_name" required minLength={3} maxLength={160} autoComplete="name" defaultValue={profile.full_name ?? ''} /></label>
          <label className="text-sm font-semibold">{t("Cargo ou atuação atual")}<input className={input} name="current_role" required minLength={2} maxLength={160} defaultValue={profile.current_role ?? ''} placeholder={t("Ex.: analista, estudante, consultor")} /></label>
          <label className="text-sm font-semibold">{t("Organização ou contexto profissional")}<input className={input} name="organization_name" required minLength={2} maxLength={180} defaultValue={profile.organization_name ?? ''} placeholder={t("Empresa, autônomo, em transição…")} /></label>
          <label className="text-sm font-semibold">{t("Cidade e estado/região")}<input className={input} name="city" required minLength={2} maxLength={120} defaultValue={profile.preferred_locations?.[0] ?? ''} placeholder={t("Cidade, estado ou região")} /></label>
        </div>
        <label className="block text-sm font-semibold">{t("Perfil pessoal no LinkedIn")}<input className={input} type="url" name="linkedin_url" required maxLength={500} defaultValue={profile.linkedin_url ?? ''} placeholder="https://www.linkedin.com/in/…" /></label>
        <label className="block text-sm font-semibold">{t("Sua relação com o jurídico")}<select name="sector" required className={input} defaultValue=""><option value="" disabled>{t("Selecione sua atuação")}</option>{CLUB_SECTORS.map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}</select></label>
        <label className="block text-sm font-semibold">{t("Apresentação")}<textarea className={input} name="public_bio" rows={4} required minLength={30} maxLength={1500} defaultValue={profile.public_bio ?? ''} placeholder={t("Com o que você trabalha ou estuda? Que experiências e dúvidas quer compartilhar?")} /></label>
        <fieldset><legend className="text-sm font-semibold">{t("Assuntos de interesse")}</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">{CLUB_INTERESTS.map(interest => <label key={interest} className="flex items-center gap-3 text-sm"><input type="checkbox" name="interests" value={interest} defaultChecked={profile.areas_of_expertise?.includes(interest)} />{t(interest)}</label>)}</div></fieldset>
        <div className="border-y border-[#CEC8BD] py-5"><p className="text-sm leading-6 text-[#69635E]">{t("Respeite os colegas, preserve dados de clientes e evite spam. Divulgação comercial deve ser combinada com a administração. Seus dados de apresentação ficam disponíveis aos membros; currículo e email não fazem parte do diretório.")}</p><label className="mt-4 flex items-start gap-3 text-sm"><input className="mt-1" type="checkbox" name="accepted_rules" required /><span>{t("Meus dados são verdadeiros, minha atuação tem relação com a comunidade e concordo com essas regras.")}</span></label></div>
        {error && <p role="alert" className="text-sm text-red-700">{t(error)}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-[#111111] px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? t("Salvando…") : t("Entrar na comunidade gratuita")}</button>
      </form>
    </div>
  </main>
}
