-- Public professional identity is mirrored into the member directory.
alter table public.account_profiles add column avatar_path text,
  add column organization_description text check (length(organization_description) <= 700),
  add constraint profile_avatar_owned check (avatar_path is null or avatar_path ~ ('^' || user_id::text || '/[0-9a-f-]{36}\.jpg$'));
alter table public.community_members add column avatar_path text,
  add column organization_description text check (length(organization_description) <= 700),
  add constraint member_avatar_owned check (avatar_path is null or avatar_path ~ ('^' || user_id::text || '/[0-9a-f-]{36}\.jpg$'));
grant select (avatar_path,organization_description), update (organization_description) on public.account_profiles to authenticated;
grant select (avatar_path,organization_description) on public.community_members to authenticated;
-- Uploads use the authenticated API and server role. No direct Storage grants.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('club-avatars','club-avatars',false,1048576,array['image/jpeg']);

create or replace function public.sync_community_member_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.community_members (
    user_id, display_name, "current_role", areas_of_expertise, public_headline,
    public_bio, organization_name, organization_description, avatar_path, linkedin_url, profile_verification_status,
    profile_verified_at, created_at, updated_at
  ) values (
    new.user_id, coalesce(nullif(new.full_name,''),'Membro LegalOps'), new."current_role",
    coalesce(new.areas_of_expertise,'{}'), new.public_headline, new.public_bio,
    new.organization_name, new.organization_description, new.avatar_path, new.linkedin_url, 'unverified', null, coalesce(new.created_at,now()), now()
  ) on conflict (user_id) do update set
    display_name=excluded.display_name, "current_role"=excluded."current_role",
    areas_of_expertise=excluded.areas_of_expertise, public_headline=excluded.public_headline,
    public_bio=excluded.public_bio, organization_name=excluded.organization_name,
    organization_description=excluded.organization_description, avatar_path=excluded.avatar_path,
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

revoke all on function public.sync_community_member_profile() from public,anon,authenticated;
drop trigger if exists account_profiles_sync_community_member on public.account_profiles;
create trigger account_profiles_sync_community_member
  after insert or update of full_name,"current_role",areas_of_expertise,public_headline,public_bio,organization_name,organization_description,avatar_path,linkedin_url,linkedin_data
  on public.account_profiles for each row execute function public.sync_community_member_profile();
