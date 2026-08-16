// Supabase Edge Function — creates a new order row. Replaces the direct
// anon `supabase.from('orders').insert(...).select().single()` call, which
// depended on the "anon can insert pending orders" RLS policy plus an anon
// SELECT policy to read the new row back (PostgREST's `.select()` after
// `.insert()` sends `Prefer: return=representation`, which requires
// SELECT-level RLS on the returned row, not just an INSERT check). Once the
// blanket anon SELECT policy was removed to close order enumeration (see
// migration 012), that combination started failing outright — the insert
// itself would succeed but PostgREST's read-back would be rejected by RLS,
// surfacing as a 42501 on the whole request.
//
// This function uses the service role key for both the insert and the
// read-back, so it doesn't depend on any anon RLS grant at all — matching
// every other write in this app. `status` is always hardcoded to
// 'pending_payment' server-side, same guarantee the old RLS `with check`
// gave, now enforced in code instead of policy. Only an explicit allowlist
// of fields is accepted — never a blind spread of the client's body.
//
// Deploy: supabase functions deploy create-order

import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const WRITABLE_FIELDS = [
  'site_type', 'template', 'online_payments', 'domain', 'hero_style', 'effect_pack',
  'individual_effects', 'color_theme', 'social_preview', 'extra_pages', 'delivery',
  'contact', 'payment_acceptance', 'total_amount', 'currency',
]

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    })
  }
  if (req.method !== 'POST') return json({ success: false, reason: 'method_not_allowed' }, 405)
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ success: false, reason: 'server_not_configured' }, 500)
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ success: false, reason: 'invalid_json' }, 400)
  }

  const safeInsert: Record<string, unknown> = { status: 'pending_payment' }
  for (const key of Object.keys(body || {})) {
    if (WRITABLE_FIELDS.includes(key)) safeInsert[key] = body[key]
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const { data, error } = await supabase.from('orders').insert(safeInsert).select().single()

  if (error || !data) return json({ success: false, reason: 'insert_failed' }, 500)
  return json({ success: true, order: data })
})
