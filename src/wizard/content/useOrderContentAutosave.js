import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, supabaseReady } from '../../lib/supabaseClient.js'
import { toClientShapedOrder } from '../../lib/orderShape.js'

const AUTOSAVE_DEBOUNCE_MS = 900

/**
 * Loads the order + its order_content row (creating one via
 * save-order-content on first visit), and exposes a `patch()` that updates
 * local state immediately and autosaves on a short debounce — the source of
 * the "Saved just now" indicator every step reads `lastSavedAt` from.
 *
 * All writes go through the save-order-content Edge Function, never a direct
 * client `.update()`/`.insert()` — order_content has no anon write policy at
 * all (see migration 002's notes), so this is the only path in.
 */
export default function useOrderContentAutosave(orderId) {
  const [order, setOrder] = useState(null)
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const saveTimeoutRef = useRef(null)
  const pendingPatchRef = useRef({})

  useEffect(() => {
    if (!orderId || !supabaseReady) {
      setLoading(false)
      setLoadError(!supabaseReady ? 'not_configured' : 'missing_order_id')
      return
    }
    let cancelled = false

    async function load() {
      const { data: orderRow, error: orderError } = await supabase.from('orders').select('*').eq('id', orderId).single()
      if (cancelled) return
      if (orderError || !orderRow) {
        setLoadError('order_not_found')
        setLoading(false)
        return
      }
      setOrder(toClientShapedOrder(orderRow))

      const { data: contentRow } = await supabase.from('order_content').select('*').eq('order_id', orderId).maybeSingle()
      if (cancelled) return

      if (contentRow) {
        setContent(contentRow)
      } else {
        // First visit — create the row via the Edge Function with an empty
        // patch rather than a direct insert.
        const { data } = await supabase.functions.invoke('save-order-content', { body: { orderId, patch: {} } })
        if (!cancelled) setContent(data?.content || { order_id: orderId })
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [orderId])

  const flushSave = useCallback(async () => {
    const patch = pendingPatchRef.current
    if (!orderId || Object.keys(patch).length === 0) return
    pendingPatchRef.current = {}
    setSaving(true)
    await supabase.functions.invoke('save-order-content', { body: { orderId, patch } })
    setSaving(false)
    setLastSavedAt(Date.now())
  }, [orderId])

  const patch = useCallback(
    (fields) => {
      setContent((prev) => (prev ? { ...prev, ...fields } : prev))
      pendingPatchRef.current = { ...pendingPatchRef.current, ...fields }
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(flushSave, AUTOSAVE_DEBOUNCE_MS)
    },
    [flushSave]
  )

  // Flush immediately (no debounce wait) — used right before final submission.
  const patchNow = useCallback(
    async (fields) => {
      setContent((prev) => (prev ? { ...prev, ...fields } : prev))
      pendingPatchRef.current = { ...pendingPatchRef.current, ...fields }
      clearTimeout(saveTimeoutRef.current)
      await flushSave()
    },
    [flushSave]
  )

  useEffect(() => () => clearTimeout(saveTimeoutRef.current), [])

  return { order, content, loading, saving, lastSavedAt, loadError, patch, patchNow }
}
