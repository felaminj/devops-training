import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json', '.vue'],
  },
  optimizeDeps: {
    include: ['leaflet', 'leaflet.markercluster', '@iconify/vue'],
  },
  server: {
    port: 5174,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
});
