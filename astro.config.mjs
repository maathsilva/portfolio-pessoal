import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

const slugs = ['faster', 'orus', 'zion', 'mordomo', 'nero', 'luno'];

export default defineConfig({
  site: 'https://www.matheussilvabaptista.online',
  trailingSlash: 'never',
  compressHTML: true,
  adapter: vercel(),
  // Old .html URLs (from the pre-Astro site) keep working via permanent redirects.
  redirects: Object.fromEntries(
    slugs.map((s) => [`/projetos/projeto-${s}.html`, { status: 301, destination: `/projetos/projeto-${s}` }])
  ),
});
