import { Component } from 'react'
import './ErrorBoundary.css'

const BUSINESS_WHATSAPP = import.meta.env.VITE_BUSINESS_WHATSAPP_NUMBER
const BUSINESS_EMAIL = import.meta.env.VITE_BUSINESS_EMAIL || 'orders@web4web.example'

// Single top-level boundary, not one per flow (Configurator / content form).
// Both of those already persist independently of React's component tree —
// Configurator state autosaves to localStorage on every change
// (orderStore.js), and content-form answers save to order_content via the
// save-order-content Edge Function on a 900ms debounce — so a crash
// anywhere loses at most the last unsaved keystroke, not the draft, whether
// or not the boundary is scoped narrowly. A single boundary means one
// fallback to maintain and reason about instead of three copies of the same
// logic; if a specific step ever proves flaky enough to need isolating from
// the rest of its flow, add a nested boundary around just that step then.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // TODO: wire a real error-monitoring service (e.g. Sentry) here once one
    // is chosen — this console.error is the only record of crashes today.
    console.error('[ErrorBoundary] caught a render error:', error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const waLink = BUSINESS_WHATSAPP
      ? `https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent("Hi — I hit an error on the Web4Web site and could use a hand.")}`
      : null

    return (
      <div className="error-boundary">
        <div className="error-boundary__card card">
          <span className="eyebrow">Something went wrong</span>
          <h1 className="error-boundary__title">Something went wrong on our end — this isn't your fault.</h1>
          <p className="error-boundary__desc">
            The page hit an unexpected error. Your progress up to your last save is safe — try again, or head back
            to the homepage. If this happened while you were paying or submitting your site content, reach out and
            we'll sort it out with you directly.
          </p>
          <div className="error-boundary__actions">
            <button type="button" className="btn btn--primary" onClick={this.handleRetry}>
              Try again
            </button>
            <a href="/" className="btn btn--ghost">
              Go to homepage
            </a>
          </div>
          <div className="error-boundary__contact">
            <span className="mono-label">Need help right now?</span>
            <div className="error-boundary__contact-links">
              {waLink && (
                <a href={waLink} target="_blank" rel="noreferrer">
                  WhatsApp us
                </a>
              )}
              <a href={`mailto:${BUSINESS_EMAIL}`}>{BUSINESS_EMAIL}</a>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
