import preact from '@preact/preset-vite';
import { buildSync } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BOOT_SCRIPT = /<script src="\/src\/boot\/([a-z-]+)\.js"><\/script>/g;

function inlineBootScripts() {
  return {
    name: 'inline-boot-scripts',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        html.replace(BOOT_SCRIPT, (_tag, name) => {
          const [bundle] = buildSync({
            entryPoints: [path.resolve(__dirname, 'src/boot', `${name}.js`)],
            bundle: true,
            minify: true,
            format: 'iife',
            target: 'es2020',
            write: false
          }).outputFiles;
          return `<script>${bundle.text.trim()}</script>`;
        })
    }
  };
}

export default defineConfig({
  plugins: [inlineBootScripts(), preact()],

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
    warmup: {
      clientFiles: ['./src/index.tsx', './src/pages/**/*Page.tsx']
    },
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
    manifest: true,

    sourcemap: false,

    chunkSizeWarningLimit: 500,

    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'preact-router',
              test: /[\\/]node_modules[\\/](preact|wouter)[\\/]/
            }
          ]
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

    minify: 'oxc',

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
