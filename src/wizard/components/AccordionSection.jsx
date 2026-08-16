export default function AccordionSection({ id, title, subtitle, badge, open, onToggle, children }) {
  return (
    <section className={'accordion' + (open ? ' accordion--open' : '')}>
      <button type="button" className="accordion__header" onClick={() => onToggle(id)} aria-expanded={open}>
        <span className="accordion__header-text">
          <span className="accordion__title">{title}</span>
          {subtitle && <span className="accordion__subtitle">{subtitle}</span>}
        </span>
        {badge && <span className="accordion__badge">{badge}</span>}
        <span className="accordion__chevron" aria-hidden="true">
          ⌄
        </span>
      </button>
      <div className={'accordion__body-wrap' + (open ? ' accordion__body-wrap--open' : '')}>
        <div className="accordion__body">
          <div className="accordion__body-inner">{children}</div>
        </div>
      </div>
    </section>
  )
}
