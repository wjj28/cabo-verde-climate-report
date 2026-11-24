// Every figure in the report: its data, chart spec, data table and CSV come from one definition,
// so the chart, the accessible table and the download can never disagree.
import data from '../data/climate.json';
import { t, type Lang } from '../i18n/ui';
import type { ChartSpec } from './chart';
import { REPORT } from './report';
import { citiesFigures } from './figures-cities';

export type FigKey = 'stripes' | 'tasAnomaly' | 'monthlyRain' | 'rainAnomaly' | 'crop' | 'projTas' | 'tropicalNights' | 'projRain'
  | 'urban' | 'praiaStripes' | 'praiaNights' | 'praiaRainMax';

type Table = { head: string[]; rows: (string | number)[][] };
export interface Figure {
  key: FigKey;
  slug: string;
  chapter: string;
  source: string;
  sourceUrl: string;
  spec: (lang: Lang) => ChartSpec;
  table: (lang: Lang) => Table;
}

const o = data.observed;
const p = data.projections;
const CCKP = 'https://climateknowledgeportal.worldbank.org/country/cabo-verde';
const ERA5 = 'ERA5 reanalysis (ECMWF/Copernicus), national average, via World Bank Climate Change Knowledge Portal';
const CMIP6 = 'CMIP6 multi-model ensemble, via World Bank Climate Change Knowledge Portal';
const scenKeys = ['ssp126', 'ssp245', 'ssp585'] as const;

