import { PROJECT_STATUS_STEPS, statusStepIcon } from '../statusEmail.js'

export default function ProjectStatusView({ order, content, justSubmitted }) {
  // This view is only ever reachable after content.submitted is true (see
  // SubmitContent.jsx), so project_status is always at least
  // 'content_submitted' in practice even if the column itself is still null.
  const currentStatusId = order?.projectStatus || 'content_submitted'
  const contactPoint = content?.business_email || order?.contact?.email

  return (
    <div className="cf-status-view">
      {justSubmitted && (
        <div className="cf-status-view__thanks">
          <p>
            Thanks — we've got everything we need to get started. If we need anything else, we'll reach out
            {contactPoint ? ` on ${contactPoint}` : ''} or WhatsApp. You can check back here anytime to see your
            project status.
          </p>
        </div>
      )}
      <h1 className="cf-status-view__title">Website Project</h1>
      <div className="cf-status-view__steps">
        {PROJECT_STATUS_STEPS.map((s, i) => (
          <div className="cf-status-view__step" key={s.id}>
            <span>{statusStepIcon(currentStatusId, i)}</span>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      <p className="cf-hint">
        Submitted {content?.submitted_at ? new Date(content.submitted_at).toLocaleDateString() : ''}. We'll reach out on
        WhatsApp or email as your project moves forward — no need to revisit this page for updates, but it'll always
        reflect where things stand.
      </p>
    </div>
  )
}
