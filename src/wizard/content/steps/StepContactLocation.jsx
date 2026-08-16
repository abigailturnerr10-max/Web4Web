import { FormField } from '../ContentFormUI.jsx'

export default function StepContactLocation({ order, content, patch }) {
  const physical = order?.siteType === 'store' || order?.siteType === 'business'

  return (
    <div className="cf-step">
      <FormField label="Business phone" priority="required">
        <input className="text-input" type="tel" value={content.phone || ''} onChange={(e) => patch({ phone: e.target.value })} />
      </FormField>

      <FormField label="Business email" priority="required">
        <input
          className="text-input"
          type="email"
          placeholder="May differ from your account email"
          value={content.business_email || ''}
          onChange={(e) => patch({ business_email: e.target.value })}
        />
      </FormField>

      <FormField label="Physical address" priority={physical ? 'recommended' : 'optional'}>
        <input className="text-input" value={content.address || ''} onChange={(e) => patch({ address: e.target.value })} />
      </FormField>

      <FormField label="Business hours" priority={physical ? 'recommended' : 'optional'}>
        <input
          className="text-input"
          placeholder="e.g. Mon–Sat, 9am–6pm"
          value={content.business_hours || ''}
          onChange={(e) => patch({ business_hours: e.target.value })}
        />
      </FormField>
    </div>
  )
}
