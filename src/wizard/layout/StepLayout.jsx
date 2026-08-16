import { Link } from 'react-router-dom'
import './StepLayout.css'

const STEPS = [
  { path: '/info', label: 'Info' },
  { path: '/configurator', label: 'Style' },
  { path: '/timeline', label: 'Timeline' },
  { path: '/review', label: 'Review' },
]

export default function StepLayout({ currentPath, children, wide = false }) {
  const currentIndex = currentPath === '/confirmation' ? STEPS.length : STEPS.findIndex((s) => s.path === currentPath)

  return (
    <div className="page">
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
      <main className={'topbar-main' + (wide ? ' topbar-main--wide' : '')}>{children}</main>
    </div>
  )
}
