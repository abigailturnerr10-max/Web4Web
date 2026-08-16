/**
 * Declarative spec for the content-collection form — which steps/fields
 * apply to a given order (siteType/tier/paymentAcceptance), their priority
 * (drives the Required/Recommended/Optional badge, submission blocking, and
 * the weighted completion percentage), and whether a field currently counts
 * as "filled" given the order + order_content so far.
 */

import { EFFECT_FIELD_ACTIVATIONS, EFFECT_PRIORITY_UPGRADES, tierAndTypeUpgrades, upgradePriority, purchasedEffectIds } from './contentRequirementsMap.js'

export const PRIORITY = { REQUIRED: 'required', RECOMMENDED: 'recommended', OPTIONAL: 'optional' }
export const PRIORITY_WEIGHT = { required: 3, recommended: 2, optional: 1 }
export const PRIORITY_LABEL = { required: 'Required', recommended: 'Recommended', optional: 'Optional' }

const PHYSICAL_LOCATION_TYPES = ['store', 'business']

function hasText(v) {
  return typeof v === 'string' && v.trim().length > 0
}

function hasItems(v) {
  return Array.isArray(v) && v.length > 0
}

/**
 * Each field: id, stepId, priority (fixed or a fn of (order) => priority),
 * appliesWhen(order) => boolean, filled(content, order) => boolean.
 * Fields not in appliesWhen for this order are excluded entirely — never
 * shown, never counted toward completion or submission blocking.
 */
