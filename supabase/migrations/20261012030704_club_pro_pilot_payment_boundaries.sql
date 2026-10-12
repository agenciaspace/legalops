-- Keep legacy PIX approval separate from recurring subscriptions and trial grants.
create or replace function public.approve_club_pro_order(order_id uuid, operator_id uuid)
returns timestamptz language plpgsql security invoker set search_path='' as $$
declare purchase public.club_pro_orders; expires_at timestamptz;
begin
  select * into purchase from public.club_pro_orders where id=order_id for update;
  if not found or purchase.status<>'submitted' or purchase.receipt_path is null or purchase.payment_mode<>'pix' then raise exception 'ORDER_NOT_SUBMITTED'; end if;
  perform 1 from public.community_members where user_id=purchase.user_id
    and club_access_status in ('active','complimentary') and (club_access_expires_at is null or club_access_expires_at>now()) for update;
  if not found then raise exception 'MEMBERSHIP_REQUIRED'; end if;
  select greatest(now(),coalesce(club_pro_expires_at,now())) + make_interval(months=>purchase.period_months)
    into expires_at from public.community_members where user_id=purchase.user_id;
  update public.community_members set club_pro_status='active',club_pro_expires_at=expires_at,updated_at=now() where user_id=purchase.user_id;
  update public.club_pro_orders set status='approved',grant_kind='paid',reviewed_by=operator_id,reviewed_at=now(),access_expires_at=expires_at where id=order_id;
  return expires_at;
end $$;
revoke all on function public.approve_club_pro_order(uuid,uuid) from public,anon,authenticated;
grant execute on function public.approve_club_pro_order(uuid,uuid) to service_role;
