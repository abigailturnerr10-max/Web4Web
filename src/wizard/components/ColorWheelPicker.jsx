import { PALETTE_TYPES, buildPalette } from '../colorTheory.js'
import './ColorWheelPicker.css'

export default function ColorWheelPicker({ hue, paletteType, onHueChange, onPaletteTypeChange }) {
  return (
    <div className="color-wheel">
      <div className="color-wheel__hue">
        <input
          type="range"
          min="0"
          max="359"
          value={hue}
          onChange={(e) => onHueChange(Number(e.target.value))}
          className="color-wheel__slider"
          aria-label="Base hue"
        />
        <span className="mono-label color-wheel__hue-value">{hue}°</span>
      </div>

      <div className="color-wheel__palettes">
        {PALETTE_TYPES.map((p) => {
          const colors = buildPalette(hue, p.id)
          const selected = paletteType === p.id
          return (
            <button
              type="button"
              key={p.id}
              className={'color-wheel__option' + (selected ? ' color-wheel__option--selected' : '')}
              onClick={() => onPaletteTypeChange(p.id)}
            >
              <div className="color-wheel__swatches">
                {colors.map((c, i) => (
                  <span key={i} style={{ background: c }} />
                ))}
              </div>
              <div className="color-wheel__option-text">
                <span className="color-wheel__option-name">{p.name}</span>
                <span className="color-wheel__option-desc">{p.description}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
