import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import emailjs from '@emailjs/browser'
import StepLayout from '../layout/StepLayout.jsx'
import { useOrderStore, calculateOrderTotal, calculateOrderLineItems } from '../store/orderStore.js'
import { SITE_TYPES, TEMPLATES, HERO_STYLES, DELIVERY_OPTIONS, EFFECT_PACKS, findEffect, formatPrice } from '../config/catalog.js'
import { supabase, supabaseReady } from '../../lib/supabaseClient.js'
import { sendStatusEmail, statusEmailConfigured } from '../statusEmail.js'
import './Confirmation.css'

const BUSINESS_WHATSAPP = import.meta.env.VITE_BUSINESS_WHATSAPP_NUMBER
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const BUSINESS_EMAIL = import.meta.env.VITE_BUSINESS_EMAIL || 'orders@web4web.example'

function buildOrderSummary(order, currency) {
  const type = SITE_TYPES.find((t) => t.id === order.siteType)
  const template = TEMPLATES[order.template.tier]
  const hero = HERO_STYLES.find((h) => h.id === order.heroStyle.id)
  const effects = order.individualEffects.map((e) => findEffect(e.id)).filter(Boolean)
  const effectPack = order.effectPack ? EFFECT_PACKS.find((p) => p.id === order.effectPack.id) : null
  const delivery = DELIVERY_OPTIONS[order.delivery.type]

  const total = calculateOrderTotal(order)
  const lineItems = calculateOrderLineItems(order)

  const lines = [
    'New Web4Web order',
    '—',
    `Website type: ${type?.label ?? '—'}`,
    `Template: ${template?.name ?? '—'}`,
    `Hero style: ${hero?.name ?? '—'}`,
    `Effect Pack: ${effectPack ? `${effectPack.name} pack` : 'None selected'}`,
    `Individual effects: ${effects.length ? effects.map((e) => e.name).join(', ') : 'None'}`,
    `Color theme: ${order.colorTheme.mode === 'admin-choice' ? 'CLIENT REQUESTED — to be selected by Web4Web' : 'Client-selected'}`,
    `Pages: ${(template?.includedPages || 0) + order.extraPages.length}`,
    `Domain: ${order.domain.selected ? `${order.domain.desired || 'yourbrand'}${order.domain.type}` : 'Not yet chosen'}`,
    `Timeline: ${delivery ? `${delivery.label} (${delivery.days})` : '—'}`,
    '—',
    ...lineItems.map((item) => `${item.label}: ${formatPrice(item.amount, currency)}`),
    `TOTAL: ${formatPrice(total, currency)}`,
    '—',
    `Contact email: ${order.contact.email}`,
    `Contact WhatsApp: ${order.contact.whatsapp}`,
  ]
  return { text: lines.join('\n'), total, currency, lineItems }
}

