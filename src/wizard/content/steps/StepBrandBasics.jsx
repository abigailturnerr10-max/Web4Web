import { FormField, FallbackChoice } from '../ContentFormUI.jsx'
import { uploadClientContentFile } from '../uploadHelpers.js'

export default function StepBrandBasics({ order, content, patch, orderId }) {
  const hasBrandAsset = Boolean(order?.colorTheme?.brandAssetUrl)

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const path = await uploadClientContentFile(orderId, file)
    if (path) patch({ logo_path: path, logo_fallback: null })
  }

  return (
    <div className="cf-step">
      <FormField label="Business/brand name" priority="required">
        <input className="text-input" value={content.brand_name || ''} onChange={(e) => patch({ brand_name: e.target.value })} />
      </FormField>

      <FormField label="Tagline" priority="optional">
        <input className="text-input" value={content.tagline || ''} onChange={(e) => patch({ tagline: e.target.value })} />
      </FormField>

      <FormField label="Short business description" priority="required">
        <textarea
          className="text-input"
          rows={3}
          placeholder="What you do, and who it's for."
          value={content.business_description || ''}
          onChange={(e) => patch({ business_description: e.target.value })}
        />
      </FormField>

      {hasBrandAsset ? (
        <p className="cf-hint">Logo already captured during Visual Identity setup — nothing more needed here.</p>
      ) : (
        <FormField label="Logo" priority="required">
          <label className="cf-upload">
            <input type="file" accept="image/*" onChange={handleLogoUpload} />
            <span>{content.logo_path ? `Uploaded: ${content.logo_path.split('/').pop()}` : 'Choose a file'}</span>
          </label>
          <FallbackChoice
            itemLabel="a logo"
            value={content.logo_fallback}
            onChange={(v) => patch({ logo_fallback: v })}
          />
        </FormField>
      )}
    </div>
  )
}
