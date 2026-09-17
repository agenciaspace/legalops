-- Private intake and editorial review are separate from public content.
create table public.bench_contribution_submissions (
  id uuid primary key default gen_random_uuid(),
  content jsonb not null check (jsonb_typeof(content) = 'object' and octet_length(content::text) <= 16000),
  contact_email text not null check (length(contact_email) between 3 and 254),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  review_note text
);
create index bench_contribution_pending_idx on public.bench_contribution_submissions (status,created_at);
create index bench_contribution_reviewer_idx on public.bench_contribution_submissions (reviewed_by);

create table public.bench_contribution_publications (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.bench_contribution_submissions(id),
  content jsonb not null check (jsonb_typeof(content) = 'object' and octet_length(content::text) <= 16000),
  published_at timestamptz not null default now(),
  review_note text not null check (length(review_note) between 10 and 700),
  is_public boolean not null default true
);
create index bench_contribution_public_idx on public.bench_contribution_publications (published_at desc,id) where is_public;

create table public.bench_contribution_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.bench_contribution_submissions(id),
  reviewer_id uuid not null references auth.users(id),
  decision text not null check (decision in ('approve','reject','withdraw')),
  note text not null check (length(note) between 10 and 700),
  reviewed_content jsonb,
  created_at timestamptz not null default now()
);
create index bench_contribution_reviews_submission_idx on public.bench_contribution_reviews (submission_id);
create index bench_contribution_reviews_reviewer_idx on public.bench_contribution_reviews (reviewer_id);

create table public.bench_contribution_limits (
  bucket_key text not null check (length(bucket_key) = 64),
  bucket_date date not null default (now() at time zone 'UTC')::date,
  attempts integer not null check (attempts > 0),
  primary key (bucket_key,bucket_date)
);

alter table public.bench_contribution_submissions enable row level security;
alter table public.bench_contribution_publications enable row level security;
alter table public.bench_contribution_reviews enable row level security;
alter table public.bench_contribution_limits enable row level security;
revoke all on public.bench_contribution_submissions,public.bench_contribution_publications,public.bench_contribution_reviews,public.bench_contribution_limits from public,anon,authenticated;
grant all on public.bench_contribution_submissions,public.bench_contribution_publications,public.bench_contribution_reviews,public.bench_contribution_limits to service_role;
-- Access is through the bounded API, which projects only approved public fields.

create function public.submit_bench_contribution(submission_content jsonb,contact_email text,network_key text,contact_key text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare contribution_id uuid; slot integer; today date := (now() at time zone 'UTC')::date;
begin
  if length(network_key) <> 64 or length(contact_key) <> 64 then raise exception 'INVALID_RATE_KEY'; end if;
  insert into public.bench_contribution_limits as limits(bucket_key,bucket_date,attempts)
  values(network_key,today,1)
  on conflict(bucket_key,bucket_date) do update set attempts = limits.attempts + 1 where limits.attempts < 20
  returning attempts into slot;
  if slot is null then raise exception 'BENCH_RATE_LIMIT'; end if;
  slot := null;
  insert into public.bench_contribution_limits as limits(bucket_key,bucket_date,attempts)
  values(contact_key,today,1)
  on conflict(bucket_key,bucket_date) do update set attempts = limits.attempts + 1 where limits.attempts < 3
  returning attempts into slot;
  if slot is null then raise exception 'BENCH_RATE_LIMIT'; end if;
  insert into public.bench_contribution_submissions(content,contact_email)
  values(submission_content,lower(trim(contact_email))) returning id into contribution_id;
  delete from public.bench_contribution_limits where bucket_date < today - 7;
  return contribution_id;
end;
$$;

create function public.review_bench_contribution(submission_uuid uuid,reviewer_uuid uuid,decision text,note text,reviewed_content jsonb default null)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare item public.bench_contribution_submissions; publication_uuid uuid;
begin
  if decision not in ('approve','reject') or length(trim(note)) not between 10 and 700 then raise exception 'INVALID_REVIEW'; end if;
  select * into item from public.bench_contribution_submissions where id = submission_uuid for update;
  if not found or item.status <> 'pending' then raise exception 'BENCH_ALREADY_REVIEWED'; end if;
  if decision = 'approve' then
    if reviewed_content is null or jsonb_typeof(reviewed_content) <> 'object' then raise exception 'INVALID_PUBLIC_CONTENT'; end if;
    insert into public.bench_contribution_publications(submission_id,content,review_note)
    values(submission_uuid,reviewed_content,trim(note)) returning id into publication_uuid;
  end if;
  update public.bench_contribution_submissions set status = case when decision = 'approve' then 'approved' else 'rejected' end,
    reviewed_at = now(),reviewed_by = reviewer_uuid,review_note = trim(note) where id = submission_uuid;
  insert into public.bench_contribution_reviews(submission_id,reviewer_id,decision,note,reviewed_content)
    values(submission_uuid,reviewer_uuid,decision,trim(note),case when decision='approve' then reviewed_content else null end);
  return publication_uuid;
end;
$$;

create function public.withdraw_bench_publication(publication_uuid uuid,reviewer_uuid uuid,note text)
returns void language plpgsql security invoker set search_path = '' as $$
declare item public.bench_contribution_publications;
begin
  if length(trim(note)) not between 10 and 700 then raise exception 'INVALID_REVIEW'; end if;
  select * into item from public.bench_contribution_publications where id = publication_uuid for update;
  if not found or not item.is_public then raise exception 'BENCH_ALREADY_REVIEWED'; end if;
  update public.bench_contribution_publications set is_public = false where id = publication_uuid;
  insert into public.bench_contribution_reviews(submission_id,reviewer_id,decision,note,reviewed_content)
    values(item.submission_id,reviewer_uuid,'withdraw',trim(note),item.content);
end;
$$;

revoke all on function public.submit_bench_contribution(jsonb,text,text,text) from public,anon,authenticated;
revoke all on function public.review_bench_contribution(uuid,uuid,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.withdraw_bench_publication(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.submit_bench_contribution(jsonb,text,text,text) to service_role;
grant execute on function public.review_bench_contribution(uuid,uuid,text,text,jsonb) to service_role;
grant execute on function public.withdraw_bench_publication(uuid,uuid,text) to service_role;
