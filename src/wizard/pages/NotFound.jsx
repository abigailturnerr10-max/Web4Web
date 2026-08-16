import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container" style={{ padding: '96px 24px', textAlign: 'center' }}>
      <span className="mono-label">404</span>
      <h1 className="section-heading__title" style={{ marginTop: 8 }}>
        This page doesn't exist
      </h1>
      <p className="section-heading__desc" style={{ margin: '0 auto 28px' }}>
        The link you followed may be broken, or the page may have moved.
      </p>
      <Link to="/" className="btn btn--primary">
        ← Back to homepage
      </Link>
    </div>
  )
}
