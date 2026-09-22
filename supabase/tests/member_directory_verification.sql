-- Run against a migrated database; all fixtures are rolled back.
begin;

insert into auth.users (id,email,aud,role,email_confirmed_at,created_at,updated_at)
values ('11111111-1919-4919-8919-111111111111','complete-profile@example.invalid','authenticated','authenticated',now(),now(),now());

update public.account_profiles set
  full_name='Ana Completa',
  "current_role"='Legal Operations',
  organization_name='Empresa Teste',
  public_bio='Atuo com operações jurídicas, contratos e dados.',
  linkedin_url='https://www.linkedin.com/in/ana-completa',
  areas_of_expertise=array['Contratos / CLM'],
  avatar_path='11111111-1919-4919-8919-111111111111/22222222-2222-4222-8222-222222222222.jpg'
where user_id='11111111-1919-4919-8919-111111111111';

do $$ begin
  assert exists(
    select 1 from public.community_members
    where user_id='11111111-1919-4919-8919-111111111111'
      and profile_verification_status='verified'
      and profile_verified_at is not null
  ), 'Complete profile was not verified automatically';
end $$;

update public.account_profiles set avatar_path=null
where user_id='11111111-1919-4919-8919-111111111111';

do $$ begin
  assert exists(
    select 1 from public.community_members
    where user_id='11111111-1919-4919-8919-111111111111'
      and profile_verification_status='unverified'
      and profile_verified_at is null
  ), 'Removing a required field did not clear automatic completeness';
  assert not has_function_privilege('authenticated','public.request_club_profile_review()','EXECUTE'),
    'Manual review requests must stay disabled';
  assert not has_function_privilege('service_role','public.review_club_profile(uuid,uuid,text,text)','EXECUTE'),
    'Manual service review must stay disabled';
end $$;

select 'Automatic profile completeness assertions passed' as result;
rollback;
