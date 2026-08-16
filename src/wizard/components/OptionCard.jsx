import './OptionCard.css'

export default function OptionCard({
  name,
  description,
  priceLabel,
  selected,
  multi = false,
  swatches,
  onClick,
  badge,
  reason,
  disabledNote,
}) {
  const isDisabled = Boolean(disabledNote)

  return (
    <button
      type="button"
      className={'option-card' + (selected ? ' option-card--selected' : '') + (isDisabled ? ' option-card--disabled' : '')}
      onClick={isDisabled ? undefined : onClick}
      aria-pressed={selected}
      disabled={isDisabled}
    >
      {badge && <span className="option-card__badge">{badge}</span>}
      <div className="option-card__top">
        <span className={'option-card__mark' + (multi ? ' option-card__mark--square' : '')}>
          {selected && (multi ? '✓' : '')}
        </span>
        <span className="option-card__name">{name}</span>
        {priceLabel && <span className="option-card__price mono-label">{priceLabel}</span>}
      </div>
      {swatches && (
        <div className="option-card__swatches">
          {swatches.map((c) => (
            <span key={c} className="option-card__swatch" style={{ background: c }} />
          ))}
        </div>
      )}
      {description && <p className="option-card__desc">{description}</p>}
      {reason && <p className="option-card__reason">{reason}</p>}
      {disabledNote && <p className="option-card__disabled-note">{disabledNote}</p>}
    </button>
  )
}
