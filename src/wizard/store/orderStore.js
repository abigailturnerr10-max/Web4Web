import { create } from 'zustand'
import {
  TEMPLATES,
  ONLINE_PAYMENTS_ADDON,
  SOCIAL_PREVIEW_ADDON,
  TLD_PRICING,
  EFFECT_PACKS,
  findEffect,
  EXTRA_PAGE_PRICE,
  DELIVERY_OPTIONS,
} from '../config/catalog.js'
import { supabase, supabaseReady } from '../../lib/supabaseClient.js'

const STORAGE_KEY = 'web4web_order_draft'

function defaultOrder() {
  return {
    siteType: null,
    template: { tier: null, price: 0, effectPackCredit: 0 },
    onlinePayments: { enabled: false, price: ONLINE_PAYMENTS_ADDON.price },
    domain: { selected: false, type: null, price: 0, desired: '' },
    heroStyle: { id: null, price: 0 },
    effectPack: null,
    effectPackTouched: false,
    individualEffects: [],
    socialPreview: { enabled: false, price: SOCIAL_PREVIEW_ADDON.price },
    colorTheme: {
      mode: null,
      moodId: null,
      paletteId: null,
      hue: null,
      paletteType: null,
      primary: '',
      secondary: '',
      accent: '',
      brandAssetUrl: '',
    },
    extraPages: [],
    delivery: { type: 'standard', price: 0 },
    contact: { name: '', email: '', whatsapp: '' },
    paymentAcceptance: { method: null },
  }
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function hasRealProgress(order) {
  return Boolean(order && (order.siteType || order.template?.tier))
}

function newPageId() {
  return `page-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`
}

const initialDraft = loadDraft()

export const useOrderStore = create((set, get) => ({
  order: defaultOrder(),
  currency: null,
  paid: false,
  supabaseOrderId: initialDraft?.supabaseOrderId ?? null,
  draftAvailable: hasRealProgress(initialDraft?.order),
  resumePromptResolved: false,

  // A raw File can't be JSON-serialized into the localStorage draft (and
  // shouldn't survive a reload anyway) — deliberately NOT part of `order`,
  // so the autosave subscriber below (which only ever persists order/
  // currency/paid/supabaseOrderId) never touches it. The actual upload is
  // deferred until a real Supabase order id exists — signed-storage-url
  // requires the order row to already exist, so this can't upload straight
  // from the Configurator. Review.jsx uploads it right after
  // saveOrderToSupabase() succeeds, then clears this.
  pendingBrandAssetFile: null,
  pendingBrandAssetPreviewUrl: null,

  setSiteType: (siteType) => set((s) => ({ order: { ...s.order, siteType } })),

  setTemplate: (tier) => {
    const t = TEMPLATES[tier]
    if (!t) return
    set((s) => ({ order: { ...s.order, template: { tier, price: t.price, effectPackCredit: t.effectPackCredit } } }))
  },

  setOnlinePayments: (enabled) =>
    set((s) => ({ order: { ...s.order, onlinePayments: { enabled, price: ONLINE_PAYMENTS_ADDON.price } } })),

  setDomain: (tld) => {
    const match = TLD_PRICING.find((t) => t.tld === tld)
    if (!match) return
    set((s) => ({
      order: { ...s.order, domain: { ...s.order.domain, selected: true, type: tld, price: match.price } },
    }))
  },
  clearDomain: () =>
    set((s) => ({ order: { ...s.order, domain: { ...s.order.domain, selected: false, type: null, price: 0 } } })),
  setDomainName: (desired) => set((s) => ({ order: { ...s.order, domain: { ...s.order.domain, desired } } })),

  setHeroStyle: (id, price) => set((s) => ({ order: { ...s.order, heroStyle: { id, price } } })),

  // effectPackTouched persists (unlike a component-local "did we auto-apply
  // yet" ref) so a deliberate removal survives a remount/reload instead of
  // the recommended pack silently reapplying itself.
  setEffectPack: (id) => {
    if (!id) {
      set((s) => ({ order: { ...s.order, effectPack: null, effectPackTouched: true } }))
      return
    }
    const pack = EFFECT_PACKS.find((p) => p.id === id)
    if (!pack) return
    set((s) => ({ order: { ...s.order, effectPack: { id: pack.id, price: pack.price }, effectPackTouched: true } }))
  },

  toggleIndividualEffect: (id) =>
    set((s) => {
      const exists = s.order.individualEffects.some((e) => e.id === id)
      if (exists) {
        return { order: { ...s.order, individualEffects: s.order.individualEffects.filter((e) => e.id !== id) } }
      }
      const effect = findEffect(id)
      if (!effect) return {}
      return {
        order: { ...s.order, individualEffects: [...s.order.individualEffects, { id: effect.id, price: effect.price }] },
      }
    }),

  setColorThemeMode: (mode) => set((s) => ({ order: { ...s.order, colorTheme: { ...s.order.colorTheme, mode } } })),

  setColorThemeStyle: (moodId, paletteId) =>
    set((s) => ({
      order: { ...s.order, colorTheme: { ...s.order.colorTheme, mode: 'style', moodId, paletteId, hue: null } },
    })),

  setColorThemeHue: (hue, paletteType) =>
    set((s) => ({
      order: { ...s.order, colorTheme: { ...s.order.colorTheme, mode: 'style', paletteId: null, hue, paletteType } },
    })),

  setColorThemeBrand: (patch) =>
    set((s) => ({ order: { ...s.order, colorTheme: { ...s.order.colorTheme, mode: 'client-brand', ...patch } } })),

  setPendingBrandAssetFile: (file) =>
    set((s) => {
      if (s.pendingBrandAssetPreviewUrl) URL.revokeObjectURL(s.pendingBrandAssetPreviewUrl)
      return {
        pendingBrandAssetFile: file,
        pendingBrandAssetPreviewUrl: file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      }
    }),

  clearPendingBrandAssetFile: () =>
    set((s) => {
      if (s.pendingBrandAssetPreviewUrl) URL.revokeObjectURL(s.pendingBrandAssetPreviewUrl)
      return { pendingBrandAssetFile: null, pendingBrandAssetPreviewUrl: null }
    }),

  addExtraPage: () =>
    set((s) => ({ order: { ...s.order, extraPages: [...s.order.extraPages, { id: newPageId(), price: EXTRA_PAGE_PRICE }] } })),

  removeExtraPage: (id) =>
    set((s) => ({ order: { ...s.order, extraPages: s.order.extraPages.filter((p) => p.id !== id) } })),

  setDelivery: (type) => {
    const d = DELIVERY_OPTIONS[type]
    if (!d) return
    set((s) => ({ order: { ...s.order, delivery: { type, price: d.price } } }))
  },

  setContact: (patch) => set((s) => ({ order: { ...s.order, contact: { ...s.order.contact, ...patch } } })),
  setPaymentAcceptance: (method) => set((s) => ({ order: { ...s.order, paymentAcceptance: { method } } })),

  setSocialPreview: (enabled) =>
    set((s) => ({ order: { ...s.order, socialPreview: { enabled, price: SOCIAL_PREVIEW_ADDON.price } } })),

  setCurrency: (currency) => set({ currency }),
  markPaid: () => set({ paid: true }),

  /**
   * Persists the current selections to Supabase as a "pending_payment" row
   * right before checkout, so the total being paid against — and later
   * verified server-side — reflects exactly what the visitor picked at that
   * moment. Always writes a fresh row (a prior pending row from an earlier
   * Review visit, if any, is just left abandoned — harmless, filterable by
   * status later).
   *
   * Returns { id, reason } rather than a bare id/null — `reason:
   * 'not_configured'` (Supabase genuinely not set up, the intentional local-
   * dev placeholder path) and `reason: 'save_failed'` (Supabase IS
   * configured but this specific insert failed — a real, loggable error)
   * must stay distinguishable. Conflating them previously meant a transient
   * insert failure silently took the same "trust the client, skip server
   * verification" path as unconfigured local dev — i.e. a real backend
   * failure could let a payment through with no order ever saved to verify
   * it against.
   */
  saveOrderToSupabase: async () => {
    if (!supabaseReady) return { id: null, reason: 'not_configured' }
    const { order, currency } = get()
    const total = calculateOrderTotal(order)
    const { data, error } = await supabase.functions.invoke('create-order', {
      body: {
        site_type: order.siteType,
        template: order.template,
        online_payments: order.onlinePayments,
        domain: order.domain,
        hero_style: order.heroStyle,
        effect_pack: order.effectPack,
        individual_effects: order.individualEffects,
        color_theme: order.colorTheme,
        social_preview: order.socialPreview,
        extra_pages: order.extraPages,
        delivery: order.delivery,
        contact: order.contact,
        payment_acceptance: order.paymentAcceptance,
        total_amount: total,
        currency: currency || 'NGN',
      },
    })

    if (error || !data?.success) {
      console.error('[Web4Web] Failed to save order to Supabase before checkout — payment will be blocked until this succeeds.', error)
      return { id: null, reason: 'save_failed' }
    }
    set({ supabaseOrderId: data.order.id })
    return { id: data.order.id, reason: null }
  },

  resetOrder: () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* localStorage unavailable */
    }
    set({ order: defaultOrder(), currency: null, paid: false, supabaseOrderId: null, draftAvailable: false, resumePromptResolved: true })
  },

  resumeDraft: () =>
    set((s) => {
      const draft = loadDraft()
      if (!draft?.order) return { resumePromptResolved: true }
      return {
        order: { ...defaultOrder(), ...draft.order },
        currency: draft.currency ?? s.currency,
        paid: draft.paid ?? false,
        supabaseOrderId: draft.supabaseOrderId ?? null,
        resumePromptResolved: true,
      }
    }),

  dismissResumePrompt: () => set({ resumePromptResolved: true }),
}))

