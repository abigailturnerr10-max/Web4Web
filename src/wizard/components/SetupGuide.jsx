import MediaCarousel from './MediaCarousel.jsx'
import { SETUP_SUPPORT_NOTE } from '../clientPayments.js'
import './SetupGuide.css'

export default function SetupGuide({ title, steps, slides }) {
  return (
    <div className="setup-guide">
      <h4 className="setup-guide__title">{title}</h4>
      <ol className="setup-guide__steps">
        {steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
      {/* No placeholder shown when there's no real media yet — pass real
          slides (with a src) here once screenshots/recordings exist. */}
      {slides?.length > 0 && <MediaCarousel slides={slides} />}
      <p className="setup-guide__note">{SETUP_SUPPORT_NOTE}</p>
    </div>
  )
}
