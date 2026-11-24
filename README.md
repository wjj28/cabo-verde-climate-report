# Climate of Cabo Verde: report microsite (independent concept)

A static, accessible, multilingual microsite for a national climate report, built as a portfolio piece.
It follows the requirements of a publication microsite for climate assessment reports: summary for policymakers,
chapters, interactive figures, downloadable PDFs and data, editing by non-technical staff, and deployment
to a plain static/LAMP host.

**Live site:** https://wjj28.github.io/cabo-verde-climate-report/

> **Not an official publication.** Not produced by or for INMG, INIDA, WMO, the IPCC or the Government of Cabo Verde.
> All data comes from the public sources cited on each figure and in `data/raw/`.

## What it shows

| Requirement | How it is met |
|---|---|
| Static build for LAMP hosting | Astro outputs plain HTML/CSS/JS in `dist/`; `public/.htaccess` adds language redirect, security headers, compression and caching |
| Non-technical editing | Git-based CMS at `/admin/` (Sveltia CMS, Decap-compatible): forms for chapters, headline statements, video and About page in every language; saves are commits that rebuild the site |
| Official languages | English, French and Chinese (WMO/UN official languages); `hreflang`, language switcher, localised number formats, Chinese typography. RTL-ready (logical CSS properties) for Arabic |
| Interactive charts with alt text | 8 SVG charts rendered at build time (no chart library): text description, data table, keyboard-accessible readout, scenario toggles |
| Lightbox and high-resolution downloads | Native `<dialog>` lightbox; PNG (4×) and SVG export; CSV for every figure |
| Full report and chapter PDFs | Generated from print pages with headless Chrome (`npm run pdf`), so PDFs always match the web content |
| Video | YouTube facade: loads `youtube-nocookie.com` only after the visitor presses play |
| Accessibility | axe-core WCAG 2.2 AA check on every page × desktop/mobile × light/dark (`npm run test:a11y`), 0 violations |
| SEO | Titles, meta descriptions, Open Graph/Twitter cards, JSON-LD, canonical URLs, `sitemap.xml` with hreflang, `robots.txt` |
| Performance | Lighthouse (mobile): Performance 99, Accessibility 100, Best Practices 100, SEO 100 |
| Search | Pagefind static search index, per language, no server |

## Commands

```bash
npm install
npm run dev          # local development at http://localhost:4321
npm run data         # rebuild src/data/climate.json from data/raw/
npm run build        # static site + search index in dist/
npm run pdf          # PDFs for every language (needs Chrome/Chromium; set CHROME_PATH if not found)
npm run og           # social preview image
npm run test:a11y    # accessibility audit of dist/
npm run release      # build + PDFs + rebuild + accessibility audit
```

`SITE` and `BASE` environment variables set the public URL and sub-path, e.g.
`SITE=https://wjj28.github.io BASE=/cabo-verde-climate-report/ npm run build`.

## Deploying

- **GitHub Pages:** `.github/workflows/deploy.yml` builds, generates PDFs, runs the accessibility audit and publishes on every push to `main`.
- **Apache / LAMP:** copy `dist/` to the document root. The same workflow can upload over SFTP when `LAMP_ENABLED` and the `LAMP_*` secrets are set. If the site lives in a sub-folder, build with `BASE=/folder/` and adjust the redirect paths in `.htaccess`.

## Editing content

| What | Where | Through the CMS |
|---|---|---|
| Chapters (text, key messages, figure placement, sources) | `src/content/chapters/<lang>/*.yaml` | Chapters |
| Home page, headline statements, video, About | `src/content/report/<lang>.json` | Report & summary |
| Interface text and figure captions/alt text | `src/i18n/ui.ts` | developer |
| Figure data and chart definitions | `scripts/build-data.mjs`, `src/lib/figures.ts` | developer |

Set `backend.repo` in `public/admin/config.yml` to the real repository. To edit locally without GitHub,
open `/admin/` in Chrome or Edge and choose **Work with Local Repository**.

## Data

| Dataset | Source |
|---|---|
| Observed temperature and rainfall, 1950–2024 | ERA5 reanalysis, Cabo Verde average, World Bank Climate Change Knowledge Portal API |
| Monthly temperature climatology, 1991–2020 | CRU TS 4.08, same portal |
| Projections (temperature, rainfall, nights > 26 °C) | CMIP6 ensemble median and 10th–90th percentiles, same portal |
| Crop and food production indices | FAO, via World Bank Open Data (`AG.PRD.CROP.XD`, `AG.PRD.FOOD.XD`) |

Gridded data averages the islands with the surrounding ocean; a real edition would use INMG station records.

## Project structure

```
data/raw/            downloaded source data (JSON)
scripts/             data processing, PDF, social image, accessibility audit
src/content/         report content per language (edited through the CMS)
src/i18n/ui.ts       interface strings and figure texts
src/lib/figures.ts   one definition per figure → chart, table, CSV
src/components/      Chart (SVG), Figure, Video, Evidence label
src/pages/[lang]/    home, summary, chapters, figures, downloads, about, search, print
public/admin/        CMS
public/.htaccess     Apache configuration
```
