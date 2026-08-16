import { Routes, Route, Link } from 'react-router-dom'
import useAdminSession from './useAdminSession.js'
import AdminLogin from './AdminLogin.jsx'
import AdminOrdersList from './AdminOrdersList.jsx'
import AdminOrderDetail from './AdminOrderDetail.jsx'
import AdminTestCheckout from './AdminTestCheckout.jsx'
import { supabaseAdmin as supabase } from '../lib/supabaseAdminClient.js'
import './admin.css'

export default function AdminApp() {
  const { session, loading } = useAdminSession()

  if (loading) return <p className="admin-loading">Loading…</p>
  if (!session) return <AdminLogin />

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <span className="admin-topbar__brand">Web4Web Admin</span>
        <Link to="/admin/test-checkout" className="btn btn--ghost">
          Test checkout
        </Link>
        <button type="button" className="btn btn--ghost" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </header>
      <Routes>
        <Route path="/" element={<AdminOrdersList />} />
        <Route path="/orders/:id" element={<AdminOrderDetail />} />
        <Route path="/test-checkout" element={<AdminTestCheckout />} />
      </Routes>
    </div>
  )
}
