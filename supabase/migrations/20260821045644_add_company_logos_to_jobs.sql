alter table public.jobs
  add column if not exists company_logo_url text;

comment on column public.jobs.company_logo_url is
  'Public HTTPS logo URL discovered on the employer career page or job board.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'jobs_company_logo_url_https_check'
      and conrelid = 'public.jobs'::regclass
  ) then
    alter table public.jobs
      add constraint jobs_company_logo_url_https_check
      check (company_logo_url is null or company_logo_url ~ '^https://');
  end if;
end
$$;
