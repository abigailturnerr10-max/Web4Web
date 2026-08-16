/** Scans order_content for every "I'll provide it later" / "I need help" fallback choice, including per-item ones inside repeatable blocks. */
export function deriveOutstandingAndUpsell(content) {
  const outstanding = []
  const upsell = []

  function record(label, value) {
    if (value === 'later') outstanding.push(label)
    if (value === 'upsell') upsell.push(label)
  }

  record('Logo', content.logo_fallback)
  record('Testimonials', content.testimonials_fallback)
  record('Additional photos', content.additional_photos_fallback)
  record('Video footage', content.video_footage_fallback)

  ;(content.products || []).forEach((p, i) => record(`${p.name || `Product ${i + 1}`} — photo`, p.photo_fallback))
  ;(content.team || []).forEach((t, i) => record(`${t.name || `Team member ${i + 1}`} — photo`, t.photo_fallback))

  return { outstanding, upsell }
}
