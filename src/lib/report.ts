// Which report this build produces. One template, several microsites:
//   REPORT=main   → Climate of Cabo Verde (default)
//   REPORT=cities → Climate and Cities: Praia
// Each report has its own content, figures, data, colours and PDF store; everything else is shared.
export type ReportId = 'main' | 'cities';
export const REPORT: ReportId = (process.env.REPORT as ReportId) === 'cities' ? 'cities' : 'main';

interface ReportConfig {
  /** content folder (report JSON + chapters) */
  contentDir: string;
  /** what sits beside the title on the home page */
  heroAside: 'islands' | 'figure';
  /** figure shown in the hero card when heroAside = 'figure' */
  heroFigure?: string;
  /** relative path from this site's base to the sibling microsite built from the same template */
  sibling: { path: string; label: Record<'en' | 'fr' | 'zh', string> };
  /** social preview image */
  og: string;
}

export const reportConfig: ReportConfig = {
  main: {
    contentDir: './src/content',
    heroAside: 'islands',
    sibling: { path: 'cities/', label: { en: 'Climate and Cities: Praia', fr: 'Climat et villes : Praia', zh: '气候与城市：普拉亚' } },
    og: 'og/cover.png',
  },
  cities: {
    contentDir: './src/reports/cities',
    heroAside: 'figure',
    heroFigure: 'praiaNights',
    sibling: { path: '../', label: { en: 'Climate of Cabo Verde 2026', fr: 'Climat de Cabo Verde 2026', zh: '佛得角气候报告 2026' } },
    og: 'og/cover-cities.png',
  },
}[REPORT] as ReportConfig;

/** Folder holding generated PDFs for this report (read by the downloads page, written by scripts/make-pdfs.mjs). */
export const PDF_STORE = process.env.PDF_STORE || (REPORT === 'main' ? 'public/pdf' : `data/pdf-${REPORT}`);
