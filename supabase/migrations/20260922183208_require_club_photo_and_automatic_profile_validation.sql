-- Club profiles are complete automatically. A photo is part of admission and
-- remains required for active members; no administrator review is needed.
create or replace function private.club_profile_is_complete(
  p_user_id uuid,
  p_avatar_path text,
  p_full_name text,
  p_current_role text,
  p_organization_name text,
  p_linkedin_url text,
  p_public_bio text,
  p_areas_of_expertise text[]
) returns boolean
language sql immutable security invoker set search_path = '' as $$
  select
    coalesce(p_avatar_path ~ ('^' || p_user_id::text || '/[0-9a-f-]{36}\.jpg$'), false)
    and coalesce(length(btrim(p_full_name)), 0) >= 3
    and coalesce(length(btrim(p_current_role)), 0) >= 2
    and coalesce(length(btrim(p_organization_name)), 0) >= 2
    and coalesce(p_linkedin_url ~ '^https://www\.linkedin\.com/in/[^/?#[:space:]]+$', false)
    and coalesce(length(btrim(p_public_bio)), 0) >= 20
    and coalesce(cardinality(p_areas_of_expertise), 0) > 0;
$$;
revoke all on function private.club_profile_is_complete(uuid,text,text,text,text,text,text,text[]) from public,anon,authenticated;

create or replace function public.sync_community_member_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
declare profile_complete boolean;
begin
  profile_complete := private.club_profile_is_complete(
    new.user_id,new.avatar_path,new.full_name,new."current_role",new.organization_name,
    new.linkedin_url,new.public_bio,new.areas_of_expertise
  );
  insert into public.community_members (
    user_id,display_name,"current_role",areas_of_expertise,public_headline,public_bio,
    organization_name,organization_description,avatar_path,linkedin_url,profile_verification_status,
    profile_verified_at,created_at,updated_at,directory_country,directory_region,directory_city,directory_qualifications,professional_type
  ) values (
    new.user_id,coalesce(nullif(new.full_name,''),'Membro LegalOps'),new."current_role",coalesce(new.areas_of_expertise,'{}'),new.public_headline,new.public_bio,
    new.organization_name,new.organization_description,new.avatar_path,new.linkedin_url,
    case when profile_complete then 'verified' else 'unverified' end,
    case when profile_complete then now() else null end,coalesce(new.created_at,now()),now(),
    new.directory_country,new.directory_region,new.directory_city,new.directory_qualifications,new.professional_type
  ) on conflict(user_id) do update set
    display_name=excluded.display_name,"current_role"=excluded."current_role",areas_of_expertise=excluded.areas_of_expertise,
    public_headline=excluded.public_headline,public_bio=excluded.public_bio,organization_name=excluded.organization_name,
    organization_description=excluded.organization_description,avatar_path=excluded.avatar_path,linkedin_url=excluded.linkedin_url,
    directory_country=excluded.directory_country,directory_region=excluded.directory_region,directory_city=excluded.directory_city,
    directory_qualifications=excluded.directory_qualifications,professional_type=excluded.professional_type,
    profile_verification_status=case when profile_complete then 'verified' else 'unverified' end,
    profile_verified_at=case when profile_complete then coalesce(public.community_members.profile_verified_at,now()) else null end,
    updated_at=now();
  update public.club_profile_reviews
    set status='superseded',reviewed_at=coalesce(reviewed_at,now()),
        review_note='A fila manual foi substituída pela confirmação automática de cadastro completo.'
    where user_id=new.user_id and status='pending';
  return new;
end;
$$;
revoke all on function public.sync_community_member_profile() from public,anon,authenticated;

