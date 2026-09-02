-- Social networks and aggregators may be discovery inputs, but a public job
-- must point to the employer/ATS page and have a displayable company logo.
update public.jobs
set url_status = 'unknown',
    url_checked_at = now()
where url_status = 'live'
  and (
    company_logo_url is null
    or btrim(company_logo_url) = ''
    or company_logo_url !~* '^https://'
    or url !~* '^https?://'
    or url ~* '^https?://([^/]+\.)?(linkedin\.com|facebook\.com|instagram\.com|tiktok\.com|twitter\.com|x\.com|indeed\.com|glassdoor\.com|jooble\.org|adzuna\.com|vaga-ja\.com|trabajo\.org|jobsora\.com|bebee\.com|talent\.com|simplyhired\.com|careerjet\.com|jobscouts\.com|jobs\.cloc\.org|legal\.io|legaloperators\.com|goinhouse\.com)([:/?#]|$)'
  );

alter table public.jobs
  add constraint jobs_live_requires_direct_url_and_logo
  check (
    url_status <> 'live'
    or (
      company_logo_url is not null
      and btrim(company_logo_url) <> ''
      and company_logo_url ~* '^https://'
      and url ~* '^https?://'
      and url !~* '^https?://([^/]+\.)?(linkedin\.com|facebook\.com|instagram\.com|tiktok\.com|twitter\.com|x\.com|indeed\.com|glassdoor\.com|jooble\.org|adzuna\.com|vaga-ja\.com|trabajo\.org|jobsora\.com|bebee\.com|talent\.com|simplyhired\.com|careerjet\.com|jobscouts\.com|jobs\.cloc\.org|legal\.io|legaloperators\.com|goinhouse\.com)([:/?#]|$)'
    )
  ) not valid;

alter table public.jobs
  validate constraint jobs_live_requires_direct_url_and_logo;
