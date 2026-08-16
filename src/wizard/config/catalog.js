/**
 * Single source of truth for every name, price, and recommendation mapping
 * in the app. Nothing about pricing or catalog content is hardcoded in a
 * component — edit here, everything downstream (homepage, configurator,
 * review, receipts) updates automatically.
 */

export const SITE_TYPES = [
  { id: 'store', label: 'Store', description: 'Sell products online with cart and checkout.' },
  { id: 'portfolio', label: 'Portfolio', description: 'Showcase your work — for creatives, freelancers, consultants.' },
  { id: 'business', label: 'Business', description: 'Company or service site built to build trust and convert.' },
]

export const TEMPLATES = {
  plain: { tier: 'plain', name: 'Plain', price: 70000, includedPages: 3, effectPackCredit: 0, pageNote: 'Home, About, Contact' },
  standard: { tier: 'standard', name: 'Standard', price: 100000, includedPages: 6, effectPackCredit: 0, pageNote: 'Adds Services, Gallery, Blog/News' },
  rich: { tier: 'rich', name: 'Rich', price: 150000, includedPages: 10, effectPackCredit: 25000, pageNote: 'Full animated experience — includes a ₦25,000 Effect Pack credit' },
}
export const TEMPLATE_LIST = Object.values(TEMPLATES)

export const ONLINE_PAYMENTS_ADDON = { id: 'online-payments', name: 'Online payment checkout', price: 20000 }

export const SOCIAL_PREVIEW_ADDON = {
  id: 'social-preview',
  name: 'Social Share Card (Open Graph)',
  description: 'A custom image and metadata so your site looks polished when shared on WhatsApp, X, or Facebook.',
  price: 8000,
}

export const DOMAIN_TIERS = [
  { id: 'popular', label: 'Popular', price: 20000, tlds: ['.com', '.com.ng', '.ng', '.net', '.org', '.io'] },
  { id: 'budget', label: 'Budget-friendly', price: 10000, tlds: ['.store', '.site', '.africa'] },
]
export const TLD_PRICING = DOMAIN_TIERS.flatMap((tier) =>
  tier.tlds.map((tld) => ({ tld, price: tier.price, tierId: tier.id, tierLabel: tier.label }))
)

export const HERO_STYLES = [
  { id: 'static', name: 'Static Hero', description: 'A clean still image or headline hero.', price: 0 },
  { id: 'video', name: 'Video Hero', description: 'Looping background motion instead of a still image.', price: 10000 },
  { id: 'line-draw', name: 'Animated Line-Draw', description: 'SVG line-draw illustration animates in on load.', price: 15000 },
  { id: 'parallax', name: 'Parallax Hero', description: 'Multi-layer parallax depth as the visitor scrolls.', price: 12000 },
  { id: 'split-screen', name: 'Split-Screen Hero', description: 'Copy on one side, visual on the other.', price: 11000 },
  { id: 'full-bleed', name: 'Full-Bleed Background', description: 'Edge-to-edge photo or video behind your headline.', price: 13000 },
  { id: 'typing-headline', name: 'Animated Typing Headline', description: 'Headline types itself out, cycling through phrases.', price: 9000 },
  { id: 'illustrated', name: 'Illustrated Hero', description: 'A character or custom illustration anchors the hero.', price: 18000 },
  { id: 'floating-shapes', name: 'Minimal + Floating Shapes', description: 'Centered headline with soft shapes drifting behind it.', price: 8000 },
]

export const HERO_RECOMMENDATIONS = {
  store: { heroId: 'video', reason: 'A short product loop builds instant trust and shows what you sell in motion.' },
  portfolio: { heroId: 'full-bleed', reason: 'Full-bleed imagery puts your work front and center from the first scroll.' },
  business: { heroId: 'split-screen', reason: 'Balances your message with a strong visual — professional, and easy to scan on mobile.' },
}
export const DEFAULT_HERO_RECOMMENDATION = HERO_RECOMMENDATIONS.business

/**
 * Level 1 — automatic, tier-based inclusions. Shown as "what's included,"
 * never a selection. Purely informational; not individually priced.
 */
