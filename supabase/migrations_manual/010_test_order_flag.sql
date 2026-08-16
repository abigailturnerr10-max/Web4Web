-- Marks an order as an internal test order (see AdminTestCheckout.jsx) —
-- created directly by an authenticated admin to run one small real
-- transaction through the live Flutterwave verification path without
-- touching the public catalog/pricing at all. verify-flutterwave-payment
-- trusts total_amount directly for these instead of recomputing from
-- catalog ids, which don't apply to a non-catalog test order.
--
-- Safe as a plain column with no special RLS: the existing "authenticated
-- can update orders" / orders INSERT policy (see 007) already means only a
-- real logged-in admin can ever set this, same as project_status.

alter table public.orders
  add column if not exists is_test_order boolean not null default false;
