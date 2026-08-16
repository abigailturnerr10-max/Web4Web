import { FormField } from '../ContentFormUI.jsx'

export default function StepDomainConfirmation({ order, content, patch }) {
  const domain = order?.domain

  return (
    <div className="cf-step">
      {domain?.selected ? (
        <div className="cf-domain-confirm">
          <span className="mono-label">Your domain</span>
          <p className="cf-domain-confirm__value">
            {(domain.desired || 'yourbrand')}
            {domain.type}
          </p>
          <p className="cf-hint">This is what you selected during checkout — we'll register it as part of your build.</p>
        </div>
      ) : (
        <>
          <p className="cf-hint">No domain was purchased through Web4Web — if you already own one, tell us here.</p>
          <FormField label="Domain note" priority="optional">
            <textarea
              className="text-input"
              rows={3}
              placeholder="e.g. I already own yourbrand.com via Namecheap"
              value={content.domain_note || ''}
              onChange={(e) => patch({ domain_note: e.target.value })}
            />
          </FormField>
          <p className="cf-hint">We'll send DNS-pointing instructions in a setup guide at delivery.</p>
        </>
      )}
    </div>
  )
}
