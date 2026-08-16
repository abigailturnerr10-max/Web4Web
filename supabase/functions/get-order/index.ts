// Supabase Edge Function — the only sanctioned way an anon client reads an
// order (and optionally its order_content row) back. Replaces direct
// `supabase.from('orders').select('*')` calls, which relied on a blanket
// `anon can read orders` RLS policy (`using (true)`) — that policy let
// anyone with the public anon key list every order via a raw REST call,
// not just the one they hold the id for (confirmed live: GET
// /rest/v1/orders?select=id returned all rows with no id filter at all).
// Every other Edge Function in this app (signed-storage-url,
// store-client-secret, save-order-content, etc.) authorizes solely on "you
// know this order's UUID" — that blanket policy handed out every id for
// free, undermining all of them at once.
//
// This function only ever fetches the single order id it's given, via the
// service role key — no client-suppliable filter reaches Postgres, so there
// is nothing here to enumerate.
//
// Deploy: supabase functions deploy get-order

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

  let body: { orderId?: string; includeContent?: boolean }
  try {
    body = await req.json()
  } catch {
    return json({ success: false, reason: 'invalid_json' }, 400)
  }

  const { orderId, includeContent } = body
  if (!orderId) return json({ success: false, reason: 'missing_order_id' }, 400)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: order, error } = await supabase.from('orders').select('*').eq('id', orderId).single()
  if (error || !order) return json({ success: false, reason: 'order_not_found' }, 404)

  let content = null
  if (includeContent) {
    const { data: contentRow } = await supabase.from('order_content').select('*').eq('order_id', orderId).maybeSingle()
    content = contentRow || null
  }

  return json({ success: true, order, content })
})
