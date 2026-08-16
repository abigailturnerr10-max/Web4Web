-- Security audit fix — brand-assets and client-content had no
-- file_size_limit or allowed_mime_types (confirmed live: both null).
-- Every upload UI in the app already restricts to `accept="image/*"`
-- (StepBrandBasics/StepPageContent/StepVisualAssets), so this just enforces
-- server-side what the client already only ever sends.
--
-- image/svg+xml is deliberately excluded even though it's an image format:
-- uploaded files are downloadable directly by the admin (admin-file__download),
-- and an SVG opened directly in a browser tab (as opposed to used as an
-- <img> src, which is how AdminOrderDetail always renders them) can execute
-- embedded script. Raster formats carry no such risk.

update storage.buckets
set file_size_limit = 10485760, -- 10 MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id in ('brand-assets', 'client-content');
