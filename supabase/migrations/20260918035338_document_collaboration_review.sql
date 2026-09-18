create or replace function private.valid_map_node(n jsonb, depth int default 0) returns boolean language plpgsql immutable set search_path = '' as $$
declare typ text; child jsonb; mark jsonb; permitted text[];
begin
  if n is null or jsonb_typeof(n) <> 'object' or depth > 12 or octet_length(n::text)>100000 then return false; end if;
  if depth=0 and not jsonb_path_exists(n, '$.** ? (@.type == "text" && @.text != "")') then return false; end if;
  typ := n->>'type';
  if typ is null or typ not in ('doc','paragraph','heading','bulletList','orderedList','listItem','blockquote','text','hardBreak','table','tableRow','tableCell','tableHeader','taskList','taskItem') or (depth=0) <> (typ='doc') then return false; end if;
  if exists(select 1 from jsonb_object_keys(n) k where k not in ('type','text','content','attrs','marks')) then return false; end if;
  if typ='text' then
    if jsonb_typeof(n->'text') is distinct from 'string' or length(n->>'text') not between 1 and 20000 then return false; end if;
  elsif n ? 'text' then return false;
  end if;
  if n ? 'attrs' then
    if jsonb_typeof(n->'attrs') <> 'object' then return false; end if;
    if typ='heading' then
      if exists(select 1 from jsonb_object_keys(n->'attrs') k where k <> 'level') or (n->'attrs'->>'level') not in ('2','3') then return false; end if;
    elsif typ='orderedList' then
      if exists(select 1 from jsonb_object_keys(n->'attrs') k where k <> 'start') or coalesce(n->'attrs'->>'start','') !~ '^[0-9]{1,5}$' then return false; end if;
      if (n->'attrs'->>'start')::int not between 1 and 10000 then return false; end if;
    elsif typ='taskItem' then
      if exists(select 1 from jsonb_object_keys(n->'attrs') k where k <> 'checked') or jsonb_typeof(n->'attrs'->'checked') is distinct from 'boolean' then return false; end if;
    elsif typ in ('tableCell','tableHeader') then
      if exists(select 1 from jsonb_object_keys(n->'attrs') k where k not in ('colspan','rowspan','colwidth')) then return false; end if;
      if coalesce(n->'attrs'->>'colspan','') !~ '^[0-9]{1,2}$' or coalesce(n->'attrs'->>'rowspan','') !~ '^[0-9]{1,2}$' then return false; end if;
      if (n->'attrs'->>'colspan')::int not between 1 and 50 or (n->'attrs'->>'rowspan')::int not between 1 and 50 then return false; end if;
      if n->'attrs' ? 'colwidth' and n->'attrs'->'colwidth' <> 'null'::jsonb then
        if jsonb_typeof(n->'attrs'->'colwidth') <> 'array' then return false; end if;
        if jsonb_array_length(n->'attrs'->'colwidth')>50 then return false; end if;
        for mark in select value from jsonb_array_elements(n->'attrs'->'colwidth') loop
          if mark::text !~ '^[0-9]{1,4}$' then return false; end if;
          if (mark::text)::int>4000 then return false; end if;
        end loop;
      end if;
    elsif n->'attrs' <> '{}'::jsonb then return false;
    end if;
  end if;
  if typ='heading' and coalesce(n->'attrs'->>'level','') not in ('2','3') then return false; end if;
  if n ? 'marks' then
    if typ <> 'text' or jsonb_typeof(n->'marks') <> 'array' then return false; end if;
    if jsonb_array_length(n->'marks')>2 then return false; end if;
    for mark in select value from jsonb_array_elements(n->'marks') loop
      if mark not in ('{"type":"bold"}'::jsonb,'{"type":"italic"}'::jsonb) then return false; end if;
    end loop;
  end if;
  permitted := case typ
    when 'doc' then array['paragraph','heading','bulletList','orderedList','blockquote','taskList','table']
    when 'table' then array['tableRow'] when 'tableRow' then array['tableCell','tableHeader']
    when 'tableCell' then array['paragraph','heading','bulletList','orderedList','taskList'] when 'tableHeader' then array['paragraph','heading','bulletList','orderedList','taskList']
    when 'taskList' then array['taskItem'] when 'taskItem' then array['paragraph','bulletList','orderedList','taskList']
    when 'paragraph' then array['text','hardBreak'] when 'heading' then array['text','hardBreak']
    when 'bulletList' then array['listItem'] when 'orderedList' then array['listItem']
    when 'listItem' then array['paragraph','bulletList','orderedList']
    when 'blockquote' then array['paragraph','heading','bulletList','orderedList'] else array[]::text[] end;
  if n ? 'content' then
    if jsonb_typeof(n->'content') <> 'array' then return false; end if;
    if jsonb_array_length(n->'content')>300 then return false; end if;
    for child in select value from jsonb_array_elements(n->'content') loop
      if not (coalesce(child->>'type','') = any(permitted)) or not private.valid_map_node(child,depth+1) then return false; end if;
    end loop;
  end if;
  return true;
