// Small, dependency-free helpers for building accessible SVG charts at build time.
export const W = 600;
export const H = 340;
export const M = { t: 16, r: 14, b: 34, l: 50 };

export type Pt = { x: number; y: number; lo?: number; hi?: number };
export type Series = { key: string; label: string; points: Pt[]; band?: boolean; dashed?: boolean };

export type ChartSpec =
  | { kind: 'bars'; points: Pt[]; signed?: boolean; highlight?: number[]; xLabels?: string[]; yLabel: string; unit: string; domain?: [number, number] }
  | { kind: 'lines'; series: Series[]; yLabel: string; unit: string; shade?: { x0: number; x1: number; label: string }; domain?: [number, number]; xDomain?: [number, number]; toggle?: boolean }
  | { kind: 'stripes'; points: Pt[] };

export const scale = (d0: number, d1: number, r0: number, r1: number) => (v: number) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);

/** "Nice" tick values covering [min, max]. */
export function ticks(min: number, max: number, count = 5): number[] {
  const span = max - min;
  const step0 = span / count;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count) ?? mag * 10;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6 || 0);
  return out;
}

export function extent(values: number[], pad = 0.08): [number, number] {
  let lo = Math.min(...values), hi = Math.max(...values);
  const p = (hi - lo) * pad;
  lo -= p; hi += p;
  if (lo > 0 && lo < (hi - lo) * 0.6) lo = 0;
  return [lo, hi];
}

export const linePath = (pts: Pt[], sx: (v: number) => number, sy: (v: number) => number) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join('');

export const bandPath = (pts: Pt[], sx: (v: number) => number, sy: (v: number) => number) => {
  const up = pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.hi!).toFixed(1)}`).join('');
  const down = [...pts].reverse().map((p) => `L${sx(p.x).toFixed(1)},${sy(p.lo!).toFixed(1)}`).join('');
  return up + down + 'Z';
};

/** Diverging blue–white–red scale for warming stripes, symmetrical around zero. */
export function stripeColor(a: number, maxAbs: number) {
  const t = Math.max(-1, Math.min(1, a / maxAbs));
  const blues = ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'];
  const reds = ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'];
  const pal = t < 0 ? blues : reds;
  return pal[Math.min(8, Math.round(Math.abs(t) * 8))];
}
