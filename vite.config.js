import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    // Service Worker + precaching. The win here is hard-refresh (Ctrl+F5):
    // it bypasses the HTTP cache but NOT the Service Worker cache, so once the
    // SW is installed every reload serves JS/CSS/icons from cache instantly
    // instead of re-downloading ~1.3MB over the network. `autoUpdate` ships a
    // new SW on each deploy and activates it in the background.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null, // we register manually in src/index.tsx
      includeAssets: [
        'favicon.ico',
        'logo192.png',
        'logo512.png',
        'robots.txt'
      ],
      manifest: false, // keep the existing public/manifest.json
      workbox: {
        // Precache the built app shell (hashed JS/CSS) so a hard refresh is
        // served from cache. SPA navigations fall back to index.html.
        // Piece SVGs are excluded from precache: there are 276 of them but a
        // user only ever loads 1–2 styles, so they're runtime-cached on demand
        // (see the /piece/ rule below) instead of bloating the precache.
        globPatterns: ['**/*.{js,css,html,ico,png,woff2}'],
        globIgnores: ['piece/**'],
        navigateFallback: '/index.html',
        // Supabase API, the chess-DB edge function, and auth must always hit
        // the network — never serve a stale cached response for them.
        navigateFallbackDenylist: [/^\/api/, /supabase/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            // Self-hosted piece SVGs — immutable, cached on first use so only
            // the styles a user actually opens are stored. StaleWhileRevalidate
            // self-heals a bad entry on the next load.
            urlPattern: /\/piece\/.*\.svg$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'piece-svgs',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [200] }
            }
          },
          {
            // Google Fonts stylesheets.
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' }
          },
          {
            // Google Fonts webfont files — immutable.
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      devOptions: {
        // Keep the SW off in `pnpm dev` so it never interferes with HMR.
        enabled: false
      }
    })
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@hooks': path.resolve(__dirname, 'src/shared/hooks'),
      '@utils': path.resolve(__dirname, 'src/shared/utils'),
      '@contexts': path.resolve(__dirname, 'src/shared/contexts'),
      '@constants': path.resolve(__dirname, 'src/shared/constants'),
      '@app-types': path.resolve(__dirname, 'src/shared/types')
    },
    extensions: ['.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs', '.json']
  },

  server: {
    port: 3000,
    open: true,
    strictPort: false,
    hmr: {
      overlay: true
    }
  },

  preview: {
    port: 4173,
    open: true
  },

  build: {
    outDir: 'dist',

    sourcemap: false,

    chunkSizeWarningLimit: 500,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('@dnd-kit')) return 'vendor-dnd';
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/react-router-dom/') ||
            id.includes('/react-router/') ||
            id.includes('/scheduler/')
          ) {
            return 'vendor-react';
          }
          return undefined;
        },

        chunkFileNames: 'static/js/[name]-[hash].js',
        entryFileNames: 'static/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'static/css/[name]-[hash][extname]';
          }
          return 'static/media/[name]-[hash][extname]';
        }
      }
    },

    minify: 'esbuild',

    target: 'es2020',

    cssCodeSplit: true,

    // Inline only assets smaller than 4 KB (Vite default).
    // Higher values would base64-encode SVG chess pieces into the JS bundle,
    // increasing bundle size and disabling HTTP caching for those assets.
    assetsInlineLimit: 4096
  },

  css: {
    postcss: './postcss.config.js',
    devSourcemap: true
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@dnd-kit/core',
      'lucide-react'
    ]
  },

  envPrefix: 'VITE_',

  define: {
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV || 'development'
    )
  }
});
