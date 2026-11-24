// Data for the "Climate and Cities: Praia" microsite → src/reports/cities/data.json
// Sources: Open-Meteo Historical Weather API (ERA5/ERA5-Land, daily, grid point nearest Praia)
//          World Bank Open Data (urban population share; urban population living in slums)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { CAPITALS } from './fetch-capitals.mjs';

const raw = (f) => JSON.parse(readFileSync(new URL(`../data/raw/${f}`, import.meta.url), 'utf8'));
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const r = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

const daily = raw('praia_daily_openmeteo.json').data;
const byYear = {};
daily.time.forEach((t, i) => {
  const y = +t.slice(0, 4);
  (byYear[y] ??= { tmin: [], pr: [], dates: [] });
  if (daily.temperature_2m_min[i] != null) byYear[y].tmin.push(daily.temperature_2m_min[i]);
  if (daily.precipitation_sum[i] != null) { byYear[y].pr.push(daily.precipitation_sum[i]); byYear[y].dates.push(t); }
});
const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);
const HOT = 25; // °C minimum temperature
const nights = years.map((y) => ({ y, v: byYear[y].tmin.filter((x) => x >= HOT).length }));
const tminMean = years.map((y) => ({ y, v: mean(byYear[y].tmin) }));
const base = mean(tminMean.filter((p) => p.y >= 1991 && p.y <= 2020).map((p) => p.v));
const tminAnom = tminMean.map((p) => ({ y: p.y, v: r(p.v, 2), a: r(p.v - base, 2) }));
const wettest = years.map((y) => {
  const pr = byYear[y].pr; const m = Math.max(...pr);
  return { y, v: r(m, 1), date: byYear[y].dates[pr.indexOf(m)] };
});
const annualRain = mean(years.filter((y) => y >= 1991 && y <= 2020).map((y) => byYear[y].pr.reduce((a, b) => a + b, 0)));
const decade = (fn) => [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020].map((d) => ({ d, v: r(mean(years.filter((y) => y >= d && y < d + 10).map(fn)), 1) }));

const wb = (id) => raw(`wb_${id}.json`)[1].filter((x) => x.value != null).map((x) => ({ y: +x.date, v: r(x.value, 1) })).sort((a, b) => a.y - b.y);
const urban = wb('SP.URB.TOTL.IN.ZS').filter((p) => p.y >= 1990);
const slums = wb('EN.POP.SLUM.UR.ZS');

// Capitals of the 12 ECOWAS member states (data/raw/capitals, from scripts/fetch-capitals.mjs):
// change between 1961–1990 and 1995–2024 (the latest 30 years) in night-time temperature, hot nights and the wettest day.
const capitals = CAPITALS.map((c) => {
  const d = JSON.parse(readFileSync(new URL(`../data/raw/capitals/${c.id}.json`, import.meta.url), 'utf8')).daily;
  const yr = {};
  d.time.forEach((t, i) => {
    const y = +t.slice(0, 4);
    (yr[y] ??= { tmin: [], pr: [] });
    if (d.temperature_2m_min[i] != null) yr[y].tmin.push(d.temperature_2m_min[i]);
    if (d.precipitation_sum[i] != null) yr[y].pr.push(d.precipitation_sum[i]);
  });
  const per = (a, b, fn) => mean(Object.keys(yr).map(Number).filter((y) => y >= a && y <= b).map((y) => fn(yr[y])));
  const tmin = (o) => mean(o.tmin), hot = (o) => o.tmin.filter((x) => x >= HOT).length, wet = (o) => Math.max(...o.pr);
  const rain = (o) => o.pr.reduce((a, b) => a + b, 0);
  return {
    id: c.id, city: c.city, country: c.country,
    tminThen: r(per(1961, 1990, tmin), 2), tminNow: r(per(1995, 2024, tmin), 2),
    warming: r(per(1995, 2024, tmin) - per(1961, 1990, tmin), 2),
    hotThen: r(per(1961, 1990, hot), 1), hotNow: r(per(1995, 2024, hot), 1),
    hotChange: r(per(1995, 2024, hot) - per(1961, 1990, hot), 1),
    wetThen: r(per(1961, 1990, wet), 1), wetNow: r(per(1995, 2024, wet), 1),
    rainNow: Math.round(per(1995, 2024, rain)),
  };
});

const top = [...wettest].sort((a, b) => b.v - a.v)[0];
const out = {
  generated: new Date().toISOString().slice(0, 10),
  point: raw('praia_daily_openmeteo.json').data.meta,
  hotThreshold: HOT,
  nights,
  nightsByDecade: decade((y) => byYear[y].tmin.filter((x) => x >= HOT).length),
  tminAnom,
  tminBase: r(base, 1),
  wettest,
  wettestRecord: top,
  annualRainBase: Math.round(annualRain),
  urban,
  urbanLatest: urban.at(-1),
  slums,
  slumsLatest: slums.at(-1),
  capitals,
};
mkdirSync(new URL('../src/reports/cities/', import.meta.url), { recursive: true });
writeFileSync(new URL('../src/reports/cities/data.json', import.meta.url), JSON.stringify(out, null, 1));
console.table(capitals);
console.log({ nightsByDecade: out.nightsByDecade.map((x) => `${x.d}s:${x.v}`).join(' '), record: top, rainBase: out.annualRainBase, urban: [urban[0], out.urbanLatest], slums: [slums[0], out.slumsLatest], tminBase: out.tminBase });