// Autosave — persist continuously so a return visit can offer to resume.
useOrderStore.subscribe((state) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ order: state.order, currency: state.currency, paid: state.paid, supabaseOrderId: state.supabaseOrderId })
    )
  } catch {
    /* localStorage unavailable — draft just won't persist */
  }
})

/**
 * The one function every page calls to display a total. Applies the
 * Rich-tier effect pack credit against the selected pack's list price.
 */
export function calculateOrderTotal(order) {
  if (!order) return 0
  let total = 0
  total += order.template?.price || 0
  total += order.onlinePayments?.enabled ? order.onlinePayments.price || 0 : 0
  total += order.domain?.selected ? order.domain.price || 0 : 0
  total += order.heroStyle?.price || 0
  if (order.effectPack) {
    const credit = order.template?.effectPackCredit || 0
    total += Math.max(0, order.effectPack.price - credit)
  }
  total += (order.individualEffects || []).reduce((sum, e) => sum + (e.price || 0), 0)
  total += order.socialPreview?.enabled ? order.socialPreview.price || 0 : 0
  total += (order.extraPages || []).reduce((sum, p) => sum + (p.price || 0), 0)
  total += order.delivery?.price || 0
  return total
}

/**
 * Itemized breakdown of calculateOrderTotal, for receipt-style display.
 * Every line here must stay in lockstep with the totaling logic above.
 */
