-- Public Bench registration is submitted through a server action; it has no
-- direct client grants and anonymous visitors never receive RSVP records.
alter table public.community_event_rsvps alter column user_id drop not null;
