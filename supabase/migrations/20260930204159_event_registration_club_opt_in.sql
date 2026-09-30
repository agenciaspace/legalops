alter table public.community_event_rsvps
  add column if not exists club_opt_in_at timestamptz,
  add column if not exists club_signup_status text not null default 'not_requested'
    check (club_signup_status in ('not_requested','pending','confirmation_sent','existing_account','error')),
  add column if not exists club_signup_user_id uuid references auth.users(id) on delete set null,
  add column if not exists club_signup_email_sent_at timestamptz,
  add column if not exists club_signup_error text;

comment on column public.community_event_rsvps.club_opt_in_at is
  'Explicit consent timestamp for the optional LegalOps Club account flow. Event registration remains independent.';
