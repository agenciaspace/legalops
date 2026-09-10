-- Keep the aggregate correct for inserts, deletes and topic moves.
CREATE OR REPLACE FUNCTION public.refresh_bench_interest_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_topic uuid;
  previous_topic uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    current_topic := OLD.topic_id;
  ELSE
    current_topic := NEW.topic_id;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    previous_topic := OLD.topic_id;
  END IF;

  UPDATE public.bench_topics topic
  SET interest_count = (
    SELECT count(*)::integer
    FROM public.bench_registrations registration
    WHERE registration.topic_id = current_topic
      AND registration.status <> 'canceled'
  ),
  updated_at = now()
  WHERE topic.id = current_topic;

  IF previous_topic IS NOT NULL AND previous_topic <> current_topic THEN
    UPDATE public.bench_topics topic
    SET interest_count = (
      SELECT count(*)::integer
      FROM public.bench_registrations registration
      WHERE registration.topic_id = previous_topic
        AND registration.status <> 'canceled'
    ),
    updated_at = now()
    WHERE topic.id = previous_topic;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_bench_interest_count() FROM PUBLIC;
