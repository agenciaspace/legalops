-- The project was previously used by an abandoned contract-management app.
-- Keep its empty tables recoverable, but do not expose them through PostgREST.
do $migration$
declare
  legacy_table text;
begin
  foreach legacy_table in array array[
    'accounts',
    'activity_logs',
    'approval_actions',
    'approval_instances',
    'clauses',
    'contract_clauses',
    'contract_comments',
    'contract_counterparties',
    'contract_relationships',
    'contract_tags',
    'contracts',
    'counterparties',
    'counterparty_contacts',
    'department_members',
    'departments',
    'documents',
    'extracted_metadata',
    'invitations',
    'legal_hold_contracts',
    'legal_holds',
    'matter_contracts',
    'matters',
    'notifications',
    'obligations',
    'organization_members',
    'organizations',
    'retention_policies',
    'saved_searches',
    'sessions',
    'signature_requests',
    'tags',
    'template_clauses',
    'templates',
    'users',
    'verification_tokens',
    'workflow_definitions'
  ]
  loop
    if to_regclass(format('public.%I', legacy_table)) is not null then
      execute format('alter table public.%I enable row level security', legacy_table);
    end if;
  end loop;
end
$migration$;

-- Trigger functions do not need direct execution by API roles.
revoke execute on function public.bootstrap_account_profile() from public, anon, authenticated;
revoke execute on function public.sync_community_member_profile() from public, anon, authenticated;

-- The trigger body already fully qualifies public.email_domains.
alter function public.sync_user_email_alias_address() set search_path = '';

-- Avoid evaluating auth.uid() once per row in owner-scoped policies.
drop policy if exists contacts_owner on public.contacts;
create policy contacts_owner
  on public.contacts for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists events_owner on public.application_events;
create policy events_owner
  on public.application_events for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists ignored_jobs_owner on public.ignored_jobs;
create policy ignored_jobs_owner
  on public.ignored_jobs for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists contacts_entry_idx
  on public.contacts (entry_id);
create index if not exists contacts_user_idx
  on public.contacts (user_id);
create index if not exists application_events_entry_idx
  on public.application_events (entry_id);
create index if not exists application_events_user_idx
  on public.application_events (user_id);
create index if not exists ignored_jobs_job_idx
  on public.ignored_jobs (job_id);
create index if not exists personalized_cvs_job_idx
  on public.personalized_cvs (job_id);