const mainFigures: Figure[] = [
  {
    key: 'stripes', slug: 'temperature-stripes', chapter: 'observed-climate', source: ERA5, sourceUrl: CCKP,
    spec: () => ({ kind: 'stripes', points: o.tas.map((d) => ({ x: d.y, y: d.a })) }),
    table: (l) => ({ head: [t(l).year, `${t(l).fig.tasAnomaly.y}`], rows: o.tas.map((d) => [d.y, d.a]) }),
  },
  {
    key: 'tasAnomaly', slug: 'temperature-anomaly', chapter: 'observed-climate', source: ERA5, sourceUrl: CCKP,
    spec: (l) => ({ kind: 'bars', signed: true, points: o.tas.map((d) => ({ x: d.y, y: d.a })), yLabel: t(l).fig.tasAnomaly.y, unit: '°C' }),
    table: (l) => ({ head: [t(l).year, '°C', t(l).fig.tasAnomaly.y], rows: o.tas.map((d) => [d.y, d.v, d.a]) }),
  },
  {
    key: 'monthlyRain', slug: 'monthly-rainfall', chapter: 'rainfall-drought', source: ERA5 + ', 1991–2020 climatology', sourceUrl: CCKP,
    spec: (l) => ({ kind: 'bars', points: o.prMonthly.map((v, i) => ({ x: i + 1, y: v })), highlight: [7, 8, 9, 10], xLabels: t(l).months.map((m) => m.slice(0, 3)), yLabel: t(l).fig.monthlyRain.y, unit: 'mm' }),
    table: (l) => ({ head: [t(l).month, t(l).fig.monthlyRain.y, '°C'], rows: o.prMonthly.map((v, i) => [t(l).months[i], v, o.tasMonthly[i]]) }),
  },
  {
    key: 'rainAnomaly', slug: 'rainfall-anomaly', chapter: 'rainfall-drought', source: ERA5, sourceUrl: CCKP,
    spec: (l) => ({ kind: 'bars', signed: true, points: o.pr.map((d) => ({ x: d.y, y: d.pct })), yLabel: t(l).fig.rainAnomaly.y, unit: '%' }),
    table: (l) => ({ head: [t(l).year, 'mm', t(l).fig.rainAnomaly.y], rows: o.pr.map((d) => [d.y, d.v, d.pct]) }),
  },
  {
    key: 'crop', slug: 'crop-production', chapter: 'agriculture-food',
    source: 'FAO production indices (2014–2016 = 100), via World Bank Open Data (AG.PRD.CROP.XD, AG.PRD.FOOD.XD)',
    sourceUrl: 'https://data.worldbank.org/indicator/AG.PRD.CROP.XD?locations=CV',
    spec: (l) => ({
      kind: 'lines', yLabel: t(l).fig.crop.y, unit: '',
      shade: { x0: 2017, x1: 2019, label: t(l).fig.crop.drought },
      series: [
        { key: 'crop', label: t(l).fig.crop.cropLabel, points: data.agriculture.crop.map((d) => ({ x: d.y, y: d.v })) },
        { key: 'food', label: t(l).fig.crop.foodLabel, points: data.agriculture.food.map((d) => ({ x: d.y, y: d.v })), dashed: true },
      ],
    }),
    table: (l) => ({
      head: [t(l).year, t(l).fig.crop.cropLabel, t(l).fig.crop.foodLabel],
      rows: data.agriculture.crop.map((d) => [d.y, d.v, data.agriculture.food.find((f) => f.y === d.y)?.v ?? '']),
    }),
  },
  {
    key: 'projTas', slug: 'projected-warming', chapter: 'future-climate', source: CMIP6 + ', median and 10th–90th percentile', sourceUrl: CCKP,
    spec: (l) => ({
      kind: 'lines', yLabel: t(l).fig.projTas.y, unit: '°C', toggle: true,
      series: [
        { key: 'hist', label: t(l).scen.hist, points: p.hist.map((d) => ({ x: d.y, y: d.v })) },
        ...scenKeys.map((s) => ({ key: s, label: t(l).scen[s], band: true, points: p[s].tas.map((d) => ({ x: d.y, y: d.v, lo: d.lo, hi: d.hi })) })),
      ],
    }),
    table: (l) => ({
      head: [t(l).year, ...scenKeys.map((s) => t(l).scen[s])],
      rows: p.ssp245.tas.filter((d) => d.y % 5 === 0).map((d) => [d.y, ...scenKeys.map((s) => p[s].tas.find((x) => x.y === d.y)!.v)]),
    }),
  },
  {
    key: 'tropicalNights', slug: 'hot-nights', chapter: 'future-climate', source: CMIP6 + ' (index: nights with minimum temperature above 26 °C)', sourceUrl: CCKP,
    spec: (l) => ({
      kind: 'lines', yLabel: t(l).fig.tropicalNights.y, unit: t(l).units.days, toggle: true,
      series: scenKeys.map((s) => ({ key: s, label: t(l).scen[s], points: p[s].tr26.map((d) => ({ x: d.y, y: d.v })) })),
    }),
    table: (l) => ({
      head: [t(l).year, ...scenKeys.map((s) => t(l).scen[s])],
      rows: p.ssp245.tr26.filter((d) => d.y % 5 === 0).map((d) => [d.y, ...scenKeys.map((s) => p[s].tr26.find((x) => x.y === d.y)!.v)]),
    }),
  },
  {
    key: 'projRain', slug: 'projected-rainfall', chapter: 'future-climate', source: CMIP6 + ', median', sourceUrl: CCKP,
    spec: (l) => ({
      kind: 'lines', yLabel: t(l).fig.projRain.y, unit: '%', toggle: true,
      series: scenKeys.map((s) => ({ key: s, label: t(l).scen[s], points: p[s].prPct.map((d) => ({ x: d.y, y: d.v })) })),
    }),
    table: (l) => ({
      head: [t(l).year, ...scenKeys.map((s) => t(l).scen[s])],
      rows: p.ssp245.prPct.filter((d) => d.y % 5 === 0).map((d) => [d.y, ...scenKeys.map((s) => p[s].prPct.find((x) => x.y === d.y)!.v)]),
    }),
  },
];

/** Figures of the report being built (see src/lib/report.ts). */
export const figures: Figure[] = REPORT === 'cities' ? citiesFigures(mainFigures.find((f) => f.key === 'tropicalNights')!) : mainFigures;

export const figureNumber = (key: FigKey) => figures.findIndex((f) => f.key === key) + 1;
export const getFigure = (key: string) => figures.find((f) => f.key === key);

export const toCsv = (tbl: Table, source: string) =>
  [`# Source: ${source}`, `# Compiled for an independent concept report; cite the original source.`, tbl.head.join(','), ...tbl.rows.map((r) => r.map((c) => (typeof c === 'string' && c.includes(',') ? `"${c}"` : c)).join(','))].join('\n') + '\n';
