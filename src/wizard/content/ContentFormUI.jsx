import { useEffect, useState } from 'react'
import { PRIORITY_LABEL } from './contentSpec.js'
import './ContentFormUI.css'

export function PriorityBadge({ priority }) {
  if (!priority) return null
  return <span className={`cf-priority cf-priority--${priority}`}>{PRIORITY_LABEL[priority]}</span>
}

export function SaveIndicator({ saving, lastSavedAt }) {
  const [, forceTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 15000)
    return () => clearInterval(t)
  }, [])

  if (saving) return <span className="cf-save-indicator cf-save-indicator--saving">Saving…</span>
  if (!lastSavedAt) return <span className="cf-save-indicator">Not saved yet</span>

  const seconds = Math.round((Date.now() - lastSavedAt) / 1000)
  const label = seconds < 5 ? 'Saved just now' : seconds < 60 ? `Saved ${seconds}s ago` : `Saved ${Math.round(seconds / 60)}m ago`
  return <span className="cf-save-indicator">{label}</span>
}

/**
 * "I'll provide it later" / "I need Web4Web to help with this" — the shared
 * fallback pattern for logo, photos, testimonials, privacy policy, video
 * footage, and product descriptions. `later` just flags the item as
 * outstanding; `upsell` flags it distinctly as a lead for admin, since it's
 * a business opportunity, not just a gap.
 */
export function FallbackChoice({ value, onChange, itemLabel }) {
  return (
    <div className="cf-fallback">
      <p className="cf-fallback__prompt">Don't have {itemLabel.toLowerCase()} ready?</p>
      <div className="cf-fallback__options">
        <button type="button" className={'cf-fallback__btn' + (value === 'later' ? ' cf-fallback__btn--active' : '')} onClick={() => onChange('later')}>
          I'll provide it later
        </button>
        <button type="button" className={'cf-fallback__btn' + (value === 'upsell' ? ' cf-fallback__btn--active' : '')} onClick={() => onChange('upsell')}>
          I need Web4Web to help with this
        </button>
      </div>
      {value && (
        <button type="button" className="cf-fallback__clear" onClick={() => onChange(null)}>
          Actually, I have it — clear this
        </button>
      )}
    </div>
  )
}

/** Generic collapsible add/edit card list for products, team, FAQ, etc. */
export function RepeatableBlock({ items, onChange, itemLabel, emptyItem, renderSummary, renderFields }) {
  const [openIndex, setOpenIndex] = useState(null)

  function addItem() {
    const next = [...items, { ...emptyItem() }]
    onChange(next)
    setOpenIndex(next.length - 1)
  }

  function updateItem(index, patch) {
    const next = items.map((it, i) => (i === index ? { ...it, ...patch } : it))
    onChange(next)
  }

  function removeItem(index) {
    onChange(items.filter((_, i) => i !== index))
    if (openIndex === index) setOpenIndex(null)
  }

  return (
    <div className="cf-repeatable">
      {items.map((item, i) => (
        <div className="cf-repeatable__card" key={i}>
          <button type="button" className="cf-repeatable__header" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
            <span>
              {itemLabel} {i + 1} — {renderSummary(item)}
            </span>
            <span className="cf-repeatable__chevron">{openIndex === i ? '⌄' : '›'}</span>
          </button>
          {openIndex === i && (
            <div className="cf-repeatable__body">
              {renderFields(item, (patch) => updateItem(i, patch))}
              <button type="button" className="cf-repeatable__remove" onClick={() => removeItem(i)}>
                Remove this {itemLabel.toLowerCase()}
              </button>
            </div>
          )}
        </div>
      ))}
      <button type="button" className="btn btn--ghost cf-repeatable__add" onClick={addItem}>
        + Add another {itemLabel.toLowerCase()}
      </button>
    </div>
  )
}

export function FormField({ label, priority, note, children }) {
  return (
    <label className="cf-field">
      <span className="cf-field__label">
        {label} <PriorityBadge priority={priority} />
      </span>
      {note && <p className="cf-field__note">{note}</p>}
      {children}
    </label>
  )
}
