-- Event summaries contain private group discussions, even after anonymization.
revoke all on public.community_event_whatsapp_summaries from anon;
drop policy if exists event_whatsapp_summaries_public_read on public.community_event_whatsapp_summaries;
create policy event_whatsapp_summaries_signed_in_read
  on public.community_event_whatsapp_summaries for select to authenticated
  using (
    (select auth.uid()) is not null
    and coalesce((select auth.jwt()) ->> 'is_anonymous', 'false') = 'false'
    and exists (
      select 1 from public.community_events event
      where event.id = community_event_whatsapp_summaries.event_id
        and event.is_published = true
    )
  );
