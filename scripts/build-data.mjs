// Turns the raw downloads in data/raw/ into one tidy file the site reads: src/data/climate.json
// Raw sources: World Bank Climate Change Knowledge Portal (CCKP) API and World Bank Open Data API.
// Re-run with `npm run data` after refreshing data/raw/.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const raw = (f) => JSON.parse(readFileSync(new URL(`../data/raw/${f}.json`, import.meta.url), 'utf8'));
const cckp = (f) =>
  Object.entries(raw(f).data.CPV).map(([k, v]) => ({ y: +k.slice(0, 4), m: +k.slice(5, 7), v }));
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const r = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
const between = (s, a, b) => s.filter((p) => p.y >= a && p.y <= b).map((p) => p.v);

// Observed: ERA5 reanalysis, Cabo Verde national average, 1950–2024
const tas = cckp('era5_tas');
const pr = cckp('era5_pr');
const tasBase = mean(between(tas, 1991, 2020));
const prBase = mean(between(pr, 1991, 2020));

// Linear trend (least squares), °C per decade
const trend = (s) => {
  const mx = mean(s.map((p) => p.y)), my = mean(s.map((p) => p.v));
  const num = s.reduce((a, p) => a + (p.y - mx) * (p.v - my), 0);
  const den = s.reduce((a, p) => a + (p.y - mx) ** 2, 0);
  return (num / den) * 10;
};

const tasRanked = [...tas].sort((a, b) => b.v - a.v);
const prRanked = [...pr].sort((a, b) => a.v - b.v);

// Monthly climatology 1991–2020: rainfall (ERA5), temperature (CRU TS 4.08)
const prMonthly = cckp('era5_pr_monthly_clim').map((p) => r(p.v, 1));
const tasMonthly = cckp('tas_monthly_clim').map((p) => r(p.v, 1));
const wetShare = (prMonthly[6] + prMonthly[7] + prMonthly[8] + prMonthly[9]) / prMonthly.reduce((a, b) => a + b, 0);

// Projections: CMIP6 multi-model ensemble (smoothed), anomalies vs model 1995–2014
const histTas = cckp('tas_hist_cmip6');
const histPr = cckp('pr_hist_cmip6');
const tasRef = mean(between(histTas, 1995, 2014));
const prRef = mean(between(histPr, 1995, 2014));
const scen = ['ssp126', 'ssp245', 'ssp585'];
const proj = {};
for (const s of scen) {
  const med = cckp(`tas_${s}_median`), lo = cckp(`tas_${s}_p10`), hi = cckp(`tas_${s}_p90`);
  const prm = cckp(`pr_${s}_median`);
  const tr = cckp(`tr26_${s}`);
  proj[s] = {
    tas: med.map((p, i) => ({ y: p.y, v: r(p.v - tasRef), lo: r(lo[i].v - tasRef), hi: r(hi[i].v - tasRef) })),
    prPct: prm.map((p) => ({ y: p.y, v: r(((p.v - prRef) / prRef) * 100, 1) })),
    tr26: tr.map((p) => ({ y: p.y, v: r(p.v, 0) })),
    tas2041_2060: r(mean(between(med, 2041, 2060)) - tasRef, 1),
    tas2081_2100: r(mean(between(med, 2081, 2100)) - tasRef, 1),
    tas2081_2100_lo: r(mean(between(lo, 2081, 2100)) - tasRef, 1),
    tas2081_2100_hi: r(mean(between(hi, 2081, 2100)) - tasRef, 1),
    pr2081_2100: r(((mean(between(prm, 2081, 2100)) - prRef) / prRef) * 100, 0),
    tr26_2050: r(mean(between(tr, 2041, 2060)), 0),
    tr26_2090: r(mean(between(tr, 2081, 2100)), 0),
  };
}
const histAnom = histTas.map((p) => ({ y: p.y, v: r(p.v - tasRef) }));

// Agriculture: FAO crop and food production indices (2014–2016 = 100), via World Bank Open Data
const wb = (id) =>
  raw(`wb_${id}`)[1]
    .filter((x) => x.value !== null)
    .map((x) => ({ y: +x.date, v: r(x.value, 1) }))
    .sort((a, b) => a.y - b.y);
const crop = wb('AG.PRD.CROP.XD').filter((p) => p.y >= 1990);
const food = wb('AG.PRD.FOOD.XD').filter((p) => p.y >= 1990);

const out = {
  generated: new Date().toISOString().slice(0, 10),
  observed: {
    tas: tas.map((p) => ({ y: p.y, v: p.v, a: r(p.v - tasBase) })),
    pr: pr.map((p) => ({ y: p.y, v: r(p.v, 0), pct: r(((p.v - prBase) / prBase) * 100, 0) })),
    tasBase: r(tasBase), prBase: r(prBase, 0),
    trendPerDecade: r(trend(tas), 2),
    trendSince1980: r(trend(tas.filter((p) => p.y >= 1980)), 2),
    warmest: tasRanked.slice(0, 5).map((p) => ({ y: p.y, v: p.v, a: r(p.v - tasBase) })),
    driest: prRanked.slice(0, 5).map((p) => ({ y: p.y, v: r(p.v, 0), pct: r(((p.v - prBase) / prBase) * 100, 0) })),
    lastDecadeVsFirst: r(mean(between(tas, 2015, 2024)) - mean(between(tas, 1950, 1979)), 1),
    drought2017_2019: r(((mean(between(pr, 2017, 2019)) - prBase) / prBase) * 100, 0),
    prMonthly, tasMonthly, wetShare: r(wetShare * 100, 0),
    prCV: r(Math.sqrt(mean(between(pr, 1991, 2020).map((v) => (v - prBase) ** 2))) / prBase * 100, 0),
  },
  projections: { ...proj, hist: histAnom },
  agriculture: {
    crop, food,
    cropPeak: crop.filter((p) => p.y >= 2010).sort((a, b) => b.v - a.v)[0],
    cropLatest: crop.at(-1),
  },
};

mkdirSync(new URL('../src/data/', import.meta.url), { recursive: true });
writeFileSync(new URL('../src/data/climate.json', import.meta.url), JSON.stringify(out, null, 1));
const o = out.observed, p = out.projections;
console.log({
  trend: o.trendPerDecade, since1980: o.trendSince1980, warmest: o.warmest.slice(0, 3), driest: o.driest.slice(0, 3),
  lastDecadeVsFirst: o.lastDecadeVsFirst, drought: o.drought2017_2019, wetShare: o.wetShare, cv: o.prCV,
  ssp: Object.fromEntries(scen.map((s) => [s, [p[s].tas2041_2060, p[s].tas2081_2100, p[s].tas2081_2100_lo, p[s].tas2081_2100_hi, p[s].pr2081_2100, p[s].tr26_2050, p[s].tr26_2090]])),
  crop: [out.agriculture.cropPeak, out.agriculture.cropLatest], tr26now: p.ssp245.tr26.slice(0, 6).map((x) => x.v),
});
