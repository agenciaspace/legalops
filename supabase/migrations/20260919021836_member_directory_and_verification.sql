-- Only explicitly public professional details are mirrored. Never copy CV or job preferences.
alter table public.account_profiles
  add column directory_country text check (directory_country is null or directory_country ~ '^[A-Z]{2}$'),
  add column directory_region text check (length(directory_region) <= 120),
  add column directory_city text check (length(directory_city) <= 120),
  add column directory_qualifications text[] not null default '{}' check (cardinality(directory_qualifications) <= 15 and length(array_to_string(directory_qualifications,',')) <= 2400);
alter table public.community_members
  add column directory_country text,
  add column directory_region text,
  add column directory_city text,
  add column directory_qualifications text[] not null default '{}',
  add column professional_type text;
grant select(directory_country,directory_region,directory_city,directory_qualifications), update(directory_country,directory_region,directory_city,directory_qualifications) on public.account_profiles to authenticated;
grant select(directory_country,directory_region,directory_city,directory_qualifications,professional_type) on public.community_members to authenticated;

create table public.club_profile_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','verified','rejected','superseded')),
  profile_snapshot jsonb not null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  review_note text check (length(review_note) <= 1000)
);
create unique index club_profile_reviews_one_pending on public.club_profile_reviews(user_id) where status='pending';
create index club_profile_reviews_owner_date on public.club_profile_reviews(user_id,submitted_at desc);
create index club_profile_reviews_queue on public.club_profile_reviews(status,submitted_at);
create index club_profile_reviews_reviewer on public.club_profile_reviews(reviewed_by);
alter table public.club_profile_reviews enable row level security;
revoke all on public.club_profile_reviews from anon,authenticated;
grant select on public.club_profile_reviews to authenticated;
grant all on public.club_profile_reviews to service_role;
create policy profile_reviews_owner_read on public.club_profile_reviews for select to authenticated using(user_id=(select auth.uid()));

create or replace function public.sync_community_member_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
declare identity_changed boolean := false;
begin
  if tg_op='UPDATE' then
    identity_changed := row(new.full_name,new."current_role",new.organization_name,new.linkedin_url) is distinct from row(old.full_name,old."current_role",old.organization_name,old.linkedin_url);
  end if;
  insert into public.community_members (
    user_id,display_name,"current_role",areas_of_expertise,public_headline,public_bio,
    organization_name,organization_description,avatar_path,linkedin_url,profile_verification_status,
    profile_verified_at,created_at,updated_at,directory_country,directory_region,directory_city,directory_qualifications,professional_type
  ) values (
    new.user_id,coalesce(nullif(new.full_name,''),'Membro LegalOps'),new."current_role",coalesce(new.areas_of_expertise,'{}'),new.public_headline,new.public_bio,
    new.organization_name,new.organization_description,new.avatar_path,new.linkedin_url,'unverified',null,coalesce(new.created_at,now()),now(),
    new.directory_country,new.directory_region,new.directory_city,new.directory_qualifications,new.professional_type
  ) on conflict(user_id) do update set
    display_name=excluded.display_name,"current_role"=excluded."current_role",areas_of_expertise=excluded.areas_of_expertise,
    public_headline=excluded.public_headline,public_bio=excluded.public_bio,organization_name=excluded.organization_name,
    organization_description=excluded.organization_description,avatar_path=excluded.avatar_path,linkedin_url=excluded.linkedin_url,
    directory_country=excluded.directory_country,directory_region=excluded.directory_region,directory_city=excluded.directory_city,
    directory_qualifications=excluded.directory_qualifications,professional_type=excluded.professional_type,
    profile_verification_status=case when public.community_members.profile_verification_status='rejected' then 'rejected' when identity_changed then 'unverified' else public.community_members.profile_verification_status end,
    profile_verified_at=case when identity_changed then null else public.community_members.profile_verified_at end,updated_at=now();
  if identity_changed then
    update public.club_profile_reviews set status='superseded',review_note='Seu nome, cargo, organização ou LinkedIn mudou. Solicite uma nova análise.' where user_id=new.user_id and status='pending';
  end if;
  return new;
end;
$$;
revoke all on function public.sync_community_member_profile() from public,anon,authenticated;
drop trigger account_profiles_sync_community_member on public.account_profiles;
create trigger account_profiles_sync_community_member after insert or update of full_name,"current_role",areas_of_expertise,public_headline,public_bio,organization_name,organization_description,avatar_path,linkedin_url,linkedin_data,directory_country,directory_region,directory_city,directory_qualifications,professional_type
on public.account_profiles for each row execute function public.sync_community_member_profile();
update public.community_members m set professional_type=p.professional_type from public.account_profiles p where p.user_id=m.user_id;

