/**
 * Maps specific purchased options (hero style, individual effects, tier
 * inclusions) to the content fields they activate or upgrade in the
 * collection form. Audited against the full catalog in catalog.js —
 * findings below.
 *
 * ---- Audit findings ------------------------------------------------------
 *
 * Hero styles: only `video` implies a distinct content need (real footage) —
 * already wired via `video_footage`/`showVideoFootage` in contentSpec.js,
 * unaffected by this map. `ai-video-hero` (a signature effect) generates
 * motion FROM the existing hero image/photo rather than needing separate
 * footage, so it deliberately does NOT activate the video-footage field —
 * confirmed correct as already gated purely on heroStyleId === 'video'.
 * The other 7 hero styles (static/line-draw/parallax/split-screen/
 * full-bleed/typing-headline/illustrated/floating-shapes) are presentation
 * treatments of content already asked for elsewhere — no new field needed.
 *
 * `newsletter` (Newsletter Signup Integration) is deliberately NOT in
 * EFFECT_FIELD_ACTIVATIONS below — it needed a whole conditional step (email
 * provider + vault-routed API key), not a plain field, so it's wired
 * directly in contentSpec.js's Step 7 and STEP_DEFS instead. See
 * newsletterIntegration.js for the provider guides/reassurance copy.
 *
 * Effect Packs (signature/luxury/interactive): none of the 3 packs' bundled
 * effects imply new client-provided content — every effect in every pack is
 * a pure animation/hover/transition treatment. No pack-level mapping exists
 * below; this was a deliberate audit finding, not an oversight.
 *
 * Individual effects: of ~60 in the catalog, the overwhelming majority
 * (beautification + most premium/signature) are pure visual polish applied
 * to content already collected — dark mode, custom cursor, confetti,
 * page transitions, etc. need nothing new. The ones below are the real
 * exceptions found during the audit.
 *
 * Flagged but NOT built (reported per the brief rather than silently
 * skipped or silently invented):
 * - Standard tier's own page note (`catalog.js` TEMPLATES.standard) says
 *   "Adds Services, Gallery, Blog/News" — Gallery is covered, Services is
 *   covered via the Products/Services step, but there is no Blog/News
 *   content field anywhere in the form. Ongoing content (posts), not a
 *   one-time intake field — flagged as a real gap, deliberately not built
 *   here since it doesn't fit this form's "collect once" shape.
 * - No effect in the current catalog is testimonial-specific (searched all
 *   ~60 individual effects and all 3 packs) — the "testimonial-showcasing
 *   effect" example from the brief doesn't correspond to any real
 *   purchasable option today, so no mapping was built for it.
 * - `social-banner-kit` was checked and does NOT need new client content —
 *   it's built from the logo/brand colors already required in Step 1.
 * - FAQ and Team sections are never referenced in TIER_INCLUSIONS or any
 *   TEMPLATES pageNote, and extra_pages carry no "what kind of page" data —
 *   there is no reliable signal anywhere in the order to know whether an
 *   extra page IS a FAQ/Team page. Left as Optional always; upgrading this
 *   properly would need the Configurator to capture what an extra page is
 *   for, which is out of scope for this form.
 */

/** New fields activated by a specific purchased individual effect. */
export const EFFECT_FIELD_ACTIVATIONS = {
  'before-after-slider': {
    fieldId: 'before_after_photos',
    priority: 'required',
    reason: "The Before/After Slider effect literally can't function without both images.",
  },
  '3d-interactive-object': {
    fieldId: 'object_photos',
    priority: 'recommended',
    reason: 'Multi-angle photos are enough to build this — no 3D scan needed.',
  },
  '3d-product-showcase': {
    fieldId: 'object_photos',
    priority: 'recommended',
    reason: 'Multi-angle photos are enough to build this — no 3D scan needed.',
  },
  'animated-counters': {
    fieldId: 'stats',
    priority: 'recommended',
    reason: 'The Count-Up Numbers effect needs real numbers to count up to.',
  },
  marquee: {
    fieldId: 'trust_badges',
    priority: 'optional',
    reason: 'The scrolling strip can run on text alone, but logos/badges make it land better.',
  },
  'multi-language': {
    fieldId: 'languages_needed',
    priority: 'recommended',
    reason: "The toggle needs to know which languages, and whether you'll supply translated copy.",
  },
}

/** Existing fields whose minimum priority is upgraded by a specific purchased individual effect. */
export const EFFECT_PRIORITY_UPGRADES = {
  'horizontal-gallery': { fieldId: 'gallery', priority: 'required', note: 'At least 6 images recommended for this effect to look right.' },
  'masonry-cascade': { fieldId: 'gallery', priority: 'required', note: 'At least 6 images recommended for this effect to look right.' },
}

/** Existing fields whose minimum priority is upgraded by tier/siteType (not a specific effect purchase). */
export function tierAndTypeUpgrades(order) {
  const upgrades = []
  if (order?.template?.tier && order.template.tier !== 'plain') {
    upgrades.push({ fieldId: 'social_links', priority: 'required', reason: 'Social media links are included at your tier.' })
  }
  if (order?.siteType === 'store') {
    upgrades.push({ fieldId: 'products', priority: 'required', reason: "A store can't launch without products." })
  }
  return upgrades
}

const PRIORITY_RANK = { optional: 0, recommended: 1, required: 2 }

/** Never downgrades — only raises a priority if the new one outranks the current one. */
export function upgradePriority(current, candidate) {
  return PRIORITY_RANK[candidate] > PRIORITY_RANK[current] ? candidate : current
}

/** Every individual-effect id purchased on this order (from order.individualEffects). */
export function purchasedEffectIds(order) {
  return (order?.individualEffects || []).map((e) => e.id)
}
