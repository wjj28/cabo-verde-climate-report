// Generates the full-report and chapter PDFs for every language from the print pages,
// using headless Chrome. Run after `npm run build`:  npm run pdf
// Output: <PDF_STORE>/<lang>/report.pdf and chapter-N.pdf (copied into <OUT_DIR>/pdf too).
// OUT_DIR and PDF_STORE select the microsite (defaults: dist and public/pdf for the main report).
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, copyFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);
const chrome = chromeCandidates.find((p) => existsSync(p));
if (!chrome) throw new Error('Chrome/Chromium not found. Set CHROME_PATH.');

// A separate profile, so headless Chrome does not attach to a Chrome window that is already open
const profile = join(tmpdir(), 'cv-climate-pdf-profile');
const DIST = (process.env.OUT_DIR || 'dist').replace(/^\.\//, '');
const STORE = process.env.PDF_STORE || (process.env.REPORT && process.env.REPORT !== 'main' ? `data/pdf-${process.env.REPORT}` : 'public/pdf');
const PORT = 4399;
const win = process.platform === 'win32';
// own process group on Linux/macOS so the whole server tree can be stopped afterwards
const server = spawn(`npx astro preview --port ${PORT}`, { shell: true, stdio: 'ignore', detached: !win });
// Respect the BASE sub-path (e.g. /repo-name/ on GitHub Pages)
const BASE = ('/' + (process.env.BASE || '/').replace(/^\/+|\/+$/g, '') + '/').replace('//', '/');
const base = `http://localhost:${PORT}${BASE.slice(0, -1)}`;
const wait = async () => {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(base + '/en/')).ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Preview server did not start');
};

try {
  await wait();
  const langs = readdirSync(DIST).filter((d) => existsSync(join(DIST, d, 'print')));
  for (const lang of langs) {
    const parts = readdirSync(join(DIST, lang, 'print'));
    mkdirSync(join(STORE, lang), { recursive: true });
    mkdirSync(join(DIST, 'pdf', lang), { recursive: true });
    for (const part of parts) {
      const out = resolve(STORE, lang, `${part}.pdf`);
      execFileSync(chrome, [
        '--headless=new', '--disable-gpu', `--user-data-dir=${profile}`, ...(process.env.CI ? ['--no-sandbox'] : []), '--no-pdf-header-footer', '--run-all-compositor-stages-before-draw',
        '--virtual-time-budget=6000', `--print-to-pdf=${out}`, `${base}/${lang}/print/${part}/`,
      ], { stdio: 'ignore' });
      copyFileSync(out, join(DIST, 'pdf', lang, `${part}.pdf`));
      console.log(`${out}  ${Math.round(statSync(out).size / 1024)} KB`);
    }
  }
} finally {
  // stop the preview server and its child processes
  if (win) { try { execFileSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' }); } catch {} }
  else { try { process.kill(-server.pid, 'SIGTERM'); } catch {} }
}
