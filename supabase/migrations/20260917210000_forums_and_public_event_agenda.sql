-- Public event metadata remains discoverable; member-only material stays behind RLS.
drop policy if exists community_events_paid_read on public.community_events;
create policy community_events_public_metadata on public.community_events
  for select to anon, authenticated using (is_published = true);
grant select on public.community_events to anon, authenticated;

create table if not exists public.community_forum_topics (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null check (char_length(title) between 3 and 160),
  description text not null default '' check (char_length(description) <= 1000),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active','archived'))
);
create index if not exists community_forum_topics_category_idx on public.community_forum_topics(category, created_at desc);
alter table public.community_forum_topics enable row level security;
create policy community_forum_topics_member_read on public.community_forum_topics
  for select to authenticated using (status = 'active' and private.has_active_club_access());
create policy community_forum_topics_member_insert on public.community_forum_topics
  for insert to authenticated with check ((select auth.uid()) = created_by and private.has_active_club_access());
grant select, insert on public.community_forum_topics to authenticated;

alter table public.community_posts add column if not exists topic_id uuid references public.community_forum_topics(id) on delete set null;
create index if not exists community_posts_topic_idx on public.community_posts(topic_id, created_at desc);
