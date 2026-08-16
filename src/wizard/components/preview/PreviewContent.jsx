import { useRef, useState } from 'react'
import useInView from './useInView.js'
import {
  WHAT_WE_DO,
  WHAT_WE_DO_BY_TYPE,
  HOW_IT_WORKS,
  HOW_IT_WORKS_BY_TYPE,
  WHY_TIERS,
  SOCIAL_PROOF,
  CONTACT_CTA,
  FOOTER_COPY,
  SHOWCASE_BY_TYPE,
  DEFAULT_SHOWCASE,
} from './previewCopy.js'

/**
 * The real, tier-gated Web4Web demo content shown in the live preview —
 * distinct from PreviewEffects.jsx, which demos individually-purchased
 * effects. Which of these sections render at all is decided by the caller
 * (InteractivePreview.jsx) per tier; components here just render their own
 * content once asked to.
 */

export function WhatWeDo({ tier, siteType }) {
  const cardTier = tier !== 'plain'
  const items = WHAT_WE_DO_BY_TYPE[siteType] || WHAT_WE_DO
  return (
    <section className={'pv-whatwedo' + (cardTier ? ' pv-whatwedo--cards' : '')}>
      {items.map((item) => (
        <div className={cardTier ? 'pv-whatwedo__card' : 'pv-whatwedo__plain'} key={item.title}>
          {cardTier && <span className="pv-whatwedo__icon" aria-hidden="true" />}
          <h4 className="pv-whatwedo__title">{item.title}</h4>
          <p className="pv-whatwedo__desc">{item.desc}</p>
        </div>
      ))}
    </section>
  )
}

