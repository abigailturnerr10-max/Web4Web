-- A plain boolean the client can read/write via existing order_content RLS —
-- tracks only WHETHER a payment gateway secret key has been submitted for
-- this order, never the value itself (which lives only in client_secrets,
-- encrypted, with no anon access at all).

alter table public.order_content
  add column if not exists payment_secret_key_stored boolean not null default false;
