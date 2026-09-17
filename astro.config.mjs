import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.matheussilvabaptista.online',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  compressHTML: true,
});
