// Supabase Edge Function — the only way orders.color_theme.brandAssetUrl
// ever gets set after the order row exists. There is no anon UPDATE policy
// on `orders` at all (see schema.sql / migration 007's defense-in-depth
// widening — neither covers UPDATE) — this function only ever touches the
// single order id it's given, via the service role key, and only merges the
// one jsonb key rather than overwriting color_theme wholesale.
//
// Called right after saveOrderToSupabase() succeeds in Review.jsx, once a
// pending brand-asset file (held only in memory until then — see
// orderStore.js's pendingBrandAssetFile) has been uploaded via
// signed-storage-url to the brand-assets bucket. signed-storage-url itself
// requires the order to already exist, which is why this can't happen any
// earlier than Review.
//
// Deploy: supabase functions deploy attach-brand-asset

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

  let body: { orderId?: string; path?: string }
  try {
    body = await req.json()
  } catch {
    return json({ success: false, reason: 'invalid_json' }, 400)
  }

  const { orderId, path } = body
  if (!orderId || !path) return json({ success: false, reason: 'missing_fields' }, 400)
  // Defense in depth, same check signed-storage-url's view mode does for
  // reads — refuse to attach a path that isn't actually inside this order's
  // own folder, even though the path was computed server-side to begin with.
  if (!path.startsWith(`${orderId}/`)) return json({ success: false, reason: 'path_order_mismatch' }, 403)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: order, error: fetchError } = await supabase.from('orders').select('color_theme').eq('id', orderId).single()
  if (fetchError || !order) return json({ success: false, reason: 'order_not_found' }, 404)

  const { error: updateError } = await supabase
    .from('orders')
    .update({ color_theme: { ...(order.color_theme || {}), brandAssetUrl: path } })
    .eq('id', orderId)

  if (updateError) return json({ success: false, reason: 'update_failed' }, 500)

  return json({ success: true })
})
