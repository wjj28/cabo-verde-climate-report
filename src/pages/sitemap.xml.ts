// sitemap.xml with hreflang alternates for every language version of each page.
import type { APIRoute } from 'astro';
import { langs } from '../i18n/ui';
import { getChapters } from '../lib/content';
import { url } from '../lib/url';

export const GET: APIRoute = async ({ site }) => {
  const chapters = await getChapters('en');
  const paths = ['', 'summary/', 'chapters/', 'figures/', 'downloads/', 'about/', ...chapters.map((c) => `chapters/${c.slug}/`)];
  const abs = (p: string) => new URL(url(p), site).href;
  const entries = paths.flatMap((p) =>
    langs.map((l) => `  <url>\n    <loc>${abs(`${l}/${p}`)}</loc>\n${langs.map((a) => `    <xhtml:link rel="alternate" hreflang="${a}" href="${abs(`${a}/${p}`)}"/>`).join('\n')}\n  </url>`),
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
