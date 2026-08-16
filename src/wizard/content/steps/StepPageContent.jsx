import { FormField, RepeatableBlock, FallbackChoice } from '../ContentFormUI.jsx'
import { uploadClientContentFile } from '../uploadHelpers.js'
import { getField } from '../contentSpec.js'

export default function StepPageContent({ order, content, fields, patch, orderId }) {
  const showProducts = order?.siteType === 'store' || order?.siteType === 'business'
  const showGallery = order?.template?.tier && order.template.tier !== 'plain'
  const productWord = order?.siteType === 'store' ? 'Product' : 'Service'
  const productsField = getField(fields, 'products')
  const galleryField = getField(fields, 'gallery')
  const statsField = getField(fields, 'stats')
  const trustBadgesField = getField(fields, 'trust_badges')
  const languagesField = getField(fields, 'languages_needed')

  async function uploadInto(list, index, patch_, file) {
    const path = await uploadClientContentFile(orderId, file)
    if (path) patch_({ photo_path: path })
    void list
    void index
  }

  return (
    <div className="cf-step">
      <FormField label="Home page — key message" priority="required">
        <textarea className="text-input" rows={2} value={content.home_key_message || ''} onChange={(e) => patch({ home_key_message: e.target.value })} />
      </FormField>

      <FormField label="About — full story" priority="required">
        <textarea className="text-input" rows={5} value={content.about_story || ''} onChange={(e) => patch({ about_story: e.target.value })} />
      </FormField>

      {showProducts && (
        <FormField label={`${productWord}s`} priority={productsField?.priority}>
          <RepeatableBlock
            items={content.products || []}
            onChange={(items) => patch({ products: items })}
            itemLabel={productWord}
            emptyItem={() => ({ name: '', description: '', price: '', photo_path: '', photo_fallback: null })}
            renderSummary={(item) => item.name || 'Untitled'}
            renderFields={(item, update) => (
              <>
                <FormField label="Name" priority="required">
                  <input className="text-input" value={item.name} onChange={(e) => update({ name: e.target.value })} />
                </FormField>
                <FormField label="Description" priority="required">
                  <textarea className="text-input" rows={2} value={item.description} onChange={(e) => update({ description: e.target.value })} />
                </FormField>
                <FormField label="Price" priority="required">
                  <input className="text-input" value={item.price} onChange={(e) => update({ price: e.target.value })} />
                </FormField>
                <FormField label="Photo" priority="recommended">
                  <label className="cf-upload">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && uploadInto(content.products, 0, update, e.target.files[0])}
                    />
                    <span>{item.photo_path ? `Uploaded: ${item.photo_path.split('/').pop()}` : 'Choose a file'}</span>
                  </label>
                  <FallbackChoice itemLabel="a photo" value={item.photo_fallback} onChange={(v) => update({ photo_fallback: v })} />
                </FormField>
              </>
            )}
          />
        </FormField>
      )}

      {showGallery && (
        <FormField label="Gallery images" priority={galleryField?.priority} note={galleryField?.note}>
          <RepeatableBlock
            items={content.gallery || []}
            onChange={(items) => patch({ gallery: items })}
            itemLabel="Image"
            emptyItem={() => ({ path: '', caption: '' })}
            renderSummary={(item) => item.caption || (item.path ? item.path.split('/').pop() : 'Untitled')}
            renderFields={(item, update) => (
              <>
                <FormField label="Image" priority="required">
                  <label className="cf-upload">
                    <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const path = await uploadClientContentFile(orderId, f); if (path) update({ path }) } }} />
                    <span>{item.path ? `Uploaded: ${item.path.split('/').pop()}` : 'Choose a file'}</span>
                  </label>
                </FormField>
                <FormField label="Caption" priority="optional">
                  <input className="text-input" value={item.caption} onChange={(e) => update({ caption: e.target.value })} />
                </FormField>
              </>
            )}
          />
        </FormField>
      )}

      <FormField label="Team" priority="optional">
        <RepeatableBlock
          items={content.team || []}
          onChange={(items) => patch({ team: items })}
          itemLabel="Team member"
          emptyItem={() => ({ name: '', role: '', photo_path: '', photo_fallback: null, bio: '' })}
          renderSummary={(item) => item.name || 'Untitled'}
          renderFields={(item, update) => (
            <>
              <FormField label="Name" priority="required">
                <input className="text-input" value={item.name} onChange={(e) => update({ name: e.target.value })} />
              </FormField>
              <FormField label="Role" priority="required">
                <input className="text-input" value={item.role} onChange={(e) => update({ role: e.target.value })} />
              </FormField>
              <FormField label="Short bio" priority="optional">
                <textarea className="text-input" rows={2} value={item.bio} onChange={(e) => update({ bio: e.target.value })} />
              </FormField>
              <FormField label="Photo" priority="optional">
                <label className="cf-upload">
                  <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const path = await uploadClientContentFile(orderId, f); if (path) update({ photo_path: path }) } }} />
                  <span>{item.photo_path ? `Uploaded: ${item.photo_path.split('/').pop()}` : 'Choose a file'}</span>
                </label>
                <FallbackChoice itemLabel="a photo" value={item.photo_fallback} onChange={(v) => update({ photo_fallback: v })} />
              </FormField>
            </>
          )}
        />
      </FormField>

      <FormField label="FAQ" priority="optional">
        <RepeatableBlock
          items={content.faq || []}
          onChange={(items) => patch({ faq: items })}
          itemLabel="Question"
          emptyItem={() => ({ question: '', answer: '' })}
          renderSummary={(item) => item.question || 'Untitled'}
          renderFields={(item, update) => (
            <>
              <FormField label="Question" priority="required">
                <input className="text-input" value={item.question} onChange={(e) => update({ question: e.target.value })} />
              </FormField>
              <FormField label="Answer" priority="required">
                <textarea className="text-input" rows={2} value={item.answer} onChange={(e) => update({ answer: e.target.value })} />
              </FormField>
            </>
          )}
        />
      </FormField>

      <FormField label="Real testimonials" priority="optional">
        <p className="cf-hint">Distinct from the placeholder testimonials shown in the configurator preview — these are real quotes from real customers.</p>
        <RepeatableBlock
          items={content.testimonials || []}
          onChange={(items) => patch({ testimonials: items })}
          itemLabel="Testimonial"
          emptyItem={() => ({ quote: '', author: '' })}
          renderSummary={(item) => item.author || 'Untitled'}
          renderFields={(item, update) => (
            <>
              <FormField label="Quote" priority="required">
                <textarea className="text-input" rows={2} value={item.quote} onChange={(e) => update({ quote: e.target.value })} />
              </FormField>
              <FormField label="Attributed to" priority="required">
                <input className="text-input" value={item.author} onChange={(e) => update({ author: e.target.value })} />
              </FormField>
            </>
          )}
        />
        <FallbackChoice itemLabel="testimonials" value={content.testimonials_fallback} onChange={(v) => patch({ testimonials_fallback: v })} />
      </FormField>

      {statsField && (
        <FormField label="Stats / key numbers" priority={statsField.priority}>
          <p className="cf-hint">You picked an effect that counts up to a number on scroll — give it real numbers to count to.</p>
          <RepeatableBlock
            items={content.stats || []}
            onChange={(items) => patch({ stats: items })}
            itemLabel="Stat"
            emptyItem={() => ({ label: '', value: '' })}
            renderSummary={(item) => (item.label && item.value ? `${item.value} — ${item.label}` : 'Untitled')}
            renderFields={(item, update) => (
              <>
                <FormField label="Value" priority="required">
                  <input className="text-input" placeholder="e.g. 500+" value={item.value} onChange={(e) => update({ value: e.target.value })} />
                </FormField>
                <FormField label="Label" priority="required">
                  <input className="text-input" placeholder="e.g. Happy customers" value={item.label} onChange={(e) => update({ label: e.target.value })} />
                </FormField>
              </>
            )}
          />
          <FallbackChoice itemLabel="stats" value={content.stats_fallback} onChange={(v) => patch({ stats_fallback: v })} />
        </FormField>
      )}

      {trustBadgesField && (
        <FormField label="Trust badges / partner logos" priority={trustBadgesField.priority}>
          <p className="cf-hint">You picked a scrolling logo/badge strip effect. Logos look best, but plain names work too.</p>
          <RepeatableBlock
            items={content.trust_badges || []}
            onChange={(items) => patch({ trust_badges: items })}
            itemLabel="Badge"
            emptyItem={() => ({ label: '', logo_path: '' })}
            renderSummary={(item) => item.label || (item.logo_path ? item.logo_path.split('/').pop() : 'Untitled')}
            renderFields={(item, update) => (
              <>
                <FormField label="Name" priority="optional">
                  <input className="text-input" value={item.label} onChange={(e) => update({ label: e.target.value })} />
                </FormField>
                <FormField label="Logo" priority="optional">
                  <label className="cf-upload">
                    <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const path = await uploadClientContentFile(orderId, f); if (path) update({ logo_path: path }) } }} />
                    <span>{item.logo_path ? `Uploaded: ${item.logo_path.split('/').pop()}` : 'Choose a file'}</span>
                  </label>
                </FormField>
              </>
            )}
          />
        </FormField>
      )}

      {languagesField && (
        <FormField label="Languages needed" priority={languagesField.priority}>
          <p className="cf-hint">You picked a multi-language toggle. Which languages, and will you supply the translated copy?</p>
          <textarea
            className="text-input"
            rows={2}
            placeholder="e.g. English + French — I'll supply French copy"
            value={content.languages_needed || ''}
            onChange={(e) => patch({ languages_needed: e.target.value })}
          />
          <FallbackChoice itemLabel="the translated copy" value={content.languages_needed_fallback} onChange={(v) => patch({ languages_needed_fallback: v })} />
        </FormField>
      )}
    </div>
  )
}
