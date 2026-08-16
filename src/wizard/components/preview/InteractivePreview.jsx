import { useEffect, useRef, useState } from 'react'
import { ESSENTIAL_PREVIEW_TIERS } from '../../config/catalog.js'
import { HERO_COPY, HERO_COPY_BY_TYPE } from './previewCopy.js'
import { WhatWeDo, HowItWorks, WhyTiers, SocialProof, ContactCTA, FooterReal, SeeItInAction } from './PreviewContent.jsx'
import {
  ScrambleHeading,
  AnimatedCounters,
  MagneticButton,
  TiltCards,
  HorizontalGallery,
  PinnedFeature,
  Marquee,
  StaggeredGrid,
  HangingSignDemo,
  CursorSpotlight,
  CardHoverLift,
  BlueprintLineDraw,
  CurtainReveal,
  GooeyMenuHover,
  BeforeAfterSlider,
  MasonryCascade,
  ImageTiltHover,
  SoundActionDemo,
  ButtonPopDemo,
  ShatterSplitDemo,
  SeoBadge,
  ConfettiCannon,
  CrackOpenReveal,
} from './PreviewEffects.jsx'
import './InteractivePreview.css'

const TYPE_NAV_LINK = { business: 'Services', portfolio: 'Work', store: 'Shop' }

// Placeholder path — swap a real branded loop in here and it plays with zero
// code changes. Until then, a real file isn't dropped in yet, so the
// <video> tag is never even rendered — the Ken-Burns pan/zoom on the
// graphic beneath it is the visible "video." A HEAD request (below) checks
// once per page load rather than letting the browser attempt to load and
// decode a URL that Vite's dev-server SPA fallback silently answers with
// index.html (text/html) instead of a 404 — that's what previously produced
// "no decoders for requested formats: text/html" in the console on every
// video-hero render.
const VIDEO_HERO_SRC = '/video/hero-loop.mp4'

let videoAvailabilityPromise = null
function checkVideoAvailable() {
  if (!videoAvailabilityPromise) {
    videoAvailabilityPromise = fetch(VIDEO_HERO_SRC, { method: 'HEAD' })
      .then((res) => res.ok && (res.headers.get('content-type') || '').startsWith('video/'))
      .catch(() => false)
  }
  return videoAvailabilityPromise
}

// Which tiers each essential-preview id renders on, per TIER_INCLUSIONS in catalog.js.
function hasEssential(id, tier) {
  return (ESSENTIAL_PREVIEW_TIERS[id] || []).includes(tier)
}

export default function InteractivePreview({ websiteType, baseTemplateId, heroStyleId, effectIds, palette, url }) {
  const scrollRef = useRef(null)
  const [activePage, setActivePage] = useState('home')
  const [scrollPct, setScrollPct] = useState(0)
  const [navScrolled, setNavScrolled] = useState(false)
  const [showIntro, setShowIntro] = useState(effectIds.includes('loading-intro'))

  const hasEffect = (id) => effectIds.includes(id)
  const hasTierEssential = (id) => hasEssential(id, baseTemplateId)
  const extraNavLink = TYPE_NAV_LINK[websiteType]
  const isMotionHero = heroStyleId === 'video' || hasEffect('ai-video-hero')
  const tier = baseTemplateId || 'plain'
  const navOverlay = tier !== 'plain'

  useEffect(() => {
    if (!effectIds.includes('loading-intro')) {
      setShowIntro(false)
      return
    }
    setShowIntro(true)
    const t = setTimeout(() => setShowIntro(false), 900)
    return () => clearTimeout(t)
  }, [effectIds])

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    setScrollPct(max > 0 ? (el.scrollTop / max) * 100 : 0)
    setNavScrolled(el.scrollTop > 40)
  }

  const themeVars = { '--pv-ink': palette[0], '--pv-a': palette[1], '--pv-b': palette[2] }

  return (
    <div className="mock-browser">
      <div className="mock-browser__chrome">
        <span className="mock-browser__dot" />
        <span className="mock-browser__dot" />
        <span className="mock-browser__dot" />
        <div className="mock-browser__url">{url}</div>
        {hasTierEssential('seo-tags') && <SeoBadge />}
      </div>

      <div
        className={'mock-site-scroll' + (hasEffect('custom-cursor') ? ' mock-site--custom-cursor' : '')}
        style={themeVars}
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {hasEffect('scroll-progress') && (
          <div className="pv-progress-track">
            <div className="pv-progress-fill" style={{ width: `${scrollPct}%` }} />
          </div>
        )}

        {showIntro && (
          <div className="pv-intro">
            <span className="pv-intro__mark">W4W</span>
          </div>
        )}

        <div className="pv-ribbon">
          Base representation — your final site is fully tailored, details shared after payment.
        </div>

        <div
          className={
            'mock-nav' + (navOverlay ? ' mock-nav--overlay' : '') + (navOverlay && navScrolled ? ' mock-nav--scrolled' : '')
          }
        >
          <span className="mock-nav__brand">{websiteType ? websiteType.toUpperCase() : 'YOURBRAND'}</span>
          <div className="mock-nav__links">
            <button
              type="button"
              className={'mock-nav__tab' + (navOverlay ? ' mock-nav__tab--underline' : '') + (activePage === 'home' ? ' mock-nav__tab--active' : '')}
              onClick={() => setActivePage('home')}
            >
              Home
            </button>
            <button
              type="button"
              className={'mock-nav__tab' + (navOverlay ? ' mock-nav__tab--underline' : '') + (activePage === 'about' ? ' mock-nav__tab--active' : '')}
              onClick={() => setActivePage('about')}
            >
              About
            </button>
            {navOverlay && extraNavLink && (
              <span className="mock-nav__link mock-nav__link--underline">{extraNavLink}</span>
            )}
            <span
              className={'mock-nav__link' + (navOverlay ? ' mock-nav__link--underline' : '') + (websiteType === 'business' ? ' mock-nav__link--cta' : '')}
            >
              {websiteType === 'business' ? 'Book Now' : 'Contact'}
            </span>
            {websiteType === 'store' && (
              <span className="mock-nav__cart" aria-hidden="true">
                🛒<span className="mock-nav__cart-count">2</span>
              </span>
            )}
          </div>
        </div>

        <div
          key={activePage}
          className={'pv-page' + (hasEffect('page-transitions') ? ' pv-page--transition' : '')}
        >
          {activePage === 'home' ? (
            <HomeContent
              tier={tier}
              websiteType={websiteType}
              heroStyleId={heroStyleId}
              isMotionHero={isMotionHero}
              hasEffect={hasEffect}
              scrollRootRef={scrollRef}
            />
          ) : (
            <AboutContent />
          )}
        </div>

        <ContactCTA tier={tier} />
        <FooterReal tier={tier} />
      </div>
    </div>
  )
}

