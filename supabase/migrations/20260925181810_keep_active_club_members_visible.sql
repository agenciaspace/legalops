-- Active existing members keep their community access and directory presence even
-- while their profile is incomplete. Completeness remains available as a
-- separate badge/filter and new admissions still require a complete profile.
create or replace function public.search_club_members(filters jsonb default '{}') returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare result jsonb; page_no int := greatest(1,least(10000,coalesce((filters->>'page')::int,1)));
begin
  if auth.uid() is null or not private.has_active_club_access() then raise exception 'MEMBERSHIP_REQUIRED'; end if;
  with eligible as materialized (
    select m.user_id,m.display_name,m.current_role,m.areas_of_expertise,m.public_headline,m.public_bio,m.organization_name,m.organization_description,m.avatar_path,m.profile_verification_status,
      m.directory_country,m.directory_region,m.directory_city,m.directory_qualifications,m.professional_type,m.created_at
    from public.community_members m
    where m.club_access_status in ('active','complimentary') and (m.club_access_expires_at is null or m.club_access_expires_at>now())
      and (coalesce(filters->>'scope','')<>'contacts' or exists(select 1 from public.community_saved_contacts c where c.user_id=auth.uid() and c.member_id=m.user_id))
  ), filtered as materialized (
    select * from eligible m where
      (coalesce(filters->>'country','')='' or m.directory_country=filters->>'country')
      and (coalesce(filters->>'region','')='' or private.directory_fold(m.directory_region)=private.directory_fold(filters->>'region'))
      and (coalesce(filters->>'city','')='' or private.directory_fold(m.directory_city)=private.directory_fold(filters->>'city'))
      and (coalesce(filters->>'type','')='' or m.professional_type=filters->>'type')
      and (coalesce(filters->>'expertise','')='' or exists(select 1 from unnest(m.areas_of_expertise) a where private.directory_fold(a)=private.directory_fold(filters->>'expertise')))
      and (coalesce(filters->>'qualification','')='' or exists(select 1 from unnest(m.directory_qualifications) a where private.directory_fold(a)=private.directory_fold(filters->>'qualification')))
      and (coalesce(filters->>'verification','')='' or (filters->>'verification'='verified' and m.profile_verification_status='verified') or (filters->>'verification'='unverified' and m.profile_verification_status<>'verified'))
      and not exists (select 1 from regexp_split_to_table(private.directory_fold(left(coalesce(filters->>'q',''),200)),'\s+') word where word<>'' and strpos(private.directory_fold(concat_ws(' ',m.display_name,m.current_role,m.public_headline,m.public_bio,m.organization_name,m.organization_description,m.directory_country,m.directory_region,m.directory_city,array_to_string(m.areas_of_expertise,' '),array_to_string(m.directory_qualifications,' '))),word)=0)
  ), page as (
    select * from filtered order by case when filters->>'sort'='recent' then created_at end desc,private.directory_fold(display_name),user_id limit 24 offset (page_no-1)*24
  )
  select jsonb_build_object('total',(select count(*) from filtered),'page',page_no,'pageSize',24,
    'members',coalesce((select jsonb_agg(to_jsonb(page)-'created_at') from page),'[]'::jsonb),
    'facets',jsonb_build_object(
      'countries',coalesce((select jsonb_agg(v order by v) from (select distinct directory_country v from eligible where coalesce(directory_country,'')<>'') s),'[]'::jsonb),
      'regions',coalesce((select jsonb_agg(v order by v) from (select distinct directory_region v from eligible where coalesce(directory_region,'')<>'' and (coalesce(filters->>'country','')='' or directory_country=filters->>'country')) s),'[]'::jsonb),
      'cities',coalesce((select jsonb_agg(v order by v) from (select distinct directory_city v from eligible where coalesce(directory_city,'')<>'' and (coalesce(filters->>'country','')='' or directory_country=filters->>'country') and (coalesce(filters->>'region','')='' or private.directory_fold(directory_region)=private.directory_fold(filters->>'region'))) s),'[]'::jsonb),
      'expertise',coalesce((select jsonb_agg(v order by v) from (select distinct unnest(areas_of_expertise) v from eligible) s where v<>''),'[]'::jsonb),
      'qualifications',coalesce((select jsonb_agg(v order by v) from (select distinct unnest(directory_qualifications) v from eligible) s where v<>''),'[]'::jsonb)
    )) into result;
  return result;
end;
$$;

revoke all on function public.search_club_members(jsonb) from public,anon;
grant execute on function public.search_club_members(jsonb) to authenticated;
