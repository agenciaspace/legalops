-- Community admission and paid assistance are independent permissions.
alter table public.community_members
  add column club_pro_status text not null default 'inactive'
    check (club_pro_status in ('inactive', 'active', 'complimentary', 'past_due', 'canceled')),
  add column club_pro_expires_at timestamptz,
  add column club_rules_accepted_at timestamptz;

-- Preserve existing benefits, and do not expire community membership with Pro.
update public.community_members
set club_pro_status = club_access_status,
    club_pro_expires_at = club_access_expires_at,
    club_access_expires_at = null
where club_access_status in ('active', 'complimentary');

create or replace function private.has_club_pro_access()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.community_members m
    where m.user_id = (select auth.uid())
      and m.club_access_status in ('active', 'complimentary')
      and m.club_pro_status in ('active', 'complimentary')
      and (m.club_pro_expires_at is null or m.club_pro_expires_at > now())
  );
$$;
revoke all on function private.has_club_pro_access() from public;
grant execute on function private.has_club_pro_access() to authenticated;

alter policy club_job_alerts_member_read on public.club_job_alerts
  using ((select auth.uid()) = user_id and private.has_club_pro_access());
alter policy personalized_cvs_club_owner_read on public.personalized_cvs
  using ((select auth.uid()) = user_id and private.has_club_pro_access());
alter policy community_summaries_authenticated_read on public.community_discussion_summaries
  using (visibility = 'public' or private.has_club_pro_access());

-- This authenticated RPC is the only self-service admission path. It never
-- reads user_metadata for authorization or accepts billing/Pro fields.
create or replace function public.join_club(profile_data jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  member_id uuid := (select auth.uid());
  interests text[];
  sector text := profile_data->>'sector';
  professional_type text;
  linkedin text := btrim(profile_data->>'linkedin_url');
begin
  if member_id is null or not exists (
    select 1 from auth.users u where u.id = member_id and u.email_confirmed_at is not null
  ) then raise exception 'Confirme seu email antes de entrar na comunidade.'; end if;
  if exists (select 1 from public.community_members m where m.user_id = member_id
    and (m.club_access_status = 'canceled' or m.profile_verification_status = 'rejected')) then
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
  -- The profile trigger creates the member. Do not modify plan, Pro or verified status.
  update public.community_members set club_access_status = 'active',
    club_access_expires_at = null, club_rules_accepted_at = now(), updated_at = now()
    where user_id = member_id and club_access_status not in ('active','complimentary');
  update public.community_members set club_rules_accepted_at = coalesce(club_rules_accepted_at,now())
    where user_id = member_id;
end;
$$;
revoke all on function public.join_club(jsonb) from public, anon;
grant execute on function public.join_club(jsonb) to authenticated;

-- A supplied URL or imported LinkedIn data is not identity verification.
-- Preserve moderation decisions when members edit their own profiles.
create or replace function public.sync_community_member_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.community_members (
    user_id, display_name, "current_role", areas_of_expertise, public_headline,
    public_bio, organization_name, linkedin_url, profile_verification_status,
    profile_verified_at, created_at, updated_at
  ) values (
    new.user_id, coalesce(nullif(new.full_name,''),'Membro LegalOps'), new."current_role",
    coalesce(new.areas_of_expertise,'{}'), new.public_headline, new.public_bio,
    new.organization_name, new.linkedin_url, 'unverified', null, coalesce(new.created_at,now()), now()
  ) on conflict (user_id) do update set
    display_name=excluded.display_name, "current_role"=excluded."current_role",
    areas_of_expertise=excluded.areas_of_expertise, public_headline=excluded.public_headline,
    public_bio=excluded.public_bio, organization_name=excluded.organization_name,
    linkedin_url=excluded.linkedin_url,
    profile_verification_status=case
      when public.community_members.profile_verification_status='rejected' then 'rejected'
      when public.community_members.linkedin_url is not distinct from excluded.linkedin_url
        then public.community_members.profile_verification_status
      else 'unverified' end,
    profile_verified_at=case
      when public.community_members.linkedin_url is not distinct from excluded.linkedin_url
        then public.community_members.profile_verified_at else null end,
    updated_at=now();
  return new;
end;
$$;
