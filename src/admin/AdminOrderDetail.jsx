import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import JSZip from 'jszip'
import { supabaseAdmin as supabase } from '../lib/supabaseAdminClient.js'
import { calculateOrderLineItems, calculateOrderTotal } from '../wizard/store/orderStore.js'
import { formatPrice } from '../wizard/config/catalog.js'
import { sendStatusEmail, statusEmailConfigured, PROJECT_STATUS_STEPS as STATUS_TRACKER_STEPS } from '../wizard/statusEmail.js'

// Same 4 ids the status-tracker/email module already defines — sourced from
// there rather than duplicated, so the button list can never drift from the
// phases the email system actually knows how to send for.
const PROJECT_STATUS_STEPS = STATUS_TRACKER_STEPS.map((s) => s.id)

const STATUS_TONE = {
  paid: 'success',
  confirmed: 'success',
  pending_payment: 'warning',
  draft: 'neutral',
  content_submitted: 'info',
  in_production: 'info',
  review: 'warning',
  launched: 'success',
}

function fallbackLabel(v) {
  if (v === 'later') return 'Client will provide this later'
  if (v === 'upsell') return 'Client asked Web4Web to help with this'
  return null
}

function StatusBadge({ status, children }) {
  const tone = STATUS_TONE[status] || 'neutral'
  return <span className={`admin-badge admin-badge--${tone}`}>{children || status}</span>
}

/** Small inline copy icon — shown next to any field that has a real value. */
function CopyButton({ value, className = '' }) {
  const [copied, setCopied] = useState(false)
  if (!value) return null

  async function handleCopy(e) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(String(value))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable — silently ignore, nothing to fall back to */
    }
  }

  return (
    <button
      type="button"
      className={`admin-copy-btn${copied ? ' admin-copy-btn--copied' : ''} ${className}`}
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy'}
      aria-label={copied ? 'Copied' : 'Copy to clipboard'}
    >
      {copied ? '✓' : '⧉'}
    </button>
  )
}

function TextField({ label, value }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>
        <span>{value || '—'}</span>
        <CopyButton value={value} />
      </dd>
    </>
  )
}

/**
 * Direct authenticated signed-URL fetch — legitimate here because it runs
 * under the admin's real Supabase Auth session (the "authenticated can read
 * ..." RLS policies), not the anon key. This is not the exposure that was
 * fixed for the client-facing upload/view path (see signed-storage-url).
 */
function AdminImage({ bucket, path, alt }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (!path) return
    let cancelled = false
    supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60)
      .then(({ data }) => {
        if (!cancelled && data) setUrl(data.signedUrl)
      })
    return () => {
      cancelled = true
    }
  }, [bucket, path])

  if (!path) return null
  if (!url) return <span className="admin-image-loading">Loading…</span>
  return <img className="admin-image" src={url} alt={alt} />
}

/** Fetches a fresh, download-flagged signed URL on click — not on mount, so
 * we're not racing the 60s expiry against however long the admin takes to
 * find and click it, and we don't fire a signed-url request for every file
 * up front regardless of whether it's ever downloaded. */
async function triggerDownload(bucket, path) {
  const filename = path.split('/').pop()
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 60, { download: filename })
  if (!data) return
  const a = document.createElement('a')
  a.href = data.signedUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

function DownloadButton({ bucket, path }) {
  if (!path) return null
  return (
    <button type="button" className="admin-file__download" onClick={() => triggerDownload(bucket, path)} title="Download file">
      ⬇ Download
    </button>
  )
}

function FileWithActions({ bucket, path, alt, caption }) {
  if (!path) return null
  return (
    <div className="admin-file">
      <AdminImage bucket={bucket} path={path} alt={alt} />
      {caption && <span className="admin-file__caption">{caption}</span>}
      <DownloadButton bucket={bucket} path={path} />
    </div>
  )
}

function FileGrid({ bucket, items, pathKey = 'path', labelFn }) {
  if (!items?.length) return null
  return (
    <div className="admin-image-grid">
      {items.map((item, i) => (
        <FileWithActions key={i} bucket={bucket} path={item[pathKey]} alt={labelFn?.(item) || ''} caption={labelFn?.(item)} />
      ))}
    </div>
  )
}

