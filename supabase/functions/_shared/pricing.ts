// Server-side pricing catalog for verify-flutterwave-payment.
//
// This is a deliberate, standalone COPY of the price data in
// src/wizard/config/catalog.js — Edge Functions run on Deno, not through
// Vite, so they can't import the frontend module directly. Keep this file
// in sync by hand whenever a price changes in catalog.js.
//
// Critically: this module recomputes the total from *ids only* (order.template.tier,
// order.heroStyle.id, etc.) — never from the numeric `.price` fields the
// client's order JSON also happens to carry. Trusting those would defeat the
// entire point of server-side verification, since a client can send any
// order JSON it wants.

export const TEMPLATES: Record<string, { price: number; effectPackCredit: number }> = {
  plain: { price: 70000, effectPackCredit: 0 },
  standard: { price: 100000, effectPackCredit: 0 },
  rich: { price: 150000, effectPackCredit: 25000 },
}

export const ONLINE_PAYMENTS_ADDON_PRICE = 20000
export const SOCIAL_PREVIEW_ADDON_PRICE = 8000
export const EXTRA_PAGE_PRICE = 15000

export const HERO_STYLE_PRICES: Record<string, number> = {
  static: 0,
  video: 10000,
  'line-draw': 15000,
  parallax: 12000,
  'split-screen': 11000,
  'full-bleed': 13000,
  'typing-headline': 9000,
  illustrated: 18000,
  'floating-shapes': 8000,
}

export const EFFECT_PACK_PRICES: Record<string, number> = {
  signature: 25000,
  luxury: 35000,
  interactive: 50000,
}

export const INDIVIDUAL_EFFECT_PRICES: Record<string, number> = {
  // Beautification
  favicon: 5000,
  'animated-logo': 12000,
  'custom-404': 6000,
  newsletter: 10000,
  'cookie-banner': 4000,
  'custom-scrollbar': 3000,
  'dark-mode': 15000,
  'multi-language': 14000,
  'social-banner-kit': 12000,
  'custom-cursor': 6000,
  'cursor-spotlight': 6000,
  'gradient-backgrounds': 4000,
  'card-hover-lift': 4000,
  'text-scramble': 5000,
  marquee: 5000,
  'button-pop': 5000,
  'micro-interactions': 5000,
  'loading-intro': 7000,
  'scroll-progress': 3000,
  'success-chime': 4000,
  'floating-blobs': 4000,
  'glowing-orbs': 4000,
  'grain-texture-overlay': 3000,
  'liquid-fill-button': 4000,
  'mask-reveal': 6000,
  'blur-to-sharp-entrance': 4000,
  'scale-settle': 3000,
  // Premium
  glassmorphism: 8000,
  'scroll-reveal': 7000,
  'parallax-sections': 9000,
  'hanging-sign-reveal': 10000,
  'pinned-sections': 12000,
  'horizontal-gallery': 9000,
  'magnetic-buttons': 6000,
  'animated-counters': 5000,
  'card-tilt': 6000,
  'page-transitions': 8000,
  'staggered-reveal': 5000,
  'blueprint-line-draw': 6000,
  'curtain-reveal': 7000,
  'gooey-menu-hover': 6000,
  'before-after-slider': 9000,
  'masonry-cascade': 8000,
  'image-tilt-hover': 5000,
  'confetti-cannon': 6000,
  'cursor-trail': 7000,
  'hover-depth': 6000,
  'image-hover-distortion': 9000,
  'floating-hero-image': 5000,
  'image-assemble': 9000,
  'floating-accent-cards': 6000,
  'light-sweep': 5000,
  'card-stack-scroll': 10000,
  'section-handoff-transition': 9000,
  // Signature
  'shatter-split': 28000,
  'crack-open-reveal': 22000,
  'ai-video-hero': 35000,
  '3d-interactive-object': 45000,
  '3d-product-showcase': 50000,
  '3d-mouse-scene': 55000,
}

export const DELIVERY_PRICES: Record<string, number> = {
  standard: 0,
  rush: 20000,
}

const DOMAIN_TIER_PRICE_BY_TLD: Record<string, number> = {
  '.com': 20000, '.com.ng': 20000, '.ng': 20000, '.net': 20000, '.org': 20000, '.io': 20000,
  '.store': 10000, '.site': 10000, '.africa': 10000,
}

/**
 * Recomputes the order total from ids only. Returns null if the order
 * references an id this catalog doesn't recognize (treated as invalid/
 * tampered rather than silently priced at 0).
 *
 * IMPORTANT: `order` here is a row fetched straight from Postgres via
 * `select('*')` — its top-level keys are the actual COLUMN NAMES (snake_case:
 * hero_style, effect_pack, individual_effects, extra_pages, online_payments,
 * social_preview), not the camelCase keys the frontend's order object uses.
 * Only read snake_case keys at the top level here. (The *contents* of each
 * jsonb column keep whatever casing the client originally stored, e.g.
 * order.template.tier and order.hero_style.id are both camelCase inside.)
 */
export function calculateServerOrderTotal(order: any): number | null {
  try {
    let total = 0

    const tier = order?.template?.tier
    const template = tier ? TEMPLATES[tier] : null
    if (!template) return null
    total += template.price

    if (order?.online_payments?.enabled) total += ONLINE_PAYMENTS_ADDON_PRICE

    if (order?.domain?.selected) {
      const tld = order.domain.type
      const price = tld ? DOMAIN_TIER_PRICE_BY_TLD[tld] : undefined
      if (price === undefined) return null
      total += price
    }

    const heroId = order?.hero_style?.id
    if (heroId) {
      const price = HERO_STYLE_PRICES[heroId]
      if (price === undefined) return null
      total += price
    }

    if (order?.effect_pack?.id) {
      const packPrice = EFFECT_PACK_PRICES[order.effect_pack.id]
      if (packPrice === undefined) return null
      total += Math.max(0, packPrice - (template.effectPackCredit || 0))
    }

    for (const effect of order?.individual_effects || []) {
      const price = INDIVIDUAL_EFFECT_PRICES[effect?.id]
      if (price === undefined) return null
      total += price
    }

    if (order?.social_preview?.enabled) total += SOCIAL_PREVIEW_ADDON_PRICE

    const extraPageCount = Array.isArray(order?.extra_pages) ? order.extra_pages.length : 0
    total += extraPageCount * EXTRA_PAGE_PRICE

    const deliveryType = order?.delivery?.type
    if (deliveryType) {
      const price = DELIVERY_PRICES[deliveryType]
      if (price === undefined) return null
      total += price
    }

    return total
  } catch {
    return null
  }
}

export const NGN_PER_USD = 1600

export function ngnToUsd(ngn: number): number {
  return Math.round((ngn / NGN_PER_USD) * 100) / 100
}
