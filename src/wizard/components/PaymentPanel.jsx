import { useEffect, useState } from 'react'
import { FlutterWaveButton } from 'flutterwave-react-v3'
import { formatPrice, ngnToUsd } from '../config/catalog.js'
import { supabase, supabaseReady } from '../../lib/supabaseClient.js'
import './PaymentPanel.css'

const FLW_PUBLIC_KEY = import.meta.env.VITE_FLW_PUBLIC_KEY

// flutterwave-react-v3's button doesn't load its checkout script
// (checkout.flutterwave.com/v3.js) until the FIRST click — and if that
// click lands before the script finishes loading, its own internal
// `isFWScriptLoading` guard makes the click a silent no-op with zero visual
// feedback (confirmed by reading the library's source directly). A visitor
// tapping Pay before the script is ready sees nothing happen; tapping again
// while it's still loading does nothing a second time too — exactly the
// "first trial the pay button didn't click" report this fixes. Loading the
// script proactively the moment this panel mounts, well before Pay is ever
// tapped, means `window.FlutterwaveCheckout` is already defined by the time
// a real visitor reaches for the button in the common case; the "Preparing
// checkout…" state below covers the rare case where it's still in flight.
const FLW_SCRIPT_SRC = 'https://checkout.flutterwave.com/v3.js'

function useFlutterwaveScriptReady() {
  const [ready, setReady] = useState(() => Boolean(window.FlutterwaveCheckout))

  useEffect(() => {
    if (ready) return
    if (window.FlutterwaveCheckout) {
      setReady(true)
      return
    }
    let existing = document.querySelector(`script[src="${FLW_SCRIPT_SRC}"]`)
    const handleLoad = () => setReady(true)
    if (!existing) {
      existing = document.createElement('script')
      existing.src = FLW_SCRIPT_SRC
      existing.async = true
      document.body.appendChild(existing)
    }
    existing.addEventListener('load', handleLoad)
    return () => existing.removeEventListener('load', handleLoad)
  }, [ready])

  return ready
}

// Web4Web's own checkout goes through Flutterwave only, regardless of
// visitor region/currency — Flutterwave supports international card
// payments natively, so no Stripe fallback is needed here. (Stripe remains
// a valid recommendation on the Information page's client payment-acceptance
// guide — that's a different feature: how clients accept payments from
// their own customers, not how visitors pay Web4Web.)
export default function PaymentPanel({ currency, totalNgn, contact, orderId, onPaid }) {
  return <FlutterwavePay currency={currency} totalNgn={totalNgn} contact={contact} orderId={orderId} onPaid={onPaid} />
}

function FlutterwavePay({ currency, totalNgn, contact, orderId, onPaid }) {
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState(null)
  const scriptReady = useFlutterwaveScriptReady()
  const ready = Boolean(FLW_PUBLIC_KEY)
  const isUsd = currency === 'USD'
  const amount = isUsd ? Number(ngnToUsd(totalNgn).toFixed(2)) : totalNgn
  const displayPrice = formatPrice(totalNgn, currency)

  // Tied to the order id (not just a timestamp) so verify-flutterwave-payment
  // can cross-check that a verified transaction actually belongs to the
  // order it's being credited to, not some other order's transaction.
  const txRef = orderId ? `w4w-${orderId}` : `w4w-${Date.now()}`

  async function handleCallback(response) {
    // No backend configured yet — fall back to trusting the client's report,
    // same "degrades to placeholder until configured" posture as every other
    // integration here. This is the insecure path the backend setup exists
    // to close; it only applies during local dev before Supabase is wired up.
    if (!supabaseReady) {
      onPaid?.(response)
      return
    }

    // Supabase IS configured but no orderId reached this component — Review
    // is expected to block reaching PaymentPanel at all in that case (see
    // saveFailed there), so this means that safeguard was bypassed somehow.
    // Must NOT silently take the same "trust the client" path as genuinely
    // unconfigured local dev — that would let a payment through with no
    // server-side order to verify it against.
    if (!orderId) {
      console.error('[Web4Web] Payment callback fired with no orderId while Supabase is configured — refusing to trust the client-only result.')
      setVerifyError(
        "We couldn't verify this payment against a saved order. Please message us on WhatsApp with your payment reference so we can confirm manually — don't pay again."
      )
      return
    }

    setVerifying(true)
    setVerifyError(null)
    const { data, error } = await supabase.functions.invoke('verify-flutterwave-payment', {
      body: { orderId },
    })
    setVerifying(false)

    if (error || !data?.success) {
      setVerifyError(
        "We received your payment but couldn't confirm it automatically. Please message us on WhatsApp with your reference so we can verify manually."
      )
      return
    }
    onPaid?.(response)
  }

  const config = {
    public_key: FLW_PUBLIC_KEY || 'FLWPUBK_TEST-PLACEHOLDER',
    tx_ref: txRef,
    amount,
    currency: isUsd ? 'USD' : 'NGN',
    payment_options: isUsd ? 'card' : 'card,banktransfer,ussd,mobilemoney',
    customer: {
      email: contact.email || 'customer@example.com',
      phone_number: contact.whatsapp || '',
    },
    customizations: {
      title: 'Web4Web',
      description: 'Website build order',
    },
    callback: handleCallback,
    onClose: () => {},
  }

  if (!ready) {
    return (
      <div className="payment-panel payment-panel--placeholder">
        <span className="payment-panel__badge">Flutterwave — not yet connected</span>
        <p>
          Set <code>VITE_FLW_PUBLIC_KEY</code> in your <code>.env</code> to enable real payments. For now this button is
          disabled.
        </p>
        <button type="button" className="btn btn--primary" disabled>
          Pay {displayPrice}
        </button>
      </div>
    )
  }

  return (
    <div className="payment-panel">
      {verifying ? (
        <button type="button" className="btn btn--primary" disabled>
          Confirming payment…
        </button>
      ) : scriptReady ? (
        <FlutterWaveButton
          {...config}
          text={`Pay ${displayPrice}`}
          className="btn btn--primary payment-panel__flw-btn"
        />
      ) : (
        <button type="button" className="btn btn--primary" disabled>
          Preparing checkout…
        </button>
      )}
      {verifyError && <p className="payment-panel__error">{verifyError}</p>}
    </div>
  )
}
