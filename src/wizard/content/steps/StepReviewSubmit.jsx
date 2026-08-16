import { useState } from 'react'
import { calculateCompletion, PRIORITY_LABEL, STEP_DEFS } from '../contentSpec.js'
import { deriveOutstandingAndUpsell } from '../deriveFlags.js'
import { supabase } from '../../../lib/supabaseClient.js'
import { useAudio } from '../../AudioContext.jsx'

export default function StepReviewSubmit({ order, content, patchNow, orderId, onSubmitted }) {
  const [submitting, setSubmitting] = useState(false)
  const { playSuccess } = useAudio()
  const { missingRequired, missingOther } = calculateCompletion(order, content)
  const stepTitleFor = (stepId) => STEP_DEFS.find((s) => s.id === stepId)?.title || ''

  const completeSteps = STEP_DEFS.filter((s) => s.id !== 11 && (s.appliesWhen ? s.appliesWhen(order) : true)).filter(
    (s) => ![...missingRequired, ...missingOther].some((f) => f.stepId === s.id)
  )

  async function handleSubmit() {
    if (missingRequired.length > 0) return
    setSubmitting(true)
    const { outstanding, upsell } = deriveOutstandingAndUpsell(content)
    await patchNow({
      outstanding_items: outstanding,
      upsell_requests: upsell,
      submitted: true,
      submitted_at: new Date().toISOString(),
    })
    // Routed through an Edge Function, not a direct anon update — orders has
    // no anon UPDATE policy at all (see migration 004's retirement note).
    // This only ever touches the one order id it's given.
    await supabase.functions.invoke('mark-content-submitted', { body: { orderId } })
    setSubmitting(false)
    playSuccess()
    onSubmitted?.()
  }

  return (
    <div className="cf-step">
      {missingRequired.length > 0 && (
        <div className="cf-checklist cf-checklist--missing">
          <h4>⚠️ Missing — must fill in before submitting</h4>
          <ul>
            {missingRequired.map((f) => (
              <li key={f.id}>
                {f.label} <span className="cf-checklist__step">({stepTitleFor(f.stepId)})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {missingOther.length > 0 && (
        <div className="cf-checklist cf-checklist--other">
          <h4>Not filled in yet (won't block submission)</h4>
          <ul>
            {missingOther.map((f) => (
              <li key={f.id}>
                {f.label} <span className="cf-checklist__priority">{PRIORITY_LABEL[f.priority]}</span>{' '}
                <span className="cf-checklist__step">({stepTitleFor(f.stepId)})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {completeSteps.length > 0 && (
        <div className="cf-checklist cf-checklist--complete">
          <h4>✅ Complete</h4>
          <ul>
            {completeSteps.map((s) => (
              <li key={s.id}>{s.title}</li>
            ))}
          </ul>
        </div>
      )}

      <button type="button" className="btn btn--primary cf-submit-btn" disabled={missingRequired.length > 0 || submitting} onClick={handleSubmit}>
        {submitting ? 'Submitting…' : 'Submit Website Content →'}
      </button>
      {missingRequired.length > 0 && (
        <p className="cf-error">
          Fill in {missingRequired.length} more required field{missingRequired.length === 1 ? '' : 's'} to submit.
        </p>
      )}
    </div>
  )
}
