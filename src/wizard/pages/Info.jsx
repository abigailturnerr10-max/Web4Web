import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StepLayout from '../layout/StepLayout.jsx'
import SetupGuide from '../components/SetupGuide.jsx'
import ManualTransferUpload from '../components/ManualTransferUpload.jsx'
import { useOrderStore } from '../store/orderStore.js'
import { useAudio } from '../AudioContext.jsx'
import { SITE_TYPES, DELIVERY_OPTIONS, PAYMENT_ACCEPTANCE_METHODS, formatPrice } from '../config/catalog.js'
import { GUIDES_FOR_METHOD, SETUP_GUIDES } from '../clientPayments.js'
import './Info.css'

const PROCESS_STEPS = [
  { title: 'Tell us about your business', desc: 'Fill in this page — your info, content, images, and how you\'ll take payments.' },
  { title: 'Choose your style', desc: 'Pick a template, hero style, effects and visual identity in a live preview.' },
  { title: 'Pick your timeline', desc: 'Standard (free) or Rush (+₦20,000) — you choose the pace.' },
  { title: 'Review & pay', desc: 'See the full breakdown, edit anything, then pay securely.' },
  { title: 'We build it', desc: "You'll get updates by WhatsApp while we build your site." },
  { title: 'Launch', desc: 'Final review, then your site goes live on your domain.' },
]