create or replace function public.join_club(profile_data jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  member_id uuid := (select auth.uid());
  interests text[];
  sector text := profile_data->>'sector';
  professional_type text;
  linkedin text := btrim(profile_data->>'linkedin_url');
  avatar text;
begin
  if member_id is null or not exists (
    select 1 from auth.users u where u.id = member_id and u.email_confirmed_at is not null
  ) then raise exception 'Confirme seu email antes de entrar na comunidade.'; end if;
  select avatar_path into avatar from public.account_profiles where user_id=member_id;
  if not coalesce(avatar ~ ('^' || member_id::text || '/[0-9a-f-]{36}\.jpg$'),false) then
    raise exception 'PHOTO_REQUIRED';
  end if;
  if exists (select 1 from public.community_members m where m.user_id = member_id
    and m.club_access_status = 'canceled') then
    raise exception 'Seu cadastro precisa de revisão pela administração.';
  end if;
  if coalesce(profile_data->>'accepted_rules', '') <> 'true'
    or coalesce(sector, '') not in ('legal_dept','law_firm','legal_ops','legal_tech','public_sector','freelance','education')
    or coalesce(length(btrim(profile_data->>'full_name')), 0) not between 3 and 160
    or coalesce(length(btrim(profile_data->>'current_role')), 0) not between 2 and 160
    or coalesce(length(btrim(profile_data->>'organization_name')), 0) not between 2 and 180
    or coalesce(length(btrim(profile_data->>'city')), 0) not between 2 and 120
    or coalesce(length(btrim(profile_data->>'public_bio')), 0) not between 30 and 1500
    or coalesce(linkedin, '') !~ '^https://www\.linkedin\.com/in/[^/?#[:space:]]+$'
    or length(linkedin) > 500
  then raise exception 'Complete o perfil profissional e aceite as regras.'; end if;
  if jsonb_typeof(profile_data->'interests') is distinct from 'array' then
    raise exception 'Escolha os assuntos de interesse.';
  end if;
  select array_agg(distinct value) into interests
    from jsonb_array_elements_text(profile_data->'interests') as v(value)
    where value in ('Legal Operations','Contratos / CLM','Tecnologia jurídica','IA e automação','Dados e indicadores','Gestão jurídica','Carreira');
  if coalesce(cardinality(interests),0) = 0 then raise exception 'Escolha os assuntos de interesse.'; end if;
  professional_type := case when sector in ('legal_ops','legal_tech','education') then 'other' else sector end;
  insert into public.account_profiles (user_id, full_name, "current_role", organization_name,
    professional_type, linkedin_url, public_bio, areas_of_expertise, preferred_locations)
  values (member_id, btrim(profile_data->>'full_name'), btrim(profile_data->>'current_role'),
    btrim(profile_data->>'organization_name'), professional_type, linkedin,
    btrim(profile_data->>'public_bio'), interests, array[btrim(profile_data->>'city')])
  on conflict (user_id) do update set full_name=excluded.full_name,
    "current_role"=excluded."current_role", organization_name=excluded.organization_name,
    professional_type=excluded.professional_type, linkedin_url=excluded.linkedin_url,
    public_bio=excluded.public_bio, areas_of_expertise=excluded.areas_of_expertise,
    preferred_locations=excluded.preferred_locations;
  update public.community_members set club_access_status = 'active',
    club_access_expires_at = null, club_rules_accepted_at = now(), updated_at = now()
    where user_id = member_id and club_access_status not in ('active','complimentary');
  update public.community_members set club_rules_accepted_at = coalesce(club_rules_accepted_at,now())
    where user_id = member_id;
end;
$$;
revoke all on function public.join_club(jsonb) from public, anon;
grant execute on function public.join_club(jsonb) to authenticated;

-- End the old queue without deleting its audit history.
revoke execute on function public.request_club_profile_review() from authenticated;
update public.club_profile_reviews
set status='superseded',reviewed_at=coalesce(reviewed_at,now()),
    review_note='A fila manual foi substituída pela confirmação automática de cadastro completo.'
where status='pending';

update public.community_members
set profile_verification_status='unverified',profile_verified_at=null;
update public.community_members m
set profile_verification_status='verified',profile_verified_at=coalesce(m.profile_verified_at,now())
from public.account_profiles p
where p.user_id=m.user_id
  and private.club_profile_is_complete(p.user_id,p.avatar_path,p.full_name,p."current_role",p.organization_name,p.linkedin_url,p.public_bio,p.areas_of_expertise);

comment on column public.community_members.profile_verification_status is
  'Automatic profile completeness status. verified means required self-reported fields and owned avatar are present; it is not an identity or credential certification.';

-- Profiles without the now-required photo stay out of the directory until fixed.
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
      and m.avatar_path is not null
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
