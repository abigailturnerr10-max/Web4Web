/**
 * Visual Identity config — the three-path color system (Let Web4Web
 * choose / Choose a style / I already have my brand colors). The "Choose a
 * style" path is two steps: mood, then 2-3 curated named palettes within
 * that mood. Palette color arrays are [ink, accentA, accentB] — ink stays
 * dark so nav/footer contrast holds regardless of the named pair.
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

export const MOODS = [
  { id: 'professional', name: 'Professional', tagline: 'Clean • Trustworthy • Modern' },
  { id: 'bold', name: 'Bold', tagline: 'Energetic • Strong • Attention-grabbing' },
  { id: 'luxury', name: 'Luxury', tagline: 'Elegant • Premium • Sophisticated' },
  { id: 'pastel', name: 'Pastel', tagline: 'Soft • Friendly • Playful' },
  { id: 'nature', name: 'Nature', tagline: 'Organic • Calm • Natural' },
]

/** 2-3 curated, named palettes per mood — shown as step 2 after a mood is picked. */
export const CURATED_PALETTES = [
  { id: 'ledger', moodId: 'professional', name: 'Ledger', colors: ['#16213E', '#F2A93B', '#E1592C'] },
  { id: 'slate', moodId: 'professional', name: 'Slate', colors: ['#23272E', '#6B7A8F', '#A3AEBB'] },
  { id: 'denim', moodId: 'professional', name: 'Denim', colors: ['#2E2A26', '#7C93A8', '#B7A98F'] },

  { id: 'volt', moodId: 'bold', name: 'Volt', colors: ['#1A1533', '#8A5CF6', '#C6F135'] },
  { id: 'neon', moodId: 'bold', name: 'Neon', colors: ['#1E1024', '#FF3D8A', '#21D3EE'] },
  { id: 'ember', moodId: 'bold', name: 'Ember', colors: ['#241236', '#FF6B6B', '#9D5CFF'] },

  { id: 'obsidian', moodId: 'luxury', name: 'Obsidian', colors: ['#141414', '#C9A227', '#F2ECD9'] },
  { id: 'pearl', moodId: 'luxury', name: 'Pearl', colors: ['#2B2B2B', '#D9C9A3', '#FFFFFF'] },
  { id: 'midnight', moodId: 'luxury', name: 'Midnight', colors: ['#141B2E', '#B9C2D0', '#FFFFFF'] },

  { id: 'blush', moodId: 'pastel', name: 'Blush', colors: ['#2B2A2E', '#E8B4B8', '#A7C4A0'] },
  { id: 'powder', moodId: 'pastel', name: 'Powder', colors: ['#232A33', '#A8CDE0', '#F2C6A0'] },
  { id: 'lilac', moodId: 'pastel', name: 'Lilac', colors: ['#262232', '#C9B6E4', '#A8E0C8'] },

  { id: 'sage', moodId: 'nature', name: 'Sage', colors: ['#2B3A2E', '#8FA681', '#C1622D'] },
  { id: 'moss', moodId: 'nature', name: 'Moss', colors: ['#22301F', '#8A9A5B', '#B5651D'] },
  { id: 'kelp', moodId: 'nature', name: 'Kelp', colors: ['#12332E', '#3E8E7E', '#D8C9A3'] },
]

export function palettesForMood(moodId) {
  return CURATED_PALETTES.filter((p) => p.moodId === moodId)
}

export function findPalette(paletteId) {
  return CURATED_PALETTES.find((p) => p.id === paletteId)
}

/** "Let Web4Web choose" fast path if the flag is ever resolved automatically — kept for reference; not auto-applied per spec. */
const AUTO_PALETTE_BY_TYPE = {
  store: { plain: 'ledger', standard: 'ledger', rich: 'neon' },
  portfolio: { plain: 'slate', standard: 'obsidian', rich: 'obsidian' },
  business: { plain: 'ledger', standard: 'ledger', rich: 'midnight' },
}

export function autoPaletteId(siteType, tier) {
  const byType = AUTO_PALETTE_BY_TYPE[siteType] || AUTO_PALETTE_BY_TYPE.business
  return byType[tier] || byType.standard
}

/** Resolves the active [ink, a, b] palette from order.colorTheme. */
export function resolveActivePalette(colorTheme) {
  if (!colorTheme) return buildPalette(DEFAULT_HUE, DEFAULT_PALETTE_TYPE)
  if (colorTheme.mode === 'client-brand' && colorTheme.primary) {
    return [colorTheme.primary, colorTheme.secondary || colorTheme.primary, colorTheme.accent || colorTheme.primary]
  }
  if (colorTheme.mode === 'style') {
    if (colorTheme.paletteId) {
      const palette = findPalette(colorTheme.paletteId)
      if (palette) return palette.colors
    }
    if (colorTheme.hue != null) return buildPalette(colorTheme.hue, colorTheme.paletteType || DEFAULT_PALETTE_TYPE)
  }
  return buildPalette(DEFAULT_HUE, DEFAULT_PALETTE_TYPE)
}
