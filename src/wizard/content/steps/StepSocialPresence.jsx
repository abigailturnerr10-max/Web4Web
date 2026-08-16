import { FormField } from '../ContentFormUI.jsx'
import { getField } from '../contentSpec.js'

const PLATFORMS = ['instagram', 'facebook', 'tiktok', 'x']

export default function StepSocialPresence({ order, content, fields, patch }) {
  const physical = order?.siteType === 'store' || order?.siteType === 'business'
  const links = content.social_links || {}
  const socialLinksField = getField(fields, 'social_links')

  function setLink(platform, value) {
    patch({ social_links: { ...links, [platform]: value } })
  }

  return (
    <div className="cf-step">
      <FormField label="Social profile links" priority={socialLinksField?.priority}>
        {PLATFORMS.map((p) => (
          <input
            key={p}
            className="text-input"
            type="url"
            style={{ marginBottom: 8 }}
            placeholder={`${p.charAt(0).toUpperCase() + p.slice(1)} URL`}
            value={links[p] || ''}
            onChange={(e) => setLink(p, e.target.value)}
          />
        ))}
      </FormField>

      <FormField label="Existing website URL (if replacing one)" priority="optional">
        <input className="text-input" type="url" value={content.existing_website_url || ''} onChange={(e) => patch({ existing_website_url: e.target.value })} />
      </FormField>

      <FormField label="Google Business Profile link" priority={physical ? 'recommended' : 'optional'}>
        <input className="text-input" type="url" value={content.google_business_url || ''} onChange={(e) => patch({ google_business_url: e.target.value })} />
      </FormField>
    </div>
  )
}
