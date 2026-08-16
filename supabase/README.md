# Web4Web backend setup

Manual steps to stand up the Supabase backend from scratch. Nothing here runs
automatically — Claude Code can't create accounts or paste secrets into a
dashboard for you.

## 1. Create the Supabase project

Sign up at supabase.com and create a project (free tier is fine). From
**Project Settings → API**, copy:

- **Project URL**
- **anon public key** — safe to put in `.env`
- **service_role key** — keep this secret; you won't need to touch it
  directly, Supabase provides it to Edge Functions automatically

## 2. Run every migration, in order

**Project → SQL Editor → New query.** Run `schema.sql` first, then every file
in `supabase/migrations_manual/` in numeric order — each one depends on the
ones before it:

1. `schema.sql` — the `orders` table, its RLS policies, and the `brand-assets`
   Storage bucket.
2. `001_add_missing_order_columns.sql`
3. `002_content_collection.sql` — `order_content` table, the `client_secrets`
   vault + its `store_client_secret`/`get_client_secret` functions, admin
   (`authenticated`) read/update policies, the `client-content` bucket.
4. `003_payment_secret_flag.sql`
5. `004_project_status_submit_policy.sql` — no runnable SQL; retired in favor
   of the `mark-content-submitted` Edge Function. Safe to skip, kept for the
   history/reasoning in its comments.
6. `005_lockdown_storage_buckets.sql` — removes the broad anon Storage
   policies `schema.sql` originally created.
7. `006_purchase_driven_content_fields.sql` — extra `order_content` columns
   for purchase-driven form fields (before/after photos, stats, trust badges,
   object photos, languages needed).
8. `007_orders_insert_policy_defense_in_depth.sql` — widens the `orders`
   INSERT policy to cover `authenticated` as well as `anon`, matching the
   frontend fix for the admin/customer Supabase-client isolation bug (see
   `src/lib/supabaseClient.js`'s comment for the full story).
9. `008_newsletter_integration_fields.sql` — `order_content` columns for the
   newsletter-integration step (provider + a stored-flag for the vaulted API
   key, same pattern as the payment secret key).
10. `009_project_link_fields.sql` — `orders.preview_url`/`live_url`, set by
    the admin panel right before advancing a project to "Review"/"Live!" so
    the status email for those phases has something to link to.

## 3. Create an admin user

**Authentication → Users → Add user** (email + password, no email
confirmation needed). This is the only login `/admin` accepts — there's no
separate admin-role table, any confirmed Supabase Auth user can sign in.

## 4. Set your frontend `.env`

Copy `.env.example` to `.env` and fill in real values. See that file for the
full list — Supabase URL/anon key, Flutterwave public key, EmailJS ids,
business contact info. Every integration degrades to a clearly-labeled
placeholder until configured, so you can fill these in incrementally.

## 5. Set Edge Function secrets and deploy

You'll need the Supabase CLI (already available in this repo via `npx
supabase`, no global install needed).

```
npx supabase login
npx supabase link --project-ref <your-project-ref>   # found in your Project URL

npx supabase secrets set FLUTTERWAVE_SECRET_KEY=<your Flutterwave secret key>
npx supabase secrets set CLIENT_SECRETS_ENCRYPTION_KEY=<a long random string you generate yourself — this is the symmetric key the client_secrets vault encrypts with, never store it in the database or share it>

npx supabase functions deploy verify-flutterwave-payment
npx supabase functions deploy save-order-content
npx supabase functions deploy mark-content-submitted
npx supabase functions deploy signed-storage-url
npx supabase functions deploy store-client-secret
npx supabase functions deploy attach-brand-asset
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` don't need to be set manually —
Supabase provides both to every Edge Function automatically.

**`CLIENT_SECRETS_ENCRYPTION_KEY` cannot be recovered if lost** — if you ever
lose it, every payment-gateway secret key a client has already submitted
through the content form becomes permanently undecryptable, and they'd need
to resubmit it. Store it in a real secrets manager or password manager, not
just in your terminal history.

## 6. Verify it's working

1. `npm run dev`, click through to Review with a live (or Flutterwave
   test-mode) `VITE_FLW_PUBLIC_KEY` configured, and complete a payment.
2. **Table Editor → orders** — the row should move from `pending_payment` to
   `paid`, with a real `flutterwave_tx_id`, after the transaction completes.
3. From Confirmation, click through to the content-collection form and submit
   it — **Table Editor → order_content** should show `submitted = true`.
4. Log into `/admin` with the user created in step 3 and confirm the order
   and its content submission both show up.

## What's intentionally not built here

- **`payment-proofs` Storage bucket** — not created. It was originally scoped
  for manual-bank-transfer proof screenshots, but `ManualTransferUpload.jsx`
  is a preview of a feature on the *client's own future site* (their
  customers uploading proof to *them*), not part of Web4Web's own checkout —
  and Web4Web's own checkout is Flutterwave-only, so there's no
  manual-transfer-to-Web4Web flow that would ever produce a real file to
  store here.
- **Brand-asset upload UI** — the `brand-assets` bucket exists and is ready,
  but no "Visual Identity → I already have my brand colors → upload" UI has
  been built in the Configurator yet (`order.colorTheme.brandAssetUrl` is a
  reserved-but-unused field). Wire the upload to this bucket when that UI
  gets built.
- **`orders.status = 'confirmed'`** — the schema allows this value, but
  nothing in this pass transitions an order to it. Likely belongs to a
  future admin-review step.
- **`get_client_secret()` has no caller** — it exists in the database for a
  future "decrypt only during deploy, then purge" automation. Nothing invokes
  it yet; the decrypted value is never exposed to any frontend or admin
  screen by design.