export const TIER_INCLUSIONS = {
  plain: ['Responsive layout', 'Footer', 'Contact block', 'Basic SEO tags'],
  standard: ['Everything in Plain', 'Social media links', 'Scroll-aware navbar', 'Animated mobile menu', 'Smoother page transitions'],
  rich: ['Everything in Standard', 'Advanced motion throughout', 'Rich page transitions', '₦25,000 Effect Pack credit'],
}

/** Tier ids (in order) on which each essential-preview id renders — used by InteractivePreview. */
export const ESSENTIAL_PREVIEW_TIERS = {
  footer: ['plain', 'standard', 'rich'],
  'contact-block': ['plain', 'standard', 'rich'],
  'seo-tags': ['plain', 'standard', 'rich'],
  'social-media': ['standard', 'rich'],
}

/**
 * Level 2 — Effect Packs. Outcome-framed bundles, not a flat effect
 * checklist. effectIds reference INDIVIDUAL_EFFECTS entries used to render
 * a genuine live-preview difference per pack.
 */
export const EFFECT_PACKS = [
  {
    id: 'signature',
    name: 'Signature',
    price: 25000,
    description: 'Cinematic section reveals, a cinematic entrance, and a smooth handoff between sections.',
    effectIds: ['scroll-reveal', 'blur-to-sharp-entrance', 'section-handoff-transition'],
  },
  {
    id: 'luxury',
    name: 'Luxury',
    price: 35000,
    description: 'Glass-panel depth, light sweeps, floating accents, and premium hover interactions.',
    effectIds: ['glassmorphism', 'light-sweep', 'floating-accent-cards', 'hover-depth'],
  },
  {
    id: 'interactive',
    name: 'Interactive',
    price: 50000,
    description: 'Cursor-driven interactions, image hover distortion, and layered scroll storytelling.',
    effectIds: ['cursor-spotlight', 'image-hover-distortion', 'parallax-sections', 'pinned-sections'],
  },
]

/** Which Effect Pack to recommend for a given siteType + template tier, and why. Edit here only. */
export const RECOMMENDED_PACK_MAP = {
  store: { plain: 'signature', standard: 'signature', rich: 'interactive' },
  portfolio: { plain: 'signature', standard: 'luxury', rich: 'interactive' },
  business: { plain: 'signature', standard: 'signature', rich: 'luxury' },
}

const RECOMMENDED_PACK_LABELS = {
  'store:rich': 'Storefront Experience',
  'portfolio:rich': 'Creative Showcase',
  'business:standard': 'Professional',
}

export function recommendedPackId(siteType, tier) {
  const byType = RECOMMENDED_PACK_MAP[siteType] || RECOMMENDED_PACK_MAP.business
  return byType[tier] || byType.standard
}

export function recommendedPackLabel(siteType, tier) {
  return RECOMMENDED_PACK_LABELS[`${siteType}:${tier}`] || 'Recommended Package'
}

/**
 * Level 3 — individual effects for visitors who'd rather hand-pick than
 * take a pack. Outcome-first naming throughout. buildEffort: 'high' flags
 * items that are more build-intensive (3D/WebGL, crack-open, Shatter Split).
 */