create function public.request_club_profile_review() returns uuid
language plpgsql security definer set search_path = '' as $$
declare p public.account_profiles; m public.community_members; result uuid;
begin
  if auth.uid() is null or not private.has_active_club_access() then raise exception 'MEMBERSHIP_REQUIRED'; end if;
  select * into p from public.account_profiles where user_id=auth.uid() for update;
  select * into m from public.community_members where user_id=auth.uid() for update;
  if coalesce(length(btrim(p.full_name)),0)<3 or coalesce(length(btrim(p."current_role")),0)<2
    or coalesce(length(btrim(p.organization_name)),0)<2 or coalesce(length(btrim(p.public_bio)),0)<20
    or coalesce(cardinality(p.areas_of_expertise),0)=0
    or coalesce(p.linkedin_url,'') !~ '^https://www\.linkedin\.com/in/[^/?#[:space:]]+$'
    then raise exception 'PROFILE_INCOMPLETE'; end if;
  if m.profile_verification_status='verified' then raise exception 'ALREADY_VERIFIED'; end if;
  select id into result from public.club_profile_reviews where user_id=auth.uid() and status='pending';
  if result is not null then return result; end if;
  insert into public.club_profile_reviews(user_id,profile_snapshot) values(auth.uid(),jsonb_build_object('full_name',p.full_name,'current_role',p."current_role",'organization_name',p.organization_name,'linkedin_url',p.linkedin_url)) returning id into result;
  update public.community_members set profile_verification_status='pending',profile_verified_at=null where user_id=auth.uid();
  return result;
end;
$$;
revoke all on function public.request_club_profile_review() from public,anon;
grant execute on function public.request_club_profile_review() to authenticated;

-- Trusted server-only review; application validates the operator against admin configuration.
create function public.review_club_profile(p_request uuid,p_operator uuid,p_decision text,p_note text) returns void
language plpgsql security definer set search_path = '' as $$
declare r public.club_profile_reviews; p public.account_profiles; owner_id uuid;
begin
  if p_operator is null or p_decision not in ('verified','rejected') or length(btrim(coalesce(p_note,''))) not between 10 and 1000 then raise exception 'INVALID_REVIEW'; end if;
  select user_id into owner_id from public.club_profile_reviews where id=p_request;
  if owner_id is null then raise exception 'REQUEST_NOT_FOUND'; end if;
  select * into p from public.account_profiles where user_id=owner_id for update;
  perform 1 from public.community_members where user_id=owner_id for update;
  select * into r from public.club_profile_reviews where id=p_request for update;
  if r.status<>'pending' then raise exception 'ALREADY_REVIEWED'; end if;
  if r.profile_snapshot is distinct from jsonb_build_object('full_name',p.full_name,'current_role',p."current_role",'organization_name',p.organization_name,'linkedin_url',p.linkedin_url) then raise exception 'PROFILE_CHANGED'; end if;
  update public.club_profile_reviews set status=p_decision,reviewed_at=now(),reviewed_by=p_operator,review_note=btrim(p_note) where id=p_request;
  update public.community_members set profile_verification_status=p_decision,profile_verified_at=case when p_decision='verified' then now() else null end where user_id=owner_id;
end;
$$;
revoke all on function public.review_club_profile(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.review_club_profile(uuid,uuid,text,text) to service_role;

create function private.directory_fold(value text) returns text language sql immutable parallel safe set search_path = '' as $$
  select lower(translate(coalesce(value,''),'ÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÑÇáàâãäåéèêëíìîïóòôõöúùûüñç','AAAAAAEEEEIIIIOOOOOUUUUNCaaaaaaeeeeiiiiooooouuuunc'));
$$;
revoke all on function private.directory_fold(text) from public,anon;
grant execute on function private.directory_fold(text) to authenticated;
create function public.search_club_members(filters jsonb default '{}') returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare result jsonb; page_no int := greatest(1,least(10000,coalesce((filters->>'page')::int,1)));
begin
  if auth.uid() is null or not private.has_active_club_access() then raise exception 'MEMBERSHIP_REQUIRED'; end if;
  with eligible as materialized (
    select m.user_id,m.display_name,m.current_role,m.areas_of_expertise,m.public_headline,m.public_bio,m.organization_name,m.organization_description,m.avatar_path,m.profile_verification_status,
      m.directory_country,m.directory_region,m.directory_city,m.directory_qualifications,m.professional_type,m.created_at
    from public.community_members m
    where m.club_access_status in ('active','complimentary') and (m.club_access_expires_at is null or m.club_access_expires_at>now())
      and length(btrim(m.display_name))>=2 and lower(btrim(m.display_name)) not in ('membro legalops','membro do club')
      and length(btrim(m.current_role))>0 and length(btrim(m.organization_name))>0
      and (coalesce(filters->>'scope','')<>'contacts' or exists(select 1 from public.community_saved_contacts c where c.user_id=auth.uid() and c.member_id=m.user_id))
  ), filtered as materialized (
    select * from eligible m where
      (coalesce(filters->>'country','')='' or m.directory_country=filters->>'country')
      and (coalesce(filters->>'region','')='' or private.directory_fold(m.directory_region)=private.directory_fold(filters->>'region'))
      and (coalesce(filters->>'city','')='' or private.directory_fold(m.directory_city)=private.directory_fold(filters->>'city'))
      and (coalesce(filters->>'type','')='' or m.professional_type=filters->>'type')
      and (coalesce(filters->>'expertise','')='' or exists(select 1 from unnest(m.areas_of_expertise) a where private.directory_fold(a)=private.directory_fold(filters->>'expertise')))
      and (coalesce(filters->>'qualification','')='' or exists(select 1 from unnest(m.directory_qualifications) a where private.directory_fold(a)=private.directory_fold(filters->>'qualification')))
      and (coalesce(filters->>'verification','')='' or (filters->>'verification'='verified' and m.profile_verification_status='verified') or (filters->>'verification'='pending' and m.profile_verification_status='pending') or (filters->>'verification'='unverified' and m.profile_verification_status in ('unverified','rejected')))
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
