-- Translate captions; files, filenames and image contents remain original.
alter table public.club_translation_sources add column resource_id uuid unique references public.community_event_resources(id) on delete cascade;
alter table public.club_translation_sources drop constraint club_translation_sources_check,drop constraint club_translation_sources_check1,drop constraint club_translation_sources_check2;
alter table public.club_translation_sources add constraint translation_one_original check(num_nonnulls(post_id,comment_id,event_id,topic_id,member_id,summary_id,resource_id)=1),add constraint translation_original_id check(entity_id=coalesce(post_id,comment_id,event_id,topic_id,member_id,summary_id,resource_id)),add constraint translation_original_kind check((entity_type='post' and post_id is not null) or (entity_type='comment' and comment_id is not null) or (entity_type='event' and event_id is not null) or (entity_type='topic' and topic_id is not null) or (entity_type='member' and member_id is not null) or (entity_type='summary' and summary_id is not null) or (entity_type='resource' and resource_id is not null));
create policy translations_follow_resource on public.club_translation_sources for select to authenticated using(resource_id is not null and exists(select 1 from public.community_event_resources r where r.id=resource_id));
create or replace function private.queue_club_translation() returns trigger language plpgsql security definer set search_path='' as $$
declare doc jsonb:=to_jsonb(new); selected jsonb; source_key uuid; hint text;
begin
  select coalesce(jsonb_object_agg(key,value),'{}') into selected from jsonb_each(doc) where key=any(string_to_array(tg_argv[2],','));
  if tg_argv[0]='resource' then
    selected:=jsonb_build_object('caption',coalesce(nullif(doc->>'description',''),case when strpos(doc->>'title',' · ')>0 then split_part(doc->>'title',' · ',1) else '' end));
  end if;
  source_key:=(doc->>tg_argv[1])::uuid;
  hint:=doc->>'source_locale';
  insert into public.club_translation_sources(entity_type,entity_id,post_id,comment_id,event_id,topic_id,member_id,summary_id,resource_id,payload,locale_hint)
  values(tg_argv[0],source_key,
    case when tg_argv[0]='post' then source_key end,case when tg_argv[0]='comment' then source_key end,
    case when tg_argv[0]='event' then source_key end,case when tg_argv[0]='topic' then source_key end,
    case when tg_argv[0]='member' then source_key end,case when tg_argv[0]='summary' then source_key end,case when tg_argv[0]='resource' then source_key end,selected,hint)
  on conflict(entity_type,entity_id) do update set
    payload=excluded.payload,locale_hint=excluded.locale_hint,revision=club_translation_sources.revision+1,
    detected_locale=null,translations='{}',status='pending',attempts=0,next_attempt_at=now(),lease_token=null,lease_expires_at=null,updated_at=now()
  where club_translation_sources.payload is distinct from excluded.payload or club_translation_sources.locale_hint is distinct from excluded.locale_hint;
  return new;
end $$;
revoke all on function private.queue_club_translation() from public,anon,authenticated;

create trigger queue_translation after insert or update on public.community_event_resources for each row execute function private.queue_club_translation('resource','id','description');
insert into public.club_translation_sources(entity_type,entity_id,resource_id,payload)
select 'resource',r.id,r.id,jsonb_build_object('caption',coalesce(nullif(r.description,''),case when strpos(r.title,' · ')>0 then split_part(r.title,' · ',1) else '' end)) from public.community_event_resources r;
