import { getClubLocale, getClubTranslator } from '@/lib/club-locale-server'
import { TranslatedContent } from '@/components/community/TranslatedContent'
import { MemberAvatar } from '@/components/community/MemberAvatar'
import { loadClubTranslations } from '@/lib/club-translations'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BadgeCheck, Building2, MapPin, Search } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { directoryFilters, directoryUrl, PROFESSIONAL_ENVIRONMENTS, type DirectoryResult } from '@/lib/member-directory'
import { verificationState } from '@/lib/member-verification'
export const dynamic = 'force-dynamic'
const control='mt-2 min-h-11 w-full min-w-0 rounded-lg border border-[#CEC8BD] bg-white px-3 text-sm'
export default async function MembersPage({ searchParams }: { searchParams?: Record<string,string|string[]|undefined> }) {
  const t=getClubTranslator(), locale=getClubLocale(), filters=directoryFilters(searchParams)
  const db=await createServerSupabaseClient()
  const {data:raw,error}=await db.rpc('search_club_members',{filters})
  const result=raw as DirectoryResult|null
  const members=result?.members??[], facets=result?.facets

  const countryNames=new Intl.DisplayNames([locale],{type:'region'})
  const total=result?.total??0, pages=Math.max(1,Math.ceil(total/24))
  if(result && filters.page>pages) redirect(directoryUrl(filters,{page:pages}))
  const translations=await loadClubTranslations(db,members.map(member=>member.user_id))
  const countryOptions=Array.from(new Set([...(facets?.countries??[]), ...(filters.country?[filters.country]:[])]))
  const active=Object.entries(filters).filter(([key,value])=>value&&!['page','sort','scope'].includes(key))
  return <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold">{t('Membros')}</h1><p className="mt-2 text-sm text-[#625E59]">{t('Encontre pessoas por experiência, função, qualificação ou região.')}</p></div><Link href="/community/profile#verification" className="inline-flex min-h-11 items-center text-sm font-semibold underline">{t('Meu perfil')}</Link></header>
    <nav aria-label={t('Contatos')} className="mt-4 flex flex-wrap gap-x-5 text-sm"><Link href={directoryUrl(filters,{scope:'',page:1})} aria-current={!filters.scope?'page':undefined} className="inline-flex min-h-11 items-center font-semibold underline">{t('Todos os membros')}</Link><Link href={directoryUrl(filters,{scope:'contacts',page:1})} aria-current={filters.scope?'page':undefined} className="inline-flex min-h-11 items-center underline">{t('Meus contatos')}</Link><Link href="/community/contact" className="inline-flex min-h-11 items-center">{t('Meu QR code')}</Link></nav>
    <form action="/community/members" className="mt-4 rounded-2xl border border-[#CEC8BD] bg-[#FAF7F1] p-4 sm:p-5">
      {filters.scope&&<input type="hidden" name="scope" value={filters.scope}/>}
      <label className="block text-sm font-semibold">{t('Pesquisar no diretório')}<div className="relative"><Search className="absolute left-3 top-5 h-4 w-4 text-[#625E59]" aria-hidden="true"/><input name="q" defaultValue={filters.q} maxLength={200} placeholder={t('Nome, cargo, empresa, experiência, cidade…')} className={`${control} pl-10`}/></div></label>
      <details className="mt-3" open={active.some(([key])=>key!=='q')}><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">{t('Filtros avançados')}</summary><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm">{t('País')}<select name="country" defaultValue={filters.country} className={control}><option value="">{t('Todos')}</option>{countryOptions.map(code=><option key={code} value={code}>{countryNames.of(code)}</option>)}</select></label>
        <label className="text-sm">{t('Estado / região')}<input name="region" list="directory-regions" defaultValue={filters.region} maxLength={120} className={control}/><datalist id="directory-regions">{facets?.regions.map(value=><option key={value} value={value}/>)}</datalist></label>
        <label className="text-sm">{t('Cidade')}<input name="city" list="directory-cities" defaultValue={filters.city} maxLength={120} className={control}/><datalist id="directory-cities">{facets?.cities.map(value=><option key={value} value={value}/>)}</datalist></label>
        <label className="text-sm">{t('Ambiente profissional')}<select name="type" defaultValue={filters.type} className={control}><option value="">{t('Todos')}</option>{Object.entries(PROFESSIONAL_ENVIRONMENTS).map(([key,label])=><option key={key} value={key}>{t(label)}</option>)}</select></label>
        <label className="text-sm">{t('Especialidade')}<input name="expertise" list="directory-expertise" defaultValue={filters.expertise} maxLength={120} className={control}/><datalist id="directory-expertise">{facets?.expertise.map(value=><option key={value} value={value}/>)}</datalist></label>
        <label className="text-sm">{t('Qualificação')}<input name="qualification" list="directory-qualifications" defaultValue={filters.qualification} maxLength={160} className={control}/><datalist id="directory-qualifications">{facets?.qualifications.map(value=><option key={value} value={value}/>)}</datalist></label>
        <label className="text-sm">{t('Cadastro')}<select name="verification" defaultValue={filters.verification} className={control}><option value="">{t('Todos')}</option><option value="verified">{t('Perfil completo')}</option><option value="unverified">{t('Perfil incompleto')}</option></select></label>
      </div></details>
      <div className="mt-3 flex flex-wrap items-end gap-3"><label className="min-w-0 flex-1 text-sm">{t('Ordenar por')}<select name="sort" defaultValue={filters.sort} className={control}><option value="name">{t('Nome (A–Z)')}</option><option value="recent">{t('Mais recentes')}</option></select></label><button className="min-h-11 rounded-lg bg-[#24231F] px-5 text-sm font-semibold text-white">{t('Buscar membros')}</button><Link className="inline-flex min-h-11 items-center px-2 text-sm underline" href={filters.scope?'/community/members?scope=contacts':'/community/members'}>{t('Limpar filtros')}</Link></div>
    </form>
    <details className="mt-4 text-sm text-[#625E59]"><summary className="min-h-11 cursor-pointer py-3">{t('O que significa o selo?')}</summary><p className="leading-6">{t('O selo de perfil completo aparece automaticamente quando a foto e os campos profissionais obrigatórios estão preenchidos. As informações são declaradas pelo membro; o Club não certifica identidade, diplomas ou competências.')}</p><p className="mt-2 leading-6">{t('Localização e qualificações são opcionais e declaradas pelos membros. Perfis sem esses dados não aparecem nos filtros correspondentes.')}</p></details>
    {error?<div role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm"><p>{t('Não foi possível carregar os membros. Seus filtros foram preservados.')}</p><Link href={directoryUrl(filters)} className="mt-2 inline-flex min-h-11 items-center underline">{t('Tentar novamente')}</Link></div>:<>
      <p role="status" className="mt-5 text-sm text-[#625E59]">{total} {total===1?t('membro encontrado'):t('membros encontrados')}{total>0&&` · ${Math.min((filters.page-1)*24+1,total)}–${Math.min(filters.page*24,total)}`}</p>
      {!members.length&&<div className="mt-4 rounded-xl border border-[#CEC8BD] p-6"><h2 className="font-semibold">{t('Nenhum perfil encontrado')}</h2><p className="mt-2 text-sm text-[#625E59]">{t('Revise os termos ou remova filtros para ampliar a busca.')}</p><Link href={directoryUrl(filters,{q:'',country:'',region:'',city:'',type:'',expertise:'',qualification:'',verification:'',page:1})} className="mt-3 inline-flex min-h-11 items-center font-semibold underline">{t('Limpar filtros')}</Link></div>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{members.map(member=>{
        const verification=verificationState(member.profile_verification_status)
        const location=[member.directory_city,member.directory_region,member.directory_country?countryNames.of(member.directory_country):null].filter(Boolean).join(' · ')
        return <article key={member.user_id} className="flex min-w-0 flex-col rounded-2xl border border-[#CEC8BD] bg-white p-5">
          <div className="flex items-start justify-between gap-2"><MemberAvatar userId={member.user_id} path={member.avatar_path} name={member.display_name} size="h-12 w-12"/><span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${member.profile_verification_status==='rejected'?verificationState('unverified').tone:verification.tone}`}>{member.profile_verification_status==='verified'&&<BadgeCheck aria-hidden="true" className="h-3.5 w-3.5"/>}{t(verification.publicLabel)}</span></div>
          <h2 className="mt-4 break-words text-base font-semibold">{member.display_name}</h2>
          <TranslatedContent source={translations.sources.get(`member:${member.user_id}`)} original={{public_headline:member.public_headline,current_role:member.current_role,areas_of_expertise:member.areas_of_expertise}} enabled={translations.enabled} serverLocale={locale} compact/>
          {member.organization_name&&<p className="mt-3 flex items-start gap-2 text-sm text-[#625E59]"><Building2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0"/>{member.organization_name}</p>}
          {location&&<p className="mt-2 flex items-start gap-2 text-sm text-[#625E59]"><MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0"/>{location}</p>}
          {!!member.directory_qualifications.length&&<p className="mt-3 break-words text-xs leading-5 text-[#625E59]">{member.directory_qualifications.slice(0,3).join(' · ')}{member.directory_qualifications.length>3?'…':''}</p>}
          <Link href={`/community/members/${member.user_id}`} className="mt-auto inline-flex min-h-11 items-center pt-4 text-sm font-semibold text-[#A94E38]">{t('Ver perfil completo')} →</Link>
        </article>
      })}</div>
      {pages>1&&<nav aria-label={t('Paginação')} className="mt-6 flex items-center justify-between gap-3">{filters.page>1?<Link className="inline-flex min-h-11 items-center rounded-lg border px-3 text-sm" href={directoryUrl(filters,{page:filters.page-1})}>← {t('Anterior')}</Link>:<span/>}<span className="text-sm">{filters.page} / {pages}</span>{filters.page<pages?<Link className="inline-flex min-h-11 items-center rounded-lg border px-3 text-sm" href={directoryUrl(filters,{page:filters.page+1})}>{t('Próxima')} →</Link>:<span/>}</nav>}
    </>}
  </main>
}
