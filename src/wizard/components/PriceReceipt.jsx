import { formatPrice } from '../config/catalog.js'
import './PriceReceipt.css'

export default function PriceReceipt({ lineItems, total, currency, sticky = true, title = 'Running total' }) {
  return (
    <div className={'receipt' + (sticky ? ' receipt--sticky' : '')}>
      <div className="receipt__header">
        <span className="mono-label">{title}</span>
        <span className="mono-label">{currency}</span>
      </div>
      <div className="receipt__items">
        {lineItems.length === 0 && <p className="receipt__empty">Nothing selected yet.</p>}
        {lineItems.map((item) => (
          <div className="receipt__row" key={item.key}>
            <span>{item.label}</span>
            <span className="receipt__amount">{formatPrice(item.amount, currency)}</span>
          </div>
        ))}
      </div>
      <div className="receipt__total">
        <span>Total</span>
        <span className="receipt__total-amount">{formatPrice(total, currency)}</span>
      </div>
    </div>
  )
}
