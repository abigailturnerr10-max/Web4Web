-- Reverts migration 010 — the admin-only live-key test checkout it supported
-- (AdminTestCheckout.jsx) has been verified working and removed from the
-- app, so this column is no longer read or written anywhere.

alter table public.orders
  drop column if exists is_test_order;
