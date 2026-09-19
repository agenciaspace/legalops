import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { isLegalOpsAdminEmail } from '@/lib/legalops-admin'
import { reviewMemberProfile } from './actions'
export const dynamic='force-dynamic'
export default async function MemberValidationAdmin({searchParams}:{searchParams?:{error?:string;saved?:string;status?:string}}) {
  const db=await createServerSupabaseClient();const {data:{user}}=await db.auth.getUser()
  if(!user||!isLegalOpsAdminEmail(user.email)) redirect('/community')
  const status=['verified','rejected','superseded'].includes(searchParams?.status??'')?searchParams!.status!:'pending'
  const admin=createAdminClient()
  const {data:requests,error}=await admin.from('club_profile_reviews').select('id,user_id,status,profile_snapshot,submitted_at,reviewed_at,review_note').eq('status',status).order('submitted_at',{ascending:status==='pending'}).limit(100)
  return <main className="mx-auto max-w-4xl px-4 py-8"><Link href="/community/members" className="inline-flex min-h-11 items-center text-sm underline">← Membros</Link><h1 className="mt-4 text-2xl font-semibold">Validação de perfis</h1><p className="mt-3 text-sm leading-6 text-[#625E59]">Confira nome, cargo, organização e LinkedIn. Registre as evidências da conferência ou explique o ajuste necessário. A decisão aparece no perfil do titular; o motivo não aparece no diretório. A validação não altera acesso ao Club ou ao Pro.</p>
    <form className="mt-4 flex flex-wrap gap-3"><label className="text-sm">Status<select name="status" defaultValue={status} className="ml-2 min-h-11 rounded-lg border bg-white px-3"><option value="pending">Aguardando análise</option><option value="verified">Aprovados</option><option value="rejected">Ajustes solicitados</option><option value="superseded">Perfil alterado</option></select></label><button className="min-h-11 rounded-lg border px-4 text-sm">Filtrar</button></form>
    {error&&<p role="alert" className="mt-4 text-red-700">Não foi possível carregar a fila. Atualize esta página.</p>}
    {searchParams?.error&&<p role="alert" className="mt-4 text-red-700">{searchParams.error==='fields'?'Registre um motivo de 10 a 1.000 caracteres e confirme a conferência antes de aprovar.':'A solicitação pode ter mudado ou já ter sido revisada. Atualize a fila antes de tentar novamente.'}</p>}
    {searchParams?.saved&&<p role="status" className="mt-4 text-green-700">Decisão registrada e status atualizado.</p>}
    {!error&&!requests?.length&&<p className="mt-6">Nenhuma solicitação neste status.</p>}
    {requests?.map(request=>{const profile=request.profile_snapshot as Record<string,string>;return <section key={request.id} className="mt-5 rounded-2xl border border-[#CEC8BD] bg-white p-5"><h2 className="text-lg font-semibold">{profile.full_name}</h2><p className="mt-2 text-sm">{profile.current_role} · {profile.organization_name}</p><p className="mt-2 text-xs text-[#625E59]">Solicitado em {new Date(request.submitted_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}</p><div className="mt-3 flex flex-wrap gap-4"><a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm underline">Conferir LinkedIn ↗</a><Link href={`/community/members/${request.user_id}`} className="inline-flex min-h-11 items-center text-sm underline">Ver perfil</Link></div>
      {status==='pending'?<form action={reviewMemberProfile} className="mt-3 space-y-4"><input type="hidden" name="request_id" value={request.id}/><label className="block text-sm">Evidências ou ajustes necessários<textarea name="note" required minLength={10} maxLength={1000} rows={3} className="mt-2 block w-full rounded-lg border p-3"/><span className="mt-2 block text-xs text-[#625E59]">Este texto será mostrado ao titular do perfil.</span></label><label className="flex items-start gap-2 text-sm"><input name="checked" type="checkbox" className="mt-1"/>Conferi nome, cargo, organização e a correspondência com o LinkedIn.</label><div className="flex flex-wrap gap-3"><button name="decision" value="verified" className="min-h-11 rounded-lg bg-[#24231F] px-4 text-sm font-semibold text-white">Aprovar validação</button><button name="decision" value="rejected" className="min-h-11 rounded-lg border px-4 text-sm font-semibold">Solicitar ajustes</button></div></form>:<p className="mt-4 whitespace-pre-wrap text-sm leading-6">{request.review_note}</p>}
    </section>})}<p className="mt-6 text-xs text-[#625E59]">Até 100 solicitações por status. A fila pendente mostra primeiro as mais antigas.</p>
  </main>
}
