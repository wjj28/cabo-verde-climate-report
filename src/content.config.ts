// Content model. These files are what editors change through the CMS at /admin/.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const evidence = z.enum(['observed', 'projected', 'reported']);

const report = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/report' }),
  schema: z.object({
    title: z.string(),
    shortTitle: z.string(),
    subtitle: z.string(),
    edition: z.string(),
    intro: z.string(),
    stats: z.array(z.object({ value: z.string(), label: z.string() })),
    summaryIntro: z.string(),
    headlines: z.array(
      z.object({
        id: z.string(),
        statement: z.string(),
        detail: z.string(),
        evidence,
        figure: z.string().optional(),
        chapter: z.string().optional(),
      }),
    ),
    video: z.object({ youtubeId: z.string(), title: z.string(), description: z.string() }).optional(),
    about: z.string(),
  }),
});

const chapters = defineCollection({
  // id = "<lang>/<file>" (the default would use the `slug` field, which repeats across languages)
  loader: glob({ pattern: '*/*.{yaml,yml}', base: './src/content/chapters', generateId: ({ entry }) => entry.replace(/\.ya?ml$/, '') }),
  schema: z.object({
    number: z.number(),
    slug: z.string(),
    title: z.string(),
    kicker: z.string(),
    summary: z.string(),
    keyMessages: z.array(z.string()),
    sections: z.array(z.object({ heading: z.string(), body: z.string(), figure: z.string().optional() })),
    sources: z.array(z.object({ label: z.string(), url: z.string().url().optional() })),
  }),
});

export const collections = { report, chapters };