export function calculateOrderLineItems(order) {
  if (!order) return []
  const items = []

  if (order.template?.tier) {
    items.push({ key: 'template', label: `${TEMPLATES[order.template.tier]?.name || order.template.tier} template`, amount: order.template.price || 0 })
  }
  if (order.onlinePayments?.enabled) {
    items.push({ key: 'online-payments', label: ONLINE_PAYMENTS_ADDON.name, amount: order.onlinePayments.price || 0 })
  }
  if (order.domain?.selected) {
    items.push({ key: 'domain', label: `Domain registration (${order.domain.type})`, amount: order.domain.price || 0 })
  }
  if (order.heroStyle?.id && order.heroStyle.price > 0) {
    items.push({ key: 'hero', label: 'Hero style', amount: order.heroStyle.price })
  }
  if (order.effectPack) {
    const credit = order.template?.effectPackCredit || 0
    const packName = EFFECT_PACKS.find((p) => p.id === order.effectPack.id)?.name || order.effectPack.id
    items.push({ key: 'effect-pack', label: `${packName} Effect Pack`, amount: Math.max(0, order.effectPack.price - credit) })
  }
  ;(order.individualEffects || []).forEach((e) => {
    const effect = findEffect(e.id)
    items.push({ key: `effect-${e.id}`, label: effect?.name || e.id, amount: e.price || 0 })
  })
  if (order.socialPreview?.enabled) {
    items.push({ key: 'social-preview', label: SOCIAL_PREVIEW_ADDON.name, amount: order.socialPreview.price || 0 })
  }
  const extraCount = order.extraPages?.length || 0
  if (extraCount > 0) {
    const amount = order.extraPages.reduce((sum, p) => sum + (p.price || 0), 0)
    items.push({ key: 'pages', label: `${extraCount} extra page${extraCount === 1 ? '' : 's'}`, amount })
  }
  if (order.delivery?.price > 0) {
    items.push({ key: 'delivery', label: `${DELIVERY_OPTIONS[order.delivery.type]?.label || 'Delivery'} delivery`, amount: order.delivery.price })
  }

  return items
}
