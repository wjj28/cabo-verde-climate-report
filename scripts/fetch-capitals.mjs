// Downloads daily minimum temperature and rainfall, 1950–2024, for the capitals of the 12 ECOWAS member states
// from the Open-Meteo Historical Weather API (ERA5 reanalysis, CC BY 4.0) → data/raw/capitals/<id>.json
// Run once: node scripts/fetch-capitals.mjs   (files already downloaded are skipped)
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

export const CAPITALS = [
  { id: 'abuja', city: 'Abuja', country: 'NGA', lat: 9.0765, lon: 7.3986 },
  { id: 'accra', city: 'Accra', country: 'GHA', lat: 5.6037, lon: -0.187 },
  { id: 'banjul', city: 'Banjul', country: 'GMB', lat: 13.4549, lon: -16.579 },
  { id: 'bissau', city: 'Bissau', country: 'GNB', lat: 11.8817, lon: -15.617 },
  { id: 'conakry', city: 'Conakry', country: 'GIN', lat: 9.6412, lon: -13.5784 },
  { id: 'dakar', city: 'Dakar', country: 'SEN', lat: 14.7167, lon: -17.4677 },
  { id: 'freetown', city: 'Freetown', country: 'SLE', lat: 8.4657, lon: -13.2317 },
  { id: 'lome', city: 'Lomé', country: 'TGO', lat: 6.1375, lon: 1.2123 },
  { id: 'monrovia', city: 'Monrovia', country: 'LBR', lat: 6.3156, lon: -10.8074 },
  { id: 'porto-novo', city: 'Porto-Novo', country: 'BEN', lat: 6.4969, lon: 2.6289 },
  { id: 'praia', city: 'Praia', country: 'CPV', lat: 14.9315, lon: -23.5125 },
  { id: 'yamoussoukro', city: 'Yamoussoukro', country: 'CIV', lat: 6.8276, lon: -5.2893 },
];

if (process.argv[1]?.endsWith('fetch-capitals.mjs')) {
  const dir = new URL('../data/raw/capitals/', import.meta.url);
  mkdirSync(dir, { recursive: true });
  for (const c of CAPITALS) {
    const f = new URL(`${c.id}.json`, dir);
    if (existsSync(f)) { console.log('skip', c.id); continue; }
    const u = `https://archive-api.open-meteo.com/v1/archive?latitude=${c.lat}&longitude=${c.lon}&start_date=1950-01-01&end_date=2024-12-31&daily=temperature_2m_min,precipitation_sum&timezone=GMT`;
    let res = await fetch(u);
    // the free API allows a limited amount per minute: wait and retry
    for (let k = 0; res.status === 429 && k < 5; k++) { console.log('rate limit, waiting 65 s'); await new Promise((r) => setTimeout(r, 65000)); res = await fetch(u); }
    if (!res.ok) throw new Error(`${c.id}: HTTP ${res.status} ${await res.text()}`);
    const j = await res.json();
    writeFileSync(f, JSON.stringify({ ...c, elevation: j.elevation, gridLat: j.latitude, gridLon: j.longitude, daily: j.daily }));
    console.log('ok', c.id, j.daily.time.length, 'days');
    await new Promise((r) => setTimeout(r, 30000));
  }
}
