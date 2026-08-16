/**
 * Generates theme palettes from a single base hue using standard color-theory
 * relationships, instead of hand-designing a fixed list of themes. A user
 * picking any of 360 hues × 4 relationships effectively has ~1000+ distinct,
 * harmonious combinations to choose from — all free (no price delta).
 */

export const PALETTE_TYPES = [
  { id: 'complementary', name: 'Complementary', description: 'Base hue against its direct opposite — high contrast.' },
  { id: 'analogous', name: 'Analogous', description: 'Neighboring hues — calm, cohesive.' },
  { id: 'monochromatic', name: 'Monochromatic', description: 'One hue, varying shades — minimal and clean.' },
  { id: 'triadic', name: 'Triadic', description: 'Three evenly spaced hues — vivid and balanced.' },
]

const wrap = (h) => ((h % 360) + 360) % 360

function hslToHex(h, s, l) {
  s /= 100
  l /= 100
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const toHex = (x) =>
    Math.round(255 * f(x))
      .toString(16)
      .padStart(2, '0')
  return `#${toHex(0)}${toHex(8)}${toHex(4)}`
}

/** Returns [ink, accentA, accentB] hex colors for a given hue + relationship. */
export function buildPalette(baseHue, paletteType) {
  const ink = hslToHex(baseHue, 38, 15)

  switch (paletteType) {
    case 'analogous':
      return [ink, hslToHex(wrap(baseHue + 30), 70, 55), hslToHex(wrap(baseHue - 30), 65, 50)]
    case 'monochromatic':
      return [ink, hslToHex(baseHue, 55, 55), hslToHex(baseHue, 30, 74)]
    case 'triadic':
      return [ink, hslToHex(wrap(baseHue + 120), 68, 55), hslToHex(wrap(baseHue + 240), 68, 50)]
    case 'complementary':
    default:
      return [ink, hslToHex(baseHue, 72, 55), hslToHex(wrap(baseHue + 180), 70, 52)]
  }
}

export function paletteOptions(baseHue) {
  return PALETTE_TYPES.map((p) => ({ ...p, colors: buildPalette(baseHue, p.id) }))
}

export const DEFAULT_HUE = 220
export const DEFAULT_PALETTE_TYPE = 'complementary'

/**
 * Hand-picked "known good" pairings shown before the generator, for
 * customers who'd rather pick a name than turn a dial. Ink stays dark in
 * every entry so nav/footer contrast holds regardless of the named pair.
 */
