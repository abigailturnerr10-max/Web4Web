/**
 * Real copy for the live preview's "genuine Web4Web demo" content — every
 * string here is what actually ships in the preview, not placeholder text.
 * Kept separate from PreviewContent.jsx so the components stay readable.
 */

// Generic fallback — shown before a visitor has picked a site type at all
// (Home's Step 1 unanswered, or the "About" tab). Once a type is picked,
// *_BY_TYPE below takes over so the demo reads as that kind of site rather
// than always describing Web4Web itself.
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

/**
 * Once a siteType is picked, the demo should feel like that *kind* of site —
 * a Store, a Portfolio, a Business — not a fixed description of Web4Web
 * itself. Deliberately generic/genre-level (demo product names, demo
 * project titles, demo service names) rather than modeled on any specific
 * real brand's actual copy or layout.
 */
export const HERO_COPY_BY_TYPE = {
  store: {
    headline: 'Everything you need, in one place.',
    subheadline: 'Browse the full collection — new arrivals added weekly, shipped fast.',
    cta: 'Shop Now →',
  },
  portfolio: {
    headline: 'Selected work, 2021–2026.',
    subheadline: 'A collection of projects across branding, product, and digital design.',
    cta: 'View My Work →',
  },
  business: {
    headline: 'Solutions built around your goals.',
    subheadline: "We partner with teams to plan, deliver, and support work that lasts.",
    cta: 'Book a Consultation →',
  },
}

export const WHAT_WE_DO_BY_TYPE = {
  store: [
    { title: 'Handwoven Tote', desc: '₦14,500 — natural fiber, lined interior.' },
    { title: 'Ceramic Mug Set', desc: '₦9,000 — set of two, matte glaze.' },
    { title: 'Desk Lamp', desc: '₦22,000 — warm LED, adjustable arm.' },
  ],
  portfolio: [
    { title: 'Riverside Rebrand', desc: 'Identity system for a hospitality group.' },
    { title: 'Alma App', desc: 'Product design for a wellness startup.' },
    { title: 'Northfield Studio', desc: 'Photography for an architecture practice.' },
  ],
  business: [
    { title: 'Strategy Consulting', desc: 'One-on-one sessions to plan your next move.' },
    { title: 'Ongoing Support', desc: 'A dedicated line for questions after delivery.' },
    { title: 'Team Training', desc: 'Get your whole team up to speed, fast.' },
  ],
}

/** "Browse → Cart → Checkout" etc. — reframes the generic 4-step
 * "how it works" around how a VISITOR moves through that kind of site, not
 * around Web4Web's own build process (that context doesn't apply once the
 * demo is standing in as somebody's Store/Portfolio/Business). */
export const HOW_IT_WORKS_BY_TYPE = {
  store: [
    { title: 'Browse', desc: 'Explore the full catalog by category or search.' },
    { title: 'Add to Cart', desc: 'Pick sizes, colors, or quantities as you go.' },
    { title: 'Checkout', desc: 'Secure payment, with delivery or pickup options.' },
    { title: 'Track & Enjoy', desc: 'Order updates land straight in your inbox.' },
  ],
  portfolio: [
    { title: 'Browse the Work', desc: 'Filter by category to see relevant projects.' },
    { title: 'Read the Story', desc: 'Every project includes process and outcome.' },
    { title: 'Get in Touch', desc: 'Send a brief through the contact form.' },
    { title: "We'll Reply", desc: 'Usually within a business day, with next steps.' },
  ],
  business: [
    { title: 'Consultation', desc: 'A short call to understand what you need.' },
    { title: 'Proposal', desc: 'A clear scope and price, no surprises later.' },
    { title: 'Delivery', desc: 'Work happens on an agreed, visible timeline.' },
    { title: 'Ongoing Support', desc: "We're still reachable after the work ships." },
  ],
}

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
