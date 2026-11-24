// Base-aware links, so the build works both at a domain root and under a sub-path (e.g. GitHub Pages).
const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
export const url = (path = '') => base + path.replace(/^\//, '');
