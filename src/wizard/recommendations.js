/**
 * Curation config for large option lists in the Configurator. Site-type hero
 * recommendations live in catalog.js (HERO_RECOMMENDATIONS) since they're
 * keyed to the same siteType ids as the rest of the order — this file only
 * holds which options to surface before "see all" on each big list.
 */

/** Shown before the "see all options" expand for each large option group. */
export const POPULAR_HERO_IDS = ['static', 'video', 'split-screen', 'parallax']
export const POPULAR_BEAUTIFICATION_IDS = ['favicon', 'custom-404', 'dark-mode', 'custom-cursor', 'micro-interactions']
export const POPULAR_PREMIUM_IDS = ['scroll-reveal', 'glassmorphism', 'animated-counters', 'magnetic-buttons', 'parallax-sections']
