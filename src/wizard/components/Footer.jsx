import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <span className="topbar__mark">W4W</span>
          <span className="site-footer__name">Web4Web</span>
        </div>
        <p className="site-footer__tag">Done-for-you websites, built for you — not assembled from a template.</p>
        <nav className="site-footer__links">
          <Link to="/">Home</Link>
          <Link to="/info">How it works</Link>
          <Link to="/configurator">Start building</Link>
        </nav>
        <span className="site-footer__meta mono-label">© {new Date().getFullYear()} Web4Web</span>
      </div>
    </footer>
  )
}
