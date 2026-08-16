import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import useInView from './useInView.js'
import { useAudio } from '../../AudioContext.jsx'

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function ScrambleHeading({ scrollRootRef, text }) {
  const [ref, inView] = useInView(scrollRootRef)
  const [display, setDisplay] = useState(text.replace(/[^\s]/g, '·'))

  useEffect(() => {
    if (!inView) return
    let frame = 0
    const totalFrames = 22
    const interval = setInterval(() => {
      frame += 1
      const revealCount = Math.floor((frame / totalFrames) * text.length)
      setDisplay(
        text
          .split('')
          .map((ch, i) => {
            if (ch === ' ') return ' '
            if (i < revealCount) return ch
            return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
          })
          .join('')
      )
      if (frame >= totalFrames) {
        clearInterval(interval)
        setDisplay(text)
      }
    }, 35)
    return () => clearInterval(interval)
  }, [inView, text])

  return (
    <h3 className="pv-scramble" ref={ref}>
      {display}
    </h3>
  )
}

export function AnimatedCounters({ scrollRootRef }) {
  const [ref, inView] = useInView(scrollRootRef)
  const stats = [
    { label: 'Happy clients', target: 120 },
    { label: 'Projects shipped', target: 340 },
    { label: 'Cups of coffee', target: 1280 },
  ]
  const [values, setValues] = useState(stats.map(() => 0))

  useEffect(() => {
    if (!inView) return
    const duration = 1100
    const start = performance.now()
    let raf
    function tick(now) {
      const progress = Math.min(1, (now - start) / duration)
      setValues(stats.map((s) => Math.round(s.target * progress)))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView])

  return (
    <div className="pv-counters" ref={ref}>
      {stats.map((s, i) => (
        <div className="pv-counters__item" key={s.label}>
          <div className="pv-counters__value">{values[i].toLocaleString()}+</div>
          <div className="pv-counters__label">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

export function MagneticButton() {
  const ref = useRef(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  function handleMove(e) {
    const rect = ref.current.getBoundingClientRect()
    const relX = e.clientX - (rect.left + rect.width / 2)
    const relY = e.clientY - (rect.top + rect.height / 2)
    setOffset({ x: relX * 0.35, y: relY * 0.35 })
  }

  return (
    <div className="pv-magnetic-wrap">
      <button
        type="button"
        ref={ref}
        className="pv-magnetic-btn"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
        onMouseMove={handleMove}
        onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      >
        Hover me
      </button>
    </div>
  )
}

export function TiltCards() {
  const cards = [1, 2, 3]
  return (
    <div className="pv-tilt-row">
      {cards.map((c) => (
        <TiltCard key={c} />
      ))}
    </div>
  )
}

function TiltCard() {
  const ref = useRef(null)
  const [style, setStyle] = useState({})

  function handleMove(e) {
    const rect = ref.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setStyle({ transform: `perspective(400px) rotateX(${-py * 14}deg) rotateY(${px * 14}deg) scale(1.03)` })
  }

  return (
    <div
      className="pv-tilt-card"
      ref={ref}
      style={style}
      onMouseMove={handleMove}
      onMouseLeave={() => setStyle({ transform: 'perspective(400px) rotateX(0) rotateY(0) scale(1)' })}
    >
      <span className="pv-tilt-card__badge" />
      <div className="pv-tilt-card__line" />
      <div className="pv-tilt-card__line pv-tilt-card__line--short" />
    </div>
  )
}

export function HorizontalGallery() {
  const items = [1, 2, 3, 4, 5]
  return (
    <div className="pv-hgallery">
      {items.map((i) => (
        <div className="pv-hgallery__card" key={i}>
          <span className="pv-hgallery__num mono-label">{String(i).padStart(2, '0')}</span>
        </div>
      ))}
    </div>
  )
}

export function PinnedFeature() {
  return (
    <div className="pv-pinned">
      <div className="pv-pinned__sticky">
        <span className="pv-pinned__badge" />
        <div className="pv-pinned__title" />
        <p className="pv-pinned__desc">Pinned while you scroll past the details.</p>
      </div>
      <div className="pv-pinned__scroll">
        {[1, 2, 3].map((i) => (
          <div className="pv-pinned__block" key={i}>
            <div className="pv-pinned__block-line" />
            <div className="pv-pinned__block-line pv-pinned__block-line--short" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function Marquee() {
  const words = ['TRUSTED BY TEAMS', '★★★★★', 'BUILT WITH WEB4WEB', '★★★★★', 'LAUNCHED IN DAYS']
  return (
    <div className="pv-marquee">
      <div className="pv-marquee__track">
        {[...words, ...words].map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
    </div>
  )
}

export function StaggeredGrid({ scrollRootRef }) {
  const [ref, inView] = useInView(scrollRootRef)
  const items = [1, 2, 3, 4, 5, 6]
  return (
    <div className="pv-stagger" ref={ref}>
      {items.map((i) => (
        <div
          className={'pv-stagger__item' + (inView ? ' pv-stagger__item--in' : '')}
          key={i}
          style={{ transitionDelay: `${i * 90}ms` }}
        >
          <span className="pv-stagger__dot" />
        </div>
      ))}
    </div>
  )
}

export function HangingSignDemo({ scrollRootRef }) {
  const [ref, inView] = useInView(scrollRootRef)
  const boardRef = useRef(null)
  const played = useRef(false)

  useEffect(() => {
    if (!inView || played.current) return
    played.current = true
    gsap.fromTo(
      boardRef.current,
      { y: -60, opacity: 0, rotation: -6 },
      { y: 0, opacity: 1, rotation: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' }
    )
  }, [inView])

  return (
    <div className="pv-hanging" ref={ref}>
      <div className="pv-hanging__bracket" />
      <div className="pv-hanging__board" ref={boardRef}>
        <span className="mono-label">Announcement</span>
        <p>New collection dropping soon.</p>
      </div>
    </div>
  )
}

export function CursorSpotlight() {
  const ref = useRef(null)
  const [pos, setPos] = useState({ x: 50, y: 50, on: false })

  function handleMove(e) {
    const rect = ref.current.getBoundingClientRect()
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, on: true })
  }

  return (
    <div
      className="pv-spotlight"
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => setPos((p) => ({ ...p, on: false }))}
    >
      {pos.on && (
        <div
          className="pv-spotlight__glow"
          style={{ left: pos.x, top: pos.y }}
        />
      )}
      <span className="mono-label">Move your cursor here</span>
    </div>
  )
}

export function CardHoverLift() {
  const cards = ['Design', 'Build', 'Launch']
  return (
    <div className="pv-lift-row">
      {cards.map((c) => (
        <div className="pv-lift-card" key={c}>
          <span className="pv-lift-card__badge" />
          <span className="pv-lift-card__label mono-label">{c}</span>
        </div>
      ))}
    </div>
  )
}

export function BlueprintLineDraw({ scrollRootRef }) {
  const [ref, inView] = useInView(scrollRootRef)
  return (
    <div className="pv-blueprint-line" ref={ref}>
      <span className="pv-blueprint-line__tick" />
      <svg viewBox="0 0 400 2" preserveAspectRatio="none" className={inView ? 'pv-blueprint-line__svg pv-blueprint-line__svg--drawn' : 'pv-blueprint-line__svg'}>
        <line x1="0" y1="1" x2="400" y2="1" stroke="var(--pv-b, var(--orange))" strokeWidth="2" strokeDasharray="400" />
      </svg>
      <span className="pv-blueprint-line__tick" />
    </div>
  )
}

export function CurtainReveal({ scrollRootRef }) {
  const [ref, inView] = useInView(scrollRootRef)
  return (
    <div className="pv-curtain" ref={ref}>
      <div className="pv-curtain__content">
        <div className="pv-curtain__title" />
        <div className="pv-curtain__line" />
      </div>
      <div className={'pv-curtain__panel' + (inView ? ' pv-curtain__panel--open' : '')} />
    </div>
  )
}

export function GooeyMenuHover() {
  const links = ['Home', 'Work', 'About', 'Contact']
  const [hoverIndex, setHoverIndex] = useState(0)
  return (
    <div className="pv-gooey-nav">
      <div className="pv-gooey-nav__pill" style={{ transform: `translateX(${hoverIndex * 100}%)` }} />
      {links.map((l, i) => (
        <button type="button" key={l} className="pv-gooey-nav__link" onMouseEnter={() => setHoverIndex(i)}>
          {l}
        </button>
      ))}
    </div>
  )
}

export function BeforeAfterSlider() {
  const [split, setSplit] = useState(50)
  return (
    <div className="pv-ba">
      <div className="pv-ba__after">
        <span className="mono-label">AFTER</span>
      </div>
      <div className="pv-ba__before" style={{ width: `${split}%` }}>
        <span className="mono-label">BEFORE</span>
      </div>
      <div className="pv-ba__handle" style={{ left: `${split}%` }} />
      <input
        type="range"
        min="0"
        max="100"
        value={split}
        onChange={(e) => setSplit(Number(e.target.value))}
        className="pv-ba__range"
        aria-label="Before/after comparison"
      />
    </div>
  )
}

export function MasonryCascade({ scrollRootRef }) {
  const [ref, inView] = useInView(scrollRootRef)
  const heights = [70, 110, 90, 130, 80, 100]
  return (
    <div className="pv-masonry" ref={ref}>
      {heights.map((h, i) => (
        <div
          key={i}
          className={'pv-masonry__block' + (inView ? ' pv-masonry__block--in' : '')}
          style={{ height: h, transitionDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  )
}

export function ImageTiltHover() {
  const ref = useRef(null)
  const [style, setStyle] = useState({})

  function handleMove(e) {
    const rect = ref.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setStyle({ transform: `perspective(600px) rotateX(${-py * 10}deg) rotateY(${px * 10}deg) scale(1.02)` })
  }

  return (
    <div
      className="pv-image-tilt"
      ref={ref}
      style={style}
      onMouseMove={handleMove}
      onMouseLeave={() => setStyle({ transform: 'perspective(600px) rotateX(0) rotateY(0) scale(1)' })}
    >
      <span className="mono-label">Showcase image</span>
    </div>
  )
}

export function SoundActionDemo({ soundName, label }) {
  const { playPreviewSound } = useAudio()
  const [pulsed, setPulsed] = useState(false)

  function handleClick() {
    playPreviewSound(soundName)
    setPulsed(true)
    setTimeout(() => setPulsed(false), 450)
  }

  return (
    <div className="pv-block pv-block--center">
      <button type="button" className={'pv-sound-btn' + (pulsed ? ' pv-sound-btn--pulsed' : '')} onClick={handleClick}>
        {label}
        {pulsed && <span className="pv-sound-btn__check">✓</span>}
      </button>
    </div>
  )
}

export function ButtonPopDemo() {
  const { playPreviewSound } = useAudio()
  const [popped, setPopped] = useState(false)

  function handleClick() {
    playPreviewSound('buttonPop')
    setPopped(true)
    setTimeout(() => setPopped(false), 180)
  }

  return (
    <div className="pv-block pv-block--center">
      <button type="button" className={'pv-pop-btn' + (popped ? ' pv-pop-btn--pop' : '')} onClick={handleClick}>
        Tap me
      </button>
    </div>
  )
}

export function ShatterSplitDemo() {
  const [shattered, setShattered] = useState(false)
  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function handleClick() {
    setShattered(true)
    setTimeout(() => setShattered(false), 1500)
  }

  return (
    <div className="pv-shatter">
      <div className="pv-shatter__stage">
        <div className="pv-shatter__next">
          <span className="mono-label">Welcome</span>
        </div>
        {!shattered && (
          <div className="pv-shatter__current">
            <button type="button" className="pv-shatter__cta" onClick={handleClick}>
              Get Started →
            </button>
          </div>
        )}
        {shattered &&
          (reducedMotion ? (
            <div className="pv-shatter__fade" />
          ) : (
            Array.from({ length: 6 }).map((_, i) => <span key={i} className={`pv-shatter__shard pv-shatter__shard--${i}`} />)
          ))}
      </div>
    </div>
  )
}

export function SeoBadge() {
  return (
    <div className="pv-seo-badge">
      <span className="mono-label">SEO tags configured ✓</span>
    </div>
  )
}

export function ConfettiCannon() {
  const [firing, setFiring] = useState(false)
  const colors = ['var(--pv-a, var(--amber))', 'var(--pv-b, var(--orange))', '#fff']

  function handleClick() {
    setFiring(true)
    setTimeout(() => setFiring(false), 1200)
  }

  return (
    <div className="pv-block pv-block--center">
      <div className="pv-confetti-wrap">
        <button type="button" className="pv-sound-btn" onClick={handleClick}>
          Complete order
        </button>
        {firing &&
          Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              className="pv-confetti-piece"
              style={{
                left: `${45 + Math.random() * 10}%`,
                background: colors[i % colors.length],
                animationDelay: `${Math.random() * 0.15}s`,
                transform: `rotate(${Math.random() * 360}deg)`,
                '--dx': `${(Math.random() - 0.5) * 220}px`,
              }}
            />
          ))}
      </div>
    </div>
  )
}

export function CrackOpenReveal({ scrollRootRef }) {
  const [ref, inView] = useInView(scrollRootRef)
  return (
    <div className="pv-crack" ref={ref}>
      <div className="pv-crack__content">
        <span className="mono-label">Revealed</span>
      </div>
      <div className={'pv-crack__half pv-crack__half--top' + (inView ? ' pv-crack__half--open' : '')} />
      <div className={'pv-crack__half pv-crack__half--bottom' + (inView ? ' pv-crack__half--open' : '')} />
    </div>
  )
}
