// Generates one CSV file per figure at build time (/data/<figure>.csv), from the same definition as the chart.
import type { APIRoute } from 'astro';
import { figures, toCsv } from '../../lib/figures';

export const getStaticPaths = () => figures.map((f) => ({ params: { slug: f.slug } }));

export const GET: APIRoute = ({ params }) => {
  const f = figures.find((x) => x.slug === params.slug)!;
  return new Response('﻿' + toCsv(f.table('en'), f.source), { headers: { 'Content-Type': 'text/csv; charset=utf-8' } });
};