function HomeContent({ tier, websiteType, heroStyleId, isMotionHero, hasEffect, scrollRootRef }) {
  const standardPlus = tier !== 'plain'

  return (
    <>
      <Hero tier={tier} websiteType={websiteType} heroStyleId={heroStyleId} isMotionHero={isMotionHero} hasEffect={hasEffect} />

      {hasEffect('crack-open-reveal') && <CrackOpenReveal scrollRootRef={scrollRootRef} />}
      {hasEffect('hanging-sign-reveal') && <HangingSignDemo scrollRootRef={scrollRootRef} />}
      {hasEffect('marquee') && <Marquee />}
      {hasEffect('animated-counters') && <AnimatedCounters scrollRootRef={scrollRootRef} />}

      {hasEffect('text-scramble') && (
        <div className="pv-block">
          <ScrambleHeading scrollRootRef={scrollRootRef} text="BUILT TO CONVERT" />
        </div>
      )}

      {hasEffect('card-tilt') && (
        <div className="pv-block">
          <TiltCards />
        </div>
      )}

      {hasEffect('horizontal-gallery') && (
        <div className="pv-block">
          <HorizontalGallery />
        </div>
      )}

      {hasEffect('pinned-sections') && <PinnedFeature />}

      {hasEffect('staggered-reveal') && (
        <div className="pv-block">
          <StaggeredGrid scrollRootRef={scrollRootRef} />
        </div>
      )}

      {hasEffect('magnetic-buttons') && (
        <div className="pv-block pv-block--center">
          <MagneticButton />
        </div>
      )}

      {hasEffect('cursor-spotlight') && (
        <div className="pv-block">
          <CursorSpotlight />
        </div>
      )}

      {hasEffect('card-hover-lift') && (
        <div className="pv-block">
          <CardHoverLift />
        </div>
      )}

      {hasEffect('blueprint-line-draw') && <BlueprintLineDraw scrollRootRef={scrollRootRef} />}

      {hasEffect('curtain-reveal') && <CurtainReveal scrollRootRef={scrollRootRef} />}

      {hasEffect('gooey-menu-hover') && (
        <div className="pv-block">
          <GooeyMenuHover />
        </div>
      )}

      {hasEffect('before-after-slider') && (
        <div className="pv-block">
          <BeforeAfterSlider />
        </div>
      )}

      {hasEffect('masonry-cascade') && <MasonryCascade scrollRootRef={scrollRootRef} />}

      {hasEffect('image-tilt-hover') && (
        <div className="pv-block">
          <ImageTiltHover />
        </div>
      )}

      {hasEffect('success-chime') && <SoundActionDemo soundName="successChime" label="Add to cart" />}
      {hasEffect('playful-sound-variant') && <SoundActionDemo soundName="playfulChime" label="Add to cart (playful)" />}
      {hasEffect('button-pop') && <ButtonPopDemo />}
      {hasEffect('confetti-cannon') && <ConfettiCannon />}
      {hasEffect('shatter-split') && <ShatterSplitDemo />}

      <WhatWeDo tier={tier} siteType={websiteType} />

      {/* How It Works, Why Tiers, and Social proof are a real structural omission at
          Plain — matching its "up to 3 pages" scope, not just a style downgrade. */}
      {standardPlus && <HowItWorks tier={tier} siteType={websiteType} scrollRootRef={scrollRootRef} />}
      {standardPlus && <WhyTiers tier={tier} />}
      {standardPlus && <SocialProof />}
      {tier === 'rich' && <SeeItInAction siteType={websiteType} scrollRootRef={scrollRootRef} />}
    </>
  )
}