export const BEAUTIFICATION_EFFECTS = [
  { id: 'favicon', name: 'Custom Favicon Design', category: 'beautification', description: 'A designed icon for browser tabs and bookmarks.', price: 5000 },
  { id: 'animated-logo', name: 'Animated Logo Intro', category: 'beautification', description: 'Your logo animates in briefly on first load.', price: 12000 },
  { id: 'custom-404', name: 'Custom 404 Page', category: 'beautification', description: 'An on-brand page for broken or missing links.', price: 6000 },
  { id: 'newsletter', name: 'Newsletter Signup Integration', category: 'beautification', description: 'Email capture wired to a provider of your choice.', price: 10000 },
  { id: 'cookie-banner', name: 'Cookie-Consent Banner Styling', category: 'beautification', description: 'A consent banner that matches your site, not the default.', price: 4000 },
  { id: 'custom-scrollbar', name: 'Custom Scrollbar Styling', category: 'beautification', description: 'A scrollbar styled to match your theme.', price: 3000 },
  { id: 'dark-mode', name: 'Dark Mode Toggle', category: 'beautification', description: 'Visitors can switch between light and dark.', price: 15000 },
  { id: 'multi-language', name: 'Multi-Language Toggle (UI)', category: 'beautification', description: 'A language switcher in the UI (translations not included).', price: 14000 },
  { id: 'social-banner-kit', name: 'Social Media Banner Kit', category: 'beautification', description: 'Matching cover/banner graphics for your social profiles.', price: 12000 },
  { id: 'custom-cursor', name: 'Branded Cursor', category: 'beautification', description: 'A branded cursor icon replaces the default arrow, with hover-state changes.', price: 6000 },
  { id: 'cursor-spotlight', name: 'Cursor Spotlight', category: 'beautification', description: 'A soft glow follows the cursor, lighting up whatever it passes over.', price: 6000 },
  { id: 'gradient-backgrounds', name: 'Gradient & Mesh Backgrounds', category: 'beautification', description: 'Smooth color-gradient or mesh backgrounds behind key sections instead of flat color.', price: 4000 },
  { id: 'card-hover-lift', name: 'Card Hover Lift', category: 'beautification', description: 'Cards lift and gain a soft shadow on hover — subtle, not 3D.', price: 4000 },
  { id: 'text-scramble', name: 'Text Scramble Reveal', category: 'beautification', description: 'Headlines scramble through random characters before settling on the real text.', price: 5000 },
  { id: 'marquee', name: 'Scrolling Logo/Trust Strip', category: 'beautification', description: 'Infinite scrolling strip of logos, text, or trust badges.', price: 5000 },
  { id: 'button-pop', name: 'Tactile Button Feedback', category: 'beautification', description: 'Buttons squash and pop slightly on click, paired with a soft sound, for tactile feedback.', price: 5000 },
  { id: 'micro-interactions', name: 'Micro-interactions', category: 'beautification', description: 'Buttons, hovers and taps get small animated feedback throughout the site.', price: 5000 },
  { id: 'loading-intro', name: 'Branded Loading Screen', category: 'beautification', description: 'A short branded loader plays before the site reveals itself.', price: 7000 },
  { id: 'scroll-progress', name: 'Scroll Progress Indicator', category: 'beautification', description: 'A thin bar tracks how far down the page a visitor has scrolled.', price: 3000 },
  { id: 'success-chime', name: 'Success Chime', category: 'beautification', description: 'A short, satisfying sound plays on your visitors’ actions like add-to-cart or form submission.', price: 4000 },
  { id: 'floating-blobs', name: 'Ambient Floating Shapes', category: 'beautification', description: 'Soft, slow-drifting blob shapes add depth behind your content.', price: 4000 },
  { id: 'glowing-orbs', name: 'Glowing Ambient Orbs', category: 'beautification', description: 'Ambient glowing light orbs drift softly in the background.', price: 4000 },
  { id: 'grain-texture-overlay', name: 'Grain Texture Overlay', category: 'beautification', description: 'A subtle film-grain texture over the page for a tactile, less flat feel.', price: 3000 },
  { id: 'liquid-fill-button', name: 'Liquid Fill Button', category: 'beautification', description: 'Buttons fill with color like liquid rising, on hover.', price: 4000 },
  { id: 'mask-reveal', name: 'Mask Reveal', category: 'beautification', description: 'Images or headings reveal through an animated shape mask as they enter.', price: 6000 },
  { id: 'blur-to-sharp-entrance', name: 'Blur-to-Sharp Entrance', category: 'beautification', description: 'Content starts softly blurred and sharpens into focus as it appears — a cinematic entrance.', price: 4000 },
  { id: 'scale-settle', name: 'Scale Settle', category: 'beautification', description: 'Elements scale in slightly oversized and settle down to their true size.', price: 3000 },
]

