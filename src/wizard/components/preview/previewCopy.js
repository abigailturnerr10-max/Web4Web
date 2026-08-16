/**
 * Real copy for the live preview's "genuine Web4Web demo" content — every
 * string here is what actually ships in the preview, not placeholder text.
 * Kept separate from PreviewContent.jsx so the components stay readable.
 */

export const HERO_COPY = {
  headline: 'Your website, your way — built by us, configured by you.',
  subheadline: 'Pick a template, style it live, and launch on your own domain — no code, no guesswork on price.',
  cta: 'Start building →',
}

export const WHAT_WE_DO = [
  { title: 'Done-for-you build', desc: 'You choose, we design and code every page.' },
  { title: 'Live configurator', desc: 'See your site and its price update as you pick.' },
  { title: 'Your own domain', desc: 'A real address you fully own, not a subdomain.' },
]

export const HOW_IT_WORKS = [
  { title: 'Choose your type & tier', desc: 'Store, Portfolio, or Business, at the scope you need.' },
  { title: 'Customize', desc: 'Pick effects, colors, and pages in a live preview.' },
  { title: 'Review your price', desc: 'Every add-on is itemized — nothing hidden at checkout.' },
  { title: 'We build & you launch', desc: 'We finish the site, you go live on your domain.' },
]

export const WHY_TIERS = {
  heading: 'Why three tiers?',
  body: "Plain, Standard, and Rich aren't about how flashy your site looks — they're about how much site you actually need. Plain covers a focused, few-page presence. Standard adds the structure most growing businesses need. Rich is built for sites with real depth — galleries, bookings, or a full catalog.",
}

export const SOCIAL_PROOF = [
  { quote: 'We picked Standard, watched the price update live, and had our site brief-ready in a day.', role: 'Boutique owner, Lagos' },
  { quote: 'The configurator made it obvious what we were paying for — no surprise invoice at the end.', role: 'Studio founder' },
  { quote: 'Rich tier gave us the product gallery we actually needed, not a generic template.', role: 'Online store owner' },
]

export const CONTACT_CTA = {
  heading: 'Ready to start?',
  body: 'Tell us what you need on WhatsApp or email — most projects start the same day.',
  primary: 'Chat on WhatsApp →',
  secondary: 'Email us',
}

export const FOOTER_COPY = {
  brand: 'Web4Web',
  tagline: 'Done-for-you websites, built for you — not assembled from a template.',
  quickLinks: ['Home', 'How it works', 'Contact'],
  legalLinks: ['Privacy', 'Terms'],
  newsletterPlaceholder: 'you@email.com',
}

/** "See it in action" mini-showcase copy, keyed by siteType. Rich tier only. */
export const SHOWCASE_BY_TYPE = {
  store: {
    heading: 'See it in action',
    body: 'A Store build includes a real product grid, ready for cart and checkout.',
    items: [
      { label: 'Product One', price: '₦12,000' },
      { label: 'Product Two', price: '₦18,500' },
      { label: 'Product Three', price: '₦9,000' },
    ],
  },
  portfolio: {
    heading: 'See it in action',
    body: 'A Portfolio build showcases your work in a real, browsable gallery.',
    items: [{ label: 'Project One' }, { label: 'Project Two' }, { label: 'Project Three' }, { label: 'Project Four' }],
  },
  business: {
    heading: 'See it in action',
    body: 'A Business build presents what you offer as a clear, motion-backed services grid.',
    items: [
      { label: 'Consulting', desc: 'One-on-one strategy sessions.' },
      { label: 'Support', desc: 'Ongoing help after launch.' },
      { label: 'Training', desc: 'Get your team up to speed.' },
    ],
  },
}

export const DEFAULT_SHOWCASE = SHOWCASE_BY_TYPE.business
