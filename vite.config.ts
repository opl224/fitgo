import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700,
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          leaflet: ['leaflet'],
          motion: ['motion'],
          capacitor: [
            '@capacitor/app',
            '@capacitor/core',
            '@capacitor/share',
            '@capacitor/filesystem',
            '@capacitor/splash-screen'
          ]
        }
      }
    },
    target: 'es2018'
  },
  esbuild: {
    drop: ['console', 'debugger']
  }
});