export const PREMIUM_EFFECTS = [
  { id: 'glassmorphism', name: 'Glass-Panel Depth', category: 'premium', description: 'Frosted-glass translucent cards and nav, for a premium layered look.', price: 8000 },
  { id: 'scroll-reveal', name: 'Cinematic Section Reveals', category: 'premium', description: 'Sections fade and slide in as you scroll, for a polished, considered feel.', price: 7000 },
  { id: 'parallax-sections', name: 'Depth & Motion', category: 'premium', description: 'Give your website a premium layered scrolling experience.', price: 9000 },
  { id: 'hanging-sign-reveal', name: 'Hanging-Sign Reveal', category: 'premium', description: 'A hand-built sign-board drop, on your announcement or hero section.', price: 10000 },
  { id: 'pinned-sections', name: 'Scroll Storytelling', category: 'premium', description: 'A section locks in place while its content changes as you scroll past it.', price: 12000 },
  { id: 'horizontal-gallery', name: 'Horizontal Scroll Gallery', category: 'premium', description: 'Swipe or scroll sideways through a gallery of cards.', price: 9000 },
  { id: 'magnetic-buttons', name: 'Magnetic Buttons', category: 'premium', description: 'Buttons pull gently toward the cursor as it gets close.', price: 6000 },
  { id: 'animated-counters', name: 'Count-Up Numbers', category: 'premium', description: 'Stats count up from zero when they scroll into view.', price: 5000 },
  { id: 'card-tilt', name: 'Card Tilt on Hover', category: 'premium', description: '3D perspective tilt following the cursor over cards.', price: 6000 },
  { id: 'page-transitions', name: 'Smooth Page Transitions', category: 'premium', description: 'Smooth animated transitions between pages instead of an instant jump.', price: 8000 },
  { id: 'staggered-reveal', name: 'Staggered Grid Reveal', category: 'premium', description: 'Grid or list items animate in one after another instead of all at once.', price: 5000 },
  { id: 'blueprint-line-draw', name: 'Blueprint Line Draw', category: 'premium', description: 'Section dividers draw themselves in like a technical sketch as you scroll.', price: 6000 },
  { id: 'curtain-reveal', name: 'Curtain Reveal', category: 'premium', description: 'A panel wipes away on load to reveal the page underneath — a cinematic entrance.', price: 7000 },
  { id: 'gooey-menu-hover', name: 'Gooey Menu Hover', category: 'premium', description: 'A liquid highlight glides between nav links as you hover.', price: 6000 },
  { id: 'before-after-slider', name: 'Before/After Slider', category: 'premium', description: 'A drag handle reveals a before-and-after comparison image.', price: 9000 },
  { id: 'masonry-cascade', name: 'Masonry Cascade', category: 'premium', description: 'A Pinterest-style grid of varying heights, cascading in on load.', price: 8000 },
  { id: 'image-tilt-hover', name: 'Image Tilt on Hover', category: 'premium', description: 'A large showcase image tilts gently toward the cursor.', price: 5000 },
  { id: 'confetti-cannon', name: 'Confetti Cannon', category: 'premium', description: 'A burst of confetti fires across the screen when a visitor completes an action like checkout or signup.', price: 6000 },
  { id: 'cursor-trail', name: 'Cursor Trail', category: 'premium', description: 'A soft trail of particles or shapes follows the cursor as it moves.', price: 7000 },
  { id: 'hover-depth', name: 'Premium Hover Interactions', category: 'premium', description: 'Cards and images lift with a layered shadow that responds to cursor position.', price: 6000 },
  { id: 'image-hover-distortion', name: 'Image Hover Distortion', category: 'premium', description: 'Images ripple or warp subtly as the cursor moves across them.', price: 9000 },
  { id: 'floating-hero-image', name: 'Floating Hero Image', category: 'premium', description: 'The hero image gently bobs up and down, like it’s floating.', price: 5000 },
  { id: 'image-assemble', name: 'Image Assemble', category: 'premium', description: 'Images fly in from fragments and assemble into place as they enter the screen.', price: 9000 },
  { id: 'floating-accent-cards', name: 'Floating Accents', category: 'premium', description: 'Small decorative cards drift gently around the hero or key sections.', price: 6000 },
  { id: 'light-sweep', name: 'Light Sweep', category: 'premium', description: 'A soft beam of light sweeps across buttons or cards on hover.', price: 5000 },
  { id: 'card-stack-scroll', name: 'Card Stack Scroll', category: 'premium', description: 'Cards stack on top of each other as the visitor scrolls through that section.', price: 10000 },
  { id: 'section-handoff-transition', name: 'Smooth Section Handoff', category: 'premium', description: 'One section smoothly transforms into the next instead of cutting abruptly.', price: 9000 },
]

