import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StepLayout from '../layout/StepLayout.jsx'
import OptionCard from '../components/OptionCard.jsx'
import ExpandToggle from '../components/ExpandToggle.jsx'
import AccordionSection from '../components/AccordionSection.jsx'
import InteractivePreview from '../components/preview/InteractivePreview.jsx'
import PriceReceipt from '../components/PriceReceipt.jsx'
import ColorWheelPicker from '../components/ColorWheelPicker.jsx'
import SocialPreviewCard from '../components/SocialPreviewCard.jsx'
import { useOrderStore, calculateOrderTotal, calculateOrderLineItems } from '../store/orderStore.js'
import { useAudio } from '../AudioContext.jsx'
import {
  SITE_TYPES,
  TEMPLATE_LIST,
  TEMPLATES,
  TIER_INCLUSIONS,
  HERO_STYLES,
  HERO_RECOMMENDATIONS,
  DEFAULT_HERO_RECOMMENDATION,
  EFFECT_PACKS,
  recommendedPackId,
  recommendedPackLabel,
  BEAUTIFICATION_EFFECTS,
  PREMIUM_EFFECTS,
  SIGNATURE_EFFECTS,
  EFFECT_CATEGORIES,
  SOCIAL_PREVIEW_ADDON,
  EXTRA_PAGE_PRICE,
  DOMAIN_TIERS,
  formatPrice,
} from '../config/catalog.js'
import { RECOMMENDED_THEMES, MOOD_FILTERS, DEFAULT_HUE, DEFAULT_PALETTE_TYPE, resolveActivePalette } from '../colorTheory.js'
import { POPULAR_HERO_IDS, POPULAR_BEAUTIFICATION_IDS, POPULAR_PREMIUM_IDS } from '../recommendations.js'
import './Configurator.css'

function detectCurrency() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    const lang = navigator.language || ''
    if (tz.includes('Lagos') || tz.includes('Africa') || lang.toLowerCase().includes('ng')) return 'NGN'
  } catch {
    /* ignore detection errors, fall back below */
  }
  return 'USD'
}

function orderedVisibleIds(recommendedId, popularIds, allIds, expanded) {
  const popular = popularIds.filter((id) => id !== recommendedId && allIds.includes(id))
  const rest = allIds.filter((id) => id !== recommendedId && !popular.includes(id))
  const base = recommendedId ? [recommendedId, ...popular] : popular
  return expanded ? [...base, ...rest] : base
}

