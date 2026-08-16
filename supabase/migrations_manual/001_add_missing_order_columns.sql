-- Run this once in the SQL Editor against your already-created orders table —
-- schema.sql's CREATE TABLE won't re-run against an existing table, so the
-- two columns it was originally missing (online_payments, social_preview)
-- need to be added here instead.

alter table public.orders
  add column if not exists online_payments jsonb,
  add column if not exists social_preview jsonb;
