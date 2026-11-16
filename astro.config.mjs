import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

const slugs = ['faster', 'orus', 'zion', 'mordomo', 'nero'];

export default defineConfig({
  site: 'https://www.matheussilvabaptista.online',
  trailingSlash: 'never',
  compressHTML: true,
  adapter: vercel(),
  redirects: {
    // Old .html URLs (from the pre-Astro site) keep working via permanent redirects.
    ...Object.fromEntries(
      slugs.map((s) => [`/projetos/projeto-${s}.html`, { status: 301, destination: `/projetos/projeto-${s}` }])
    ),
    // The résumé was renamed; links already shared still reach the current file.
    '/assets/docs/curriculomatheussilva.pdf': {
      status: 301,
      destination: '/assets/docs/Matheus_Silva_Analista_de_Dados.pdf',
    },
  },
});
