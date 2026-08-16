/**
 * Newsletter Signup Integration (see catalog.js's `newsletter` individual
 * effect) — the client's own email-provider API key so their site's signup
 * form actually adds subscribers to their list. A credential, not content,
 * so it follows the client_secrets vault pattern (see
 * content/steps/StepPaymentSetup.jsx), not a plain text field.
 */

export const NEWSLETTER_PROVIDERS = [
  { id: 'mailchimp', name: 'Mailchimp' },
  { id: 'convertkit', name: 'ConvertKit (Kit)' },
  { id: 'substack', name: 'Substack' },
  { id: 'other', name: 'Other' },
]

/**
 * Only the two most common get a dashboard walkthrough, per the brief.
 * Verified against each provider's current dashboard as of this writing
 * (ConvertKit rebranded to "Kit" and moved to a v4 key system since) —
 * dashboard layouts do shift over time, so prefer more current info if this
 * drifts.
 */
export const NEWSLETTER_KEY_GUIDES = {
  mailchimp: {
    title: 'Where to find your Mailchimp API key',
    steps: [
      'Log in to your Mailchimp account.',
      'Click your profile icon (bottom left) and choose Profile.',
      'Click the Extras drop-down and choose API keys — direct link: admin.mailchimp.com/account/api.',
      'Under "Your API keys," click Create A Key and give it a name you\'ll recognize.',
      'Copy the key immediately — Mailchimp only shows the full value once, right after you generate it.',
    ],
  },
  convertkit: {
    title: 'Where to find your ConvertKit (Kit) API key',
    steps: [
      'Log in to your Kit account (ConvertKit\'s current name).',
      'Click your name in the top-right corner, then choose Settings → Developer.',
      'Under "V4 Keys," click Add a new key and give it a name you\'ll recognize.',
      'Click Create API Key, then copy it immediately — Kit only shows the full value once, right after you generate it.',
    ],
  },
}

export const NEWSLETTER_KEY_REASSURANCE =
  "This key lets your site's signup form add subscribers directly to your list — which also means anyone holding it could add, remove, or export your subscribers. Because of that, never send it over chat, WhatsApp, or email, including to us. This field works differently: the moment you submit it, it's encrypted. Our system only decrypts it briefly and automatically, when your site's signup form actually needs it — it's never written back out or shown in plain text again afterward, on any screen, including the ones our own team uses."
