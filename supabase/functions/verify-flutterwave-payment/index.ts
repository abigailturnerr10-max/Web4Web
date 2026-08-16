// Supabase Edge Function — verifies a Flutterwave transaction server-side
// before an order is ever marked "paid". Never trusts the frontend's report
// that payment succeeded, and never trusts a client-sent amount.
//
// Verifies by tx_ref (Flutterwave's verify_by_reference endpoint) rather than
// by the numeric transaction_id the widget callback returns — the server
// computes the expected tx_ref itself from orderId (`w4w-${orderId}`, the
// same template PaymentPanel.jsx uses to set it), so the client doesn't need
// to pass any transaction identifier at all. One less thing to trust.
//
// Deploy: supabase functions deploy verify-flutterwave-payment
// Required env var (set via `supabase secrets set` or the dashboard):
//   FLUTTERWAVE_SECRET_KEY
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically by
// Supabase for every Edge Function — nothing to configure for those.

import { createClient } from 'npm:@supabase/supabase-js@2'
import { calculateServerOrderTotal, ngnToUsd } from '../_shared/pricing.ts'

const FLUTTERWAVE_SECRET_KEY = Deno.env.get('FLUTTERWAVE_SECRET_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const AMOUNT_EPSILON = 1 // allow for sub-unit float rounding, nothing more

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
  if (!FLUTTERWAVE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ success: false, reason: 'server_not_configured' }, 500)
  }

  let body: { orderId?: string }
  try {
    body = await req.json()
  } catch {
    return json({ success: false, reason: 'invalid_json' }, 400)
  }

  const { orderId } = body
  if (!orderId) {
    return json({ success: false, reason: 'missing_order_id' }, 400)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) {
    return json({ success: false, reason: 'order_not_found' }, 404)
  }

  // Idempotent: if this order was already verified paid (e.g. the frontend
  // retried after a network blip), just confirm rather than re-processing.
  if (order.status === 'paid' || order.status === 'confirmed') {
    return json({ success: true, alreadyProcessed: true, order })
  }

  if (order.status !== 'pending_payment') {
    return json({ success: false, reason: 'order_not_pending_payment' }, 409)
  }

  const txRef = `w4w-${orderId}`
  const flwResponse = await fetch(
    `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
    { headers: { Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}` } }
  )

  if (!flwResponse.ok) {
    return json({ success: false, reason: 'flutterwave_verify_request_failed', flutterwaveStatus: flwResponse.status }, 502)
  }

  const flwResult = await flwResponse.json()
  const txData = flwResult?.data

  if (flwResult?.status !== 'success' || !txData || txData.status !== 'successful') {
    return json({ success: false, reason: 'transaction_not_successful' }, 400)
  }

  // Sanity check — verify_by_reference already looked this transaction up by
  // this exact tx_ref, so this should always hold; kept as defense-in-depth.
  if (txData.tx_ref !== txRef) {
    return json({ success: false, reason: 'tx_ref_order_mismatch' }, 400)
  }

  const expectedNgnTotal = calculateServerOrderTotal(order)
  if (expectedNgnTotal === null || expectedNgnTotal === undefined) {
    return json({ success: false, reason: 'order_has_unrecognized_selection' }, 400)
  }

  const expectedCurrency = order.currency === 'USD' ? 'USD' : 'NGN'
  const expectedAmount = expectedCurrency === 'USD' ? ngnToUsd(expectedNgnTotal) : expectedNgnTotal

  const amountMatches = Math.abs(Number(txData.amount) - expectedAmount) <= AMOUNT_EPSILON
  const currencyMatches = txData.currency === expectedCurrency

  if (!amountMatches || !currencyMatches) {
    return json(
      {
        success: false,
        reason: 'amount_or_currency_mismatch',
        expected: { amount: expectedAmount, currency: expectedCurrency },
        received: { amount: txData.amount, currency: txData.currency },
      },
      400
    )
  }

  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      total_amount: expectedAmount,
      currency: expectedCurrency,
      flutterwave_tx_id: String(txData.id),
    })
    .eq('id', orderId)
    .select()
    .single()

  if (updateError) {
    return json({ success: false, reason: 'order_update_failed' }, 500)
  }

  return json({ success: true, order: updatedOrder })
})