function AboutContent() {
  return (
    <div className="pv-about">
      <h2 className="pv-about__heading">About Web4Web</h2>
      <p className="pv-about__body">
        Web4Web is a done-for-you website service — you pick your type, tier, and style in a live configurator, we
        design and build the real thing, and you launch on your own domain. No templates to wrestle with, no
        surprise invoice: every choice you make shows its price as you go.
      </p>
    </div>
  )
}

// A light visual tell per siteType on the hero graphic itself, not just the
// copy beside it — a generic representative icon per genre, not any real
// brand's actual product photography/layout.
const HERO_GRAPHIC_BADGE = { store: '🏷️ ₦14,500', portfolio: '🖼️ Case study', business: '📋 Free consult' }

function HeroGraphic({ isVideo, websiteType }) {
  const [videoAvailable, setVideoAvailable] = useState(false)

  useEffect(() => {
    if (!isVideo) return
    let cancelled = false
    checkVideoAvailable().then((available) => {
      if (!cancelled) setVideoAvailable(available)
    })
    return () => {
      cancelled = true
    }
  }, [isVideo])

  const badge = HERO_GRAPHIC_BADGE[websiteType]

  return (
    <div className="mock-hero__graphic" aria-hidden="true">
      <div className="mock-hero__graphic-chrome">
        <span />
        <span />
        <span />
      </div>
      <div className={'mock-hero__graphic-body' + (isVideo ? ' mock-hero__graphic-body--motion' : '')}>
        {isVideo && videoAvailable && (
          <video
            className="mock-hero__video"
            src={VIDEO_HERO_SRC}
            autoPlay
            loop
            muted
            playsInline
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        )}
        {badge && <span className="mock-hero__graphic-badge">{badge}</span>}
      </div>
    </div>
  )
}

function HeroCopy({ hasEffect, typing, websiteType }) {
  const copy = HERO_COPY_BY_TYPE[websiteType] || HERO_COPY
  if (typing) {
    return (
      <div className="mock-hero__copy">
        <div className="mock-hero__typing">
          <span className="mock-hero__typing-text">{copy.headline}</span>
          <span className="mock-hero__typing-caret" />
        </div>
        <p className="mock-hero__subheadline">{copy.subheadline}</p>
        <span className={'mock-hero__cta' + (hasEffect('micro-interactions') ? ' mock-hero__cta--pulse' : '')}>
          {copy.cta}
        </span>
      </div>
    )
  }
  return (
    <div className={'mock-hero__copy' + (hasEffect('glassmorphism') ? ' mock-hero__copy--glass' : '')}>
      <h1 className="mock-hero__headline">{copy.headline}</h1>
      <p className="mock-hero__subheadline">{copy.subheadline}</p>
      <span className={'mock-hero__cta' + (hasEffect('micro-interactions') ? ' mock-hero__cta--pulse' : '')}>
        {copy.cta}
      </span>
    </div>
  )
}

function Hero({ tier, websiteType, heroStyleId, isMotionHero, hasEffect }) {
  const isVideo = heroStyleId === 'video'
  return (
    <div className={`mock-hero mock-hero--${heroStyleId} mock-hero--tier-${tier}`}>
      {heroStyleId === 'static' && <HeroGraphic isVideo={isMotionHero} websiteType={websiteType} />}

      {isVideo && <HeroGraphic isVideo websiteType={websiteType} />}

      {heroStyleId === 'full-bleed' && <HeroGraphic isVideo={isMotionHero} websiteType={websiteType} />}

      {heroStyleId === 'line-draw' && (
        <svg className="mock-hero__line" viewBox="0 0 200 60" fill="none">
          <path d="M4 40 Q 50 4 100 30 T 196 20" stroke="var(--pv-b)" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}

      {heroStyleId === 'parallax' && (
        <>
          <span className="mock-hero__layer mock-hero__layer--1" />
          <span className="mock-hero__layer mock-hero__layer--2" />
        </>
      )}

      {heroStyleId === 'floating-shapes' && (
        <>
          <span className="mock-hero__shape mock-hero__shape--1" />
          <span className="mock-hero__shape mock-hero__shape--2" />
          <span className="mock-hero__shape mock-hero__shape--3" />
        </>
      )}

      {heroStyleId === 'illustrated' && <div className="mock-hero__character" />}

      {heroStyleId === 'split-screen' ? (
        <div className="mock-hero__split">
          <HeroCopy hasEffect={hasEffect} websiteType={websiteType} />
          <HeroGraphic isVideo={isMotionHero} websiteType={websiteType} />
        </div>
      ) : (
        <HeroCopy hasEffect={hasEffect} websiteType={websiteType} typing={heroStyleId === 'typing-headline'} />
      )}
    </div>
  )
}
