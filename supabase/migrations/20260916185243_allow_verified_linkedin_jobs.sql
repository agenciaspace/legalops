-- The collector validates public LinkedIn detail pages before setting live.
-- Keep logos mandatory and continue rejecting search/login/social URLs.
alter table public.jobs drop constraint jobs_live_requires_direct_url_and_logo;

alter table public.jobs
  add constraint jobs_live_requires_verified_url_and_logo
  check (
    url_status <> 'live'
    or (
      company_logo_url is not null
      and btrim(company_logo_url) <> ''
      and company_logo_url ~* '^https://'
      and url ~* '^https?://'
      and (
        url !~* '^https?://([^/]+\.)?(linkedin\.com|facebook\.com|instagram\.com|tiktok\.com|twitter\.com|x\.com|indeed\.com|glassdoor\.com|jooble\.org|adzuna\.com|vaga-ja\.com|trabajo\.org|jobsora\.com|bebee\.com|talent\.com|simplyhired\.com|careerjet\.com|jobscouts\.com|jobs\.cloc\.org|legal\.io|legaloperators\.com|goinhouse\.com)([:/?#]|$)'
        or url ~* '^https://([a-z0-9-]+\.)*linkedin\.com/jobs/view/([^/?#]+-)?[0-9]{6,}/?([?#].*)?$'
      )
    )
  ) not valid;

alter table public.jobs
  validate constraint jobs_live_requires_verified_url_and_logo;
