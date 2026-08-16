-- New order_content columns activated by specific purchased effects, per
-- CONTENT_REQUIREMENTS_MAP (src/wizard/content/contentRequirementsMap.js).
-- Same fallback-flag pattern as the existing logo/photos/testimonials
-- fields — 'later' vs 'upsell', or a plain value when the field isn't a
-- photo/file.

alter table public.order_content
  -- before-after-slider effect
  add column if not exists before_photo_path text,
  add column if not exists after_photo_path text,
  add column if not exists before_after_fallback text check (before_after_fallback is null or before_after_fallback in ('later', 'upsell')),

  -- 3d-interactive-object / 3d-product-showcase effects
  add column if not exists object_photos jsonb not null default '[]',
  add column if not exists object_photos_fallback text check (object_photos_fallback is null or object_photos_fallback in ('later', 'upsell')),

  -- animated-counters effect
  add column if not exists stats jsonb not null default '[]',
  add column if not exists stats_fallback text check (stats_fallback is null or stats_fallback in ('later', 'upsell')),

  -- marquee effect
  add column if not exists trust_badges jsonb not null default '[]',

  -- multi-language effect
  add column if not exists languages_needed text,
  add column if not exists languages_needed_fallback text check (languages_needed_fallback is null or languages_needed_fallback in ('later', 'upsell'));
