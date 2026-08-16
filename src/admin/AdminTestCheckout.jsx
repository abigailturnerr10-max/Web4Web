import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabaseAdmin as supabase } from '../lib/supabaseAdminClient.js'
import PaymentPanel from '../wizard/components/PaymentPanel.jsx'
import { formatPrice } from '../wizard/config/catalog.js'

const TEST_AMOUNT_NGN = 100

/**
 * Deliberately NOT part of the public catalog/Configurator — a ₦100 "order"
 * created directly here has no real siteType/tier/domain behind it, so it
 * only exists to run one small real transaction through the exact same
 * PaymentPanel → Flutterwave → verify-flutterwave-payment path a real
 * customer uses, cheaply, whenever live keys need confirming. Only reachable
 * by an authenticated admin (this whole route is behind AdminApp's login
 * gate), and the `is_test_order` flag it sets can only ever be written by
 * that same authenticated session (see migration 010) — never exposed to,
 * or creatable by, an anonymous visitor.
 */
export default function AdminTestCheckout() {
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [paid, setPaid] = useState(false)

  async function handleCreate() {
    setCreating(true)
    setCreateError(null)
    const { data, error } = await supabase
      .from('orders')
      .insert({
        site_type: 'business',
        template: { tier: 'test', price: TEST_AMOUNT_NGN, effectPackCredit: 0 },
        online_payments: { enabled: false, price: 0 },
        domain: { selected: false, type: null, price: 0, desired: '' },
        hero_style: { id: null, price: 0 },
        effect_pack: null,
        individual_effects: [],
        color_theme: { mode: null },
        social_preview: { enabled: false, price: 0 },
        extra_pages: [],
        delivery: { type: 'standard', price: 0 },
        contact: { name: 'Internal test order', email: 'test@web4web.internal', whatsapp: '' },
        payment_acceptance: { method: 'flutterwave-paystack' },
        status: 'pending_payment',
        total_amount: TEST_AMOUNT_NGN,
        currency: 'NGN',
        is_test_order: true,
      })
      .select()
      .single()

    setCreating(false)
    if (error || !data) {
      setCreateError(error?.message || 'Insert failed')
      return
    }
    setOrder(data)
  }

  function handlePaid() {
    setPaid(true)
  }

  return (
    <div className="admin-page">
      <Link to="/admin" className="admin-back-link">
        ← All orders
      </Link>

      <h1>Live-key test checkout</h1>
      <p className="admin-loading" style={{ padding: 0, marginTop: 8 }}>
        Runs one real {formatPrice(TEST_AMOUNT_NGN, 'NGN')} transaction through the exact same checkout code a real
        customer uses — the cheapest way to confirm live Flutterwave keys actually verify end to end. This never
        appears anywhere on the public site.
      </p>

      {paid ? (
        <div className="admin-card" style={{ marginTop: 20 }}>
          <p>
            ✅ Paid and verified — order <code>{order.id}</code> is now <code>status: paid</code>. Live Flutterwave
            keys are confirmed working end to end.
          </p>
        </div>
      ) : order ? (
        <div className="admin-card" style={{ marginTop: 20, maxWidth: 360 }}>
          <p style={{ marginBottom: 12 }}>
            Test order <code>{order.id}</code> created. Complete the payment below with a real card.
          </p>
          <PaymentPanel
            currency="NGN"
            totalNgn={TEST_AMOUNT_NGN}
            contact={order.contact}
            orderId={order.id}
            onPaid={handlePaid}
          />
        </div>
      ) : (
        <div className="admin-card" style={{ marginTop: 20 }}>
          <button type="button" className="btn btn--primary" onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating…' : `Create ${formatPrice(TEST_AMOUNT_NGN, 'NGN')} test order`}
          </button>
          {createError && <p className="payment-panel__error">{createError}</p>}
        </div>
      )}

      {order && (
        <button type="button" className="btn btn--ghost" style={{ marginTop: 16 }} onClick={() => navigate(`/admin/orders/${order.id}`)}>
          View this order →
        </button>
      )}
    </div>
  )
}
