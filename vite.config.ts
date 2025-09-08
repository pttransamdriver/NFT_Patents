import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/NFT_Patents/',
  build: {
    outDir: 'docs',
    copyPublicDir: true,
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/]
    }
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
      'eventemitter3',
      'pdf-lib'
    ],
    exclude: ['helia', '@helia/unixfs', 'pdfjs-dist'],
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
