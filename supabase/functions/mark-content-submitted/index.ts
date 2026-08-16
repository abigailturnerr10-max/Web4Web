// Supabase Edge Function — the only way orders.project_status ever moves
// from null to "content_submitted". No anon RLS policy grants this write at
// all (see migration 002/004 history) — a blanket `using (project_status is
// null)` policy would let anyone with the anon key flip ANY order with a
// null status, not just the one they were given a link to, since PostgREST
// applies whatever filter the caller's request supplies. This function only
// ever touches the single order id it's given, via the service role key.
//
// Deploy: supabase functions deploy mark-content-submitted

import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

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

  let body: { orderId?: string }
  try {
    body = await req.json()
  } catch {
    return json({ success: false, reason: 'invalid_json' }, 400)
  }

  const { orderId } = body
  if (!orderId) return json({ success: false, reason: 'missing_order_id' }, 400)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Only ever moves null -> content_submitted, and only for this one id —
  // idempotent if called twice (second call just matches zero rows).
  const { data, error } = await supabase
    .from('orders')
    .update({ project_status: 'content_submitted' })
    .eq('id', orderId)
    .is('project_status', null)
    .select()
    .maybeSingle()

  if (error) return json({ success: false, reason: 'update_failed' }, 500)

  return json({ success: true, alreadySet: !data })
})
