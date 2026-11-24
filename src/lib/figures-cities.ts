// Figures for the "Climate and Cities: Praia" microsite. Same Figure model as the main report.
import data from '../reports/cities/data.json';
import { t, type Lang } from '../i18n/ui';
import type { Figure } from './figures';

const OM = 'Open-Meteo Historical Weather API (ERA5 / ERA5-Land reanalysis), daily, grid point nearest Praia';
const OM_URL = 'https://open-meteo.com/en/docs/historical-weather-api';

// City names in Chinese (English and French use the local spelling)
const ZH: Record<string, string> = { abuja: '阿布贾', accra: '阿克拉', banjul: '班珠尔', bissau: '比绍', conakry: '科纳克里', dakar: '达喀尔', freetown: '弗里敦', lome: '洛美', monrovia: '蒙罗维亚', 'porto-novo': '波多诺伏', praia: '普拉亚', yamoussoukro: '亚穆苏克罗' };
type Cap = (typeof data.capitals)[number];
export const cityName = (l: Lang, c: Cap) => (l === 'zh' ? ZH[c.id] : c.city);
const CAP_SRC = 'Open-Meteo Historical Weather API (ERA5 reanalysis), daily, grid point nearest each capital of the 12 ECOWAS member states';
const sorted = (k: 'warming' | 'hotChange') => [...data.capitals].sort((a, b) => b[k] - a[k]);

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
  {
    key: 'capitalsWarming', slug: 'ecowas-capitals-night-warming', chapter: 'ecowas-capitals', source: CAP_SRC, sourceUrl: OM_URL,
    spec: (l: Lang) => ({ kind: 'hbars', signed: true, yLabel: t(l).fig.capitalsWarming.y, unit: '°C', rows: sorted('warming').map((c) => ({ label: cityName(l, c), value: c.warming, hl: c.id === 'praia' })) }),
    table: (l: Lang) => ({ head: [t(l).fig.capitalsWarming.city, t(l).fig.capitalsWarming.then, t(l).fig.capitalsWarming.now, t(l).fig.capitalsWarming.y], rows: sorted('warming').map((c) => [cityName(l, c), c.tminThen, c.tminNow, c.warming]) }),
  },
  {
    key: 'capitalsNights', slug: 'ecowas-capitals-hot-nights', chapter: 'ecowas-capitals', source: CAP_SRC, sourceUrl: OM_URL,
    spec: (l: Lang) => ({ kind: 'hbars', signed: true, yLabel: t(l).fig.capitalsNights.y, unit: t(l).units.days, rows: sorted('hotChange').map((c) => ({ label: cityName(l, c), value: c.hotChange, hl: c.id === 'praia' })) }),
    table: (l: Lang) => ({ head: [t(l).fig.capitalsWarming.city, t(l).fig.capitalsNights.then, t(l).fig.capitalsNights.now, t(l).fig.capitalsNights.y], rows: sorted('hotChange').map((c) => [cityName(l, c), c.hotThen, c.hotNow, c.hotChange]) }),
  },
];
