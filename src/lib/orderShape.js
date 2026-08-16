/**
 * Reshapes a raw `orders` table row (snake_case top-level columns, per
 * supabase/schema.sql) into the camelCase order shape used everywhere else
 * in the wizard — pricing.js, contentSpec.js, and every content-form step
 * component read `order.siteType`, `order.heroStyle`, `order.paymentAcceptance`,
 * `order.colorTheme`, `order.individualEffects`. `template`, `domain`, and
 * `delivery` happen to share the same name in both shapes.
 */
export function toClientShapedOrder(row) {
  return {
    id: row.id,
    siteType: row.site_type,
    template: row.template,
    onlinePayments: row.online_payments,
    domain: row.domain,
    heroStyle: row.hero_style,
    effectPack: row.effect_pack,
    individualEffects: row.individual_effects,
    colorTheme: row.color_theme,
    socialPreview: row.social_preview,
    extraPages: row.extra_pages,
    delivery: row.delivery,
    contact: row.contact,
    paymentAcceptance: row.payment_acceptance,
    status: row.status,
    projectStatus: row.project_status,
    totalAmount: row.total_amount,
    currency: row.currency,
  }
}