end;
$$;
revoke all on function private.valid_map_node(jsonb,int) from public,anon,authenticated;


create or replace function public.contract_map_publish(p_section text,p_version int,p_content jsonb,p_note text,p_contribution uuid default null) returns int
language plpgsql security definer set search_path = '' as $$
declare current_section public.contract_map_sections; suggestion public.contract_map_contributions;
begin
  if auth.uid() is null or not private.is_contract_map_lead() then raise exception 'LEAD_REQUIRED'; end if;
  if p_content is null or not private.valid_map_node(p_content) or length(trim(coalesce(p_note,''))) not between 3 and 1000 then raise exception 'INVALID_CONTENT'; end if;
  select * into current_section from public.contract_map_sections where id=p_section for update;
  if not found then raise exception 'SECTION_NOT_FOUND'; end if;
  if p_version is distinct from current_section.version then raise exception 'VERSION_CONFLICT'; end if;
  if p_contribution is not null then
    select * into suggestion from public.contract_map_contributions where id=p_contribution for update;
    if not found or suggestion.section_id <> p_section or suggestion.kind <> 'suggestion' or suggestion.status <> 'open' then raise exception 'INVALID_SUGGESTION'; end if;
    if suggestion.base_version <> current_section.version then raise exception 'VERSION_CONFLICT'; end if;
    -- Leads may accept selected changes or adjust a suggestion. The actual published JSON is retained in revisions.
    if p_content <> suggestion.proposed_content then p_note := left(trim(p_note),920) || ' [Aceita com ajustes; consulte a versão publicada.]'; end if;
  end if;
  update public.contract_map_sections set content=p_content,version=version+1,updated_at=now(),updated_by=auth.uid() where id=p_section;
  insert into public.contract_map_revisions(section_id,version,content,editor_id,note,contribution_id) values(p_section,p_version+1,p_content,auth.uid(),trim(p_note),p_contribution);
  if p_contribution is not null then update public.contract_map_contributions set status='accepted',reviewer_id=auth.uid(),review_note=trim(p_note),reviewed_at=now() where id=p_contribution; end if;
  return p_version+1;
end;
$$;
revoke all on function public.contract_map_publish(text,int,jsonb,text,uuid) from public,anon;
grant execute on function public.contract_map_publish(text,int,jsonb,text,uuid) to authenticated;


alter table public.contract_map_contributions add column anchor_quote text check (length(anchor_quote) between 1 and 1000);
alter table public.contract_map_contributions add column parent_id uuid references public.contract_map_contributions(id);
alter table public.contract_map_contributions add column mentioned_user_ids uuid[] not null default '{}';

