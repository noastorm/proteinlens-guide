import { defineConfig } from 'vite';

export default defineConfig({
  // Base public path — '/' works for Vercel
  base: '/',

  build: {
    outDir: 'dist',
    // Keep source maps for easier debugging
    sourcemap: true,
  },

  server: {
    port: 5173,
    open: true,
  },
});
