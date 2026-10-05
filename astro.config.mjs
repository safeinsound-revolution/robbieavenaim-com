// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

import imageDimensions from './src/integrations/image-dimensions.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://robbieavenaim.com',

  vite: {
    plugins: [tailwindcss(), imageDimensions()]
  },

  integrations: [sitemap()]
});