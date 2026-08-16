import { FormField, RepeatableBlock, FallbackChoice } from '../ContentFormUI.jsx'
import { uploadClientContentFile } from '../uploadHelpers.js'
import { getField } from '../contentSpec.js'

export default function StepVisualAssets({ order, content, fields, patch, orderId }) {
  const showVideoFootage = order?.heroStyle?.id === 'video'
  const beforeAfterField = getField(fields, 'before_after_photos')
  const objectPhotosField = getField(fields, 'object_photos')

  async function uploadTo(key, file) {
    const path = await uploadClientContentFile(orderId, file)
    if (path) patch({ [key]: path })
  }

  return (
    <div className="cf-step">
      <FormField label="Additional photos" priority="recommended">
        <RepeatableBlock
          items={content.additional_photos || []}
          onChange={(items) => patch({ additional_photos: items })}
          itemLabel="Photo"
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
        <FallbackChoice itemLabel="additional photos" value={content.additional_photos_fallback} onChange={(v) => patch({ additional_photos_fallback: v })} />
      </FormField>

      {showVideoFootage && (
        <FormField label="Video footage" priority="recommended">
          <p className="cf-hint">You picked a Video Hero — real footage makes it land. If you don't have any, we can produce it for you.</p>
          <FallbackChoice itemLabel="video footage" value={content.video_footage_fallback} onChange={(v) => patch({ video_footage_fallback: v })} />
        </FormField>
      )}

      {beforeAfterField && (
        <FormField label="Before / after photos" priority={beforeAfterField.priority}>
          <p className="cf-hint">You picked the Before/After Slider effect — it needs both a "before" and an "after" image to work at all.</p>
          <FormField label="Before photo" priority="required">
            <label className="cf-upload">
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadTo('before_photo_path', e.target.files[0])} />
              <span>{content.before_photo_path ? `Uploaded: ${content.before_photo_path.split('/').pop()}` : 'Choose a file'}</span>
            </label>
          </FormField>
          <FormField label="After photo" priority="required">
            <label className="cf-upload">
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadTo('after_photo_path', e.target.files[0])} />
              <span>{content.after_photo_path ? `Uploaded: ${content.after_photo_path.split('/').pop()}` : 'Choose a file'}</span>
            </label>
          </FormField>
          <FallbackChoice itemLabel="before/after photos" value={content.before_after_fallback} onChange={(v) => patch({ before_after_fallback: v })} />
        </FormField>
      )}

      {objectPhotosField && (
        <FormField label="Product/object photos (multi-angle)" priority={objectPhotosField.priority}>
          <p className="cf-hint">You picked a 3D-style interactive object/product effect — a handful of photos from different angles is all it needs, no 3D scan required.</p>
          <RepeatableBlock
            items={content.object_photos || []}
            onChange={(items) => patch({ object_photos: items })}
            itemLabel="Photo"
            emptyItem={() => ({ path: '', angle: '' })}
            renderSummary={(item) => item.angle || (item.path ? item.path.split('/').pop() : 'Untitled')}
            renderFields={(item, update) => (
              <>
                <FormField label="Image" priority="required">
                  <label className="cf-upload">
                    <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const path = await uploadClientContentFile(orderId, f); if (path) update({ path }) } }} />
                    <span>{item.path ? `Uploaded: ${item.path.split('/').pop()}` : 'Choose a file'}</span>
                  </label>
                </FormField>
                <FormField label="Angle (optional note)" priority="optional">
                  <input className="text-input" placeholder="e.g. front, side, top" value={item.angle} onChange={(e) => update({ angle: e.target.value })} />
                </FormField>
              </>
            )}
          />
          <FallbackChoice itemLabel="these photos" value={content.object_photos_fallback} onChange={(v) => patch({ object_photos_fallback: v })} />
        </FormField>
      )}
    </div>
  )
}
