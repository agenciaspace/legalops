alter table public.community_event_resources
  add column publication_id uuid,
  add column content_hash text,
  add column duplicate_of uuid references public.community_event_resources(id);

-- Preserve existing uploads, grouping each legacy caption into one publication.
with grouped as (
  select id, first_value(id) over (
    partition by event_id, uploader_id, kind, split_part(title, ' · ', 1), description
    order by created_at, id
  ) as publication_id
  from public.community_event_resources
)
update public.community_event_resources r set publication_id = g.publication_id
from grouped g where r.id = g.id;

alter table public.community_event_resources alter column publication_id set not null;
alter table public.community_event_resources alter column publication_id set default gen_random_uuid();
create unique index community_event_resource_content_unique
  on public.community_event_resources(event_id, uploader_id, content_hash)
  where content_hash is not null and duplicate_of is null;
create index community_event_resource_publication on public.community_event_resources(publication_id);
