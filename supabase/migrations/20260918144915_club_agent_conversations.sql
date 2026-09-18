create table public.club_agent_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nova conversa' check(length(title) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,id)
);
create index club_agent_conversations_owner_time on public.club_agent_conversations(user_id,updated_at desc,id desc);
alter table public.club_agent_conversations enable row level security;
revoke all on public.club_agent_conversations from public,anon,authenticated;
grant select on public.club_agent_conversations to authenticated;
grant all on public.club_agent_conversations to service_role;
create policy agent_conversations_owner_read on public.club_agent_conversations
  for select to authenticated using(user_id=(select auth.uid()));

alter table public.club_agent_turns add column conversation_id uuid;
-- Preserve every previous message in one conversation per owner.
with conversations as (
  insert into public.club_agent_conversations(user_id,title,created_at,updated_at)
  select user_id,'Conversa anterior',min(created_at),max(created_at)
  from public.club_agent_turns group by user_id returning id,user_id
)
update public.club_agent_turns t set conversation_id=c.id
from conversations c where t.user_id=c.user_id;
alter table public.club_agent_turns alter column conversation_id set not null;
alter table public.club_agent_turns add constraint club_agent_turns_conversation_owner_fk
  foreign key(user_id,conversation_id) references public.club_agent_conversations(user_id,id) on delete cascade;
create index club_agent_turns_conversation_time on public.club_agent_turns(user_id,conversation_id,created_at desc,id desc);

create function public.reserve_club_agent_conversation_turn(member_id uuid,question_text text,conversation_uuid uuid default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare turn_id uuid; used_count integer; selected_conversation uuid := conversation_uuid;
  today date := (now() at time zone 'UTC')::date;
begin
  perform pg_advisory_xact_lock(hashtextextended(member_id::text,0));
  if question_text is null or length(btrim(question_text)) not between 3 and 2000 then raise exception 'INVALID_QUESTION'; end if;
  if not exists(select 1 from public.community_members where user_id=member_id
    and club_access_status in ('active','complimentary') and (club_access_expires_at is null or club_access_expires_at>now())
    and club_pro_status in ('active','complimentary') and (club_pro_expires_at is null or club_pro_expires_at>now()))
    then raise exception 'PRO_REQUIRED'; end if;
  if selected_conversation is not null and not exists(select 1 from public.club_agent_conversations where id=selected_conversation and user_id=member_id)
    then raise exception 'CONVERSATION_NOT_FOUND'; end if;
  if exists(select 1 from public.club_agent_turns where user_id=member_id and status='pending' and created_at>now()-interval '2 minutes')
    then raise exception 'QUESTION_IN_PROGRESS'; end if;
  insert into public.club_agent_usage(user_id,day,used) values(member_id,today,0) on conflict do nothing;
  update public.club_agent_usage set used=used+1 where user_id=member_id and day=today and used<30 returning used into used_count;
  if not found then raise exception 'DAILY_LIMIT'; end if;
  if selected_conversation is null then
    insert into public.club_agent_conversations(user_id,title) values(member_id,left(btrim(question_text),80)) returning id into selected_conversation;
  else
    update public.club_agent_conversations set
      title=case when not exists(select 1 from public.club_agent_turns where conversation_id=selected_conversation) then left(btrim(question_text),80) else title end,
      updated_at=now() where id=selected_conversation and user_id=member_id;
  end if;
  insert into public.club_agent_turns(user_id,conversation_id,question)
    values(member_id,selected_conversation,btrim(question_text)) returning id into turn_id;
  return jsonb_build_object('turn_id',turn_id,'conversation_id',selected_conversation);
end $$;
revoke all on function public.reserve_club_agent_conversation_turn(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.reserve_club_agent_conversation_turn(uuid,text,uuid) to service_role;

-- Keep clients deployed before this migration working during the rollout.
create or replace function public.reserve_club_agent_turn(member_id uuid,question_text text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare selected_conversation uuid; reservation jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended(member_id::text,0));
  select id into selected_conversation from public.club_agent_conversations where user_id=member_id order by updated_at desc,id desc limit 1;
  reservation := public.reserve_club_agent_conversation_turn(member_id,question_text,selected_conversation);
  return (reservation->>'turn_id')::uuid;
end $$;

create function public.delete_club_agent_conversation(member_id uuid,conversation_uuid uuid)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(member_id::text,0));
  if not exists(select 1 from public.club_agent_conversations where id=conversation_uuid and user_id=member_id) then return false; end if;
  if exists(select 1 from public.club_agent_turns where user_id=member_id and conversation_id=conversation_uuid
    and status='pending' and created_at>now()-interval '2 minutes') then raise exception 'QUESTION_IN_PROGRESS'; end if;
  -- Cascade only this conversation's messages. Preferences and daily usage stay.
  delete from public.club_agent_conversations where id=conversation_uuid and user_id=member_id;
  return true;
end $$;
revoke all on function public.delete_club_agent_conversation(uuid,uuid) from public,anon,authenticated;
grant execute on function public.delete_club_agent_conversation(uuid,uuid) to service_role;