/** Every uploaded-file path on this order's content, grouped for the zip. */
function collectAllFiles(content) {
  if (!content) return []
  const files = []
  const add = (path, folder) => {
    if (path) files.push({ path, folder })
  }
  add(content.logo_path, 'logo')
  ;(content.products || []).forEach((p) => add(p.photo_path, 'products'))
  ;(content.gallery || []).forEach((g) => add(g.path, 'gallery'))
  ;(content.team || []).forEach((t) => add(t.photo_path, 'team'))
  ;(content.additional_photos || []).forEach((p) => add(p.path, 'additional-photos'))
  add(content.before_photo_path, 'before-after')
  add(content.after_photo_path, 'before-after')
  ;(content.object_photos || []).forEach((p) => add(p.path, 'object-photos'))
  ;(content.trust_badges || []).forEach((b) => add(b.logo_path, 'trust-badges'))
  return files
}

function DownloadAllButton({ orderId, content }) {
  const [status, setStatus] = useState('idle') // idle | zipping | error
  const files = collectAllFiles(content)
  if (!files.length) return null

  async function handleClick() {
    setStatus('zipping')
    try {
      const zip = new JSZip()
      await Promise.all(
        files.map(async ({ path, folder }) => {
          const { data } = await supabase.storage.from('client-content').createSignedUrl(path, 60)
          if (!data) return
          const blob = await fetch(data.signedUrl).then((r) => r.blob())
          zip.file(`${folder}/${path.split('/').pop()}`, blob)
        })
      )
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `order-${orderId}-files.zip`
      a.click()
      URL.revokeObjectURL(url)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <button type="button" className="btn btn--ghost" onClick={handleClick} disabled={status === 'zipping'}>
      {status === 'zipping' ? `Zipping ${files.length} files…` : status === 'error' ? 'Failed — try again' : `⬇ Download all files (${files.length})`}
    </button>
  )
}

function buildOrderSummaryText(order, content, lineItems, total) {
  const lines = [
    `WEB4WEB ORDER — ${order.id}`,
    `Created: ${new Date(order.created_at).toLocaleString()}`,
    '',
    '--- ORDER ---',
    `Site type: ${order.site_type || '—'}`,
    `Tier: ${order.template?.tier || '—'}`,
    `Hero style: ${order.hero_style?.id || '—'}`,
    `Effect pack: ${order.effect_pack?.id || 'None'}`,
    `Domain: ${order.domain?.selected ? `${order.domain.desired || ''}${order.domain.type}` : 'Not purchased'}`,
    `Contact: ${order.contact?.email || '—'} · ${order.contact?.whatsapp || '—'}`,
    '',
    ...lineItems.map((item) => `${item.label}: ${formatPrice(item.amount, order.currency)}`),
    `TOTAL: ${formatPrice(order.total_amount ?? total, order.currency)}`,
    '',
    `Payment status: ${order.status}`,
    `Project status: ${order.project_status || 'not started'}`,
  ]

  lines.push('', '--- CONTENT SUBMISSION ---')
  if (!content) {
    lines.push('No content submission yet.')
    return lines.join('\n')
  }

  lines.push(content.submitted ? `Submitted: ${new Date(content.submitted_at).toLocaleString()}` : 'In progress, not yet submitted')
  if (content.brand_name) lines.push(`Brand name: ${content.brand_name}`)
  if (content.tagline) lines.push(`Tagline: ${content.tagline}`)
  if (content.business_description) lines.push(`Description: ${content.business_description}`)
  if (content.phone) lines.push(`Phone: ${content.phone}`)
  if (content.business_email) lines.push(`Business email: ${content.business_email}`)
  if (content.address) lines.push(`Address: ${content.address}`)
  if (content.business_hours) lines.push(`Business hours: ${content.business_hours}`)
  if (content.home_key_message) lines.push(`Home key message: ${content.home_key_message}`)
  if (content.about_story) lines.push(`About: ${content.about_story}`)
  if (content.products?.length) lines.push(`Products/Services: ${content.products.map((p) => p.name).filter(Boolean).join(', ') || `${content.products.length} item(s)`}`)
  if (content.gallery?.length) lines.push(`Gallery: ${content.gallery.length} image(s)`)
  if (content.team?.length) lines.push(`Team: ${content.team.map((t) => t.name).filter(Boolean).join(', ')}`)
  if (content.faq?.length) lines.push(`FAQ: ${content.faq.length} question(s)`)
  if (content.testimonials?.length) lines.push(`Testimonials: ${content.testimonials.length}`)
  if (content.stats?.length) lines.push(`Stats: ${content.stats.map((s) => `${s.value} ${s.label}`).join(', ')}`)
  if (content.languages_needed) lines.push(`Languages needed: ${content.languages_needed}`)

  const socialLinks = Object.entries(content.social_links || {}).filter(([, v]) => v)
  if (socialLinks.length) lines.push(`Social links: ${socialLinks.map(([p, v]) => `${p}: ${v}`).join(', ')}`)
  if (content.existing_website_url) lines.push(`Existing website: ${content.existing_website_url}`)
  if (content.google_business_url) lines.push(`Google Business Profile: ${content.google_business_url}`)
  if (content.domain_note) lines.push(`Domain note: ${content.domain_note}`)
  if (content.anything_else) lines.push(`Anything else: ${content.anything_else}`)

  lines.push('', `Payment publishable key: ${content.payment_publishable_key || '—'}`)
  lines.push(`Payment secret key: ${content.payment_secret_key_stored ? 'Provided (encrypted, vault-only — not included here)' : 'Not provided'}`)

  if (content.outstanding_items?.length) lines.push('', `Outstanding (client will provide later): ${content.outstanding_items.join(', ')}`)
  if (content.upsell_requests?.length) lines.push(`Upsell requests: ${content.upsell_requests.join(', ')}`)

  return lines.join('\n')
}

function CopySummaryButton({ order, content, lineItems, total }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const text = buildOrderSummaryText(order, content, lineItems, total)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  }

  return (
    <button type="button" className="btn btn--primary" onClick={handleCopy}>
      {copied ? '✓ Copied — paste anywhere' : '📋 Copy order summary'}
    </button>
  )
}