create table public.contract_map_notifications (
 id uuid primary key default gen_random_uuid(),
 recipient_id uuid not null references auth.users(id),
 sender_id uuid not null references auth.users(id),
 contribution_id uuid not null references public.contract_map_contributions(id),
 section_id text not null references public.contract_map_sections(id),
 preview text not null,
 created_at timestamptz not null default now(),
 read_at timestamptz,
 unique(recipient_id,contribution_id)
);
alter table public.contract_map_notifications enable row level security;
revoke all on public.contract_map_notifications from anon,authenticated;
grant select on public.contract_map_notifications to authenticated;
grant update(read_at) on public.contract_map_notifications to authenticated;
create policy map_notifications_read on public.contract_map_notifications for select to authenticated using (recipient_id=(select auth.uid()) and private.has_active_club_access());
create policy map_notifications_seen on public.contract_map_notifications for update to authenticated using (recipient_id=(select auth.uid()) and private.has_active_club_access()) with check (recipient_id=(select auth.uid()) and private.has_active_club_access());
create index map_notifications_inbox on public.contract_map_notifications(recipient_id,created_at desc);

create function public.contract_map_submit(p_section text,p_kind text,p_body text,p_version int,p_content jsonb default null,p_license boolean default false,p_quote text default null,p_parent uuid default null,p_mentions uuid[] default '{}') returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid; recipients uuid[];
begin
 if auth.uid() is null or not private.has_active_club_access() then raise exception 'MEMBERSHIP_REQUIRED'; end if;
 if coalesce(cardinality(p_mentions),0)>10 then raise exception 'TOO_MANY_MENTIONS'; end if;
 if p_quote is not null and (p_kind<>'comment' or length(trim(p_quote)) not between 1 and 1000) then raise exception 'INVALID_QUOTE'; end if;
 if p_parent is not null and (p_kind<>'comment' or not exists(select 1 from public.contract_map_contributions where id=p_parent and section_id=p_section and kind='comment')) then raise exception 'INVALID_REPLY'; end if;
 if not exists(select 1 from public.contract_map_revisions where section_id=p_section and version=p_version) then raise exception 'VERSION_CONFLICT'; end if;
 result := public.contract_map_contribute(p_section,p_kind,p_body,p_version,p_content,p_license);
 select coalesce(array_agg(distinct user_id),'{}') into recipients from public.community_members where user_id=any(coalesce(p_mentions,'{}')) and user_id<>auth.uid() and club_access_status in ('active','complimentary') and (club_access_expires_at is null or club_access_expires_at>now());
 update public.contract_map_contributions set anchor_quote=nullif(trim(p_quote),''),parent_id=p_parent,mentioned_user_ids=recipients,base_version=p_version where id=result;
 insert into public.contract_map_notifications(recipient_id,sender_id,contribution_id,section_id,preview) select unnest(recipients),auth.uid(),result,p_section,left(trim(p_body),180);
 return result;
end $$;
revoke all on function public.contract_map_submit(text,text,text,int,jsonb,boolean,text,uuid,uuid[]) from public,anon;
grant execute on function public.contract_map_submit(text,text,text,int,jsonb,boolean,text,uuid,uuid[]) to authenticated;

create function public.contract_map_publish_notify(p_section text,p_version int,p_content jsonb,p_note text,p_contribution uuid default null,p_mentions uuid[] default '{}') returns int
language plpgsql security definer set search_path='' as $$
declare result int;
begin
 result := public.contract_map_publish(p_section,p_version,p_content,p_note,p_contribution);
 if coalesce(cardinality(p_mentions),0)>0 then
  perform public.contract_map_submit(p_section,'comment','Versão publicada: '||p_note,result,null,false,null,null,p_mentions);
 end if;
 return result;
end $$;
revoke all on function public.contract_map_publish_notify(text,int,jsonb,text,uuid,uuid[]) from public,anon;
grant execute on function public.contract_map_publish_notify(text,int,jsonb,text,uuid,uuid[]) to authenticated;
