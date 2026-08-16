import { Link } from 'react-router-dom'
import './StepLayout.css'

const STEPS = [
  { path: '/info', label: 'Info' },
  { path: '/configurator', label: 'Style' },
  { path: '/timeline', label: 'Timeline' },
  { path: '/review', label: 'Review' },
]

/**
 * Site header + wizard step-nav — shared between StepLayout (every step page)
 * and Home (which sits before step 1, so nothing in the nav is ever active
 * or done there, but the same header still gives every page consistent
 * branding/navigation). Extracted from StepLayout so both render the exact
 * same markup rather than Home hand-rolling a second copy.
 */
export default function TopBar({ currentPath }) {
  const currentIndex = currentPath === '/confirmation' ? STEPS.length : STEPS.findIndex((s) => s.path === currentPath)

  return (
    <header className="topbar">
      <Link to="/" className="topbar__brand">
        <span className="topbar__mark">W4W</span>
        <span className="topbar__name">Web4Web</span>
      </Link>
      <nav className="step-nav">
        {STEPS.map((step, i) => (
          <div
            key={step.path}
            className={
              'step-nav__item' +
              (i === currentIndex ? ' step-nav__item--active' : '') +
              (i < currentIndex ? ' step-nav__item--done' : '')
            }
          >
            <span className="step-nav__dot">{i + 1}</span>
            <span className="step-nav__label">{step.label}</span>
          </div>
        ))}
      </nav>
    </header>
  )
}