export const SIGNATURE_EFFECTS = [
  {
    id: 'shatter-split',
    name: 'Shatter Split Transition',
    category: 'signature',
    description: 'The screen cracks apart like glass on your primary CTA, revealing the next page. Falls back to a simple fade on low-end devices or reduced-motion.',
    price: 28000,
    buildEffort: 'high',
  },
  {
    id: 'crack-open-reveal',
    name: 'Crack-Open Reveal',
    category: 'signature',
    description: 'The homepage opens with a crack-open sequence — the screen splits apart like an eggshell to unveil your site on load.',
    price: 22000,
    buildEffort: 'high',
  },
  {
    id: 'ai-video-hero',
    name: 'AI Video Hero',
    category: 'signature',
    description: 'Your hero image becomes a short AI-generated motion clip instead of a static photo.',
    price: 35000,
  },
  {
    id: '3d-interactive-object',
    name: 'Interactive 3D Object',
    category: 'signature',
    description: 'A real 3D object visitors can rotate and inspect with their cursor. Best suited to product or portfolio sites.',
    price: 45000,
    buildEffort: 'high',
  },
  {
    id: '3d-product-showcase',
    name: '3D Product Showcase',
    category: 'signature',
    description: 'Your product rendered in 3D with lighting and rotation, for a premium showroom feel.',
    price: 50000,
    buildEffort: 'high',
  },
  {
    id: '3d-mouse-scene',
    name: 'Mouse-Controlled 3D Scene',
    category: 'signature',
    description: 'A full 3D background scene that responds to cursor movement across the page.',
    price: 55000,
    buildEffort: 'high',
  },
]

export const INDIVIDUAL_EFFECTS = [...BEAUTIFICATION_EFFECTS, ...PREMIUM_EFFECTS, ...SIGNATURE_EFFECTS]

export const EFFECT_CATEGORIES = [
  { id: 'beautification', name: 'Beautification' },
  { id: 'premium', name: 'Premium' },
  { id: 'signature', name: 'Signature (advanced)' },
]

export function findEffect(id) {
  return INDIVIDUAL_EFFECTS.find((e) => e.id === id)
}

export const EXTRA_PAGE_PRICE = 15000

export const DELIVERY_OPTIONS = {
  standard: { id: 'standard', label: 'Standard', days: '4–5 working days', price: 0 },
  rush: { id: 'rush', label: 'Rush', days: '1–3 working days', price: 20000 },
}

/**
 * Client's own payment-acceptance setup (Information page) — this is
 * informational/free, distinct from ONLINE_PAYMENTS_ADDON above (which is
 * the paid checkout-build add-on toggled on the homepage).
 */
export const PAYMENT_ACCEPTANCE_METHODS = [
  { id: 'flutterwave-paystack', name: 'Flutterwave + Paystack', recommended: 'Nigeria', description: 'Recommended for Nigerian businesses — cards, bank transfer, USSD.' },
  { id: 'stripe', name: 'Stripe', recommended: 'International', description: 'Recommended for international / card-first businesses.' },
  { id: 'manual-transfer', name: 'Manual bank transfer', recommended: null, description: 'Customers upload a proof-of-payment screenshot that notifies you directly.' },
]

export const NGN_PER_USD = 1600

export function ngnToUsd(ngn) {
  return ngn / NGN_PER_USD
}

export function formatPrice(ngnAmount, currency = 'NGN') {
  if (currency === 'USD') {
    return `$${ngnToUsd(ngnAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `₦${ngnAmount.toLocaleString('en-NG')}`
}
