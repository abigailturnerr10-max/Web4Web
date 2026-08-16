import { useState } from 'react'
import { supabaseAdmin as supabase } from '../lib/supabaseAdminClient.js'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (signInError) setError('Sign-in failed — check your email and password.')
  }

  return (
    <div className="admin-login">
      <form className="admin-login__card" onSubmit={handleSubmit}>
        <h1>Web4Web Admin</h1>
        <input className="text-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
        <input className="text-input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="admin-login__error">{error}</p>}
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
