import { useState } from 'react'
import './SocialPreviewCard.css'

const PLATFORMS = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'x', label: 'X' },
  { id: 'facebook', label: 'Facebook' },
]

export default function SocialPreviewCard({ siteName, domainUrl, palette }) {
  const [platform, setPlatform] = useState('whatsapp')
  const title = siteName || 'Your Brand'
  const desc = `Official website of ${title} — built with Web4Web.`

  return (
    <div className="social-preview">
      <div className="social-preview__tabs">
        {PLATFORMS.map((p) => (
          <button
            type="button"
            key={p.id}
            className={'social-preview__tab' + (platform === p.id ? ' social-preview__tab--active' : '')}
            onClick={() => setPlatform(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className={`social-card social-card--${platform}`}>
        <div className="social-card__image" style={{ background: `linear-gradient(135deg, ${palette[1]}, ${palette[2]})` }}>
          <span style={{ color: palette[0] }}>{title.slice(0, 1).toUpperCase()}</span>
        </div>
        <div className="social-card__body">
          <div className="social-card__domain">{domainUrl}</div>
          <div className="social-card__title">{title}</div>
          <div className="social-card__desc">{desc}</div>
        </div>
      </div>
    </div>
  )
}
