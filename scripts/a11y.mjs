// Automated accessibility check (WCAG 2.2 AA rules from axe-core) on every built page,
// in desktop and mobile widths, light and dark mode, using the locally installed Chrome. Run after a build: npm run test:a11y
import puppeteer from 'puppeteer-core';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const chrome = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => p && existsSync(p));

// tiny static server for dist/
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json', '.csv': 'text/csv', '.pdf': 'application/pdf', '.wasm': 'application/wasm' };
const server = createServer((req, res) => {
  let p = join('dist', decodeURIComponent(req.url.split('?')[0]));
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[p.slice(p.lastIndexOf('.'))] || 'application/octet-stream' });
  res.end(readFileSync(p));
}).listen(4398);

const pages = [];
const walk = (d) => readdirSync(d).forEach((f) => {
  const p = join(d, f);
  if (statSync(p).isDirectory()) { if (!/(_astro|pagefind|admin|print|pdf|data)$/.test(p)) walk(p); }
  else if (f === 'index.html' && p !== join('dist', 'index.html')) pages.push('/' + d.slice(5).replace(/\\/g, '/') + '/');
});
walk('dist');

const browser = await puppeteer.launch({ executablePath: chrome, headless: true });
let total = 0;
const desktop = { width: 1366, height: 900 }, mobile = { width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 };
const runs = [['desktop/light', desktop, 'light'], ['desktop/dark', desktop, 'dark'], ['mobile/light', mobile, 'light'], ['mobile/dark', mobile, 'dark']];
for (const [label, viewport, scheme] of runs) {
  for (const path of pages) {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
    await page.goto(`http://localhost:4398${path}`, { waitUntil: 'networkidle0' });
    await page.evaluate(axeSource);
    const r = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } }));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    for (const v of r.violations) {
      total += v.nodes.length;
      console.log(`✗ [${label}] ${path}  ${v.id} (${v.impact}): ${v.help}`);
      v.nodes.slice(0, 3).forEach((n) => console.log(`     ${n.target.join(' ')}`));
    }
    if (overflow) { total++; console.log(`✗ [${label}] ${path}  horizontal scroll`); }
    await page.close();
  }
}
await browser.close();
server.close();
console.log(total ? `\n${total} issue(s) on ${pages.length} pages` : `\n✓ No axe violations and no horizontal scroll on ${pages.length} pages × ${runs.length} viewport/colour-scheme combinations`);
process.exit(total ? 1 : 0);
