import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { pwa } from './scripts/pwa.mjs';

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react(), pwa()],
  server: { proxy: { '/api': 'http://127.0.0.1:8787' } },
});
