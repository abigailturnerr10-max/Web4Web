-- New order_content columns for the newsletter-integration step (only shown
-- when the `newsletter` individual effect was purchased — see
-- CONTENT_REQUIREMENTS_MAP / contentSpec.js). Same pattern as
-- 003_payment_secret_flag.sql: a plain, anon-readable/writable-via-Edge-
-- Function boolean flag tracks WHETHER a key was submitted, never the value
-- itself — the actual API key lives only in client_secrets, encrypted, with
-- no anon access at all (same vault as the payment gateway secret key).

alter table public.order_content
  add column if not exists newsletter_provider text,
  add column if not exists newsletter_api_key_stored boolean not null default false;
