-- Keep historical review rows and functions for auditability, but remove both
-- execution paths now that completeness is derived automatically.
revoke execute on function public.request_club_profile_review() from authenticated;
revoke execute on function public.review_club_profile(uuid,uuid,text,text) from service_role;
