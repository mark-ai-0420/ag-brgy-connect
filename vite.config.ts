import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  build: {
    target: 'esnext',
    cssMinify: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts'
            if (id.includes('leaflet')) return 'vendor-leaflet'
            if (id.includes('@google/genai')) return 'vendor-ai'
            if (id.includes('@supabase')) return 'vendor-supabase'
            if (id.includes('lucide-react')) return 'vendor-icons'
            if (id.includes('date-fns')) return 'vendor-date'
            if (id.includes('zod')) return 'vendor-zod'
            if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'vendor-react'
            if (id.includes('@tanstack/react-router') || id.includes('@tanstack/router-core')) return 'vendor-router'
          }
        },
      },
    },
  },
  plugins: [
    devtools({
      removeDevtoolsOnBuild: true,
    }),
    nitro({
      rollupConfig: { external: [/^@sentry\//] },
      routeRules: {
        '/assets/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
        '/seed-images/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
      },
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
