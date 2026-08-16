import { useOrderStore } from '../store/orderStore.js'
import './WelcomeBackGate.css'

/**
 * Gates the app on first mount if a prior draft exists — nothing else reads
 * or writes order state until the visitor picks continue vs. start new, so
 * an unresolved prompt can never be silently overwritten by autosave.
 */
export default function WelcomeBackGate({ children }) {
  const draftAvailable = useOrderStore((s) => s.draftAvailable)
  const resumePromptResolved = useOrderStore((s) => s.resumePromptResolved)
  const resumeDraft = useOrderStore((s) => s.resumeDraft)
  const resetOrder = useOrderStore((s) => s.resetOrder)

  if (draftAvailable && !resumePromptResolved) {
    return (
      <div className="welcome-back">
        <div className="welcome-back__card">
          <span className="eyebrow">Welcome back</span>
          <h1 className="welcome-back__title">Continue your build?</h1>
          <p className="welcome-back__desc">We saved where you left off. Pick up right there, or start fresh.</p>
          <div className="welcome-back__actions">
            <button type="button" className="btn btn--primary" onClick={resumeDraft}>
              Continue my build →
            </button>
            <button type="button" className="btn btn--ghost" onClick={resetOrder}>
              Start a new website
            </button>
          </div>
        </div>
      </div>
    )
  }

  return children
}
