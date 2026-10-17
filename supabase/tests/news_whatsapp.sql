begin;
-- All fixture publications and claims are rolled back; no provider is contacted.
do $$
declare
  fixture_id uuid;
  claimed uuid;
begin
  if has_table_privilege('anon', 'public.news_whatsapp_deliveries', 'SELECT')
     or has_table_privilege('authenticated', 'public.news_whatsapp_deliveries', 'SELECT')
     or has_function_privilege('authenticated', 'public.news_whatsapp_claim(text,integer)', 'EXECUTE')
     or has_function_privilege('anon', 'public.news_queue_whatsapp_publication()', 'EXECUTE') then
    raise exception 'private_outbox_grants';
  end if;
  insert into public.news_articles(slug,title,summary,body,audiences,topics,sources,status)
  values ('queue-fixture-' || gen_random_uuid(), 'Synthetic queue fixture', repeat('Fixture summary. ',4), repeat('Fixture body. ',20), array['escritorios'], array['governanca'], '[{"title":"Synthetic source","url":"https://example.com/source"}]', 'draft') returning id into fixture_id;
  if exists(select 1 from public.news_whatsapp_deliveries where article_id=fixture_id) then raise exception 'draft_queued'; end if;
  update public.news_articles set status='published',published_at=now() where id=fixture_id;
  update public.news_whatsapp_deliveries set queued_at='2000-01-01' where article_id=fixture_id;
  update public.news_articles set title='Edited synthetic queue fixture',status='published' where id=fixture_id;
  if (select count(*) from public.news_whatsapp_deliveries where article_id=fixture_id) <> 1 then raise exception 'duplicate_queue'; end if;
  select article_id into claimed from public.news_whatsapp_claim('120363000000000000@g.us',1);
  if claimed is distinct from fixture_id then raise exception 'claim_not_atomic'; end if;
  update public.news_whatsapp_deliveries set started_at=now()-interval '1 day' where article_id=fixture_id;
  if exists(select 1 from public.news_whatsapp_claim('120363000000000000@g.us',2) where article_id=fixture_id) then raise exception 'ambiguous_attempt_reclaimed'; end if;
  update public.news_whatsapp_deliveries set status='accepted' where article_id=fixture_id;
  update public.news_articles set status='draft',published_at=null where id=fixture_id;
  update public.news_articles set status='published',published_at=now() where id=fixture_id;
  if (select status from public.news_whatsapp_deliveries where article_id=fixture_id) <> 'accepted' then raise exception 'republish_requeued'; end if;
end;
$$;
select 'news_whatsapp_queue_verified' as result;
rollback;
