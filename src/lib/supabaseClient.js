import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseReady = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

/**
 * Null until VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set — every
 * caller must check supabaseReady (or handle a null client) first, same
 * "degrades to placeholder until configured" pattern as the rest of the
 * app's integrations (Flutterwave, EmailJS, WhatsApp).
 *
 * This is the customer-facing client — the wizard, checkout, and content
 * form — and it must NEVER authenticate a user or persist a session.
 * `createClient` defaults to `persistSession: true`, which previously meant
 * this exact client object was also imported and used by the admin panel's
 * `signInWithPassword` — so once an admin logged in anywhere in a browser,
 * every later "anonymous" customer request from that same browser silently
 * carried the admin's JWT instead of the anon key. Since `orders` only has
 * an INSERT policy for the `anon` role, that broke checkout with a real
 * RLS rejection (42501) on every attempt from that browser, reproduced live.
 * The admin panel now uses a fully separate client — see
 * supabaseAdminClient.js — so an admin session can never bleed in here.
 */
export const supabase = supabaseReady
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null
