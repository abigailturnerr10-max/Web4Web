-- Follow-up to migration 012. Dropping the anon SELECT policy broke order
-- creation: supabase-js's `.insert().select()` sends `Prefer: return=
-- representation`, which requires SELECT-level RLS to read the new row back
-- — not just an INSERT check — so every checkout attempt started failing
-- with 42501 the moment 012 landed (confirmed live). Order creation now
-- goes through the create-order Edge Function (service role, bypasses RLS
-- entirely, same pattern as every other write in this app), so no anon/
-- authenticated RLS grant is needed on `orders` for INSERT anymore either.
--
-- `orders` now has zero direct anon/authenticated write grants, matching
-- order_content's existing zero-grant model.

drop policy if exists "anon or authenticated can insert pending orders" on public.orders;