export function buildFieldSpec(order) {
  const siteType = order?.siteType
  const tier = order?.template?.tier
  const paymentMethod = order?.paymentAcceptance?.method
  const hasBrandAsset = hasText(order?.colorTheme?.brandAssetUrl)
  const hasNewsletter = (order?.individualEffects || []).some((e) => e.id === 'newsletter')
  const physicalLocation = PHYSICAL_LOCATION_TYPES.includes(siteType)
  const showProducts = siteType === 'store' || siteType === 'business'
  const showGallery = tier && tier !== 'plain'
  const showPaymentStep = paymentMethod && paymentMethod !== 'manual-transfer'
  const showVideoFootage = order?.heroStyle?.id === 'video'
  const domainAlreadySelected = Boolean(order?.domain?.selected)

  // ---- Purchase-driven upgrades (CONTENT_REQUIREMENTS_MAP, see
  // contentRequirementsMap.js) — computed once here, never applied as a
  // downgrade, only ever raises a field's priority above its baseline.
  const effectIds = purchasedEffectIds(order)
  const tierUpgrades = tierAndTypeUpgrades(order)

  function upgradedPriority(fieldId, basePriority) {
    let priority = basePriority
    const tierUpgrade = tierUpgrades.find((u) => u.fieldId === fieldId)
    if (tierUpgrade) priority = upgradePriority(priority, tierUpgrade.priority)
    for (const [effectId, upgrade] of Object.entries(EFFECT_PRIORITY_UPGRADES)) {
      if (upgrade.fieldId === fieldId && effectIds.includes(effectId)) {
        priority = upgradePriority(priority, upgrade.priority)
      }
    }
    return priority
  }

  function upgradeNote(fieldId) {
    const [, upgrade] = Object.entries(EFFECT_PRIORITY_UPGRADES).find(([effectId, u]) => u.fieldId === fieldId && effectIds.includes(effectId)) || []
    return upgrade?.note
  }

  // Fields newly activated by a specific purchased effect (before/after
  // photos, object photos, stats, trust badges, languages needed) — several
  // effect ids can activate the same field (e.g. both 3D effects activate
  // object_photos), so priority is the highest of any matching purchase.
  const activatedByField = {}
  for (const [effectId, activation] of Object.entries(EFFECT_FIELD_ACTIVATIONS)) {
    if (!effectIds.includes(effectId)) continue
    const existing = activatedByField[activation.fieldId]
    activatedByField[activation.fieldId] = existing
      ? { ...existing, priority: upgradePriority(existing.priority, activation.priority) }
      : { priority: activation.priority, reason: activation.reason }
  }

  const fields = [
    // Step 1 — Brand Basics
    { id: 'brand_name', stepId: 1, priority: PRIORITY.REQUIRED, filled: (c) => hasText(c.brand_name) },
    { id: 'tagline', stepId: 1, priority: PRIORITY.OPTIONAL, filled: (c) => hasText(c.tagline) },
    { id: 'business_description', stepId: 1, priority: PRIORITY.REQUIRED, filled: (c) => hasText(c.business_description) },
    {
      id: 'logo_path',
      stepId: 1,
      priority: PRIORITY.REQUIRED,
      appliesWhen: () => !hasBrandAsset,
      filled: (c) => hasText(c.logo_path) || Boolean(c.logo_fallback),
    },

    // Step 2 — Contact & Location
    { id: 'phone', stepId: 2, priority: PRIORITY.REQUIRED, filled: (c) => hasText(c.phone) },
    { id: 'business_email', stepId: 2, priority: PRIORITY.REQUIRED, filled: (c) => hasText(c.business_email) },
    {
      id: 'address',
      stepId: 2,
      priority: physicalLocation ? PRIORITY.RECOMMENDED : PRIORITY.OPTIONAL,
      filled: (c) => hasText(c.address),
    },
    {
      id: 'business_hours',
      stepId: 2,
      priority: physicalLocation ? PRIORITY.RECOMMENDED : PRIORITY.OPTIONAL,
      filled: (c) => hasText(c.business_hours),
    },

    // Step 3 — Page-by-Page Content
    { id: 'home_key_message', stepId: 3, priority: PRIORITY.REQUIRED, filled: (c) => hasText(c.home_key_message) },
    { id: 'about_story', stepId: 3, priority: PRIORITY.REQUIRED, filled: (c) => hasText(c.about_story) },
    {
      id: 'products',
      stepId: 3,
      priority: upgradedPriority('products', PRIORITY.RECOMMENDED),
      appliesWhen: () => showProducts,
      filled: (c) => hasItems(c.products),
    },
    {
      id: 'gallery',
      stepId: 3,
      priority: upgradedPriority('gallery', PRIORITY.RECOMMENDED),
      note: upgradeNote('gallery'),
      appliesWhen: () => showGallery,
      filled: (c) => hasItems(c.gallery),
    },
    { id: 'team', stepId: 3, priority: PRIORITY.OPTIONAL, filled: (c) => hasItems(c.team) },
    { id: 'faq', stepId: 3, priority: PRIORITY.OPTIONAL, filled: (c) => hasItems(c.faq) },
    {
      id: 'testimonials',
      stepId: 3,
      priority: PRIORITY.OPTIONAL,
      filled: (c) => hasItems(c.testimonials) || Boolean(c.testimonials_fallback),
    },
    {
      id: 'stats',
      stepId: 3,
      priority: PRIORITY.RECOMMENDED,
      appliesWhen: () => Boolean(activatedByField.stats),
      filled: (c) => hasItems(c.stats) || Boolean(c.stats_fallback),
    },
    {
      id: 'trust_badges',
      stepId: 3,
      priority: PRIORITY.OPTIONAL,
      appliesWhen: () => Boolean(activatedByField.trust_badges),
      filled: (c) => hasItems(c.trust_badges),
    },
    {
      id: 'languages_needed',
      stepId: 3,
      priority: PRIORITY.RECOMMENDED,
      appliesWhen: () => Boolean(activatedByField.languages_needed),
      filled: (c) => hasText(c.languages_needed) || Boolean(c.languages_needed_fallback),
    },

    // Step 4 — Visual Assets
    {
      id: 'additional_photos',
      stepId: 4,
      priority: PRIORITY.RECOMMENDED,
      filled: (c) => hasItems(c.additional_photos) || Boolean(c.additional_photos_fallback),
    },
    {
      id: 'video_footage',
      stepId: 4,
      priority: PRIORITY.RECOMMENDED,
      appliesWhen: () => showVideoFootage,
      filled: (c) => Boolean(c.video_footage_fallback),
    },
    {
      id: 'before_after_photos',
      stepId: 4,
      priority: PRIORITY.REQUIRED,
      appliesWhen: () => Boolean(activatedByField.before_after_photos),
      filled: (c) => (hasText(c.before_photo_path) && hasText(c.after_photo_path)) || Boolean(c.before_after_fallback),
    },
    {
      id: 'object_photos',
      stepId: 4,
      priority: PRIORITY.RECOMMENDED,
      appliesWhen: () => Boolean(activatedByField.object_photos),
      filled: (c) => hasItems(c.object_photos) || Boolean(c.object_photos_fallback),
    },

    // Step 5 — Social & Online Presence
    {
      id: 'social_links',
      stepId: 5,
      priority: upgradedPriority('social_links', PRIORITY.OPTIONAL),
      filled: (c) => Object.keys(c.social_links || {}).length > 0,
    },
    { id: 'existing_website_url', stepId: 5, priority: PRIORITY.OPTIONAL, filled: (c) => hasText(c.existing_website_url) },
    {
      id: 'google_business_url',
      stepId: 5,
      priority: physicalLocation ? PRIORITY.RECOMMENDED : PRIORITY.OPTIONAL,
      filled: (c) => hasText(c.google_business_url),
    },

    // Step 6 — Payment Setup
    {
      id: 'payment_publishable_key',
      stepId: 6,
      priority: PRIORITY.REQUIRED,
      appliesWhen: () => showPaymentStep,
      filled: (c) => hasText(c.payment_publishable_key),
    },
    {
      id: 'payment_secret_key',
      stepId: 6,
      priority: PRIORITY.REQUIRED,
      appliesWhen: () => showPaymentStep,
      filled: (c) => Boolean(c.payment_secret_key_stored),
    },

    // Step 7 — Newsletter Integration (only when the `newsletter` effect —
    // Newsletter Signup Integration — was actually purchased)
    {
      id: 'newsletter_provider',
      stepId: 7,
      priority: PRIORITY.REQUIRED,
      appliesWhen: () => hasNewsletter,
      filled: (c) => hasText(c.newsletter_provider),
    },
    {
      id: 'newsletter_api_key',
      stepId: 7,
      priority: PRIORITY.REQUIRED,
      appliesWhen: () => hasNewsletter,
      filled: (c) => Boolean(c.newsletter_api_key_stored),
    },

    // Step 8 — Domain Confirmation
    {
      id: 'domain_note',
      stepId: 8,
      priority: PRIORITY.OPTIONAL,
      appliesWhen: () => !domainAlreadySelected,
      filled: (c) => hasText(c.domain_note),
    },

    // Step 9 — Legal Content
    { id: 'legal_privacy_text', stepId: 9, priority: PRIORITY.OPTIONAL, filled: () => true }, // checkbox default covers this — see StepLegalContent

    // Step 10 — Anything Else
    { id: 'anything_else', stepId: 10, priority: PRIORITY.OPTIONAL, filled: (c) => hasText(c.anything_else) },
  ]

  return fields
    .filter((f) => (f.appliesWhen ? f.appliesWhen(order) : true))
    .map((f) => ({ ...f, label: FIELD_LABELS[f.id] || f.id }))
}

