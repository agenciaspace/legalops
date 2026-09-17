insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community-event-files', 'community-event-files', false, 10485760,
  array['image/jpeg','image/png','image/webp','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public = false, file_size_limit = 10485760;

alter table public.community_event_resources
  alter column resource_url drop not null,
  add column if not exists storage_path text;
alter table public.community_event_resources
  drop constraint if exists community_event_resources_resource_url_check;
alter table public.community_event_resources
  add constraint community_event_resources_source_check check (resource_url is not null or storage_path is not null);
