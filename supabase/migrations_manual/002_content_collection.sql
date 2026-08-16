-- Content-collection form + admin panel + client_secrets vault.
-- Run this once in the SQL Editor, after 001_add_missing_order_columns.sql.

create extension if not exists pgcrypto;

-- ---- orders: project status --------------------------------------------

alter table public.orders
  add column if not exists project_status text
  check (project_status is null or project_status in ('content_submitted', 'in_production', 'review', 'launched'));

-- ---- order_content -------------------------------------------------------
-- One row per order (autosaved field-by-field as the client fills the form).
-- Repeatable blocks (products/gallery/team/faq/testimonials) are JSONB
-- arrays here rather than separate tables — consistent with how `orders`
-- already stores its own nested selections, and simple for a handful of
-- items per order.

create table if not exists public.order_content (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) unique,

  brand_name text,
  tagline text,
  business_description text,
  logo_path text,
  logo_fallback text check (logo_fallback is null or logo_fallback in ('later', 'upsell')),

  phone text,
  business_email text,
  address text,
  business_hours text,

  home_key_message text,
  about_story text,
  products jsonb not null default '[]',
  gallery jsonb not null default '[]',
  team jsonb not null default '[]',
  faq jsonb not null default '[]',
  testimonials jsonb not null default '[]',
  testimonials_fallback text check (testimonials_fallback is null or testimonials_fallback in ('later', 'upsell')),

  additional_photos jsonb not null default '[]',
  additional_photos_fallback text check (additional_photos_fallback is null or additional_photos_fallback in ('later', 'upsell')),
  video_footage_fallback text check (video_footage_fallback is null or video_footage_fallback in ('later', 'upsell')),

  social_links jsonb not null default '{}',
  existing_website_url text,
  google_business_url text,

  payment_publishable_key text,

  domain_note text,

  legal_privacy_text text,
  legal_privacy_fallback text check (legal_privacy_fallback is null or legal_privacy_fallback in ('later', 'upsell')),
  legal_generate_standard boolean not null default true,

  anything_else text,

  outstanding_items jsonb not null default '[]',
  upsell_requests jsonb not null default '[]',

  submitted boolean not null default false,
  submitted_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.order_content enable row level security;

-- Reads use the same unguessable-order-UUID tradeoff as `orders` (see
-- schema.sql) — anyone with the anon key could list all submissions via a
-- direct REST call, not just the one they know the order id of. Accepted
-- for the same reasons (read-only disclosure, not mutation).
--
-- WRITES are deliberately NOT granted to anon at all, unlike the first draft
-- of this migration. A row-state-only policy (e.g. `using (submitted =
-- false)`) doesn't verify the caller actually knows this specific order's
-- id — PostgREST applies whatever filter a request supplies, so a blanket
-- "any not-yet-submitted row" policy would let anyone with the anon key
-- read AND modify every other client's in-progress submission, not just
-- their own. All creates/updates go through the save-order-content Edge
-- Function instead, which only ever touches the one order id it's given,
-- via the service role key.
create policy "anon can read order content"
  on public.order_content for select
  to anon
  using (true);

-- ---- client_secrets vault --------------------------------------------------
-- Deliberately NO policies for anon or authenticated — RLS enabled with zero
-- policies means default-deny for every role except service_role (which
-- bypasses RLS). The only way in or out of this table is through the two
-- SQL functions below, called only from Edge Functions using the service
-- role key, with the encryption key passed in from an Edge Function secret
-- (never stored in the database itself).

create table if not exists public.client_secrets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  key_type text not null,
  encrypted_value bytea not null,
  created_at timestamptz not null default now(),
  unique (order_id, key_type)
);

alter table public.client_secrets enable row level security;

-- search_path includes `extensions` because Supabase installs pgcrypto's
-- functions there by default, not into `public`.
create or replace function public.store_client_secret(
  p_order_id uuid, p_key_type text, p_plain_value text, p_encryption_key text
) returns void
language sql
security definer
set search_path = public, extensions
as $$
  insert into public.client_secrets (order_id, key_type, encrypted_value)
  values (p_order_id, p_key_type, pgp_sym_encrypt(p_plain_value, p_encryption_key))
  on conflict (order_id, key_type)
  do update set encrypted_value = excluded.encrypted_value, created_at = now();
$$;
revoke all on function public.store_client_secret(uuid, text, text, text) from public, anon, authenticated;

-- Exists for a future "decrypt only during deploy, then purge" automation —
-- nothing in this pass calls it, and nothing exposes its output to any
-- frontend or admin UI screen.
create or replace function public.get_client_secret(
  p_order_id uuid, p_key_type text, p_encryption_key text
) returns text
language sql
security definer
set search_path = public, extensions
as $$
  select pgp_sym_decrypt(encrypted_value, p_encryption_key)
  from public.client_secrets
  where order_id = p_order_id and key_type = p_key_type;
$$;
revoke all on function public.get_client_secret(uuid, text, text) from public, anon, authenticated;

-- ---- admin read/write (Supabase Auth) --------------------------------------
-- Single-admin internal tool: any authenticated user can read/manage every
-- order. Tighten to a specific user id later if more accounts are added.

create policy "authenticated can read all orders"
  on public.orders for select
  to authenticated
  using (true);

create policy "authenticated can update orders"
  on public.orders for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated can read all order content"
  on public.order_content for select
  to authenticated
  using (true);

-- ---- Storage: client-content ------------------------------------------------
-- Product/team/gallery photos and other raw materials the client uploads
-- post-payment. (Distinct from the earlier-skipped "payment-proofs" bucket —
-- this one has a real, current feature behind it.)
--
-- No anon policies here at all — a `using (bucket_id = 'client-content')`
-- policy (with no path check) would let anyone with the anon key read or
-- list every file in the bucket, across every order's folder, same flaw as
-- brand-assets had. Uploads and reads both go through the
-- signed-storage-url Edge Function instead, which computes the order-scoped
-- path itself and issues a short-lived, single-purpose signed URL.

insert into storage.buckets (id, name, public)
values ('client-content', 'client-content', false)
on conflict (id) do nothing;

-- Admin access is real Supabase Auth, not the anon key — this is fine as a
-- direct RLS grant, unlike the anon case above.
create policy "authenticated can read client content"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'client-content');

create policy "authenticated can read brand assets"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'brand-assets');
