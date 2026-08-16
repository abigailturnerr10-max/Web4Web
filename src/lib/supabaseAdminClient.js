import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * A separate client instance used only by the admin panel (`src/admin/**`)
 * — the only place in the app a real Supabase Auth session should ever
 * exist. Kept under its own `storageKey` so an admin's persisted session can
 * never be picked up by the customer-facing `supabase` client in
 * supabaseClient.js, which intentionally never authenticates or persists a
 * session at all. See that file's comment for the bug this split fixes.
 */
export const supabaseAdmin =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, storageKey: 'sb-web4web-admin-auth' },
      })
    : null
