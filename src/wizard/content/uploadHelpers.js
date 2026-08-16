import { supabase } from '../../lib/supabaseClient.js'

/**
 * Uploads a file to a Storage bucket via a signed, order-scoped upload URL —
 * never a direct anon `.upload()` call. Neither bucket grants anon any
 * direct RLS access (see supabase/migrations_manual/002 and 005); the
 * signed-storage-url Edge Function computes the order-scoped path itself and
 * issues a one-time upload token.
 */
export async function uploadClientContentFile(orderId, file, bucket = 'client-content') {
  const { data, error } = await supabase.functions.invoke('signed-storage-url', {
    body: { orderId, bucket, mode: 'upload', fileName: file.name },
  })
  if (error || !data?.success) return null

  const { error: uploadError } = await supabase.storage.from(bucket).uploadToSignedUrl(data.path, data.token, file)
  if (uploadError) return null

  return data.path
}
