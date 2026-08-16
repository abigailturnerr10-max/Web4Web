import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// React Router doesn't restore scroll position on navigation by default —
// without this, moving between pages keeps whatever scroll offset the
// previous page was at. Mounted once at the app root (inside BrowserRouter,
// above the route tree) so it applies to every route, not just the wizard.
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
