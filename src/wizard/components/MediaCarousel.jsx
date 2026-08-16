import { useState } from 'react'
import './MediaCarousel.css'

export default function MediaCarousel({ slides }) {
  const [index, setIndex] = useState(0)
  const slide = slides[index]

  function go(delta) {
    setIndex((i) => (i + delta + slides.length) % slides.length)
  }

  return (
    <div className="carousel">
      <div className="carousel__frame">
        <div className="carousel__placeholder">
          <span className="carousel__kind">{slide.kind === 'video' ? '▶ Video slot' : '🖼 Image slot'}</span>
          <p className="carousel__caption">{slide.caption}</p>
          <span className="mono-label">Upload pending — {index + 1} / {slides.length}</span>
        </div>
      </div>
      <div className="carousel__controls">
        <button type="button" className="carousel__nav" onClick={() => go(-1)} aria-label="Previous slide">
          ←
        </button>
        <div className="carousel__dots">
          {slides.map((s, i) => (
            <button
              key={s.caption}
              type="button"
              className={'carousel__dot' + (i === index ? ' carousel__dot--active' : '')}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
        <button type="button" className="carousel__nav" onClick={() => go(1)} aria-label="Next slide">
          →
        </button>
      </div>
    </div>
  )
}
