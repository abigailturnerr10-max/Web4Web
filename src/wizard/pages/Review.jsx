import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StepLayout from '../layout/StepLayout.jsx'
import PriceReceipt from '../components/PriceReceipt.jsx'
import PaymentPanel from '../components/PaymentPanel.jsx'
import { useOrderStore, calculateOrderTotal, calculateOrderLineItems } from '../store/orderStore.js'
import { SITE_TYPES, TEMPLATES, HERO_STYLES, DELIVERY_OPTIONS, EFFECT_PACKS, findEffect } from '../config/catalog.js'
import { RECOMMENDED_THEMES } from '../colorTheory.js'
import { supabase, supabaseReady } from '../../lib/supabaseClient.js'
import { uploadClientContentFile } from '../content/uploadHelpers.js'
import { useAudio } from '../AudioContext.jsx'
import './Review.css'

export default function Review() {
  const navigate = useNavigate()
  const order = useOrderStore((s) => s.order)
  const currency = useOrderStore((s) => s.currency) || 'NGN'
  const markPaid = useOrderStore((s) => s.markPaid)
  const { playSuccess } = useAudio()
  const saveOrderToSupabase = useOrderStore((s) => s.saveOrderToSupabase)
  const pendingBrandAssetFile = useOrderStore((s) => s.pendingBrandAssetFile)
  const setColorThemeBrand = useOrderStore((s) => s.setColorThemeBrand)
  const clearPendingBrandAssetFile = useOrderStore((s) => s.clearPendingBrandAssetFile)
  const [supabaseOrderId, setSupabaseOrderId] = useState(null)
  const [savingOrder, setSavingOrder] = useState(supabaseReady)
  const [saveFailed, setSaveFailed] = useState(false)
  const saveStartedRef = useRef(false)

  // Persist a fresh "pending_payment" snapshot the moment the visitor reaches
  // checkout, so the amount PaymentPanel/verify-flutterwave-payment work
  // against is exactly what's shown here — never a stale or client-editable
  // total. No-ops (and PaymentPanel falls back to trusting the client) only
  // when Supabase isn't configured at all — a `reason: 'save_failed'` (real
  // backend, this one insert failed) is a distinct, retryable error state,
  // not silently treated the same way. The ref only guards the *initial*
  // auto-attempt against StrictMode's dev-only double-invoke; attemptSave
  // itself can be called again from the retry button below.
  // If a brand-asset file is waiting (set in the Configurator, before any
  // order row existed — see orderStore.js's pendingBrandAssetFile), this is
  // the earliest point it CAN upload: signed-storage-url requires the order
  // to already exist. Best-effort — a failure here doesn't block checkout;
  // the file just stays pending and this runs again on the next attemptSave
  // (e.g. the "Try again" retry button, or a later Review revisit).
  async function uploadPendingBrandAsset(orderId) {
    if (!pendingBrandAssetFile) return
    const path = await uploadClientContentFile(orderId, pendingBrandAssetFile, 'brand-assets')
    if (!path) return
    const { data } = await supabase.functions.invoke('attach-brand-asset', { body: { orderId, path } })
    if (!data?.success) return
    setColorThemeBrand({ brandAssetUrl: path })
    clearPendingBrandAssetFile()
  }

  async function attemptSave() {
    setSavingOrder(true)
    setSaveFailed(false)
    const { id, reason } = await saveOrderToSupabase()
    if (id) await uploadPendingBrandAsset(id)
    setSupabaseOrderId(id)
    setSavingOrder(false)
    setSaveFailed(reason === 'save_failed')
  }

  useEffect(() => {
    if (!supabaseReady || saveStartedRef.current) return
    saveStartedRef.current = true
    attemptSave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const type = SITE_TYPES.find((t) => t.id === order.siteType)
  const template = TEMPLATES[order.template.tier]
  const hero = HERO_STYLES.find((h) => h.id === order.heroStyle.id)
  const delivery = DELIVERY_OPTIONS[order.delivery.type]
  const effects = order.individualEffects.map((e) => findEffect(e.id)).filter(Boolean)
  const effectPack = order.effectPack ? EFFECT_PACKS.find((p) => p.id === order.effectPack.id) : null

  const themeLabel =
    order.colorTheme.mode === 'admin-choice'
      ? 'Client requested: to be selected by Web4Web'
      : order.colorTheme.paletteId
        ? RECOMMENDED_THEMES.find((t) => t.id === order.colorTheme.paletteId)?.name
        : order.colorTheme.hue != null
          ? `Hue ${order.colorTheme.hue}° — ${order.colorTheme.paletteType}`
          : null

  const lineItems = calculateOrderLineItems(order)
  const total = calculateOrderTotal(order)

  function handlePaid() {
    markPaid()
    playSuccess()
    navigate('/confirmation')
  }

  return (
    <StepLayout currentPath="/review">
      <section className="section-heading">
        <span className="eyebrow">Step 4 of 4</span>
        <h1 className="section-heading__title">Review your order</h1>
        <p className="section-heading__desc">Everything below is editable — jump back to any step to change it.</p>
      </section>

      <div className="review-grid">
        <div className="review-summary">
          <ReviewRow label="Website type" value={type?.label} editPath="/" />
          <ReviewRow label="Template" value={template?.name} editPath="/configurator" />
          <ReviewRow label="Hero style" value={hero?.name} editPath="/configurator" />
          <ReviewRow label="Effect Pack" value={effectPack ? `${effectPack.name} pack` : 'None selected'} editPath="/configurator" />
          <ReviewRow
            label="Individual effects"
            value={effects.length ? effects.map((e) => e.name).join(', ') : 'None selected'}
            editPath="/configurator"
          />
          <ReviewRow label="Social share card" value={order.socialPreview.enabled ? 'Included' : 'Not added'} editPath="/configurator" />
          <ReviewRow label="Color theme" value={themeLabel || 'Not chosen yet'} editPath="/configurator" />
          <ReviewRow
            label="Pages"
            value={`${(template?.includedPages || 0) + order.extraPages.length} total (${order.extraPages.length} extra)`}
            editPath="/configurator"
          />
          <ReviewRow
            label="Domain"
            value={order.domain.selected ? `${order.domain.desired || 'yourbrand'}${order.domain.type}` : 'Not yet chosen'}
            editPath="/configurator"
          />
          <ReviewRow
            label="Online payments"
            value={order.onlinePayments.enabled ? 'Included' : 'Not added'}
            editPath="/"
          />
          <ReviewRow label="Timeline" value={delivery ? `${delivery.label} — ${delivery.days}` : '—'} editPath="/timeline" />
          <ReviewRow label="Email" value={order.contact.email} editPath="/info" />
          <ReviewRow label="WhatsApp" value={order.contact.whatsapp} editPath="/info" />
        </div>

        <div className="review-side">
          <PriceReceipt lineItems={lineItems} total={total} currency={currency} title="Order total" sticky={false} />
          {savingOrder ? (
            <div className="payment-panel payment-panel--placeholder">
              <p>Preparing checkout…</p>
            </div>
          ) : saveFailed ? (
            <div className="payment-panel payment-panel--placeholder">
              <p>We couldn't prepare your checkout — your order didn't save. Please try again before paying.</p>
              <button type="button" className="btn btn--primary" onClick={attemptSave}>
                Try again
              </button>
            </div>
          ) : (
            <PaymentPanel
              currency={currency}
              totalNgn={total}
              contact={order.contact}
              orderId={supabaseOrderId}
              onPaid={handlePaid}
            />
          )}
        </div>
      </div>

      <div className="review-actions">
        <button type="button" className="btn btn--ghost" onClick={() => navigate('/timeline')}>
          ← Back
        </button>
      </div>
    </StepLayout>
  )
}

function ReviewRow({ label, value, editPath }) {
  const navigate = useNavigate()
  return (
    <div className="review-row">
      <span className="review-row__label mono-label">{label}</span>
      <span className="review-row__value">{value || '—'}</span>
      <button type="button" className="review-row__edit" onClick={() => navigate(editPath)}>
        Edit
      </button>
    </div>
  )
}
