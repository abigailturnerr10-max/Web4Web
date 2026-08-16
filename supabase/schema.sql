-- Web4Web backend schema — run this once in the Supabase SQL Editor
-- (Project → SQL Editor → New query → paste → Run).
--
-- Design notes:
-- * No client auth system exists yet, so "read your own order by ID" is
--   enforced by the order id being an unguessable UUID, not by RLS row
--   filtering (Postgres RLS can't distinguish "SELECT ... WHERE id = $1"
--   from "SELECT *" — a permissive SELECT policy allows both). This is a
--   known, accepted tradeoff for this pattern: anyone with the anon key
--   could technically list all orders via a direct REST call, not just the
--   one they know the id of. If that risk needs closing later, route reads
--   through a service-role Edge Function instead of direct table access.
-- * total_amount is written by the client at insert time (so it's actually
--   displayable before payment), but is NEVER trusted for the paid
--   decision — verify-flutterwave-payment recomputes it server-side from
--   catalog data and overwrites this column with the verified value.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  site_type text,
  template jsonb,
  online_payments jsonb,
  domain jsonb,
  hero_style jsonb,
  effect_pack jsonb,
  individual_effects jsonb,
  color_theme jsonb,
  social_preview jsonb,
  extra_pages jsonb,
  delivery jsonb,
  contact jsonb,
  payment_acceptance jsonb,
  status text not null default 'pending_payment' check (status in ('draft', 'pending_payment', 'paid', 'confirmed')),
  total_amount numeric,
  currency text,
  flutterwave_tx_id text,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

-- Clients can create their own order, but only ever as "pending_payment" —
-- never allowed to insert a row claiming to already be paid.
create policy "anon can insert pending orders"
  on public.orders for insert
  to anon
  with check (status = 'pending_payment');

-- Clients can read orders back by id (see the tradeoff note above).
create policy "anon can read orders"
  on public.orders for select
  to anon
  using (true);

-- Deliberately no anon UPDATE or DELETE policy — status/total_amount can
-- only change via the service-role key inside verify-flutterwave-payment,
-- which bypasses RLS entirely.

-- ---- Storage: brand-assets ------------------------------------------------
-- For the Visual Identity "I already have my brand colors" upload — the
-- order.color_theme.brandAssetUrl field already reserves a slot for this
-- path, but no upload UI exists in the app yet as of this backend pass.
-- The bucket is created now so it's ready the moment that UI is built.

insert into storage.buckets (id, name, public)
values ('brand-assets', 'brand-assets', false)
on conflict (id) do nothing;

create policy "anon can upload brand assets"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'brand-assets');

create policy "anon can read brand assets"
  on storage.objects for select
  to anon
  using (bucket_id = 'brand-assets');

-- NOTE: the "payment-proofs" bucket described in the original backend
-- prompt was intentionally NOT created. ManualTransferUpload.jsx is a
-- preview of a feature on the CLIENT's own future site (their customers
-- uploading proof of payment to THEM), not part of Web4Web's own checkout —
-- and Web4Web's own checkout is Flutterwave-only, so there is no
-- manual-transfer-to-Web4Web flow that would ever produce a real proof file
-- to store here. Flagged in the handoff summary; add this bucket later if
-- that assumption changes.
