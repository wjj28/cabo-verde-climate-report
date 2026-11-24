import { getCollection, getEntry } from 'astro:content';
import { marked } from 'marked';
import type { Lang } from '../i18n/ui';

marked.setOptions({ gfm: true });
export const md = (s: string) => marked.parse(s, { async: false }) as string;
export const mdInline = (s: string) => marked.parseInline(s, { async: false }) as string;

export async function getReport(lang: Lang) {
  const e = await getEntry('report', lang);
  if (!e) throw new Error(`Missing report content for ${lang}`);
  return e.data;
}

export async function getChapters(lang: Lang) {
  const all = await getCollection('chapters', (c) => c.id.startsWith(`${lang}/`));
  return all.map((c) => c.data).sort((a, b) => a.number - b.number);
}

/** Stable, readable ids for headings ("A warming archipelago" → "a-warming-archipelago"); falls back to index for non-Latin scripts. */
export const anchor = (s: string, i: number) => {
  const a = s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return a.length > 2 ? a : `section-${i + 1}`;
};