export default function Confirmation() {
  const navigate = useNavigate()
  const order = useOrderStore((s) => s.order)
  const currency = useOrderStore((s) => s.currency) || 'NGN'
  const supabaseOrderId = useOrderStore((s) => s.supabaseOrderId)
  const [emailStatus, setEmailStatus] = useState('idle')
  const [clientEmailStatus, setClientEmailStatus] = useState('idle')

  // "skipped" = Supabase not configured, fall back to trusting local state
  // (same placeholder-until-configured posture as the rest of the app).
  // Otherwise the server's own record of payment status is authoritative —
  // not the local `paid` flag — so a refresh (or a link opened elsewhere)
  // always reflects what was actually verified, never what the client claims.
  const [remoteStatus, setRemoteStatus] = useState(supabaseReady && supabaseOrderId ? 'loading' : 'skipped')
  const [remoteOrder, setRemoteOrder] = useState(null)

  useEffect(() => {
    if (!supabaseReady || !supabaseOrderId) {
      setRemoteStatus('skipped')
      return
    }
    let cancelled = false
    setRemoteStatus('loading')
    supabase
      .from('orders')
      .select('*')
      .eq('id', supabaseOrderId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data) {
          setRemoteStatus('not-found')
          return
        }
        setRemoteOrder(data)
        setRemoteStatus(data.status === 'paid' || data.status === 'confirmed' ? 'paid' : 'pending')
      })
    return () => {
      cancelled = true
    }
  }, [supabaseOrderId])

  const summary = useMemo(() => buildOrderSummary(order, currency), [order, currency])
  const displayTotal = remoteOrder?.total_amount ?? summary.total
  const displayCurrency = remoteOrder?.currency ?? summary.currency

  const whatsappHref = useMemo(() => {
    const number = (BUSINESS_WHATSAPP || '').replace(/[^\d]/g, '')
    const text = encodeURIComponent(summary.text)
    return number ? `https://wa.me/${number}?text=${text}` : null
  }, [summary])

  const confirmed = remoteStatus === 'paid' || remoteStatus === 'skipped'

  useEffect(() => {
    if (!confirmed) return
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      setEmailStatus('not-configured')
      return
    }
    setEmailStatus('sending')
    emailjs
      .send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: BUSINESS_EMAIL,
          from_email: order.contact.email,
          // Plain "\n" newlines, deliberately not "<br>" — this same value
          // is reused as-is for WhatsApp/mailto, and the EmailJS template
          // also drops it into the Subject line, where HTML tags show up as
          // escaped literal text rather than being interpreted. The HTML
          // body template handles rendering these as real line breaks via
          // `white-space: pre-line` on the container instead.
          order_summary: summary.text,
        },
        { publicKey: EMAILJS_PUBLIC_KEY }
      )
      .then(() => setEmailStatus('sent'))
      .catch(() => setEmailStatus('failed'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmed])

  // Client-facing status email, "Order Confirmed" phase — a separate
  // template/send from the admin notification above, entirely independent:
  // either one succeeding, failing, or being unconfigured has no effect on
  // the other, and neither ever blocks rendering the confirmation itself
  // (both are fire-and-forget side effects off the same `confirmed` signal).
  // The other four phases (content_submitted/in_production/review/launched)
  // fire from AdminOrderDetail.jsx instead, when the admin advances
  // project_status — see statusEmail.js for the shared template wiring.
  useEffect(() => {
    if (!confirmed) return
    if (!statusEmailConfigured()) {
      setClientEmailStatus('not-configured')
      return
    }
    setClientEmailStatus('sending')
    const contentFormLink = supabaseOrderId ? `${window.location.origin}/submit-content?order=${supabaseOrderId}` : ''
    sendStatusEmail({
      toEmail: order.contact.email,
      phaseId: 'order_confirmed',
      progressStatusId: null,
      actionLink: contentFormLink,
      orderSummary: summary.text,
    })
      .then(() => setClientEmailStatus('sent'))
      .catch(() => setClientEmailStatus('failed'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmed])

  const mailtoHref = `mailto:${BUSINESS_EMAIL}?subject=${encodeURIComponent('New Web4Web order')}&body=${encodeURIComponent(summary.text)}`

  if (remoteStatus === 'loading') {
    return (
      <StepLayout currentPath="/confirmation">
        <div className="confirmation">
          <p className="confirmation__desc">Confirming your payment…</p>
        </div>
      </StepLayout>
    )
  }

  if (!confirmed) {
    return (
      <StepLayout currentPath="/confirmation">
        <div className="confirmation">
          <h1 className="confirmation__title">We haven't confirmed this payment yet</h1>
          <p className="confirmation__desc">
            This can happen if verification is still in progress, or if it didn't go through. Message us on WhatsApp
            with your order details and we'll sort it out — no need to pay again until we confirm with you.
          </p>
          <div className="confirmation__actions">
            {whatsappHref ? (
              <a className="btn btn--primary" href={whatsappHref} target="_blank" rel="noreferrer">
                Message us on WhatsApp →
              </a>
            ) : (
              <a className="btn btn--primary" href={mailtoHref}>
                Email us instead
              </a>
            )}
          </div>
          <Link to="/review" className="confirmation__home-link">
            ← Back to review
          </Link>
        </div>
      </StepLayout>
    )
  }

  return (
    <StepLayout currentPath="/confirmation">
      <div className="confirmation">
        <div className="confirmation__icon">✓</div>
        <h1 className="confirmation__title">Payment received</h1>
        <p className="confirmation__desc">Thanks — your payment went through.</p>

        <div className="confirmation__total">
          <span className="mono-label">Total paid</span>
          <span className="confirmation__total-amount">{formatPrice(displayTotal, displayCurrency)}</span>
        </div>

        {supabaseOrderId ? (
          <div className="confirmation__next-step">
            <h2 className="confirmation__next-step-title">One more step</h2>
            <p>Tell us about your business so we can start building — this takes a few minutes.</p>
            <button
              type="button"
              className="btn btn--primary confirmation__next-step-btn"
              onClick={() => navigate(`/submit-content?order=${supabaseOrderId}`)}
            >
              Tell us about your business →
            </button>
          </div>
        ) : supabaseReady ? (
          <p className="cf-hint">
            Send your order details on WhatsApp so we can start right away — something went wrong saving your order,
            so we can't link you to the content form directly. Message us and we'll sort it out manually.
          </p>
        ) : (
          <p className="cf-hint">
            Send your order details on WhatsApp so we can start right away — the content form isn't available without
            a configured backend in this environment.
          </p>
        )}

        <details className="confirmation__secondary-actions">
          <summary>Prefer WhatsApp or email instead?</summary>
          <div className="confirmation__actions">
            {whatsappHref ? (
              <a className="btn btn--ghost" href={whatsappHref} target="_blank" rel="noreferrer">
                Send order on WhatsApp →
              </a>
            ) : (
              <div className="confirmation__stub">
                <span className="confirmation__stub-badge">WhatsApp — not yet connected</span>
                <p>Set <code>VITE_BUSINESS_WHATSAPP_NUMBER</code> in your <code>.env</code> to enable the one-click link.</p>
              </div>
            )}

            <a className="btn btn--ghost" href={mailtoHref}>
              Email order instead
            </a>
          </div>

          <div className="confirmation__email-status mono-label">
            {emailStatus === 'sending' && 'Sending order notification to Web4Web…'}
            {emailStatus === 'sent' && 'Order notification sent to Web4Web ✓'}
            {emailStatus === 'failed' && 'Order notification failed — WhatsApp link above still works.'}
            {emailStatus === 'not-configured' &&
              'Order notification not configured — set VITE_EMAILJS_SERVICE_ID / VITE_EMAILJS_TEMPLATE_ID / VITE_EMAILJS_PUBLIC_KEY in .env.'}
          </div>
          <div className="confirmation__email-status mono-label">
            {clientEmailStatus === 'sending' && 'Sending your order receipt…'}
            {clientEmailStatus === 'sent' && 'Order receipt sent to your email ✓'}
            {clientEmailStatus === 'failed' && 'Order receipt failed to send — WhatsApp/email links above still work.'}
            {clientEmailStatus === 'not-configured' &&
              'Order receipt not configured — set VITE_EMAILJS_CLIENT_TEMPLATE_ID in .env.'}
          </div>
        </details>

        <details className="confirmation__summary">
          <summary>View full order summary</summary>
          <pre>{summary.text}</pre>
        </details>

        <Link to="/" className="confirmation__home-link">
          ← Back to homepage
        </Link>
      </div>
    </StepLayout>
  )
}
