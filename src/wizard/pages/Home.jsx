import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Features from '../components/Features.jsx'
import AssemblingPreview from '../components/AssemblingPreview.jsx'
import HomeIntro from '../components/HomeIntro.jsx'
import { useOrderStore, calculateOrderTotal } from '../store/orderStore.js'
import { useAudio } from '../AudioContext.jsx'
import { SITE_TYPES, TEMPLATE_LIST, ONLINE_PAYMENTS_ADDON, formatPrice } from '../config/catalog.js'
import './Home.css'

const MAGNET_RADIUS = 110
const MAGNET_STRENGTH = 0.35
const INTRO_SEEN_KEY = 'web4web_intro_seen'

export default function Home() {
  const navigate = useNavigate()
  const { playWhoosh } = useAudio()
  const heroRef = useRef(null)
  const spotlightRef = useRef(null)
  const ctaRef = useRef(null)
  const magnetReadyRef = useRef(false)

  const order = useOrderStore((s) => s.order)
  const currency = useOrderStore((s) => s.currency)
  const setSiteType = useOrderStore((s) => s.setSiteType)
  const setTemplate = useOrderStore((s) => s.setTemplate)
  const setOnlinePayments = useOrderStore((s) => s.setOnlinePayments)

  // First-visit-only — separate from the order-draft resume flow entirely.
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return localStorage.getItem(INTRO_SEEN_KEY) !== 'true'
    } catch {
      return false
    }
  })

  function handleIntroDone() {
    try {
      localStorage.setItem(INTRO_SEEN_KEY, 'true')
    } catch {
      /* localStorage unavailable — intro will just replay next visit */
    }
    setShowIntro(false)
  }

  const siteType = order.siteType
  const tier = order.template.tier
  const onlinePaymentsEnabled = order.onlinePayments.enabled

  const showStep2 = Boolean(siteType)
  const showStep3 = Boolean(tier)
  const displayCurrency = currency || 'NGN'
  const total = calculateOrderTotal(order)

  // Magnetic CTA only starts responding once it's actually visible and settled.
  useEffect(() => {
    if (!showStep3) {
      magnetReadyRef.current = false
      return
    }
    const t = setTimeout(() => {
      magnetReadyRef.current = true
      if (ctaRef.current) ctaRef.current.style.transition = 'transform 0.15s ease-out'
    }, 400)
    return () => clearTimeout(t)
  }, [showStep3])

  // Signature interaction: cursor spotlight + magnetic CTA. Restrained on
  // purpose — the assembling preview is the signature moment, this is just
  // a soft accent under the visitor's cursor.
  useEffect(() => {
    const el = heroRef.current
    if (!el) return

    function handleMove(e) {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      if (spotlightRef.current) {
        spotlightRef.current.style.transform = `translate(${x}px, ${y}px)`
        spotlightRef.current.style.opacity = '1'
      }
      if (ctaRef.current && magnetReadyRef.current) {
        const btnRect = ctaRef.current.getBoundingClientRect()
        const bx = e.clientX - (btnRect.left + btnRect.width / 2)
        const by = e.clientY - (btnRect.top + btnRect.height / 2)
        const dist = Math.hypot(bx, by)
        if (dist < MAGNET_RADIUS) {
          const pull = (1 - dist / MAGNET_RADIUS) * MAGNET_STRENGTH
          ctaRef.current.style.transform = `translate(${bx * pull}px, ${by * pull}px)`
        } else {
          ctaRef.current.style.transform = 'translate(0, 0)'
        }
      }
    }

    function handleLeave() {
      if (spotlightRef.current) spotlightRef.current.style.opacity = '0'
      if (ctaRef.current) ctaRef.current.style.transform = 'translate(0, 0)'
    }

    el.addEventListener('mousemove', handleMove)
    el.addEventListener('mouseleave', handleLeave)
    return () => {
      el.removeEventListener('mousemove', handleMove)
      el.removeEventListener('mouseleave', handleLeave)
    }
  }, [])

  function handleContinue() {
    playWhoosh()
    navigate('/info')
  }

  return (
    <div className="home-page">
      {showIntro && <HomeIntro onDone={handleIntroDone} />}
      <section className="home" ref={heroRef}>
        <div className="home__spotlight" ref={spotlightRef} aria-hidden="true" />

        <div className="home__layout">
          <div className="home__questions">
            <div className="home__step">
              <span className="eyebrow">Step 1 of 3</span>
              <h1 className="home__question">What are you building?</h1>
              <div className="home__options">
                {SITE_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={'home__option' + (siteType === t.id ? ' home__option--active' : '')}
                    onClick={() => setSiteType(t.id)}
                  >
                    <span className="home__option-label">{t.label}</span>
                    <span className="home__option-desc">{t.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {showStep2 && (
              <div className="home__step home__step--in">
                <span className="eyebrow">Step 2 of 3</span>
                <h2 className="home__question">How powerful do you want it?</h2>
                <div className="home__options">
                  {TEMPLATE_LIST.map((t) => (
                    <button
                      key={t.tier}
                      type="button"
                      className={'home__option' + (tier === t.tier ? ' home__option--active' : '')}
                      onClick={() => setTemplate(t.tier)}
                    >
                      <span className="home__option-label">{t.name}</span>
                      <span className="home__option-desc">
                        {formatPrice(t.price, displayCurrency)} · up to {t.includedPages} pages
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showStep3 && (
              <div className="home__step home__step--in">
                <span className="eyebrow">Step 3 of 3</span>
                <h2 className="home__question">Need customers to pay online?</h2>
                <div className="home__toggle-row">
                  <button
                    type="button"
                    className={'home__toggle' + (onlinePaymentsEnabled ? ' home__toggle--on' : '')}
                    onClick={() => setOnlinePayments(!onlinePaymentsEnabled)}
                    aria-pressed={onlinePaymentsEnabled}
                  >
                    <span className="home__toggle-knob" />
                  </button>
                  <span className="home__toggle-label">
                    {onlinePaymentsEnabled
                      ? `Yes — adds ${formatPrice(ONLINE_PAYMENTS_ADDON.price, displayCurrency)}`
                      : 'Not for now'}
                  </span>
                </div>
              </div>
            )}

            {showStep3 && (
              <div className="home__step home__step--in home__finish">
                <div className="home__total">
                  <span className="mono-label">Estimated total</span>
                  <strong>{formatPrice(total, displayCurrency)}</strong>
                </div>
                <button type="button" ref={ctaRef} className="btn btn--primary home__cta" data-no-tap-sound onClick={handleContinue}>
                  Continue building →
                </button>
              </div>
            )}
          </div>

          <div className="home__preview-col">
            <AssemblingPreview siteType={siteType} tier={tier} onlinePayments={onlinePaymentsEnabled} />
          </div>
        </div>
      </section>

      <Features />
    </div>
  )
}
