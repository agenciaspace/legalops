import Link from 'next/link'
import { redirect } from 'next/navigation'
import { agentSession } from '@/lib/club-agent-access'
import { getCreditStatus } from '@/lib/club-credits'
import { creditCopy, creditActionLabel } from '@/lib/club-credit-copy'
import { getClubLocale } from '@/lib/club-locale-server'
import { proPrice } from '@/lib/club-pro'
import { ReceiptForm } from '@/app/club/checkout/ReceiptForm'
import { createCreditOrder, submitCreditReceipt, cancelCreditOrder } from './actions'
export const dynamic='force-dynamic'
export default async function Credits({searchParams}:{searchParams?:{error?:string}}){
  const access=await agentSession();if(access.error)redirect('/community/pro')
  const locale=getClubLocale();const c=creditCopy(locale)
  const [wallet,{data:transactions},{data:orders}]=await Promise.all([
    getCreditStatus(access.user.id),
    access.supabase.from('club_credit_transactions').select('id,action,status,funding,cost,created_at').eq('user_id',access.user.id).order('created_at',{ascending:false}).limit(30),
    access.supabase.from('club_credit_orders').select('id,credits,price_cents,status,review_note').eq('user_id',access.user.id).order('created_at',{ascending:false}).limit(5),
  ])
  const pending=orders?.find(order=>['pending','submitted'].includes(order.status))
  return <div className="mx-auto max-w-3xl space-y-6 px-4 py-7"><Link href="/community/pro" className="inline-flex min-h-11 items-center underline">Club Pro</Link><h1 className="text-3xl font-semibold">{c.title}</h1>
    <div className="grid grid-cols-2 gap-3"><section className="rounded-xl border bg-white p-4"><p className="text-sm">{c.included}</p><p className="mt-2 text-3xl font-semibold">{wallet.included_remaining}</p><p className="text-xs">{wallet.allowance} {wallet.period==='day'?c.daily:c.monthly}</p></section><section className="rounded-xl border bg-white p-4"><p className="text-sm">{c.purchased}</p><p className="mt-2 text-3xl font-semibold">{wallet.purchased}</p></section></div>
    <p className="text-sm leading-6">{c.rules}</p><p className="text-xs leading-6">{c.reset}</p><Link href="/community/profile#api-key" className="inline-flex min-h-11 items-center underline">OpenAI API →</Link>
    <section className="rounded-xl border bg-white p-5"><h2 className="text-lg font-semibold">{c.costs}</h2><dl className="mt-4 space-y-3">{Object.entries(wallet.costs).map(([action,cost])=><div key={action} className="flex items-center justify-between gap-3 text-sm"><dt>{creditActionLabel(action,locale)}</dt><dd className="font-semibold">{cost}</dd></div>)}</dl></section>
    <section className="rounded-xl border bg-white p-5"><h2 className="text-lg font-semibold">{c.buy}</h2>{searchParams?.error&&<p role="alert" className="mt-3 text-red-700">{c.unavailable}</p>}
      {pending?.status==='submitted'?<p className="mt-4">{locale==='en'?'Payment under review. Credits are added after bank confirmation.':locale==='es'?'Pago en revisión. Los créditos se añaden tras confirmar el ingreso.':'Pagamento em conferência. Os créditos entram após a confirmação no banco.'}</p>:pending?<><p className="my-4">{pending.credits} · {proPrice(pending.price_cents)}</p><ReceiptForm orderId={pending.id} submitReceipt={submitCreditReceipt}/><form action={cancelCreditOrder}><input type="hidden" name="order_id" value={pending.id}/><button className="mt-3 min-h-11 underline">{locale==='en'?'Cancel unpaid order':locale==='es'?'Cancelar pedido sin pagar':'Cancelar pedido não pago'}</button></form></>:wallet.sales_active?<form action={createCreditOrder}><p className="my-4">{wallet.pack_credits} {c.title.toLowerCase()} · {proPrice(wallet.pack_price_cents!)}</p><button className="min-h-12 rounded-lg bg-[#24231F] px-4 text-white">{c.buy}</button><p className="mt-3 text-xs">PIX · {locale==='en'?'Manual bank confirmation':locale==='es'?'Confirmación bancaria manual':'Conferência bancária manual'}</p></form>:<p className="mt-4">{c.closed}</p>}
      {orders?.filter(order=>order.status==='rejected').slice(0,1).map(order=><p key={order.id} className="mt-3 text-sm text-red-700">{order.review_note}</p>)}
    </section><section><h2 className="text-lg font-semibold">{c.history}</h2><ul className="mt-3 divide-y">{transactions?.map(tx=><li key={tx.id} className="py-3 text-sm"><p className="font-semibold">{creditActionLabel(tx.action,locale)} · {tx.funding==='purchase'?'+':tx.funding==='api'||tx.status==='failed'?'':'−'}{tx.funding==='api'?c.api:tx.status==='failed'?0:tx.cost}</p><p className="mt-1 text-xs">{new Date(tx.created_at).toLocaleString(locale)} · {tx.status==='completed'?c.completed:tx.status==='failed'?(tx.funding==='api'?c.apiFailed:c.failed):c.pending}</p></li>)}</ul></section></div>
}
