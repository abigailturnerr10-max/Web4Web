import { useState } from 'react'
import { FormField } from '../ContentFormUI.jsx'
import { supabase } from '../../../lib/supabaseClient.js'
import { PAYMENT_ACCEPTANCE_METHODS } from '../../config/catalog.js'
import { GUIDES_FOR_METHOD, KEY_RETRIEVAL_GUIDES, SECRET_KEY_REASSURANCE } from '../../clientPayments.js'

function KeyRetrievalGuide({ gatewayId }) {
  const guide = KEY_RETRIEVAL_GUIDES[gatewayId]
  if (!guide) return null
  return (
    <div className="cf-key-guide">
      <h4 className="cf-key-guide__title">{guide.title}</h4>
      <ol className="cf-key-guide__steps">
        {guide.steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
    </div>
  )
}

export default function StepPaymentSetup({ order, content, patch, orderId }) {
  const [secretInput, setSecretInput] = useState('')
  const [status, setStatus] = useState('idle') // idle | saving | saved | error

  const method = PAYMENT_ACCEPTANCE_METHODS.find((m) => m.id === order?.paymentAcceptance?.method)
  const gatewayIds = GUIDES_FOR_METHOD[order?.paymentAcceptance?.method] || []

  async function handleSaveSecret() {
    if (!secretInput.trim()) return
    setStatus('saving')
    const { data, error } = await supabase.functions.invoke('store-client-secret', {
      body: { orderId, keyType: 'payment_gateway_secret_key', value: secretInput.trim() },
    })
    if (error || !data?.success) {
      setStatus('error')
      return
    }
    // The plaintext never leaves this function beyond the request above —
    // clear it from the input the moment it's stored.
    setSecretInput('')
    setStatus('saved')
    patch({ payment_secret_key_stored: true })
  }

  return (
    <div className="cf-step">
      <p className="cf-hint">Payment gateway: {method?.name || order?.paymentAcceptance?.method}</p>

      {gatewayIds.map((gatewayId) => (
        <KeyRetrievalGuide key={gatewayId} gatewayId={gatewayId} />
      ))}

      <FormField label="Publishable / public key" priority="required">
        <input
          className="text-input"
          value={content.payment_publishable_key || ''}
          onChange={(e) => patch({ payment_publishable_key: e.target.value })}
        />
      </FormField>

      <FormField label="Secret key" priority="required">
        <p className="cf-secret-reassurance">{SECRET_KEY_REASSURANCE}</p>
        {content.payment_secret_key_stored ? (
          <div className="cf-secret-stored">
            <span>✓ Secret key stored securely.</span>
            <button type="button" className="cf-secret-stored__replace" onClick={() => patch({ payment_secret_key_stored: false })}>
              Replace it
            </button>
          </div>
        ) : (
          <>
            <input
              className="text-input"
              type="password"
              autoComplete="off"
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
            />
            <button type="button" className="btn btn--primary" style={{ marginTop: 8 }} onClick={handleSaveSecret} disabled={status === 'saving'}>
              {status === 'saving' ? 'Storing…' : 'Store securely'}
            </button>
            {status === 'error' && <p className="cf-error">Couldn't store that — please try again.</p>}
          </>
        )}
      </FormField>
    </div>
  )
}
