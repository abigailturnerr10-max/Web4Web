import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// One-off generation script (run via `npx pwa-assets-generator`) — produces
// the PNG icon set referenced by vite-plugin-pwa's manifest from the
// existing brand mark at public/favicon.svg. Maskable gets extra padding +
// a solid navy background so the mark survives Android's circular/rounded
// safe-zone crop instead of touching the edge.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: {
      sizes: [512],
      padding: 0.3,
      resizeOptions: { background: '#16213e', fit: 'contain' },
    },
  },
  images: ['public/favicon.svg'],
})
