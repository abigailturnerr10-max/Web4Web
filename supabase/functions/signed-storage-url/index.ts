// Supabase Edge Function — the ONLY way an anon client uploads to or reads
// from the brand-assets/client-content Storage buckets. Neither bucket
// grants anon any direct RLS access (see migrations 002/005) — a
// `using (bucket_id = 'x')` policy with no path check would let anyone with
// the anon key read/list every file across every order's folder, not just
// their own. This function computes the order-scoped path itself (never
// trusts a client-supplied path for uploads, and for reads requires the
// given path to already start with that exact order id) and issues a
// short-lived, single-purpose signed URL via the service role key.
//
// Deploy: supabase functions deploy signed-storage-url

import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const ALLOWED_BUCKETS = ['client-content', 'brand-assets']
const VIEW_URL_EXPIRY_SECONDS = 60

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120)
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

  let body: { orderId?: string; bucket?: string; mode?: 'upload' | 'view'; fileName?: string; path?: string }
  try {
    body = await req.json()
  } catch {
    return json({ success: false, reason: 'invalid_json' }, 400)
  }

  const { orderId, bucket, mode, fileName, path } = body
  if (!orderId || !bucket || !mode) return json({ success: false, reason: 'missing_fields' }, 400)
  if (!ALLOWED_BUCKETS.includes(bucket)) return json({ success: false, reason: 'unknown_bucket' }, 400)

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: order, error: orderError } = await supabase.from('orders').select('id').eq('id', orderId).single()
  if (orderError || !order) return json({ success: false, reason: 'order_not_found' }, 404)

  if (mode === 'upload') {
    if (!fileName) return json({ success: false, reason: 'missing_file_name' }, 400)
    // Path is computed here, never taken from the client — this is the
    // actual order-scoping enforcement.
    const objectPath = `${orderId}/${Date.now()}-${sanitizeFileName(fileName)}`
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(objectPath)
    if (error || !data) return json({ success: false, reason: 'signed_upload_url_failed' }, 500)
    return json({ success: true, path: data.path, token: data.token, signedUrl: data.signedUrl })
  }

  if (mode === 'view') {
    if (!path) return json({ success: false, reason: 'missing_path' }, 400)
    // Even though this Edge Function is trusted, still refuse to sign a URL
    // for a path outside the order it was given — defense in depth.
    if (!path.startsWith(`${orderId}/`)) return json({ success: false, reason: 'path_order_mismatch' }, 403)
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, VIEW_URL_EXPIRY_SECONDS)
    if (error || !data) return json({ success: false, reason: 'signed_view_url_failed' }, 500)
    return json({ success: true, signedUrl: data.signedUrl })
  }

  return json({ success: false, reason: 'unknown_mode' }, 400)
})
