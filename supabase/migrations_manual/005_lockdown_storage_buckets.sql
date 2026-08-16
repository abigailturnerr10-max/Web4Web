-- Removes the broad anon Storage policies on brand-assets — these have been
-- live since the very first schema.sql and were never scoped by path, only
-- by bucket_id, meaning any anon request could read or list every file in
-- the bucket across every order's folder, not just upload/view its own.
-- (No upload UI writes to this bucket yet, so nothing sensitive has been
-- exposed by this in practice — but the gap itself was real and live.)
--
-- Uploads and reads for both brand-assets and client-content now go through
-- the signed-storage-url Edge Function instead, which computes the
-- order-scoped path itself (never trusts a client-supplied path) and issues
-- a short-lived, single-purpose signed URL — anon gets no direct bucket
-- access at all anymore.

drop policy if exists "anon can upload brand assets" on storage.objects;
drop policy if exists "anon can read brand assets" on storage.objects;

-- (client-content's equivalent anon policies were never applied — migration
-- 002 was fixed in place before you ran it — so there's nothing to drop for
-- that bucket here.)
