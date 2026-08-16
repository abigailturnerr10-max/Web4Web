import { useNavigate } from 'react-router-dom'
import StepLayout from '../layout/StepLayout.jsx'
import PriceReceipt from '../components/PriceReceipt.jsx'
import { useOrderStore, calculateOrderTotal, calculateOrderLineItems } from '../store/orderStore.js'
import { useAudio } from '../AudioContext.jsx'
import { DELIVERY_OPTIONS, formatPrice } from '../config/catalog.js'
import './Timeline.css'

export default function TimelinePage() {
  const navigate = useNavigate()
  const order = useOrderStore((s) => s.order)
  const currency = useOrderStore((s) => s.currency) || 'NGN'
  const setDelivery = useOrderStore((s) => s.setDelivery)
  const { playWhoosh } = useAudio()

  const lineItems = calculateOrderLineItems(order)
  const total = calculateOrderTotal(order)

  return (
    <StepLayout currentPath="/timeline">
      <section className="section-heading">
        <span className="eyebrow">Step 3 of 4</span>
        <h1 className="section-heading__title">How fast do you need it?</h1>
        <p className="section-heading__desc">Confirm your timeline — this is the last thing that affects price before checkout.</p>
      </section>

      <div className="timeline-options">
        {Object.values(DELIVERY_OPTIONS).map((t) => (
          <button
            type="button"
            key={t.id}
            className={'card timeline-option' + (order.delivery.type === t.id ? ' timeline-option--selected' : '')}
            onClick={() => setDelivery(t.id)}
          >
            <span className="mono-label">{t.label.toUpperCase()}</span>
            <div className="timeline-option__days">{t.days}</div>
            <div className="timeline-option__price">{t.price > 0 ? `+${formatPrice(t.price, currency)}` : 'Included'}</div>
          </button>
        ))}
      </div>

      <PriceReceipt lineItems={lineItems} total={total} currency={currency} sticky={false} title="Updated total" />

      <div className="timeline-actions">
        <button type="button" className="btn btn--ghost" onClick={() => navigate('/configurator')}>
          ← Back
        </button>
        <button
          type="button"
          className="btn btn--primary"
          data-no-tap-sound
          onClick={() => {
            playWhoosh()
            navigate('/review')
          }}
        >
          Continue to Review →
        </button>
      </div>
    </StepLayout>
  )
}
