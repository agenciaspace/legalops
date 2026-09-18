-- Private anchor metadata is separate from the public document tree.
alter table public.contract_map_contributions add column anchor jsonb;

create function public.contract_map_comment_anchor(p_section text,p_body text,p_version int,p_quote text,p_anchor jsonb,p_parent uuid default null,p_mentions uuid[] default '{}') returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 if auth.uid() is null or not private.has_active_club_access() then raise exception 'MEMBERSHIP_REQUIRED'; end if;
 if p_anchor is null or jsonb_typeof(p_anchor) <> 'object' then raise exception 'INVALID_ANCHOR'; end if;
 if (select count(*) from jsonb_object_keys(p_anchor))<>5
   or not(p_anchor ?& array['start','end','prefix','suffix','source'])
   or jsonb_typeof(p_anchor->'start')<>'number' or jsonb_typeof(p_anchor->'end')<>'number'
   or (p_anchor->>'start')!~'^[0-9]{1,5}$' or (p_anchor->>'end')!~'^[0-9]{1,5}$'
   or (p_anchor->>'end')::int>60000 or (p_anchor->>'end')::int<=(p_anchor->>'start')::int
   or (p_anchor->>'end')::int-(p_anchor->>'start')::int>1000
   or jsonb_typeof(p_anchor->'prefix')<>'string' or length(p_anchor->>'prefix')>64
   or jsonb_typeof(p_anchor->'suffix')<>'string' or length(p_anchor->>'suffix')>64
   or jsonb_typeof(p_anchor->'source')<>'string' or p_anchor->>'source' not in ('published','draft')
   or p_quote is null or length(trim(p_quote)) not between 1 and 1000
   or p_parent is not null then raise exception 'INVALID_ANCHOR'; end if;
 -- Reuse membership, rate limits, quote/version validation and mention delivery.
 result:=public.contract_map_submit(p_section,'comment',p_body,p_version,null,false,p_quote,null,p_mentions);
 update public.contract_map_contributions set anchor=p_anchor where id=result;
 return result;
end $$;
revoke all on function public.contract_map_comment_anchor(text,text,int,text,jsonb,uuid,uuid[]) from public,anon;
grant execute on function public.contract_map_comment_anchor(text,text,int,text,jsonb,uuid,uuid[]) to authenticated;
