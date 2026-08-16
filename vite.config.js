import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registered explicitly in main.jsx via virtual:pwa-register instead
      // of the plain auto-injected script — that path only registers the
      // worker, it doesn't reload an already-open tab once a new version
      // takes control, which would leave stale JS running indefinitely in
      // any tab left open across a deploy.
      injectRegister: false,
      // vite-plugin-pwa only generates a service worker at build time by
      // default — this makes it testable against `npm run dev` too.
      devOptions: { enabled: true, type: 'module' },
      manifest: {
        name: 'Web4Web',
        short_name: 'Web4Web',
        description: 'A guided, transparent way to get your website built — pick your style, your add-ons, your price.',
        theme_color: '#16213e',
        background_color: '#16213e',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the app shell + static assets for fast repeat loads and
        // offline-shell installability. Deliberately excludes /audio/**  —
        // web4web-music.mp3 alone is several MB and would balloon the
        // install-time precache; it's handled by the lazy runtimeCaching
        // rule below instead, cached only once actually requested.
        globPatterns: ['**/*.{js,css,html,ico,svg,png}'],

        // This app is NOT meant to be offline-functional — ordering, paying,
        // and submitting content all inherently require connectivity. These
        // rules exist to make that explicit and prevent anyone from later
        // "helpfully" adding a CacheFirst/StaleWhileRevalidate rule for live
        // data — a cached stale price or stale payment-verification result
        // would be a real, serious bug, not a UX inconvenience.
        runtimeCaching: [
          {
            // Supabase: orders, order_content, and every Edge Function
            // (verify-flutterwave-payment, save-order-content, etc.) live
            // under this origin — never served from cache.
            urlPattern: /^https:\/\/[^/]+\.supabase\.co\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            // Flutterwave's checkout script and API — same reasoning.
            urlPattern: /^https:\/\/[^/]*flutterwave\.com\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            // Static audio files change rarely and are large — cache them
            // lazily on first actual playback rather than at install time.
            urlPattern: /\/audio\/.*\.mp3$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'web4web-audio',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
})
