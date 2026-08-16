import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import './AssemblingPreview.css'

const MIDDLE_LABEL = { store: 'Products', portfolio: 'Work', business: 'Services' }
const MIDDLE_ITEMS = { store: 4, portfolio: 3, business: 3 }

/**
 * Watches a website get constructed in real time — navbar, hero, a
 * type-relevant section, and footer each fly in from a different direction
 * the first time a site type is chosen. Tier and payment-toggle changes
 * update it live afterward without replaying the full assembly.
 */
export default function AssemblingPreview({ siteType, tier, onlinePayments }) {
  const wrapRef = useRef(null)
  const navRef = useRef(null)
  const heroRef = useRef(null)
  const middleRef = useRef(null)
  const footerRef = useRef(null)
  const paymentRef = useRef(null)
  const assembledRef = useRef(false)

  useEffect(() => {
    if (!siteType || assembledRef.current) return
    assembledRef.current = true
    gsap.set([navRef.current, heroRef.current, middleRef.current, footerRef.current], { opacity: 0 })
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.55 } })
    tl.fromTo(navRef.current, { y: -30, opacity: 0 }, { y: 0, opacity: 1 })
      .fromTo(heroRef.current, { x: -50, opacity: 0 }, { x: 0, opacity: 1 }, '-=0.25')
      .fromTo(middleRef.current, { x: 50, opacity: 0 }, { x: 0, opacity: 1 }, '-=0.3')
      .fromTo(footerRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1 }, '-=0.25')
  }, [siteType])

  useEffect(() => {
    if (!siteType) assembledRef.current = false
  }, [siteType])

  useEffect(() => {
    if (!tier || !wrapRef.current) return
    gsap.fromTo(wrapRef.current, { scale: 0.98 }, { scale: 1, duration: 0.4, ease: 'back.out(2)' })
  }, [tier])

  useEffect(() => {
    if (!onlinePayments || !paymentRef.current) return
    gsap.fromTo(paymentRef.current, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' })
  }, [onlinePayments])

  if (!siteType) {
    return (
      <div className="assemble-preview assemble-preview--empty">
        <span className="mono-label">Your preview appears here</span>
        <p>Answer the first question to watch your site come together.</p>
      </div>
    )
  }

  const density = tier || 'plain'
  const middleCount = MIDDLE_ITEMS[siteType] || 3
  const cardCount = density === 'plain' ? Math.min(2, middleCount) : middleCount

  return (
    <div className={`assemble-preview assemble-preview--${density}`} ref={wrapRef}>
      <div className="assemble-preview__chrome">
        <span className="assemble-preview__dot" />
        <span className="assemble-preview__dot" />
        <span className="assemble-preview__dot" />
        <span className="assemble-preview__url">yourbrand.com</span>
      </div>

      <div className="assemble-preview__body">
        <div className="assemble-nav" ref={navRef}>
          <span className="assemble-nav__brand">YOURBRAND</span>
          <div className="assemble-nav__links">
            <span>Home</span>
            <span>{MIDDLE_LABEL[siteType]}</span>
            {density !== 'plain' && <span>About</span>}
            <span>Contact</span>
          </div>
        </div>

        <div className="assemble-hero" ref={heroRef}>
          <div className="assemble-hero__copy">
            <span className="assemble-hero__title" />
            <span className="assemble-hero__subtitle" />
            <span className="assemble-hero__cta" />
          </div>
          <span className="assemble-hero__subject" />
        </div>

        <div className="assemble-middle" ref={middleRef}>
          <span className="assemble-middle__label mono-label">{MIDDLE_LABEL[siteType]}</span>
          <div className="assemble-middle__grid">
            {Array.from({ length: cardCount }).map((_, i) => (
              <div className={'assemble-card' + (density === 'rich' ? ' assemble-card--rich' : '')} key={i}>
                <span className="assemble-card__media" />
                <span className="assemble-card__line" />
                {density !== 'plain' && <span className="assemble-card__line assemble-card__line--short" />}
              </div>
            ))}
          </div>
        </div>

        {onlinePayments && (
          <div className="assemble-payment" ref={paymentRef}>
            <span className="assemble-payment__lock" aria-hidden="true">
              🔒
            </span>
            <span>Secure checkout</span>
            <span className="assemble-payment__pill">Pay now</span>
          </div>
        )}

        <div className="assemble-footer" ref={footerRef}>
          <span className="assemble-footer__col" />
          <span className="assemble-footer__col" />
          <span className="assemble-footer__col" />
        </div>
      </div>

      {density === 'rich' && <span className="assemble-preview__glow" aria-hidden="true" />}
    </div>
  )
}
