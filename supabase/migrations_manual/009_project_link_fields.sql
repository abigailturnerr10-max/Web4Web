-- Admin-provided links surfaced in the "Ready for Review" and "Live!"
-- status emails (see src/wizard/statusEmail.js) — the system can't generate
-- these itself, so the admin panel collects them right before advancing
-- project_status to 'review' or 'launched'. Written directly by the admin
-- panel's own `.update()` call, same as project_status already is — this is
-- fine as a direct RLS grant since it's real Supabase Auth, not the anon key
-- (see migration 002's "authenticated can update orders" policy).

alter table public.orders
  add column if not exists preview_url text,
  add column if not exists live_url text;
