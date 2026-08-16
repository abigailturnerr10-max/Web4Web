// Supabase Edge Function — the ONLY way a client payment-gateway secret key
// ever gets written to the database. Encrypts server-side via Postgres
// pgcrypto (pgp_sym_encrypt), using a symmetric key that lives only as an
// Edge Function secret (CLIENT_SECRETS_ENCRYPTION_KEY) — never stored in the
// database, never returned to any caller.
//
// There is no corresponding "get" endpoint exposed here on purpose: nothing
// in this pass needs to read the decrypted value back. The matching
// get_client_secret() SQL function exists in the database for a future
// deploy-automation Edge Function to call — this file must never wrap it in
// a public-facing response.
//
// Deploy: supabase functions deploy store-client-secret
// Required env var: CLIENT_SECRETS_ENCRYPTION_KEY (generate + set yourself —
// see supabase/README.md — never share this value, including with an AI
// assistant helping set it up).

import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const CLIENT_SECRETS_ENCRYPTION_KEY = Deno.env.get('CLIENT_SECRETS_ENCRYPTION_KEY')

const ALLOWED_KEY_TYPES = ['payment_gateway_secret_key', 'newsletter_api_key']

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
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !CLIENT_SECRETS_ENCRYPTION_KEY) {
    return json({ success: false, reason: 'server_not_configured' }, 500)
  }

  let body: { orderId?: string; keyType?: string; value?: string }
  try {
    body = await req.json()
  } catch {
    return json({ success: false, reason: 'invalid_json' }, 400)
  }

  const { orderId, keyType, value } = body
  if (!orderId || !keyType || !value) {
    return json({ success: false, reason: 'missing_fields' }, 400)
  }
  if (!ALLOWED_KEY_TYPES.includes(keyType)) {
    return json({ success: false, reason: 'unknown_key_type' }, 400)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Confirm the order actually exists before storing anything against it —
  // an unguessable order id is the only access control here, same as
  // order_content, so at least require it to be real.
  const { data: order, error: orderError } = await supabase.from('orders').select('id').eq('id', orderId).single()
  if (orderError || !order) return json({ success: false, reason: 'order_not_found' }, 404)

  const { error: storeError } = await supabase.rpc('store_client_secret', {
    p_order_id: orderId,
    p_key_type: keyType,
    p_plain_value: value,
    p_encryption_key: CLIENT_SECRETS_ENCRYPTION_KEY,
  })

  if (storeError) return json({ success: false, reason: 'store_failed' }, 500)

  // Deliberately never echo the value back — success/failure only.
  return json({ success: true })
})