export function HowItWorks({ tier, siteType, scrollRootRef }) {
  const [ref, inView] = useInView(scrollRootRef)
  const rich = tier === 'rich'
  const steps = HOW_IT_WORKS_BY_TYPE[siteType] || HOW_IT_WORKS
  return (
    <section className={'pv-howitworks' + (rich ? ' pv-howitworks--rich' : '')} ref={ref}>
      <h3 className="pv-section-heading">How it works</h3>
      <div className={'pv-howitworks__row' + (inView ? ' pv-howitworks__row--in' : '')}>
        <svg
          className={'pv-howitworks__connector' + (inView ? ' pv-howitworks__connector--in' : '')}
          viewBox="0 0 400 2"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <line x1="0" y1="1" x2="400" y2="1" stroke="var(--pv-b, var(--orange))" strokeWidth={rich ? 2 : 1.5} strokeDasharray="400" />
        </svg>
        {steps.map((step, i) => (
          <div className="pv-howitworks__step" key={step.title} style={{ transitionDelay: `${i * 120}ms` }}>
            <span className="pv-howitworks__num">{i + 1}</span>
            <h5 className="pv-howitworks__step-title">{step.title}</h5>
            <p className="pv-howitworks__step-desc">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function WhyTiers({ tier }) {
  return (
    <section className={'pv-whytiers' + (tier === 'rich' ? ' pv-whytiers--glass' : '')}>
      <h3 className="pv-section-heading">{WHY_TIERS.heading}</h3>
      <p className="pv-whytiers__body">{WHY_TIERS.body}</p>
    </section>
  )
}

export function SocialProof() {
  return (
    <section className="pv-socialproof">
      {SOCIAL_PROOF.map((t) => (
        <div className="pv-socialproof__card" key={t.role}>
          <p className="pv-socialproof__quote">&ldquo;{t.quote}&rdquo;</p>
          <span className="pv-socialproof__role mono-label">{t.role}</span>
        </div>
      ))}
    </section>
  )
}

function MagneticCtaButton({ magnetic }) {
  const ref = useRef(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  function handleMove(e) {
    if (!magnetic || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setOffset({
      x: (e.clientX - (rect.left + rect.width / 2)) * 0.3,
      y: (e.clientY - (rect.top + rect.height / 2)) * 0.3,
    })
  }

  return (
    <button
      type="button"
      ref={ref}
      className="pv-contactcta__btn"
      style={magnetic ? { transform: `translate(${offset.x}px, ${offset.y}px)` } : undefined}
      onMouseMove={handleMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
    >
      {CONTACT_CTA.primary}
    </button>
  )
}

export function ContactCTA({ tier }) {
  if (tier === 'plain') {
    return (
      <section className="pv-contactcta pv-contactcta--plain">
        <p>{CONTACT_CTA.body}</p>
      </section>
    )
  }
  const glass = tier === 'rich'
  return (
    <section className={'pv-contactcta' + (glass ? ' pv-contactcta--glass' : '')}>
      <h3 className="pv-section-heading">{CONTACT_CTA.heading}</h3>
      <p>{CONTACT_CTA.body}</p>
      <div className="pv-contactcta__actions">
        <MagneticCtaButton magnetic={glass} />
        <span className="pv-contactcta__secondary">{CONTACT_CTA.secondary}</span>
      </div>
    </section>
  )
}

export function FooterReal({ tier }) {
  if (tier === 'plain') {
    return (
      <footer className="pv-footer-real pv-footer-real--minimal">
        <div className="pv-footer-real__links">
          <span>Home</span>
          <span>Contact</span>
        </div>
        <span className="mono-label">© {new Date().getFullYear()} {FOOTER_COPY.brand}</span>
      </footer>
    )
  }
  const rich = tier === 'rich'
  return (
    <footer className={'pv-footer-real' + (rich ? ' pv-footer-real--full' : '')}>
      <div className="pv-footer-real__grid">
        <div className="pv-footer-real__col">
          <span className="pv-footer-real__brand mono-label">{FOOTER_COPY.brand}</span>
          <p>{FOOTER_COPY.tagline}</p>
          <div className="pv-footer-real__socials">
            {['IG', 'FB', 'X'].map((p) => (
              <span key={p} className="pv-footer-real__social">
                {p}
              </span>
            ))}
          </div>
        </div>
        <div className="pv-footer-real__col">
          <span className="mono-label">Quick Links</span>
          {FOOTER_COPY.quickLinks.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
        <div className="pv-footer-real__col">
          <span className="mono-label">Legal</span>
          {FOOTER_COPY.legalLinks.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
        {rich && (
          <div className="pv-footer-real__col">
            <span className="mono-label">Stay updated</span>
            <div className="pv-footer-real__newsletter">
              <input type="text" placeholder={FOOTER_COPY.newsletterPlaceholder} disabled />
              <button type="button" disabled>
                Join
              </button>
            </div>
          </div>
        )}
      </div>
      <span className="pv-footer-real__copyright mono-label">
        © {new Date().getFullYear()} {FOOTER_COPY.brand}
      </span>
    </footer>
  )
}

/** Rich tier only — "See it in action," varying by siteType. */
export function SeeItInAction({ siteType, scrollRootRef }) {
  const [ref, inView] = useInView(scrollRootRef)
  const data = SHOWCASE_BY_TYPE[siteType] || DEFAULT_SHOWCASE
  const variant = siteType || 'business'
  return (
    <section className={'pv-showcase' + (inView ? ' pv-showcase--in' : '')} ref={ref}>
      <h3 className="pv-section-heading">{data.heading}</h3>
      <p className="pv-showcase__body">{data.body}</p>
      <div className={`pv-showcase__grid pv-showcase__grid--${variant}`}>
        {data.items.map((item, i) => (
          <div className="pv-showcase__item" key={item.label} style={{ transitionDelay: `${i * 90}ms` }}>
            <span className="pv-showcase__media" aria-hidden="true" />
            <div className="pv-showcase__meta">
              <span className="pv-showcase__label">{item.label}</span>
              {item.price && <span className="pv-showcase__price mono-label">{item.price}</span>}
              {item.desc && <p className="pv-showcase__desc">{item.desc}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
