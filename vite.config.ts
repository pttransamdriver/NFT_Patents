import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/NFT_Patents/',
  build: {
    outDir: 'docs'
  },
  server: {
    port: 5173,
    host: '127.0.0.1'
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
});