export const RECOMMENDED_THEMES = [
  // Original 5
  { id: 'navy-amber', name: 'Navy & Amber', category: 'professional', colors: ['#16213E', '#F2A93B', '#E1592C'] },
  { id: 'sage-terracotta', name: 'Sage & Terracotta', category: 'nature', colors: ['#2B3A2E', '#8FA681', '#C1622D'] },
  { id: 'charcoal-gold', name: 'Charcoal & Gold', category: 'luxury', colors: ['#1E1E1E', '#C9A227', '#8C8C8C'] },
  { id: 'ocean-coral', name: 'Ocean Blue & Coral', category: 'bold', colors: ['#0B3D57', '#2FA6C9', '#F2705C'] },
  { id: 'cream-forest', name: 'Cream & Forest', category: 'nature', colors: ['#1F3A2A', '#D8C9A3', '#3E6B4F'] },

  // Muted / professional
  { id: 'slate-steel', name: 'Slate & Steel', category: 'professional', colors: ['#23272E', '#6B7A8F', '#A3AEBB'] },
  { id: 'taupe-denim', name: 'Taupe & Denim', category: 'professional', colors: ['#2E2A26', '#7C93A8', '#B7A98F'] },
  { id: 'graphite-teal', name: 'Graphite & Teal', category: 'professional', colors: ['#202325', '#3FA9A2', '#8FB8B4'] },
  { id: 'stone-copper', name: 'Stone & Copper', category: 'professional', colors: ['#2B2A28', '#B5651D', '#9C9186'] },
  { id: 'ink-silver', name: 'Ink & Silver', category: 'professional', colors: ['#1B1E24', '#8B95A5', '#C7CDD6'] },

  // Bold / youthful
  { id: 'violet-lime', name: 'Electric Violet & Lime', category: 'bold', colors: ['#1A1533', '#8A5CF6', '#C6F135'] },
  { id: 'pink-cyan', name: 'Hot Pink & Cyan', category: 'bold', colors: ['#1E1024', '#FF3D8A', '#21D3EE'] },
  { id: 'coral-purple', name: 'Sunset Coral & Purple', category: 'bold', colors: ['#241236', '#FF6B6B', '#9D5CFF'] },
  { id: 'tangerine-grape', name: 'Tangerine & Grape', category: 'bold', colors: ['#241026', '#FF8A3D', '#8A3FFC'] },
  { id: 'mint-indigo', name: 'Neon Mint & Indigo', category: 'bold', colors: ['#14182B', '#35E0A1', '#5B6CFA'] },

  // Luxury / dark
  { id: 'onyx-champagne', name: 'Onyx & Champagne', category: 'luxury', colors: ['#16151A', '#D9C08B', '#8C8578'] },
  { id: 'midnight-rosegold', name: 'Midnight & Rose Gold', category: 'luxury', colors: ['#14161F', '#C98F79', '#7A6A63'] },
  { id: 'black-emerald', name: 'Black & Emerald', category: 'luxury', colors: ['#101211', '#1F6E5C', '#C9A85C'] },
  { id: 'espresso-bronze', name: 'Espresso & Bronze', category: 'luxury', colors: ['#201814', '#A9762F', '#6B5B4C'] },
  { id: 'plum-gold', name: 'Deep Plum & Gold', category: 'luxury', colors: ['#1E1220', '#C9A227', '#7A4A6B'] },

  // Soft / pastel
  { id: 'blush-sage', name: 'Blush & Sage', category: 'pastel', colors: ['#2B2A2E', '#E8B4B8', '#A7C4A0'] },
  { id: 'powder-peach', name: 'Powder Blue & Peach', category: 'pastel', colors: ['#232A33', '#A8CDE0', '#F2C6A0'] },
  { id: 'lilac-mint', name: 'Lilac & Mint', category: 'pastel', colors: ['#262232', '#C9B6E4', '#A8E0C8'] },
  { id: 'buttercream-dustyrose', name: 'Buttercream & Dusty Rose', category: 'pastel', colors: ['#2A2622', '#F0DDB0', '#D8A0A5'] },
  { id: 'sky-coral-pastel', name: 'Sky & Coral Pastel', category: 'pastel', colors: ['#202A34', '#A9D8E8', '#F0A8A0'] },

  // Nature
  { id: 'moss-clay', name: 'Moss & Clay', category: 'nature', colors: ['#22301F', '#8A9A5B', '#B5651D'] },
  { id: 'ocean-kelp', name: 'Ocean Kelp', category: 'nature', colors: ['#12332E', '#3E8E7E', '#D8C9A3'] },
  { id: 'autumn-woods', name: 'Autumn Woods', category: 'nature', colors: ['#2B1F17', '#B5651D', '#6B7A4A'] },
]

export const MOOD_FILTERS = [
  { id: 'professional', name: 'Professional' },
  { id: 'bold', name: 'Bold' },
  { id: 'luxury', name: 'Luxury' },
  { id: 'pastel', name: 'Pastel' },
  { id: 'nature', name: 'Nature' },
]

/**
 * "Select for me" fast path — which theme to auto-apply based on website
 * type. Template tier nudges toward a punchier vs. more muted pick within
 * that type's short list. Edit this mapping to change the defaults.
 */
const AUTO_THEME_BY_TYPE = {
  business: { base: 'navy-amber', premium: 'charcoal-gold' },
  portfolio: { base: 'ink-silver', premium: 'onyx-champagne' },
  ecommerce: { base: 'ocean-coral', premium: 'pink-cyan' },
  blog: { base: 'sage-terracotta', premium: 'moss-clay' },
  other: { base: 'slate-steel', premium: 'graphite-teal' },
}

export function autoThemeId(websiteType, baseTemplateId) {
  const pick = AUTO_THEME_BY_TYPE[websiteType] || AUTO_THEME_BY_TYPE.other
  return baseTemplateId === 'feature-rich' ? pick.premium : pick.base
}

/**
 * Resolves the active [ink, a, b] palette from order.colorTheme — either a
 * curated theme (paletteId set) or a generated one (hue + paletteType set).
 * Falls back to the default generated palette until the visitor picks either.
 */
export function resolveActivePalette(colorTheme) {
  if (colorTheme?.paletteId) {
    const theme = RECOMMENDED_THEMES.find((t) => t.id === colorTheme.paletteId)
    if (theme) return theme.colors
  }
  if (colorTheme?.hue != null) {
    return buildPalette(colorTheme.hue, colorTheme.paletteType || DEFAULT_PALETTE_TYPE)
  }
  return buildPalette(DEFAULT_HUE, DEFAULT_PALETTE_TYPE)
}
