import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  server: {
    host: '127.0.0.1',
    port: 4321
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
