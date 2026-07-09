import preact from '@preact/preset-vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    preact(),

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
        globPatterns: ['**/*.{js,css,html,ico,png,woff2}'],
        globIgnores: ['piece/**'],
        navigateFallback: '/index.html',

        navigateFallbackDenylist: [/^\/api/, /supabase/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /\/piece\/.*\.svg$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'piece-svgs',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [200] }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' }
          },
          {
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
      '@ui': path.resolve(__dirname, 'src/shared/ui'),
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
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/wouter/') ||
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

    assetsInlineLimit: 4096
  },

  css: {
    postcss: './postcss.config.js',
    devSourcemap: true
  },

  optimizeDeps: {
    include: ['react', 'react-dom', 'wouter']
  },

  envPrefix: 'VITE_',

  define: {
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV || 'development'
    )
  }
});
