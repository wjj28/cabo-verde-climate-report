// @ts-check
import { defineConfig } from 'astro/config';

// SITE and BASE let the same build run on GitHub Pages (/repo/) or at the root of an Apache host.
const site = process.env.SITE || 'https://example.org';
const base = process.env.BASE || '/';

export default defineConfig({
  site,
  base,
  output: 'static',
  outDir: process.env.OUT_DIR || './dist',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  i18n: {
    locales: ['en', 'fr', 'zh'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: true, redirectToDefaultLocale: false },
  },
  compressHTML: true,
});
