import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  devToolbar: { enabled: false },
  // Precarga las pantallas (HTML) al entrar en viewport → cambio casi instantáneo
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
  },
  server: {
    port: 4321,
    host: true,
  },
});
