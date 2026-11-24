// Figures for the "Climate and Cities: Praia" microsite. Same Figure model as the main report.
import data from '../reports/cities/data.json';
import { t, type Lang } from '../i18n/ui';
import type { Figure } from './figures';

const OM = 'Open-Meteo Historical Weather API (ERA5 / ERA5-Land reanalysis), daily, grid point nearest Praia';
const OM_URL = 'https://open-meteo.com/en/docs/historical-weather-api';

export const citiesFigures = (nationalNights: Figure): Figure[] => [
  {
    key: 'urban', slug: 'urban-population', chapter: 'growing-capital',
    source: 'World Bank Open Data: urban population, % of total (SP.URB.TOTL.IN.ZS)',
    sourceUrl: 'https://data.worldbank.org/indicator/SP.URB.TOTL.IN.ZS?locations=CV',
    spec: (l: Lang) => ({ kind: 'lines', yLabel: t(l).fig.urban.y, unit: '%', domain: [0, 100], series: [{ key: 'crop', label: t(l).fig.urban.y, points: data.urban.map((d) => ({ x: d.y, y: d.v })) }] }),
    table: (l: Lang) => ({ head: [t(l).year, t(l).fig.urban.y], rows: data.urban.map((d) => [d.y, d.v]) }),
  },
  {
    key: 'praiaStripes', slug: 'praia-night-temperature-stripes', chapter: 'hotter-nights', source: OM, sourceUrl: OM_URL,
    spec: () => ({ kind: 'stripes', points: data.tminAnom.map((d) => ({ x: d.y, y: d.a })) }),
    table: (l: Lang) => ({ head: [t(l).year, '°C', t(l).fig.tasAnomaly.y], rows: data.tminAnom.map((d) => [d.y, d.v, d.a]) }),
  },
  {
    key: 'praiaNights', slug: 'praia-hot-nights', chapter: 'hotter-nights', source: OM, sourceUrl: OM_URL,
    spec: (l: Lang) => ({ kind: 'bars', points: data.nights.map((d) => ({ x: d.y, y: d.v })), yLabel: t(l).fig.praiaNights.y, unit: t(l).units.days }),
    table: (l: Lang) => ({ head: [t(l).year, t(l).fig.praiaNights.y], rows: data.nights.map((d) => [d.y, d.v]) }),
  },
  { ...nationalNights, chapter: 'hotter-nights' },
  {
    key: 'praiaRainMax', slug: 'praia-wettest-day', chapter: 'heavy-rain', source: OM, sourceUrl: OM_URL,
    spec: (l: Lang) => ({ kind: 'bars', points: data.wettest.map((d) => ({ x: d.y, y: d.v })), highlight: [data.wettestRecord.y], yLabel: t(l).fig.praiaRainMax.y, unit: 'mm' }),
    table: (l: Lang) => ({ head: [t(l).year, t(l).fig.praiaRainMax.y, t(l).fig.praiaRainMax.date], rows: data.wettest.map((d) => [d.y, d.v, d.date]) }),
  },
];
