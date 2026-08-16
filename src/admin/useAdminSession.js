import { useEffect, useState } from 'react'
import { supabaseReady } from '../lib/supabaseClient.js'
import { supabaseAdmin as supabase } from '../lib/supabaseAdminClient.js'

/** Tracks the Supabase Auth session for the admin tool — real auth, not a client-side password check. */
export default function useAdminSession() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabaseReady) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return { session, loading }
}