const REQUIREMENTS = [
  { title: 'Business info', desc: 'Your business/brand name, a short description, and what makes you different.' },
  { title: 'Content', desc: 'Any text you already have — about, services, product descriptions. We can help write it if not.' },
  { title: 'Images', desc: 'Logo, product photos, team photos — anything on-brand. Stock images used if none provided.' },
  { title: 'Domain preference', desc: "What you'd like your website address to be — you'll pick it in the next step." },
]

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function Info() {
  const navigate = useNavigate()
  const order = useOrderStore((s) => s.order)
  const setContact = useOrderStore((s) => s.setContact)
  const { playWhoosh } = useAudio()

  const siteType = SITE_TYPES.find((t) => t.id === order.siteType)

  const canContinue = useMemo(() => {
    return (
      Boolean(order.siteType) &&
      isValidEmail(order.contact.email) &&
      order.contact.whatsapp.trim().length >= 7 &&
      Boolean(order.paymentAcceptance.method)
    )
  }, [order.siteType, order.contact, order.paymentAcceptance.method])

  return (
    <StepLayout currentPath="/info">
      <section className="info-intro">
        <span className="eyebrow">How it works</span>
        <h1 className="section-heading__title">Let's get the details we need</h1>
        <p className="section-heading__desc">
          A few quick sections, then you'll move to a live style builder where you can see and price your site as you go.
        </p>
      </section>

      <section className="info-block">
        <h2 className="info-block__title">The process, step by step</h2>
        <ol className="process-list">
          {PROCESS_STEPS.map((step, i) => (
            <li className="process-list__item" key={step.title}>
              <span className="process-list__index mono-label">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <div className="process-list__title">{step.title}</div>
                <p className="process-list__desc">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="info-block">
        <h2 className="info-block__title">What we need from you</h2>
        <div className="requirements-grid">
          {REQUIREMENTS.map((r) => (
            <div className="card requirements-grid__item" key={r.title}>
              <div className="requirements-grid__title">{r.title}</div>
              <p className="requirements-grid__desc">{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="info-block">
        <h2 className="info-block__title">Turnaround times</h2>
        <div className="timeline-cards">
          <div className="card timeline-card">
            <span className="mono-label">{DELIVERY_OPTIONS.standard.label.toUpperCase()}</span>
            <div className="timeline-card__days">{DELIVERY_OPTIONS.standard.days}</div>
            <div className="timeline-card__price">Free</div>
          </div>
          <div className="card timeline-card timeline-card--rush">
            <span className="mono-label">{DELIVERY_OPTIONS.rush.label.toUpperCase()}</span>
            <div className="timeline-card__days">{DELIVERY_OPTIONS.rush.days}</div>
            <div className="timeline-card__price">+{formatPrice(DELIVERY_OPTIONS.rush.price)}</div>
          </div>
        </div>
        <p className="info-block__hint">You'll confirm this again before checkout — it's not locked in yet.</p>
      </section>

      <ClientPaymentSection />

      <section className="info-block">
        <h2 className="info-block__title">What kind of website?</h2>
        {siteType ? (
          <div className="card type-recap">
            <div className="type-recap__label">{siteType.label}</div>
            <p className="type-recap__desc">{siteType.description}</p>
          </div>
        ) : (
          <p className="info-block__hint">
            No website type selected yet — head back to the homepage to choose one first.
          </p>
        )}
      </section>

      <section className="info-block">
        <h2 className="info-block__title">How can we reach you?</h2>
        <div className="contact-grid">
          <div className="field">
            <label htmlFor="name">Your name (optional)</label>
            <input
              id="name"
              type="text"
              className="text-input"
              placeholder="Your name"
              value={order.contact.name}
              onChange={(e) => setContact({ name: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="email">Email (Gmail preferred)</label>
            <input
              id="email"
              type="email"
              className="text-input"
              placeholder="you@gmail.com"
              value={order.contact.email}
              onChange={(e) => setContact({ email: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="whatsapp">WhatsApp number</label>
            <input
              id="whatsapp"
              type="tel"
              className="text-input"
              placeholder="+234 8xx xxx xxxx"
              value={order.contact.whatsapp}
              onChange={(e) => setContact({ whatsapp: e.target.value })}
            />
          </div>
        </div>
        {!canContinue && (
          <p className="info-block__hint">
            {!order.paymentAcceptance.method
              ? 'Pick how your site will accept payments above, and fill in your email and WhatsApp number, to continue.'
              : 'Fill in your email and WhatsApp number to continue.'}
          </p>
        )}
      </section>

      <div className="info-actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={!canContinue}
          data-no-tap-sound
          onClick={() => {
            playWhoosh()
            navigate('/configurator')
          }}
        >
          Continue to Configurator →
        </button>
      </div>
    </StepLayout>
  )
}

function ClientPaymentSection() {
  const order = useOrderStore((s) => s.order)
  const setPaymentAcceptance = useOrderStore((s) => s.setPaymentAcceptance)
  const selectedId = order.paymentAcceptance.method
  const [expanded, setExpanded] = useState(false)
  const [activeGuideId, setActiveGuideId] = useState(null)

  function selectMethod(id) {
    setPaymentAcceptance(id)
    setExpanded(true)
    const guides = GUIDES_FOR_METHOD[id] || []
    setActiveGuideId(guides[0] || null)
  }

  const guideIds = GUIDES_FOR_METHOD[selectedId] || []

  return (
    <section className="info-block">
      <h2 className="info-block__title">How will your site accept payments from your customers?</h2>
      <p className="info-block__hint">
        This is how buyers will pay <em>you</em> once your site is live.
      </p>
      <div className="client-payment-grid">
        {PAYMENT_ACCEPTANCE_METHODS.map((opt) => (
          <button
            type="button"
            key={opt.id}
            className={'card client-payment-card' + (selectedId === opt.id ? ' client-payment-card--selected' : '')}
            onClick={() => selectMethod(opt.id)}
          >
            {opt.recommended && <span className="client-payment-card__badge">Recommended — {opt.recommended}</span>}
            <div className="client-payment-card__name">{opt.name}</div>
            <p>{opt.description}</p>
          </button>
        ))}
      </div>

      {selectedId === 'manual-transfer' && (
        <div className="client-payment-guide">
          <ManualTransferUpload />
        </div>
      )}

      {guideIds.length > 0 && (
        <div className="client-payment-guide">
          <button type="button" className="expand-toggle" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Hide setup guide' : 'Show setup guide →'}
          </button>
          {expanded && (
            <>
              {guideIds.length > 1 && (
                <div className="mood-tabs" style={{ marginTop: 14 }}>
                  {guideIds.map((gid) => (
                    <button
                      type="button"
                      key={gid}
                      className={'mood-tab' + (activeGuideId === gid ? ' mood-tab--active' : '')}
                      onClick={() => setActiveGuideId(gid)}
                    >
                      {SETUP_GUIDES[gid].title.replace('How to set up ', '')}
                    </button>
                  ))}
                </div>
              )}
              {activeGuideId && <SetupGuide {...SETUP_GUIDES[activeGuideId]} />}
            </>
          )}
        </div>
      )}
    </section>
  )
}