export const FIELD_LABELS = {
  brand_name: 'Business/brand name',
  tagline: 'Tagline',
  business_description: 'Short business description',
  logo_path: 'Logo',
  phone: 'Business phone',
  business_email: 'Business email',
  address: 'Physical address',
  business_hours: 'Business hours',
  home_key_message: 'Home page key message',
  about_story: 'About — full story',
  products: 'Products / Services',
  gallery: 'Gallery images',
  team: 'Team',
  faq: 'FAQ',
  testimonials: 'Testimonials',
  additional_photos: 'Additional photos',
  video_footage: 'Video footage',
  before_after_photos: 'Before/after photos',
  object_photos: 'Product/object photos (multi-angle)',
  stats: 'Stats / key numbers',
  trust_badges: 'Trust badges / partner logos',
  languages_needed: 'Languages needed',
  social_links: 'Social profile links',
  existing_website_url: 'Existing website URL',
  google_business_url: 'Google Business Profile link',
  payment_publishable_key: 'Payment gateway publishable key',
  payment_secret_key: 'Payment gateway secret key',
  newsletter_provider: 'Newsletter provider',
  newsletter_api_key: 'Newsletter API key',
  domain_note: 'Domain note',
  legal_privacy_text: 'Privacy Policy / Terms',
  anything_else: 'Anything else',
}

export const STEP_DEFS = [
  { id: 1, title: 'Brand Basics' },
  { id: 2, title: 'Contact & Location' },
  { id: 3, title: 'Page-by-Page Content' },
  { id: 4, title: 'Visual Assets' },
  { id: 5, title: 'Social & Online Presence' },
  { id: 6, title: 'Payment Setup', appliesWhen: (order) => order?.paymentAcceptance?.method && order.paymentAcceptance.method !== 'manual-transfer' },
  { id: 7, title: 'Newsletter Integration', appliesWhen: (order) => (order?.individualEffects || []).some((e) => e.id === 'newsletter') },
  { id: 8, title: 'Domain Confirmation' },
  { id: 9, title: 'Legal Content' },
  { id: 10, title: 'Anything Else' },
  { id: 11, title: 'Review & Submit' },
]

export function applicableSteps(order) {
  return STEP_DEFS.filter((s) => (s.appliesWhen ? s.appliesWhen(order) : true))
}

/** Look up one field's computed spec (priority/note/appliesWhen already resolved) from a `buildFieldSpec(order)` result. */
export function getField(fields, id) {
  return fields.find((f) => f.id === id)
}

/** { percent, filledWeight, totalWeight, missingRequired, missingOther } */
export function calculateCompletion(order, content) {
  const fields = buildFieldSpec(order)
  let filledWeight = 0
  let totalWeight = 0
  const missingRequired = []
  const missingOther = []

  for (const field of fields) {
    const weight = PRIORITY_WEIGHT[field.priority]
    totalWeight += weight
    const isFilled = field.filled(content, order)
    if (isFilled) {
      filledWeight += weight
    } else if (field.priority === PRIORITY.REQUIRED) {
      missingRequired.push(field)
    } else {
      missingOther.push(field)
    }
  }

  const percent = totalWeight > 0 ? Math.round((filledWeight / totalWeight) * 100) : 100
  return { percent, missingRequired, missingOther, fields }
}
