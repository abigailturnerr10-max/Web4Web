import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import useOrderContentAutosave from './useOrderContentAutosave.js'
import { applicableSteps, calculateCompletion, buildFieldSpec } from './contentSpec.js'
import { SaveIndicator } from './ContentFormUI.jsx'
import ProjectStatusView from './ProjectStatusView.jsx'
import StepBrandBasics from './steps/StepBrandBasics.jsx'
import StepContactLocation from './steps/StepContactLocation.jsx'
import StepPageContent from './steps/StepPageContent.jsx'
import StepVisualAssets from './steps/StepVisualAssets.jsx'
import StepSocialPresence from './steps/StepSocialPresence.jsx'
import StepPaymentSetup from './steps/StepPaymentSetup.jsx'
import StepNewsletterIntegration from './steps/StepNewsletterIntegration.jsx'
import StepDomainConfirmation from './steps/StepDomainConfirmation.jsx'
import StepLegalContent from './steps/StepLegalContent.jsx'
import StepAnythingElse from './steps/StepAnythingElse.jsx'
import StepReviewSubmit from './steps/StepReviewSubmit.jsx'
import './SubmitContent.css'

const STEP_COMPONENTS = {
  1: StepBrandBasics,
  2: StepContactLocation,
  3: StepPageContent,
  4: StepVisualAssets,
  5: StepSocialPresence,
  6: StepPaymentSetup,
  7: StepNewsletterIntegration,
  8: StepDomainConfirmation,
  9: StepLegalContent,
  10: StepAnythingElse,
  11: StepReviewSubmit,
}

export default function SubmitContent() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order')
  const { order, content, loading, saving, lastSavedAt, loadError, patch, patchNow } = useOrderContentAutosave(orderId)
  const [activeStep, setActiveStep] = useState(1)
  const [justSubmitted, setJustSubmitted] = useState(false)

  if (!orderId) {
    return <FormShell>This link is missing an order reference. Check the link from your confirmation email.</FormShell>
  }
  if (loadError === 'not_configured') {
    return <FormShell>Content submission isn't available yet — check back soon.</FormShell>
  }
  if (loadError === 'order_not_found') {
    return <FormShell>We couldn't find that order. Double-check the link, or message us on WhatsApp.</FormShell>
  }
  if (loading || !order || !content) {
    return <FormShell>Loading…</FormShell>
  }

  if (content.submitted) {
    return (
      <FormShell>
        <ProjectStatusView order={order} content={content} justSubmitted={justSubmitted} />
      </FormShell>
    )
  }

  const steps = applicableSteps(order)
  const fields = buildFieldSpec(order)
  const { percent } = calculateCompletion(order, content)
  const StepComponent = STEP_COMPONENTS[activeStep]
  const currentIndexInSteps = steps.findIndex((s) => s.id === activeStep) + 1

  function goTo(stepId) {
    setActiveStep(stepId)
  }

  function next() {
    const idx = steps.findIndex((s) => s.id === activeStep)
    if (idx < steps.length - 1) setActiveStep(steps[idx + 1].id)
  }
  function back() {
    const idx = steps.findIndex((s) => s.id === activeStep)
    if (idx > 0) setActiveStep(steps[idx - 1].id)
  }

  return (
    <FormShell>
      <div className="cf-header">
        <div>
          <h1 className="cf-header__title">Website setup — {percent}% complete</h1>
          <p className="cf-header__sub">
            Step {currentIndexInSteps} of {steps.length}
          </p>
        </div>
        <SaveIndicator saving={saving} lastSavedAt={lastSavedAt} />
      </div>

      <div className="cf-progress-track">
        <div className="cf-progress-fill" style={{ width: `${percent}%` }} />
      </div>

      <nav className="cf-step-nav">
        {steps.map((s) => (
          <button
            type="button"
            key={s.id}
            className={'cf-step-nav__btn' + (s.id === activeStep ? ' cf-step-nav__btn--active' : '')}
            onClick={() => goTo(s.id)}
          >
            {s.title}
          </button>
        ))}
      </nav>

      <div className="cf-step-body">
        <StepComponent
          order={order}
          content={content}
          fields={fields}
          patch={patch}
          patchNow={patchNow}
          orderId={orderId}
          onSubmitted={() => {
            setJustSubmitted(true)
            setActiveStep(1)
          }}
        />
      </div>

      <div className="cf-step-actions">
        <button type="button" className="btn btn--ghost" onClick={back} disabled={currentIndexInSteps <= 1}>
          ← Back
        </button>
        {activeStep !== 11 && (
          <button type="button" className="btn btn--primary" onClick={next}>
            Continue →
          </button>
        )}
      </div>
    </FormShell>
  )
}

function FormShell({ children }) {
  return (
    <div className="cf-shell">
      <div className="cf-shell__inner">{children}</div>
    </div>
  )
}