function Section({ title, children }) {
  return (
    <section className="admin-card">
      <h2 className="admin-card__title">{title}</h2>
      {children}
    </section>
  )
}

function SubSection({ title, children }) {
  return (
    <div className="admin-subsection">
      <h3>{title}</h3>
      {children}
    </div>
  )
}

export default function AdminOrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [previewUrlInput, setPreviewUrlInput] = useState('')
  const [liveUrlInput, setLiveUrlInput] = useState('')
  const [linkMissing, setLinkMissing] = useState(null) // 'review' | 'launched' | null
  const [statusEmailState, setStatusEmailState] = useState('idle') // idle | sending | sent | failed | not-configured | no-recipient

  useEffect(() => {
    async function load() {
      const { data: orderRow } = await supabase.from('orders').select('*').eq('id', id).single()
      const { data: contentRow } = await supabase.from('order_content').select('*').eq('order_id', id).maybeSingle()
      setOrder(orderRow)
      setContent(contentRow)
      setLoading(false)
    }
    load()
  }, [id])

  useEffect(() => {
    if (!order) return
    setPreviewUrlInput(order.preview_url || '')
    setLiveUrlInput(order.live_url || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id])

  // The status-tracker "review"/"launched" emails need somewhere to send the
  // client — the system has no way to generate a preview or live URL on its
  // own, so this requires the admin to have already typed one into the field
  // above before advancing. content_submitted/in_production need no link at
  // all (see statusEmail.js's STATUS_PHASES — their actionLabel is null).
  async function advanceStatus(newStatus) {
    setLinkMissing(null)
    const linkValue = newStatus === 'review' ? previewUrlInput.trim() : newStatus === 'launched' ? liveUrlInput.trim() : ''
    if ((newStatus === 'review' || newStatus === 'launched') && !linkValue) {
      setLinkMissing(newStatus)
      return
    }

    const patch = { project_status: newStatus }
    if (newStatus === 'review') patch.preview_url = linkValue
    if (newStatus === 'launched') patch.live_url = linkValue

    await supabase.from('orders').update(patch).eq('id', id)
    setOrder((o) => ({ ...o, ...patch }))

    if (!order.contact?.email) {
      setStatusEmailState('no-recipient')
      return
    }
    if (!statusEmailConfigured()) {
      setStatusEmailState('not-configured')
      return
    }
    setStatusEmailState('sending')
    try {
      await sendStatusEmail({
        toEmail: order.contact.email,
        phaseId: newStatus,
        progressStatusId: newStatus,
        actionLink: linkValue,
        orderSummary: '',
      })
      setStatusEmailState('sent')
    } catch {
      setStatusEmailState('failed')
    }
  }

  if (loading) return <p className="admin-loading">Loading…</p>
  if (!order) return <p className="admin-loading">Order not found.</p>

  // Rebuild the same order shape the frontend uses so we can reuse the
  // existing pricing functions instead of re-deriving the breakdown here.
  const clientShapedOrder = {
    template: order.template,
    onlinePayments: order.online_payments,
    domain: order.domain,
    heroStyle: order.hero_style,
    effectPack: order.effect_pack,
    individualEffects: order.individual_effects,
    socialPreview: order.social_preview,
    extraPages: order.extra_pages,
    delivery: order.delivery,
  }
  const lineItems = calculateOrderLineItems(clientShapedOrder)
  const total = calculateOrderTotal(clientShapedOrder)

  return (
    <div className="admin-page">
      <Link to="/admin" className="admin-back-link">
        ← All orders
      </Link>

      <div className="admin-page__header">
        <h1 className="admin-order-title">
          Order <span className="mono-label">{order.id}</span>
          <CopyButton value={order.id} />
        </h1>
        <div className="admin-header-actions">
          <DownloadAllButton orderId={order.id} content={content} />
          <CopySummaryButton order={order} content={content} lineItems={lineItems} total={total} />
        </div>
      </div>

      <Section title="Status">
        <div className="admin-status-row">
          <span className="admin-status-row__label">Payment</span>
          <StatusBadge status={order.status} />
        </div>
        <div className="admin-status-row">
          <span className="admin-status-row__label">Project</span>
          <StatusBadge status={order.project_status || 'draft'}>{order.project_status || 'Not started'}</StatusBadge>
        </div>
        <div className="admin-status-links">
          <label className="admin-status-links__field">
            <span className="mono-label">Preview URL (for "Review")</span>
            <input
              className="text-input"
              placeholder="https://..."
              value={previewUrlInput}
              onChange={(e) => setPreviewUrlInput(e.target.value)}
            />
          </label>
          <label className="admin-status-links__field">
            <span className="mono-label">Live URL (for "Launched")</span>
            <input
              className="text-input"
              placeholder="https://..."
              value={liveUrlInput}
              onChange={(e) => setLiveUrlInput(e.target.value)}
            />
          </label>
        </div>

        <div className="admin-status-advance">
          {PROJECT_STATUS_STEPS.map((s) => (
            <button
              type="button"
              key={s}
              className={'btn' + (order.project_status === s ? ' btn--dark' : ' btn--ghost')}
              onClick={() => advanceStatus(s)}
            >
              {s}
            </button>
          ))}
        </div>

        {linkMissing && (
          <p className="admin-status-error">
            Add a {linkMissing === 'review' ? 'preview' : 'live'} URL above before advancing to "{linkMissing}" — the
            status email for this phase links to it.
          </p>
        )}

        <div className="admin-status-email-state mono-label">
          {statusEmailState === 'sending' && 'Sending status email…'}
          {statusEmailState === 'sent' && 'Status email sent ✓'}
          {statusEmailState === 'failed' && 'Status email failed to send.'}
          {statusEmailState === 'not-configured' &&
            'Status email not configured — set VITE_EMAILJS_CLIENT_TEMPLATE_ID in .env.'}
          {statusEmailState === 'no-recipient' && "Status not emailed — no contact email on this order."}
        </div>
      </Section>

      <Section title="Order details">
        <dl className="admin-dl">
          <TextField label="Site type" value={order.site_type} />
          <TextField label="Tier" value={order.template?.tier} />
          <TextField label="Hero style" value={order.hero_style?.id} />
          <TextField label="Effect pack" value={order.effect_pack?.id || 'None'} />
          <TextField label="Domain" value={order.domain?.selected ? `${order.domain.desired || ''}${order.domain.type}` : 'Not purchased'} />
          <TextField label="Email" value={order.contact?.email} />
          <TextField label="WhatsApp" value={order.contact?.whatsapp} />
        </dl>

        {order.color_theme?.brandAssetUrl && (
          <div className="admin-image-row">
            <span className="mono-label">Brand asset (client-provided)</span>
            <FileWithActions bucket="brand-assets" path={order.color_theme.brandAssetUrl} alt="Brand asset" />
          </div>
        )}

        <table className="admin-table">
          <tbody>
            {lineItems.map((item) => (
              <tr key={item.key}>
                <td>{item.label}</td>
                <td>{formatPrice(item.amount, order.currency)}</td>
              </tr>
            ))}
            <tr className="admin-table__total-row">
              <td>
                <strong>Total</strong>
              </td>
              <td>
                <strong>{formatPrice(order.total_amount ?? total, order.currency)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section title="Content submission">
        {!content ? (
          <p className="admin-empty">No content submission yet.</p>
        ) : (
          <>
            <p className="admin-submitted-line">
              {content.submitted ? `Submitted ${new Date(content.submitted_at).toLocaleString()}` : 'In progress, not yet submitted'}
            </p>

            {(content.outstanding_items?.length > 0 || content.upsell_requests?.length > 0) && (
              <div className="admin-flags">
                {content.outstanding_items?.length > 0 && (
                  <div>
                    <h3>Outstanding (client will provide later)</h3>
                    <ul>
                      {content.outstanding_items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {content.upsell_requests?.length > 0 && (
                  <div className="admin-flags__upsell">
                    <h3>🔔 Upsell requests — client asked for help with</h3>
                    <ul>
                      {content.upsell_requests.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <SubSection title="Brand basics">
              <dl className="admin-dl">
                <TextField label="Brand name" value={content.brand_name} />
                <TextField label="Tagline" value={content.tagline} />
                <TextField label="Description" value={content.business_description} />
              </dl>
              {content.logo_path ? (
                <FileWithActions bucket="client-content" path={content.logo_path} alt="Logo" caption="Logo" />
              ) : (
                fallbackLabel(content.logo_fallback) && <p className="cf-hint">Logo: {fallbackLabel(content.logo_fallback)}</p>
              )}
            </SubSection>

            <SubSection title="Contact & location">
              <dl className="admin-dl">
                <TextField label="Phone" value={content.phone} />
                <TextField label="Business email" value={content.business_email} />
                <TextField label="Address" value={content.address} />
                <TextField label="Business hours" value={content.business_hours} />
              </dl>
            </SubSection>

            <SubSection title="Page content">
              <dl className="admin-dl">
                <TextField label="Home — key message" value={content.home_key_message} />
                <TextField label="About — full story" value={content.about_story} />
              </dl>
              {content.products?.length > 0 && (
                <div className="admin-image-row">
                  <span className="mono-label">Products/Services ({content.products.length})</span>
                  <FileGrid bucket="client-content" items={content.products} pathKey="photo_path" labelFn={(p) => p.name} />
                </div>
              )}
              {content.gallery?.length > 0 && (
                <div className="admin-image-row">
                  <span className="mono-label">Gallery ({content.gallery.length})</span>
                  <FileGrid bucket="client-content" items={content.gallery} pathKey="path" labelFn={(g) => g.caption} />
                </div>
              )}
              {content.team?.length > 0 && (
                <div className="admin-image-row">
                  <span className="mono-label">Team ({content.team.length})</span>
                  <FileGrid bucket="client-content" items={content.team} pathKey="photo_path" labelFn={(t) => `${t.name} — ${t.role}`} />
                </div>
              )}
              {content.faq?.length > 0 && (
                <div className="admin-image-row">
                  <span className="mono-label">FAQ ({content.faq.length})</span>
                  <ul>
                    {content.faq.map((f, i) => (
                      <li key={i}>
                        <strong>{f.question}</strong> — {f.answer}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {(content.testimonials?.length > 0 || fallbackLabel(content.testimonials_fallback)) && (
                <div className="admin-image-row">
                  <span className="mono-label">Testimonials ({content.testimonials?.length || 0})</span>
                  {content.testimonials?.length > 0 && (
                    <ul>
                      {content.testimonials.map((t, i) => (
                        <li key={i}>"{t.quote}" — {t.author}</li>
                      ))}
                    </ul>
                  )}
                  {fallbackLabel(content.testimonials_fallback) && <p className="cf-hint">{fallbackLabel(content.testimonials_fallback)}</p>}
                </div>
              )}
            </SubSection>

            <SubSection title="Visual assets">
              {(content.additional_photos?.length > 0 || fallbackLabel(content.additional_photos_fallback)) && (
                <div className="admin-image-row">
                  <span className="mono-label">Additional photos ({content.additional_photos?.length || 0})</span>
                  <FileGrid bucket="client-content" items={content.additional_photos} pathKey="path" labelFn={(p) => p.caption} />
                  {fallbackLabel(content.additional_photos_fallback) && <p className="cf-hint">{fallbackLabel(content.additional_photos_fallback)}</p>}
                </div>
              )}
              {fallbackLabel(content.video_footage_fallback) && (
                <p className="cf-hint">Video footage: {fallbackLabel(content.video_footage_fallback)}</p>
              )}
              {(content.before_photo_path || content.after_photo_path || fallbackLabel(content.before_after_fallback)) && (
                <div className="admin-image-row">
                  <span className="mono-label">Before / after photos</span>
                  <div className="admin-image-grid">
                    <FileWithActions bucket="client-content" path={content.before_photo_path} alt="Before" caption="Before" />
                    <FileWithActions bucket="client-content" path={content.after_photo_path} alt="After" caption="After" />
                  </div>
                  {fallbackLabel(content.before_after_fallback) && <p className="cf-hint">{fallbackLabel(content.before_after_fallback)}</p>}
                </div>
              )}
              {(content.object_photos?.length > 0 || fallbackLabel(content.object_photos_fallback)) && (
                <div className="admin-image-row">
                  <span className="mono-label">Product/object photos ({content.object_photos?.length || 0})</span>
                  <FileGrid bucket="client-content" items={content.object_photos} pathKey="path" labelFn={(p) => p.angle} />
                  {fallbackLabel(content.object_photos_fallback) && <p className="cf-hint">{fallbackLabel(content.object_photos_fallback)}</p>}
                </div>
              )}
              {content.stats?.length > 0 && (
                <div className="admin-image-row">
                  <span className="mono-label">Stats</span>
                  <ul>
                    {content.stats.map((s, i) => (
                      <li key={i}>{s.value} — {s.label}</li>
                    ))}
                  </ul>
                </div>
              )}
              {content.trust_badges?.length > 0 && (
                <div className="admin-image-row">
                  <span className="mono-label">Trust badges ({content.trust_badges.length})</span>
                  <FileGrid bucket="client-content" items={content.trust_badges} pathKey="logo_path" labelFn={(b) => b.label} />
                </div>
              )}
            </SubSection>

            <SubSection title="Social & online presence">
              <dl className="admin-dl">
                {Object.entries(content.social_links || {})
                  .filter(([, v]) => v)
                  .map(([platform, url]) => (
                    <TextField key={platform} label={platform.charAt(0).toUpperCase() + platform.slice(1)} value={url} />
                  ))}
                <TextField label="Existing website" value={content.existing_website_url} />
                <TextField label="Google Business Profile" value={content.google_business_url} />
                <TextField label="Languages needed" value={content.languages_needed} />
              </dl>
              {fallbackLabel(content.languages_needed_fallback) && <p className="cf-hint">{fallbackLabel(content.languages_needed_fallback)}</p>}
            </SubSection>

            <SubSection title="Payment setup">
              <dl className="admin-dl">
                <TextField label="Publishable key" value={content.payment_publishable_key} />
                <dt>Secret key</dt>
                <dd>
                  {content.payment_secret_key_stored ? (
                    <StatusBadge status="success">Provided ✅ (encrypted)</StatusBadge>
                  ) : (
                    <StatusBadge status="neutral">Not provided</StatusBadge>
                  )}
                </dd>
              </dl>
            </SubSection>

            {(content.newsletter_provider || content.newsletter_api_key_stored) && (
              <SubSection title="Newsletter integration">
                <dl className="admin-dl">
                  <TextField label="Provider" value={content.newsletter_provider} />
                  <dt>Newsletter API key</dt>
                  <dd>
                    {content.newsletter_api_key_stored ? (
                      <StatusBadge status="success">Provided ✅ (encrypted)</StatusBadge>
                    ) : (
                      <StatusBadge status="neutral">Not provided</StatusBadge>
                    )}
                  </dd>
                </dl>
              </SubSection>
            )}

            <SubSection title="Domain confirmation">
              <dl className="admin-dl">
                <TextField label="Domain note" value={content.domain_note} />
              </dl>
            </SubSection>

            <SubSection title="Legal content">
              <dl className="admin-dl">
                <TextField label="Privacy/Terms text" value={content.legal_privacy_text} />
                <dt>Generate standard docs</dt>
                <dd>{content.legal_generate_standard ? 'Yes' : 'No'}</dd>
              </dl>
              {fallbackLabel(content.legal_privacy_fallback) && <p className="cf-hint">{fallbackLabel(content.legal_privacy_fallback)}</p>}
            </SubSection>

            <SubSection title="Anything else">
              <dl className="admin-dl">
                <TextField label="Notes" value={content.anything_else} />
              </dl>
            </SubSection>
          </>
        )}
      </Section>
    </div>
  )
}