export default function Configurator() {
  const navigate = useNavigate()
  const order = useOrderStore((s) => s.order)
  const currency = useOrderStore((s) => s.currency)
  const setCurrency = useOrderStore((s) => s.setCurrency)
  const setTemplate = useOrderStore((s) => s.setTemplate)
  const setHeroStyle = useOrderStore((s) => s.setHeroStyle)
  const setDomain = useOrderStore((s) => s.setDomain)
  const setDomainName = useOrderStore((s) => s.setDomainName)
  const toggleIndividualEffect = useOrderStore((s) => s.toggleIndividualEffect)
  const setEffectPack = useOrderStore((s) => s.setEffectPack)
  const setColorThemeMode = useOrderStore((s) => s.setColorThemeMode)
  const setColorThemeStyle = useOrderStore((s) => s.setColorThemeStyle)
  const setColorThemeHue = useOrderStore((s) => s.setColorThemeHue)
  const setColorThemeBrand = useOrderStore((s) => s.setColorThemeBrand)
  const pendingBrandAssetFile = useOrderStore((s) => s.pendingBrandAssetFile)
  const pendingBrandAssetPreviewUrl = useOrderStore((s) => s.pendingBrandAssetPreviewUrl)
  const setPendingBrandAssetFile = useOrderStore((s) => s.setPendingBrandAssetFile)
  const clearPendingBrandAssetFile = useOrderStore((s) => s.clearPendingBrandAssetFile)
  const addExtraPage = useOrderStore((s) => s.addExtraPage)
  const removeExtraPage = useOrderStore((s) => s.removeExtraPage)
  const setSocialPreview = useOrderStore((s) => s.setSocialPreview)
  const { playWhooshThenSuccess } = useAudio()

  const [heroExpanded, setHeroExpanded] = useState(false)
  const [beautyExpanded, setBeautyExpanded] = useState(false)
  const [premiumExpanded, setPremiumExpanded] = useState(false)
  const [showCustomPalette, setShowCustomPalette] = useState(false)
  const [showBrandColors, setShowBrandColors] = useState(false)
  // Mobile-only — desktop keeps the preview visible via the sticky side
  // column (CSS-driven, no JS involved there). Below the 900px breakpoint
  // that same column becomes a fixed slide-in drawer instead, gated by this
  // flag; the CSS for the drawer transform/backdrop only exists inside that
  // breakpoint's media query, so this state has zero effect on desktop.
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false)
  const [moodFilter, setMoodFilter] = useState('professional')
  const [openSection, setOpenSection] = useState(null)
  const [effectsTab, setEffectsTab] = useState(EFFECT_CATEGORIES[0].id)
  const [individualEffectsExpanded, setIndividualEffectsExpanded] = useState(false)

  const previewRef = useRef(null)
  const pulseTimeoutRef = useRef(null)

  useEffect(() => {
    if (currency === null) setCurrency(detectCurrency())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Smart default: pre-select the recommended hero for this site type, once —
  // only while nothing has been chosen yet. Picking anything (including the
  // recommendation itself) sets heroStyle.id, which stops this from firing again.
  useEffect(() => {
    if (!order.heroStyle.id && order.siteType) {
      const rec = HERO_RECOMMENDATIONS[order.siteType] || DEFAULT_HERO_RECOMMENDATION
      const hero = HERO_STYLES.find((h) => h.id === rec.heroId)
      if (hero) setHeroStyle(hero.id, hero.price)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.siteType, order.heroStyle.id])

  // Pre-select the recommended Effect Pack, once ever, via a persisted flag —
  // unlike the hero default above, a pack can be deliberately cleared, and a
  // component-local "did we auto-apply" ref would forget that on remount and
  // silently reapply the recommendation after a real removal.
  useEffect(() => {
    if (!order.effectPackTouched && order.siteType && order.template.tier) {
      setEffectPack(recommendedPackId(order.siteType, order.template.tier))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.siteType, order.template.tier])

  useEffect(() => () => clearTimeout(pulseTimeoutRef.current), [])

  function toggleSection(id) {
    setOpenSection((prev) => (prev === id ? null : id))
  }

  // Selection focus + highlight: scroll the live preview into view and give
  // it a brief glow pulse whenever any selection changes, so the client sees
  // what just changed rather than having to hunt for it.
  function pulsePreview() {
    const el = previewRef.current
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    el.classList.add('configurator__preview-sticky--pulse')
    clearTimeout(pulseTimeoutRef.current)
    pulseTimeoutRef.current = setTimeout(() => {
      el.classList.remove('configurator__preview-sticky--pulse')
    }, 1000)
  }

  function handleBaseTemplateSelect(tier) {
    setTemplate(tier)
    pulsePreview()
  }

  function selectHero(hero) {
    setHeroStyle(hero.id, hero.price)
    pulsePreview()
  }

  function selectCuratedTheme(theme) {
    setColorThemeStyle(theme.category, theme.id)
    setMoodFilter(theme.category)
    pulsePreview()
  }

  // "Select for me" doesn't auto-apply a palette — it flags the order so
  // Web4Web picks the theme personally. Picking any real option afterward
  // (curated or custom) overwrites this mode, so the client can still
  // change their mind at any point before checkout.
  function handleSelectForMe() {
    setColorThemeMode('admin-choice')
    pulsePreview()
  }

  function handleHueChange(hue) {
    setColorThemeHue(hue, order.colorTheme.paletteType || DEFAULT_PALETTE_TYPE)
  }

  function handlePaletteTypeChange(paletteType) {
    setColorThemeHue(order.colorTheme.hue ?? DEFAULT_HUE, paletteType)
  }

  function handleBrandHexChange(field, value) {
    setColorThemeBrand({ [field]: value })
    pulsePreview()
  }

  function handleBrandAssetFile(file) {
    if (!file) return
    setPendingBrandAssetFile(file)
  }

  function handleBrandAssetRemove() {
    clearPendingBrandAssetFile()
    // Also clears an asset already uploaded on a prior Review visit — pure
    // local-state removal, nothing to clean up in Storage since the file was
    // scoped to an order row that's about to be superseded by a fresh one
    // the next time Review saves (see saveOrderToSupabase's own comment on
    // always writing a fresh row).
    if (order.colorTheme.brandAssetUrl) setColorThemeBrand({ brandAssetUrl: '' })
  }

  function handleTldSelect(tld) {
    setDomain(tld)
    pulsePreview()
  }

  function handleExtraPagesChange(next) {
    const current = order.extraPages.length
    if (next > current) {
      addExtraPage()
    } else if (next < current) {
      const last = order.extraPages[order.extraPages.length - 1]
      if (last) removeExtraPage(last.id)
    }
    pulsePreview()
  }

  function handleSocialToggle() {
    setSocialPreview(!order.socialPreview.enabled)
    pulsePreview()
  }

  function handleToggleEffect(id) {
    toggleIndividualEffect(id)
    pulsePreview()
  }

  function handleSelectPack(id) {
    setEffectPack(order.effectPack?.id === id ? null : id)
    pulsePreview()
  }

  const siteTypeLabel = SITE_TYPES.find((t) => t.id === order.siteType)?.label || 'Your site'

  const lineItems = calculateOrderLineItems(order)
  const total = calculateOrderTotal(order)

  const resolvedCurrency = currency || 'NGN'
  const domainUrl = `${order.domain.desired || 'yourbrand'}${order.domain.type || '.com'}`
  const palette = resolveActivePalette(order.colorTheme)
  const currentTemplate = TEMPLATES[order.template.tier]
  const tierName = currentTemplate?.name
  const includedPages = currentTemplate?.includedPages ?? 3
  const tierInclusions = TIER_INCLUSIONS[order.template.tier] || []

  const heroRecommendation = HERO_RECOMMENDATIONS[order.siteType] || DEFAULT_HERO_RECOMMENDATION
  const allHeroIds = HERO_STYLES.map((h) => h.id)
  const collapsedHeroIds = orderedVisibleIds(heroRecommendation.heroId, POPULAR_HERO_IDS, allHeroIds, false)
  const hiddenHeroCount = allHeroIds.length - collapsedHeroIds.length
  const visibleHeroIds = heroExpanded ? orderedVisibleIds(heroRecommendation.heroId, POPULAR_HERO_IDS, allHeroIds, true) : collapsedHeroIds

  const allBeautyIds = BEAUTIFICATION_EFFECTS.map((e) => e.id)
  const collapsedBeautyIds = orderedVisibleIds(null, POPULAR_BEAUTIFICATION_IDS, allBeautyIds, false)
  const hiddenBeautyCount = allBeautyIds.length - collapsedBeautyIds.length
  const visibleBeautyIds = beautyExpanded ? allBeautyIds : collapsedBeautyIds

  const allPremiumIds = PREMIUM_EFFECTS.map((e) => e.id)
  const collapsedPremiumIds = orderedVisibleIds(null, POPULAR_PREMIUM_IDS, allPremiumIds, false)
  const hiddenPremiumCount = allPremiumIds.length - collapsedPremiumIds.length
  const visiblePremiumIds = premiumExpanded ? allPremiumIds : collapsedPremiumIds

  const filteredThemes = RECOMMENDED_THEMES.filter((t) => t.category === moodFilter)

  const currentHeroName = HERO_STYLES.find((h) => h.id === order.heroStyle.id)?.name
  const currentThemeName =
    order.colorTheme.mode === 'admin-choice'
      ? 'To be selected by Web4Web'
      : order.colorTheme.paletteId
        ? RECOMMENDED_THEMES.find((t) => t.id === order.colorTheme.paletteId)?.name
        : order.colorTheme.hue != null
          ? 'Custom palette'
          : 'Not chosen yet'

  const effectIds = order.individualEffects.map((e) => e.id)
  const effectsSelectedCount = effectIds.length

  const effectPackCredit = order.template?.effectPackCredit || 0
  const recommendedPack = order.siteType ? recommendedPackId(order.siteType, order.template.tier) : null
  const recommendedPackReason = order.siteType
    ? `${recommendedPackLabel(order.siteType, order.template.tier)} — the pack we'd pick for a ${siteTypeLabel.toLowerCase()} site at the ${tierName} tier.`
    : undefined

  function packPriceLabel(pack) {
    const effective = Math.max(0, pack.price - effectPackCredit)
    if (effectPackCredit > 0) {
      return effective === 0 ? 'Included' : `Upgrade +${formatPrice(effective, resolvedCurrency)}`
    }
    return formatPrice(pack.price, resolvedCurrency)
  }

  // Union the selected pack's underlying effects with any individually-picked
  // ones so the live preview reflects both — packs are just a curated bundle
  // of the same effect ids the preview already knows how to render.
  const selectedPackEffectIds = order.effectPack
    ? EFFECT_PACKS.find((p) => p.id === order.effectPack.id)?.effectIds || []
    : []
  const previewEffectIds = [...new Set([...effectIds, ...selectedPackEffectIds])]

  function renderEffectCard(item) {
    return (
      <OptionCard
        key={item.id}
        name={item.name}
        description={item.description}
        priceLabel={`+${formatPrice(item.price, resolvedCurrency)}`}
        selected={effectIds.includes(item.id)}
        multi
        onClick={() => handleToggleEffect(item.id)}
      />
    )
  }

  const EFFECT_LISTS = {
    beautification: { items: BEAUTIFICATION_EFFECTS, visibleIds: visibleBeautyIds, expanded: beautyExpanded, setExpanded: setBeautyExpanded, hiddenCount: hiddenBeautyCount, desc: 'Visual polish that makes the site feel finished.' },
    premium: { items: PREMIUM_EFFECTS, visibleIds: visiblePremiumIds, expanded: premiumExpanded, setExpanded: setPremiumExpanded, hiddenCount: hiddenPremiumCount, desc: 'Higher-impact animations and interactions.' },
    signature: { items: SIGNATURE_EFFECTS, visibleIds: SIGNATURE_EFFECTS.map((e) => e.id), expanded: true, setExpanded: () => {}, hiddenCount: 0, desc: 'Our most complex, most impressive, signature effects. Best suited to product/portfolio sites.' },
  }

  return (
    <StepLayout currentPath="/configurator" wide>
      <div className="configurator-subheader">
        <div className="configurator-subheader__item">
          <span className="mono-label">Building</span>
          <strong>{siteTypeLabel}</strong>
        </div>
        <div className="configurator-subheader__item configurator-subheader__item--total">
          <span className="mono-label">Running total</span>
          <strong>{formatPrice(total, resolvedCurrency)}</strong>
        </div>
      </div>

      {mobilePreviewOpen && (
        <div className="configurator-preview-backdrop" onClick={() => setMobilePreviewOpen(false)} aria-hidden="true" />
      )}

      <button
        type="button"
        className="configurator-preview-tab"
        onClick={() => setMobilePreviewOpen(true)}
        aria-label="See live preview"
      >
        👁 Preview
      </button>

      <div className="configurator">
        <div className={'configurator__preview-col' + (mobilePreviewOpen ? ' configurator__preview-col--open' : '')}>
          <button
            type="button"
            className="configurator-preview-close"
            onClick={() => setMobilePreviewOpen(false)}
            aria-label="Close preview"
          >
            ✕ Close preview
          </button>
          <div className="configurator__preview-sticky" ref={previewRef}>
            <div className="configurator__currency">
              <span className="mono-label">Currency</span>
              <div className="currency-toggle">
                <button
                  type="button"
                  className={resolvedCurrency === 'NGN' ? 'currency-toggle__btn currency-toggle__btn--active' : 'currency-toggle__btn'}
                  onClick={() => setCurrency('NGN')}
                >
                  NGN
                </button>
                <button
                  type="button"
                  className={resolvedCurrency === 'USD' ? 'currency-toggle__btn currency-toggle__btn--active' : 'currency-toggle__btn'}
                  onClick={() => setCurrency('USD')}
                >
                  USD
                </button>
              </div>
            </div>

            <InteractivePreview
              websiteType={order.siteType}
              baseTemplateId={order.template.tier}
              heroStyleId={order.heroStyle.id}
              effectIds={previewEffectIds}
              palette={palette}
              url={domainUrl}
            />

            <PriceReceipt lineItems={lineItems} total={total} currency={resolvedCurrency} sticky={false} />
          </div>
        </div>

        <div className="configurator__options-col">
          <div className="reassurance-note">
            Every selection is refined and finished by us — you're not designing the site yourself, you're just
            telling us what you want in it.
          </div>

          <AccordionSection
            id="base"
            title="Base template"
            subtitle={tierName}
            open={openSection === 'base'}
            onToggle={toggleSection}
          >
            <p className="config-section__desc">The foundation everything else builds on.</p>
            <div className="option-list">
              {TEMPLATE_LIST.map((t) => (
                <OptionCard
                  key={t.tier}
                  name={t.name}
                  description={`${t.description || t.pageNote} Up to ${t.includedPages} pages.`}
                  priceLabel={formatPrice(t.price, resolvedCurrency)}
                  selected={order.template.tier === t.tier}
                  onClick={() => handleBaseTemplateSelect(t.tier)}
                />
              ))}
            </div>
            {tierInclusions.length > 0 && (
              <div className="tier-inclusions">
                <span className="mono-label">What's included with {tierName}</span>
                <ul>
                  {tierInclusions.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
          </AccordionSection>

          <AccordionSection
            id="hero"
            title="Hero style"
            subtitle={currentHeroName}
            open={openSection === 'hero'}
            onToggle={toggleSection}
          >
            <p className="config-section__desc">
              We've pre-picked one below based on your site type — swap it for anything else any time.
            </p>
            <div className="option-list">
              {visibleHeroIds.map((id) => {
                const h = HERO_STYLES.find((x) => x.id === id)
                const isRecommended = id === heroRecommendation.heroId
                return (
                  <OptionCard
                    key={h.id}
                    name={h.name}
                    description={h.description}
                    reason={isRecommended ? heroRecommendation.reason : undefined}
                    badge={isRecommended ? 'Recommended' : undefined}
                    priceLabel={h.price > 0 ? `+${formatPrice(h.price, resolvedCurrency)}` : 'Included'}
                    selected={order.heroStyle.id === h.id}
                    onClick={() => selectHero(h)}
                  />
                )
              })}
            </div>
            <ExpandToggle expanded={heroExpanded} onToggle={() => setHeroExpanded((v) => !v)} hiddenCount={hiddenHeroCount} />
          </AccordionSection>

          <AccordionSection
            id="domain"
            title="Domain name"
            subtitle={order.domain.type || 'Not chosen'}
            open={openSection === 'domain'}
            onToggle={toggleSection}
          >
            <p className="config-section__desc">
              A domain is the web address people type to find your site (e.g. <em>yourbusiness.com</em>) — it's what
              makes your site feel like a real, owned piece of the internet rather than a page hosted somewhere
              generic, and it's required to go live under your own name.
            </p>
            <div className="domain-input-row">
              <input
                type="text"
                className="text-input"
                placeholder="yourbrandname"
                value={order.domain.desired}
                onChange={(e) => setDomainName(e.target.value)}
              />
              <span className="domain-input-row__tld mono-label">{order.domain.type || '.com'}</span>
            </div>
            {DOMAIN_TIERS.map((tier) => (
              <div className="tld-tier" key={tier.id}>
                <span className="tld-tier__label mono-label">
                  {tier.label} — {formatPrice(tier.price, resolvedCurrency)}/yr
                </span>
                <div className="tld-tier__chips">
                  {tier.tlds.map((tld) => (
                    <button
                      type="button"
                      key={tld}
                      className={'tld-chip' + (tld === order.domain.type ? ' tld-chip--selected' : '')}
                      onClick={() => handleTldSelect(tld)}
                    >
                      {tld}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </AccordionSection>

          <AccordionSection
            id="theme"
            title="Color theme"
            subtitle={currentThemeName}
            open={openSection === 'theme'}
            onToggle={toggleSection}
          >
            <div className="config-section__theme-head">
              <p className="config-section__desc config-section__desc--flex">Filter by mood, or let us pick. Always free.</p>
              <button type="button" className="btn btn--dark select-for-me-btn" onClick={handleSelectForMe}>
                Select for me →
              </button>
            </div>

            {order.colorTheme.mode === 'admin-choice' && (
              <div className="admin-flag-note">
                ✓ Noted — Web4Web will choose your color theme for you. You can still pick one yourself below any
                time before checkout.
              </div>
            )}

            <div className="mood-tabs">
              {MOOD_FILTERS.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  className={'mood-tab' + (moodFilter === m.id ? ' mood-tab--active' : '')}
                  onClick={() => setMoodFilter(m.id)}
                >
                  {m.name}
                </button>
              ))}
            </div>

            <div className="theme-grid">
              {filteredThemes.map((t) => {
                const selected = order.colorTheme.mode !== 'admin-choice' && order.colorTheme.paletteId === t.id
                return (
                  <OptionCard
                    key={t.id}
                    name={t.name}
                    priceLabel="Included"
                    swatches={t.colors}
                    selected={selected}
                    onClick={() => selectCuratedTheme(t)}
                  />
                )
              })}
            </div>

            <button type="button" className="expand-toggle" onClick={() => setShowCustomPalette((v) => !v)}>
              {showCustomPalette ? 'Hide custom palette builder' : 'Or build your own palette →'}
            </button>

            {showCustomPalette && (
              <div className="custom-palette-wrap">
                <ColorWheelPicker
                  hue={order.colorTheme.hue ?? DEFAULT_HUE}
                  paletteType={order.colorTheme.paletteType || DEFAULT_PALETTE_TYPE}
                  onHueChange={handleHueChange}
                  onPaletteTypeChange={handlePaletteTypeChange}
                />
              </div>
            )}

            <button type="button" className="expand-toggle" onClick={() => setShowBrandColors((v) => !v)}>
              {showBrandColors ? 'Hide brand colors' : '🌈 Or I already have my brand colors →'}
            </button>

            {showBrandColors && (
              <div className="custom-palette-wrap brand-colors-wrap">
                {order.colorTheme.mode === 'client-brand' && (
                  <div className="admin-flag-note">✓ Using your own brand colors below.</div>
                )}
                <p className="config-section__desc">
                  Enter your existing brand hex codes — we'll build the site around them instead of picking a theme
                  for you.
                </p>
                <div className="brand-hex-row">
                  <label className="brand-hex-field">
                    <span className="mono-label">Primary</span>
                    <div className="brand-hex-input">
                      <span className="brand-hex-swatch" style={{ background: order.colorTheme.primary || '#ffffff' }} />
                      <input
                        className="text-input"
                        placeholder="#16213e"
                        value={order.colorTheme.primary}
                        onChange={(e) => handleBrandHexChange('primary', e.target.value)}
                      />
                    </div>
                  </label>
                  <label className="brand-hex-field">
                    <span className="mono-label">Secondary</span>
                    <div className="brand-hex-input">
                      <span className="brand-hex-swatch" style={{ background: order.colorTheme.secondary || '#ffffff' }} />
                      <input
                        className="text-input"
                        placeholder="#f2a93b"
                        value={order.colorTheme.secondary}
                        onChange={(e) => handleBrandHexChange('secondary', e.target.value)}
                      />
                    </div>
                  </label>
                  <label className="brand-hex-field">
                    <span className="mono-label">Accent</span>
                    <div className="brand-hex-input">
                      <span className="brand-hex-swatch" style={{ background: order.colorTheme.accent || '#ffffff' }} />
                      <input
                        className="text-input"
                        placeholder="#e1592c"
                        value={order.colorTheme.accent}
                        onChange={(e) => handleBrandHexChange('accent', e.target.value)}
                      />
                    </div>
                  </label>
                </div>

                <div className="brand-asset-upload">
                  <span className="mono-label">Upload your logo or brand guide (optional but recommended)</span>
                  {pendingBrandAssetFile || order.colorTheme.brandAssetUrl ? (
                    <div className="brand-asset-preview">
                      {pendingBrandAssetPreviewUrl ? (
                        <img className="brand-asset-preview__thumb" src={pendingBrandAssetPreviewUrl} alt="Brand asset preview" />
                      ) : (
                        <span className="brand-asset-preview__icon">📄</span>
                      )}
                      <span className="brand-asset-preview__name">
                        {pendingBrandAssetFile
                          ? pendingBrandAssetFile.name
                          : order.colorTheme.brandAssetUrl.split('/').pop()}
                      </span>
                      <div className="brand-asset-preview__actions">
                        <label className="brand-asset-dropzone brand-asset-dropzone--replace">
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => handleBrandAssetFile(e.target.files?.[0])}
                          />
                          <span>Replace</span>
                        </label>
                        <button type="button" className="brand-asset-remove" onClick={handleBrandAssetRemove}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="brand-asset-dropzone">
                      <input type="file" accept="image/*,application/pdf" onChange={(e) => handleBrandAssetFile(e.target.files?.[0])} />
                      <span>Choose a file (image or PDF)</span>
                    </label>
                  )}
                  <p className="brand-asset-note">
                    This uploads once you reach checkout — we scope every upload to your specific order, so nothing
                    is stored until an order actually exists.
                  </p>
                </div>
              </div>
            )}
          </AccordionSection>

          <AccordionSection
            id="pages"
            title="Page count"
            subtitle={`${includedPages + order.extraPages.length} pages`}
            open={openSection === 'pages'}
            onToggle={toggleSection}
          >
            <p className="config-section__desc">
              {includedPages} pages included with {tierName}. Extra pages are {formatPrice(EXTRA_PAGE_PRICE, resolvedCurrency)} each.
            </p>
            <div className="page-stepper">
              <button type="button" onClick={() => handleExtraPagesChange(order.extraPages.length - 1)}>
                −
              </button>
              <span>
                {includedPages + order.extraPages.length} pages <span className="mono-label">({order.extraPages.length} extra)</span>
              </span>
              <button type="button" onClick={() => handleExtraPagesChange(order.extraPages.length + 1)}>
                +
              </button>
            </div>
          </AccordionSection>

          <AccordionSection
            id="effects"
            title="Enhance your website"
            subtitle={
              order.effectPack
                ? `${EFFECT_PACKS.find((p) => p.id === order.effectPack.id)?.name} pack`
                : effectsSelectedCount > 0
                  ? `${effectsSelectedCount} individual effect${effectsSelectedCount === 1 ? '' : 's'}`
                  : 'None selected'
            }
            open={openSection === 'effects'}
            onToggle={toggleSection}
          >
            {effectPackCredit > 0 && (
              <div className="admin-flag-note">
                1 Effect Pack included — up to {formatPrice(effectPackCredit, resolvedCurrency)}. Choose your
                complimentary pack below.
              </div>
            )}
            <p className="config-section__desc">
              A curated bundle of effects that work well together, at a better price than picking them one by one.
            </p>
            <div className="option-list">
              {EFFECT_PACKS.map((pack) => {
                const isRecommended = pack.id === recommendedPack
                return (
                  <OptionCard
                    key={pack.id}
                    name={pack.name}
                    description={pack.description}
                    reason={isRecommended ? recommendedPackReason : undefined}
                    badge={isRecommended ? 'Recommended' : undefined}
                    priceLabel={packPriceLabel(pack)}
                    selected={order.effectPack?.id === pack.id}
                    onClick={() => handleSelectPack(pack.id)}
                  />
                )
              })}
            </div>

            <button
              type="button"
              className="expand-toggle"
              onClick={() => setIndividualEffectsExpanded((v) => !v)}
            >
              {individualEffectsExpanded ? 'Hide individual effects' : 'Or choose individual effects instead →'}
            </button>

            {individualEffectsExpanded && (
              <div className="custom-palette-wrap">
                <div className="mood-tabs">
                  {EFFECT_CATEGORIES.map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      className={'mood-tab' + (effectsTab === t.id ? ' mood-tab--active' : '')}
                      onClick={() => setEffectsTab(t.id)}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>

                {(() => {
                  const tab = EFFECT_LISTS[effectsTab]
                  if (!tab) return null
                  return (
                    <>
                      <p className="config-section__desc">{tab.desc}</p>
                      <div className="option-list">
                        {tab.visibleIds.map((id) => renderEffectCard(tab.items.find((x) => x.id === id)))}
                      </div>
                      <ExpandToggle expanded={tab.expanded} onToggle={() => tab.setExpanded((v) => !v)} hiddenCount={tab.hiddenCount} />
                    </>
                  )
                })()}
              </div>
            )}
          </AccordionSection>

          <AccordionSection
            id="social"
            title="Social share preview"
            subtitle={order.socialPreview.enabled ? 'Added' : 'Not added'}
            open={openSection === 'social'}
            onToggle={toggleSection}
          >
            <p className="config-section__desc">
              How your link looks when shared on WhatsApp, X, or Facebook. A custom card is a paid add-on.
            </p>
            <SocialPreviewCard siteName={order.domain.desired || 'Your Brand'} domainUrl={domainUrl} palette={palette} />
            <label className="social-toggle">
              <input type="checkbox" checked={order.socialPreview.enabled} onChange={handleSocialToggle} />
              <span>
                Add {SOCIAL_PREVIEW_ADDON.name} — {formatPrice(SOCIAL_PREVIEW_ADDON.price, resolvedCurrency)}
              </span>
            </label>
          </AccordionSection>

          <div className="reassurance-note reassurance-note--muted">
            Remember: this is a starting point. Your finished site is fully tailored to your brand once we build it.
          </div>

          {!order.domain.selected && (
            <p className="config-section__desc" style={{ color: 'var(--orange-600, #b8450c)' }}>
              Pick a domain name above before continuing — every site needs one to go live.
            </p>
          )}

          <div className="configurator-actions">
            <button type="button" className="btn btn--ghost" onClick={() => navigate('/info')}>
              ← Back
            </button>
            <button
              type="button"
              className="btn btn--primary"
              disabled={!order.domain.selected}
              data-no-tap-sound
              onClick={() => {
                playWhooshThenSuccess()
                navigate('/timeline')
              }}
            >
              Continue to Timeline →
            </button>
          </div>
        </div>
      </div>
    </StepLayout>
  )
}
