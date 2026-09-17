-- Existing single-part Storage objects have equal content checksums and sizes.
-- Hide only matching copies belonging to the same member and event; retain files.
with fingerprints as (
  select r.id, first_value(r.id) over (
    partition by r.event_id, r.uploader_id, o.metadata->>'eTag', o.metadata->>'size'
    order by r.created_at, r.id
  ) as original_id
  from public.community_event_resources r
  join storage.objects o on o.bucket_id = 'community-event-files'
    and o.name = to_jsonb(r)->>'storage_path'
  where r.kind = 'foto' and r.duplicate_of is null
    and trim(both '"' from o.metadata->>'eTag') ~ '^[a-f0-9]{32}$'
    and (o.metadata->>'size') is not null
)
update public.community_event_resources r set duplicate_of = f.original_id
from fingerprints f where r.id = f.id and f.id <> f.original_id;
