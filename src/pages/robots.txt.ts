import type { APIRoute } from 'astro';
import { url } from '../lib/url';

export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nDisallow: ${url('admin/')}\nDisallow: ${url('en/print/')}\nDisallow: ${url('fr/print/')}\nDisallow: ${url('zh/print/')}\n\nSitemap: ${new URL(url('sitemap.xml'), site).href}\n`, {
    headers: { 'Content-Type': 'text/plain' },
  });
