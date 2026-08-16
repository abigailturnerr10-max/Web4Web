-- Security audit fix — the "anon can read orders" / "anon can read order
-- content" policies (schema.sql / migration 002) used `using (true)`, which
-- Postgres RLS cannot narrow to "only the row whose id the caller already
-- knows" — a permissive SELECT policy allows both a filtered lookup AND a
-- full table scan. Confirmed live: GET /rest/v1/orders?select=id returned
-- every order with no id filter at all, using nothing but the public anon
-- key. Every other Edge Function in this app (signed-storage-url,
-- store-client-secret, save-order-content, mark-content-submitted,
-- attach-brand-asset) authorizes solely on "the caller knows this order's
-- UUID" — this policy handed out every id for free, undermining all of them.
--
-- Reads now go through the get-order Edge Function instead (same pattern as
-- every write already uses), which only ever fetches the one id it's given
-- via the service role key. No anon SELECT grant needed on either table
-- anymore.

drop policy if exists "anon can read orders" on public.orders;
drop policy if exists "anon can read order content" on public.order_content;
