// Supabase Edge Function — the only way order_content ever gets created or
// updated. No anon INSERT/UPDATE policy exists on that table at all (see
// migration 002's notes) — this function only ever touches the single
// order_id it's given, via the service role key, and only writes fields on
// an explicit allowlist (never a blind spread of whatever the client sends).
//
// Deploy: supabase functions deploy save-order-content

import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const WRITABLE_FIELDS = [
  'brand_name', 'tagline', 'business_description', 'logo_path', 'logo_fallback',
  'phone', 'business_email', 'address', 'business_hours',
  'home_key_message', 'about_story', 'products', 'gallery', 'team', 'faq',
  'testimonials', 'testimonials_fallback',
  'additional_photos', 'additional_photos_fallback', 'video_footage_fallback',
  'before_photo_path', 'after_photo_path', 'before_after_fallback',
  'object_photos', 'object_photos_fallback',
  'stats', 'stats_fallback',
  'trust_badges',
  'languages_needed', 'languages_needed_fallback',
  'social_links', 'existing_website_url', 'google_business_url',
  'payment_publishable_key', 'payment_secret_key_stored',
  'newsletter_provider', 'newsletter_api_key_stored',
  'domain_note',
  'legal_privacy_text', 'legal_privacy_fallback', 'legal_generate_standard',
  'anything_else',
  'outstanding_items', 'upsell_requests', 'submitted', 'submitted_at',
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

  let body: { orderId?: string; patch?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return json({ success: false, reason: 'invalid_json' }, 400)
  }

  const { orderId, patch } = body
  if (!orderId || !patch || typeof patch !== 'object') {
    return json({ success: false, reason: 'invalid_body' }, 400)
  }

  const safePatch: Record<string, unknown> = {}
  for (const key of Object.keys(patch)) {
    if (WRITABLE_FIELDS.includes(key)) safePatch[key] = patch[key]
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: order, error: orderError } = await supabase.from('orders').select('id').eq('id', orderId).single()
  if (orderError || !order) return json({ success: false, reason: 'order_not_found' }, 404)

  const { data: existing } = await supabase.from('order_content').select('id, submitted').eq('order_id', orderId).maybeSingle()
  if (existing?.submitted) return json({ success: false, reason: 'already_submitted' }, 409)

  const result = existing
    ? await supabase.from('order_content').update(safePatch).eq('order_id', orderId).select().single()
    : await supabase.from('order_content').insert({ order_id: orderId, ...safePatch }).select().single()

  if (result.error) return json({ success: false, reason: 'save_failed' }, 500)
  return json({ success: true, content: result.data })
})
