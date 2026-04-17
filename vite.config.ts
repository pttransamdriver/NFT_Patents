import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    copyPublicDir: true,
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/]
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — small, cached aggressively by browsers
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // ethers.js is large (~500 kB) — split so the app shell loads fast
          'vendor-ethers': ['ethers'],
          // UI extras — only loaded when animated components mount
          'vendor-ui': ['framer-motion', 'lucide-react'],
          // PDF generation — only needed on the mint/patent-detail pages
          'vendor-pdf': ['pdf-lib'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
    hmr: {
      port: 5174
    },
    headers: {
      'Content-Security-Policy': "script-src 'self' 'unsafe-eval' 'unsafe-inline'; object-src 'none';"
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'pdf-lib'
    ],
    esbuildOptions: {
      target: 'esnext'
    }
  },
  define: {
    global: 'globalThis',
    'process.env': {}
  },
  resolve: {
    alias: {
      stream: 'stream-browserify',
      util: 'util',
      buffer: 'buffer',
      process: 'process/browser'
    }
  }
});
