import { useState } from 'react'
import { FormField } from '../ContentFormUI.jsx'
import { supabase } from '../../../lib/supabaseClient.js'
import { NEWSLETTER_PROVIDERS, NEWSLETTER_KEY_GUIDES, NEWSLETTER_KEY_REASSURANCE } from '../../newsletterIntegration.js'

function KeyGuide({ providerId }) {
  const guide = NEWSLETTER_KEY_GUIDES[providerId]
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

export default function StepNewsletterIntegration({ content, patch, orderId }) {
  const [secretInput, setSecretInput] = useState('')
  const [status, setStatus] = useState('idle') // idle | saving | saved | error
  const knownProviderIds = NEWSLETTER_PROVIDERS.map((p) => p.id).filter((id) => id !== 'other')
  const isKnownProvider = knownProviderIds.includes(content.newsletter_provider)
  const selectedProviderId = isKnownProvider ? content.newsletter_provider : content.newsletter_provider ? 'other' : ''
  const [otherProvider, setOtherProvider] = useState(selectedProviderId === 'other' ? content.newsletter_provider : '')

  function handleProviderSelect(id) {
    if (id === 'other') {
      patch({ newsletter_provider: otherProvider || '' })
    } else {
      patch({ newsletter_provider: id })
    }
  }

  async function handleSaveSecret() {
    if (!secretInput.trim()) return
    setStatus('saving')
    const { data, error } = await supabase.functions.invoke('store-client-secret', {
      body: { orderId, keyType: 'newsletter_api_key', value: secretInput.trim() },
    })
    if (error || !data?.success) {
      setStatus('error')
      return
    }
    setSecretInput('')
    setStatus('saved')
    patch({ newsletter_api_key_stored: true })
  }

  return (
    <div className="cf-step">
      <p className="cf-hint">
        You purchased the Newsletter Signup Integration — we need your email provider's API key so your site's
        signup form can actually add subscribers to your list.
      </p>

      <FormField label="Which email provider do you use?" priority="required">
        <div className="option-list">
          {NEWSLETTER_PROVIDERS.map((p) => (
            <button
              type="button"
              key={p.id}
              className={'btn' + (selectedProviderId === p.id ? ' btn--dark' : ' btn--ghost')}
              onClick={() => handleProviderSelect(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>
        {selectedProviderId === 'other' && (
          <input
            className="text-input"
            style={{ marginTop: 8 }}
            placeholder="Which provider?"
            value={otherProvider}
            onChange={(e) => {
              setOtherProvider(e.target.value)
              patch({ newsletter_provider: e.target.value })
            }}
          />
        )}
      </FormField>

      {selectedProviderId && selectedProviderId !== 'other' && <KeyGuide providerId={selectedProviderId} />}

      <FormField label="API key" priority="required">
        <p className="cf-secret-reassurance">{NEWSLETTER_KEY_REASSURANCE}</p>
        {content.newsletter_api_key_stored ? (
          <div className="cf-secret-stored">
            <span>✓ API key stored securely.</span>
            <button type="button" className="cf-secret-stored__replace" onClick={() => patch({ newsletter_api_key_stored: false })}>
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
