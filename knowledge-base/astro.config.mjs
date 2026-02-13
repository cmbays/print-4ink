import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import pagefind from 'astro-pagefind';

export default defineConfig({
  integrations: [react(), pagefind()],
  vite: {
    plugins: [tailwindcss()],
  },
});
