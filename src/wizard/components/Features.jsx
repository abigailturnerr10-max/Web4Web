import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import './Features.css'

const FEATURES = [
  { title: 'Fully custom-built', desc: "Not a template platform like Shopify — your site is built for you, not assembled from a theme." },
  { title: 'Your own domain', desc: 'A real domain, included as part of the build — not a subdomain you never fully own.' },
  { title: 'Guided, with live preview', desc: 'Every choice you make updates a real, interactive preview as you go.' },
  { title: 'Transparent pricing', desc: 'Every add-on shows its price upfront — no hidden costs at checkout.' },
  { title: 'Done-for-you execution', desc: 'You pick what you want; we build and finish everything — you never touch a code editor.' },
  { title: 'Local & global payments', desc: 'Flutterwave and Paystack for Nigeria, Stripe for international customers — set up either way.' },
]

export default function Features() {
  const sectionRef = useRef(null)

  useEffect(() => {
    const items = sectionRef.current?.querySelectorAll('.feature-card')
    if (!items?.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          gsap.fromTo(
            entry.target,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
          )
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.3 }
    )
    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="features" ref={sectionRef}>
      <div className="features__inner">
        <span className="eyebrow">Why Web4Web</span>
        <h2 className="features__title">What makes this different</h2>
        <div className="features__grid">
          {FEATURES.map((f, i) => (
            <div className="feature-card" key={f.title} style={{ opacity: 0 }}>
              <span className="feature-card__index mono-label">{String(i + 1).padStart(2, '0')}</span>
              <div className="feature-card__title">{f.title}</div>
              <p className="feature-card__desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
