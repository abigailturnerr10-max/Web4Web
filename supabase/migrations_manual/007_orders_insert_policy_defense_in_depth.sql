-- Defense in depth for the bug fixed in src/lib/supabaseClient.js /
-- supabaseAdminClient.js: the customer-facing app and the admin panel used
-- to share one Supabase client, so an admin's persisted auth session could
-- silently attach to "anonymous" checkout requests from the same browser.
-- The orders INSERT policy only covered `anon`, so any request that
-- authenticated as `authenticated` (an admin session) was rejected outright
-- (42501) — a real, reproduced, 100%-of-the-time checkout blocker for any
-- browser that had ever logged into /admin.
--
-- The frontend split is the real fix (an admin session should never reach
-- this code path again), but the actual safety guard here was always the
-- `with check (status = 'pending_payment')` clause, not the role — so widen
-- the policy to also cover `authenticated`, with the identical check. This
-- closes the whole bug class at the database level too, in case any future
-- code path ever makes a checkout-adjacent request under an authenticated
-- session again.

drop policy if exists "anon can insert pending orders" on public.orders;

create policy "anon or authenticated can insert pending orders"
  on public.orders for insert
  to anon, authenticated
  with check (status = 'pending_payment');
