-- The aggregate function is trigger-only. It must never be callable through PostgREST.
REVOKE ALL ON FUNCTION public.refresh_bench_interest_count() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_bench_interest_count() FROM anon;
REVOKE ALL ON FUNCTION public.refresh_bench_interest_count() FROM authenticated;
