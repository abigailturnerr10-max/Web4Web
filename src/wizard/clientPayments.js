/**
 * How the CLIENT's own site will accept payments from their customers —
 * distinct from Web4Web's own checkout (see PaymentPanel.jsx / the
 * onlinePayments add-on). Selectable methods match
 * config/catalog.js#PAYMENT_ACCEPTANCE_METHODS; setup guides are keyed per
 * underlying processor since Flutterwave + Paystack ship as one combined
 * option but each still needs its own walkthrough.
 */

export const GUIDES_FOR_METHOD = {
  'flutterwave-paystack': ['flutterwave', 'paystack'],
  stripe: ['stripe'],
  'manual-transfer': [],
}

// `slides` deliberately left empty on every entry below — real screenshots/
// recordings aren't ready yet, and SetupGuide.jsx only renders the media
// carousel when a guide actually has slides, so this correctly shows as
// text-only for now. Drop real { kind, caption, src } entries in here once
// the assets exist; no component changes needed to light it back up.
export const SETUP_GUIDES = {
  flutterwave: {
    title: 'How to set up Flutterwave',
    steps: [
      'Sign up at flutterwave.com and verify your business details.',
      "Complete KYC (bank account, ID) so you're cleared to receive live payments.",
      'Find your test (sandbox) API keys under Settings → API in your dashboard.',
      'Once verified, switch to live mode and copy your production API keys.',
    ],
    slides: [],
  },
  paystack: {
    title: 'How to set up Paystack',
    steps: [
      'Sign up at paystack.com and verify your business.',
      'Add your settlement bank account under Settings → Preferences.',
      'Find your test secret/public keys under Settings → API Keys & Webhooks.',
      'Request activation to go live, then copy your production keys.',
    ],
    slides: [],
  },
  stripe: {
    title: 'How to set up Stripe',
    steps: [
      'Create your account at stripe.com and verify your business details.',
      'Activate payments and add your bank account for payouts.',
      'Find your publishable and secret test keys under Developers → API keys.',
      'Once activated, switch to live mode for production keys.',
    ],
    slides: [],
  },
}

export const SETUP_SUPPORT_NOTE =
  "Stuck at any step? We'll help you retrieve these details — you're not left to figure this out alone."

/**
 * Narrower than SETUP_GUIDES above — for someone who already has a gateway
 * account and just needs to go find the specific publishable/secret key to
 * paste into the content-collection form's Payment Setup step, not the
 * full "create an account" onboarding walkthrough. Verified against each
 * provider's current dashboard as of this writing; dashboard layouts do
 * shift over time, so prefer more current info if this drifts.
 */
export const KEY_RETRIEVAL_GUIDES = {
  stripe: {
    title: 'Where to find your Stripe keys',
    steps: [
      'Log in to your Stripe account.',
      'Go to the Developers section (left sidebar on desktop; may appear as a smaller icon on mobile) — direct link: dashboard.stripe.com/apikeys.',
      'Click API keys.',
      'Your Publishable key is shown directly — copy it into the field above.',
      'For the Secret key: in test mode, click "Reveal test key." In live mode, click "Create secret key" — Stripe only shows a live secret key once, at creation, so copy it immediately rather than navigating away first.',
    ],
  },
  flutterwave: {
    title: 'Where to find your Flutterwave keys',
    steps: [
      'Log in to your Flutterwave dashboard.',
      'Go to Settings → API Keys, under the Developers tab — direct link: app.flutterwave.com/dashboard/settings/apis/live.',
      'Use the mode toggle in the sidebar to switch between Test and Live — the keys shown change with it.',
      'Your Public Key is shown directly — copy it into the field above.',
      'Your Secret Key needs to be generated the first time — click "Generate Secret Key" and copy it immediately once it appears.',
    ],
  },
  paystack: {
    title: 'Where to find your Paystack keys',
    steps: [
      'Log in to your Paystack dashboard.',
      'Go to Settings → API Keys & Webhooks.',
      'Scroll to "API Configuration — Test Mode" or "— Live Mode," depending on which keys you need.',
      'Your Public Key is shown directly — copy it into the field above.',
      "Click the eye icon next to the Secret Key and re-enter your account password to reveal it, then copy it immediately.",
    ],
  },
}

/**
 * Shown specifically next to the secret-key field, not the guides above —
 * the reassurance is about what happens to the value after submission, not
 * about how to find it.
 */
export const SECRET_KEY_REASSURANCE =
  "A secret key isn't like an ordinary password you can safely reuse or forward — whoever holds it can act on your payment account as if they were you. Because of that, never send it over chat, WhatsApp, or email, including to us. This field works differently: the moment you submit it, it's encrypted. Our system only decrypts it briefly and automatically, at the point your site's checkout actually needs it — it's never written back out or displayed in plain text again afterward, on any screen, including the ones our own team uses."
