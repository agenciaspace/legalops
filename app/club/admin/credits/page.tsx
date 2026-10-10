import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { isLegalOpsAdminEmail } from '@/lib/legalops-admin'
import { PRO_RECEIPT_BUCKET, proPrice } from '@/lib/club-pro'
import { creditActionLabel } from '@/lib/club-credit-copy'
import { configureCredits, reviewCreditOrder } from './actions'
export const dynamic='force-dynamic'
export default async function CreditAdmin({searchParams}:{searchParams?:{error?:string;saved?:string}}){
  const db=await createServerSupabaseClient();const {data:{user}}=await db.auth.getUser()
  if(!user||!isLegalOpsAdminEmail(user.email))redirect('/community')
  const admin=createAdminClient()
  const [{data:settings},{data:costs},{data:orders}]=await Promise.all([
    admin.from('club_credit_settings').select('*').eq('id',true).single(),admin.from('club_credit_costs').select('*'),
    admin.from('club_credit_orders').select('*').eq('status','submitted').order('created_at'),
  ])
  const rows=await Promise.all((orders??[]).map(async order=>{const [{data:member},{data:receipt}]=await Promise.all([
    admin.from('community_members').select('display_name').eq('user_id',order.user_id).maybeSingle(),
    admin.storage.from(PRO_RECEIPT_BUCKET).createSignedUrl(order.receipt_path,300,{download:true}),
  ]);return {...order,name:member?.display_name??order.user_id,url:receipt?.signedUrl}}))
  return <main className="mx-auto max-w-3xl space-y-6 px-4 py-8"><Link className="inline-flex min-h-11 items-center underline" href="/club/admin/pro">Pagamentos do Pro</Link><h1 className="text-3xl font-semibold">Créditos do Pro</h1>{searchParams?.error&&<p role="alert" className="text-red-700">Confira os valores, o pedido e a confirmação bancária.</p>}{searchParams?.saved&&<p role="status">Salvo.</p>}
    <form action={configureCredits} className="space-y-5 rounded-xl border bg-white p-5"><h2 className="text-xl font-semibold">Franquia e custos</h2><label className="block">Créditos incluídos<input className="mt-2 block min-h-11 w-full rounded border p-2" type="number" name="allowance" min="0" max="1000000" required defaultValue={settings?.allowance}/></label><label className="block">Renovação<select name="period" className="mt-2 block min-h-11 w-full rounded border p-2" defaultValue={settings?.period}><option value="day">Diária (00h UTC)</option><option value="month">Mensal (dia 1, 00h UTC)</option></select></label>
      <p className="text-xs leading-5">A franquia é compartilhada entre todos os recursos. Alterações valem para novas gerações; créditos comprados e pedidos abertos preservam suas quantidades.</p>
      {costs?.map(cost=><label key={cost.action} className="block">{creditActionLabel(cost.action,'pt-BR')}<input className="mt-2 block min-h-11 w-full rounded border p-2" type="number" name={cost.action} min="1" max="1000000" required defaultValue={cost.credits}/></label>)}
      <h2 className="text-xl font-semibold">Pacote de créditos extras</h2><label className="block">Quantidade de créditos<input className="mt-2 block min-h-11 w-full rounded border p-2" type="number" name="pack_credits" min="1" max="1000000" defaultValue={settings?.pack_credits??''}/></label><label className="block">Preço em reais<input className="mt-2 block min-h-11 w-full rounded border p-2" inputMode="decimal" name="pack_price" defaultValue={settings?.pack_price_cents?(settings.pack_price_cents/100).toFixed(2):''}/></label><label className="flex min-h-11 items-center gap-3"><input type="checkbox" name="sales_active" defaultChecked={settings?.sales_active}/>Abrir venda de créditos por PIX</label><button className="min-h-12 rounded bg-[#24231F] px-4 text-white">Salvar configuração</button></form>
    <h2 className="text-xl font-semibold">Comprovantes para conferência</h2>{!rows.length&&<p>Nenhum pedido aguardando conferência.</p>}{rows.map(order=><section key={order.id} className="space-y-3 rounded-xl border bg-white p-5"><h3 className="font-semibold">{order.name} · {order.credits} créditos · {proPrice(order.price_cents)}</h3><p className="break-all text-xs">Pedido {order.id}</p>{order.url&&<a className="inline-flex min-h-11 items-center underline" href={order.url}>Baixar comprovante (5 minutos)</a>}<form action={reviewCreditOrder} className="space-y-3"><input type="hidden" name="order_id" value={order.id}/><label className="flex min-h-11 items-center gap-3"><input type="checkbox" name="verified"/>Conferi o recebimento deste valor no banco.</label><button name="decision" value="approve" className="min-h-12 rounded bg-[#24231F] px-4 text-white">Confirmar pagamento e liberar créditos</button><label className="block">Motivo da rejeição<textarea name="note" maxLength={1000} className="mt-2 block w-full rounded border p-2"/></label><button name="decision" value="reject" className="min-h-11 text-red-700 underline">Rejeitar pedido</button></form></section>)}
  </main>
}
