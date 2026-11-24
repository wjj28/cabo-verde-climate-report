import puppeteer from 'puppeteer-core';
const S = process.argv[2];
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
for (const scheme of ['light', 'dark']) {
  await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
  await p.setViewport({ width: 1440, height: 860 });
  await p.goto('http://localhost:4323/en/', { waitUntil: 'networkidle0' });
  await p.screenshot({ path: `${S}/cities-home-${scheme}.png` });
}
await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
await p.goto('http://localhost:4323/en/chapters/hotter-nights/', { waitUntil: 'networkidle0' });
await p.screenshot({ path: `${S}/cities-chapter.png`, clip: { x: 0, y: 0, width: 1440, height: 2000 }, captureBeyondViewport: true });
await p.setViewport({ width: 390, height: 844, isMobile: true });
await p.goto('http://localhost:4323/en/', { waitUntil: 'networkidle0' });
await p.screenshot({ path: `${S}/cities-mobile.png`, clip: { x: 0, y: 0, width: 390, height: 1700 }, captureBeyondViewport: true });
console.log(errs);
await b.close();
