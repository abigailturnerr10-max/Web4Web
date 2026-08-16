/**
 * The one unified EmailJS template (VITE_EMAILJS_CLIENT_TEMPLATE_ID) that
 * covers both the order-confirmation email and every project-status-update
 * email — kept to a single client-facing template deliberately, to stay
 * within EmailJS's 2-template free-tier limit alongside the admin
 * notification template (VITE_EMAILJS_TEMPLATE_ID).
 *
 * Sent from two places: Confirmation.jsx (order_confirmed, right after
 * payment) and AdminOrderDetail.jsx (the other four phases, fired when the
 * admin advances orders.project_status). Both call sendStatusEmail() here so
 * the template wiring, phase copy, and status-tracker text live in one
 * place rather than drifting between two files.
 */
import emailjs from '@emailjs/browser'

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const EMAILJS_CLIENT_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_CLIENT_TEMPLATE_ID
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const BUSINESS_WHATSAPP = import.meta.env.VITE_BUSINESS_WHATSAPP_NUMBER
const BUSINESS_EMAIL = import.meta.env.VITE_BUSINESS_EMAIL || 'orders@web4web.example'

/**
 * The same 4 steps + 🟢/🟡/⚪ logic ProjectStatusView.jsx shows the client on
 * their status page — reused here, not reimplemented, so the tracker in the
 * email always matches the one on that page. `currentStatusId` is the raw
 * orders.project_status value: null/undefined before content is ever
 * submitted (nothing has started), otherwise one of the ids below.
 */
export const PROJECT_STATUS_STEPS = [
  { id: 'content_submitted', label: 'Content submitted' },
  { id: 'in_production', label: 'In production' },
  { id: 'review', label: 'Review' },
  { id: 'launched', label: 'Launch' },
]

export function statusStepIcon(currentStatusId, stepIndex) {
  const currentIndex = PROJECT_STATUS_STEPS.findIndex((s) => s.id === currentStatusId)
  if (stepIndex < currentIndex) return '🟢'
  if (stepIndex === currentIndex) return '🟡'
  return '⚪'
}

/** Plain "\n"-joined text, not "<br>" — same reason as order_summary elsewhere: this
 * value also needs to be safe wherever the template drops it in, and the HTML body
 * renders real line breaks via its own `white-space: pre-line` container. */
export function buildStatusProgressText(currentStatusId) {
  return PROJECT_STATUS_STEPS.map((s, i) => `${statusStepIcon(currentStatusId, i)} ${s.label}`).join('\n')
}

/**
 * `order_confirmed` isn't a real orders.project_status value — it's the
 * pre-project-status phase, sent once right after payment succeeds, before
 * content is ever submitted. The other four keys match project_status
 * exactly, since that's what actually drives the admin trigger.
 */
export const STATUS_PHASES = {
  order_confirmed: {
    statusLabel: 'Order Confirmed',
    statusTitle: "Thanks — we've got your order",
    statusMessage:
      "We've received your order and everything's ready to go. Next, tell us about your business so we can start building.",
    actionLabel: 'Tell us about your business →',
  },
  content_submitted: {
    statusLabel: 'Content Received',
    statusTitle: "We've got everything we need",
    statusMessage: "Thanks for the details — we've got everything we need. Our team is reviewing it before we start building.",
    actionLabel: null,
  },
  in_production: {
    statusLabel: 'In Production',
    statusTitle: 'Your website is being built',
    statusMessage: "We're now actively building your website. We'll let you know the moment it's ready for you to review.",
    actionLabel: null,
  },
  review: {
    statusLabel: 'Ready for Review',
    statusTitle: 'Take a look at your site',
    statusMessage: "Your website is ready! Take a look and let us know if you'd like any changes before we launch.",
    actionLabel: 'View your site →',
  },
  launched: {
    statusLabel: 'Live!',
    statusTitle: 'Your website is live',
    statusMessage: 'Your website is now live! Thank you for choosing Web4Web — we hope it helps your business grow.',
    actionLabel: 'Visit your live site →',
  },
}

export function statusEmailConfigured() {
  return Boolean(EMAILJS_SERVICE_ID && EMAILJS_CLIENT_TEMPLATE_ID && EMAILJS_PUBLIC_KEY)
}

/**
 * `progressStatusId` drives the 4-line tracker specifically — pass `null` for
 * order_confirmed (nothing has started yet), otherwise the project_status
 * the order was just moved to. `actionLink` absent/empty means the phase's
 * action button is omitted entirely by the template (content_submitted and
 * in_production never have one; review/launched require the admin to supply
 * one — see AdminOrderDetail.jsx). `orderSummary` is only meaningful on the
 * order_confirmed phase; every other phase should pass an empty string.
 */
export function sendStatusEmail({ toEmail, phaseId, progressStatusId, actionLink, orderSummary }) {
  if (!statusEmailConfigured()) return Promise.reject(new Error('not_configured'))
  const phase = STATUS_PHASES[phaseId]
  if (!phase) return Promise.reject(new Error('unknown_phase'))

  const businessWhatsappReadable = BUSINESS_WHATSAPP ? `+${BUSINESS_WHATSAPP.replace(/[^\d]/g, '')}` : ''

  return emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_CLIENT_TEMPLATE_ID,
    {
      to_email: toEmail,
      status_label: phase.statusLabel,
      status_title: phase.statusTitle,
      status_message: phase.statusMessage,
      status_progress: buildStatusProgressText(progressStatusId),
      action_link: actionLink || '',
      action_label: actionLink ? phase.actionLabel || '' : '',
      business_whatsapp: businessWhatsappReadable,
      business_email: BUSINESS_EMAIL,
      order_summary: orderSummary || '',
    },
    { publicKey: EMAILJS_PUBLIC_KEY }
  )
}
