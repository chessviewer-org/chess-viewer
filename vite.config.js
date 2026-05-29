import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@hooks': path.resolve(__dirname, 'src/shared/hooks'),
      '@utils': path.resolve(__dirname, 'src/shared/utils'),
      '@contexts': path.resolve(__dirname, 'src/contexts'),
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
          // Order matters — more specific patterns first to avoid the
          // `react` substring swallowing `react-dnd`, `react-window`, etc.
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('react-dnd')) return 'vendor-dnd';
          if (id.includes('react-window')) return 'vendor-virtualization';
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
      'react-dnd',
      'react-dnd-html5-backend',
      'react-dnd-touch-backend',
      'lucide-react',
      'react-window'
    ]
  },

  envPrefix: 'VITE_',

  define: {
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV || 'development'
    )
  }
});
