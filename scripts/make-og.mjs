// Builds the social-media preview image (public/og/cover.png, 1200×630) from the real temperature data.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';

const data = JSON.parse(readFileSync('src/data/climate.json', 'utf8'));
const pts = data.observed.tas;
const max = Math.max(...pts.map((p) => Math.abs(p.a)));
const blues = ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'];
const reds = ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'];
const col = (a) => (a < 0 ? blues : reds)[Math.min(8, Math.round((Math.abs(a) / max) * 8))];
const w = 1200 / pts.length;
const stripes = pts.map((p, i) => `<rect x="${i * w}" y="0" width="${w + 0.5}" height="630" fill="${col(p.a)}"/>`).join('');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;width:1200px;height:630px;overflow:hidden;font-family:Georgia,serif}
svg{position:absolute;inset:0}
.shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(8,34,49,.94) 0%,rgba(8,34,49,.86) 52%,rgba(8,34,49,.25) 100%)}
.t{position:absolute;left:72px;top:118px;color:#fff;width:720px}
.e{font:600 22px/1 Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#7fd3e6;margin:0 0 26px}
h1{font-size:76px;line-height:1.02;margin:0 0 24px}
p{font-size:30px;line-height:1.3;color:#d7eef5;margin:0}
.f{position:absolute;left:72px;bottom:48px;font:500 20px Arial,sans-serif;color:#b9d6df}
</style></head><body><svg width="1200" height="630">${stripes}</svg><div class="shade"></div>
<div class="t"><p class="e">Concept edition · 2026</p><h1>Climate of Cabo Verde</h1><p>Observed changes, future risks and adaptation</p><p style="margin-top:14px;font:600 22px Arial,sans-serif;color:#f2a541">English · Français · 中文</p></div>
<div class="f">Temperature stripes 1950–2024 · ERA5 via World Bank CCKP · Independent concept</div></body></html>`;

const tmp = resolve(tmpdir(), 'cv-og.html');
writeFileSync(tmp, html);
mkdirSync('public/og', { recursive: true });
const chrome = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => p && existsSync(p));
execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--user-data-dir=${join(tmpdir(), 'cv-og-profile')}`, '--window-size=1200,630', `--screenshot=${resolve('public/og/cover.png')}`, 'file:///' + tmp.replace(/\\/g, '/')], { stdio: 'ignore' });
console.log('public/og/cover.png');
