// Progressive enhancement only: every page is fully readable without this file.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const lang = document.documentElement.lang;
  const nf = new Intl.NumberFormat(lang === 'ar' ? 'ar-u-nu-latn' : lang, { maximumFractionDigits: 2 });

  /* ---- hero height: fill the screen below the notice bar and header ---- */
  const setChrome = () => {
    const h = ($('.concept-bar')?.offsetHeight || 0) + ($('.site-header')?.offsetHeight || 0);
    document.documentElement.style.setProperty('--chrome-h', `${h}px`);
  };
  setChrome();
  window.addEventListener('resize', setChrome, { passive: true });

  /* ---- interactive island map ---- */
  const map = $('[data-island-map]');
  if (map) {
    let pinned = null;
    const hint = $('.isl-hint', map);
    const show = (k) => {
      $$('.isl', map).forEach((g) => g.classList.toggle('on', g.dataset.island === k));
      $$('.labels text[data-label]', map).forEach((t) => t.classList.toggle('on', t.dataset.label === k));
      $$('[data-card]', map).forEach((c) => (c.hidden = c.dataset.card !== k));
      if (hint) hint.hidden = !!k;
      map.classList.toggle('has-on', !!k);
    };
    const reset = () => show(pinned);
    $$('.isl', map).forEach((g) => {
      const k = g.dataset.island;
      g.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') show(k); });
      g.addEventListener('focus', () => show(k));
      g.addEventListener('blur', () => setTimeout(() => { if (!map.contains(document.activeElement)) reset(); }, 0));
      const toggle = () => {
        pinned = pinned === k ? null : k;
        $$('.isl', map).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.island === pinned)));
        show(pinned ?? k);
      };
      g.addEventListener('click', toggle);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    });
    $('svg', map).addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') reset(); });
    map.addEventListener('keydown', (e) => { if (e.key === 'Escape') { pinned = null; show(null); } });
  }

  /* ---- mobile navigation ---- */
  const nav = $('.main-nav');
  const toggle = $('.nav-toggle');
  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  /* ---- close <details> menus on outside click / Escape ---- */
  const menus = () => $$('details.lang-menu[open], details.dl-menu[open]');
  document.addEventListener('click', (e) => menus().forEach((d) => !d.contains(e.target) && d.removeAttribute('open')));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    menus().forEach((d) => { d.removeAttribute('open'); $('summary', d).focus(); });
    if (nav?.classList.contains('open')) { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); }
  });

  /* ---- chart readout (hover + keyboard) and scenario toggles ---- */
  for (const chart of $$('.chart')) {
    const json = $('.chart-data', chart);
    if (!json) continue;
    const d = JSON.parse(json.textContent);
    const plot = $('.plot', chart);
    const svg = $('svg', plot);
    const out = $('.readout', plot);
    const g = d.geom;
    const n = d.x.length;
    const NS = 'http://www.w3.org/2000/svg';
    const guide = document.createElementNS(NS, 'line');
    guide.setAttribute('class', 'chart-guide');
    guide.setAttribute('y1', g.t); guide.setAttribute('y2', g.b);
    guide.style.display = 'none';
    svg.appendChild(guide);
    const off = new Set();
    const xAt = (i) => (g.bars ? g.l + (i + 0.5) * ((g.r - g.l) / n) : g.l + ((d.x[i] - g.x0) / (g.x1 - g.x0)) * (g.r - g.l));
    let idx = -1;
    const show = (i) => {
      idx = Math.max(0, Math.min(n - 1, i));
      const x = xAt(idx);
      guide.setAttribute('x1', x); guide.setAttribute('x2', x);
      guide.style.display = '';
      const rows = d.series
        .filter((s) => !off.has(s.key) && Number.isFinite(s.v[idx]))
        .map((s) => `<span class="s-${s.key}">${d.series.length > 1 ? `<i></i>${s.label}: ` : ''}<strong>${s.v[idx] > 0 && /%|°/.test(d.unit) ? '+' : ''}${nf.format(s.v[idx])}${d.unit ? ' ' + d.unit : ''}</strong></span>`);
      if (!rows.length) return hide();
      out.innerHTML = `<b>${d.x[idx]}</b>${rows.join('<br>')}`;
      out.hidden = false;
      const scale = plot.clientWidth / svg.viewBox.baseVal.width;
      const px = x * scale;
      const w = out.offsetWidth;
      out.style.left = `${Math.min(Math.max(0, px + (px > plot.clientWidth / 2 ? -w - 12 : 12)), plot.clientWidth - w)}px`;
    };
    const hide = () => { out.hidden = true; guide.style.display = 'none'; };
    const toIndex = (clientX) => {
      const r = svg.getBoundingClientRect();
      const vx = ((clientX - r.left) / r.width) * svg.viewBox.baseVal.width;
      if (g.bars) return Math.floor(((vx - g.l) / (g.r - g.l)) * n);
      const year = g.x0 + ((vx - g.l) / (g.r - g.l)) * (g.x1 - g.x0);
      let best = 0;
      d.x.forEach((v, i) => { if (Math.abs(v - year) < Math.abs(d.x[best] - year)) best = i; });
      return best;
    };
    plot.addEventListener('pointermove', (e) => show(toIndex(e.clientX)));
    plot.addEventListener('pointerleave', hide);
    plot.tabIndex = 0;
    plot.setAttribute('aria-describedby', `${svg.getAttribute('aria-labelledby').split(' ')[1]}`);
    plot.addEventListener('focus', () => show(idx < 0 ? n - 1 : idx));
    plot.addEventListener('blur', hide);
    plot.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowLeft: -1, ArrowUp: 10, ArrowDown: -10 }[e.key];
      if (e.key === 'Home') { e.preventDefault(); return show(0); }
      if (e.key === 'End') { e.preventDefault(); return show(n - 1); }
      if (step) { e.preventDefault(); show(idx + step); }
    });
    const fs = $('.toggles', chart);
    if (fs) {
      fs.hidden = false;
      fs.addEventListener('change', (e) => {
        const k = e.target.dataset.toggle;
        if (!k) return;
        e.target.checked ? off.delete(k) : off.add(k);
        $$(`[data-series="${k}"]`, svg).forEach((el) => el.classList.toggle('is-off', !e.target.checked));
        if (idx >= 0 && !out.hidden) show(idx);
      });
    }
  }

  /* ---- figure export: standalone SVG / high-resolution PNG ---- */
  const exportSvg = (fig) => {
    const src = $('.plot svg', fig);
    fig.classList.add('export-light');
    const clone = src.cloneNode(true);
    const all = [src, ...$$('*', src)];
    const copies = [clone, ...$$('*', clone)];
    all.forEach((el, i) => {
      const cs = getComputedStyle(el);
      const c = copies[i];
      for (const p of ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity', 'font-size', 'font-weight', 'display']) {
        const v = cs.getPropertyValue(p);
        if (v) c.style.setProperty(p, v);
      }
    });
    fig.classList.remove('export-light');
    $$('.chart-guide', clone).forEach((el) => el.remove());
    const title = fig.dataset.title;
    const vb = src.viewBox.baseVal;
    const pad = 44;
    const wrap = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    wrap.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    wrap.setAttribute('viewBox', `0 0 ${vb.width + 32} ${vb.height + pad + 40}`);
    wrap.setAttribute('width', vb.width + 32);
    wrap.setAttribute('height', vb.height + pad + 40);
    wrap.innerHTML = `<rect width="100%" height="100%" fill="#fff"/><text x="16" y="28" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="700" fill="#142630"></text><text x="16" y="${vb.height + pad + 28}" font-family="Inter, Arial, sans-serif" font-size="11" fill="#4d5f69"></text>`;
    wrap.children[1].textContent = title;
    wrap.children[2].textContent = ($('.figure-source', fig)?.textContent || '').trim();
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(16 ${pad})`);
    clone.removeAttribute('class');
    clone.setAttribute('width', vb.width);
    clone.setAttribute('height', vb.height);
    clone.style.fontFamily = 'Inter, Arial, sans-serif';
    g.appendChild(clone);
    wrap.appendChild(g);
    return { text: new XMLSerializer().serializeToString(wrap), w: vb.width + 32, h: vb.height + pad + 40 };
  };
  const save = (blob, name) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  };
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-download]');
    if (!btn) return;
    const fig = btn.closest('.figure');
    const name = `cabo-verde-climate-${fig.dataset.figure}`;
    const { text, w, h } = exportSvg(fig);
    if (btn.dataset.download === 'svg') return save(new Blob([text], { type: 'image/svg+xml' }), `${name}.svg`);
    const img = new Image();
    const scale = 4; // 4× ≈ 2500 px wide: print quality
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = w * scale; c.height = h * scale;
      const ctx = c.getContext('2d');
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, w, h);
      c.toBlob((b) => save(b, `${name}.png`), 'image/png');
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(text);
    btn.closest('details')?.removeAttribute('open');
  });

  /* ---- lightbox ---- */
  const dlg = $('dialog.lightbox');
  let opener = null;
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-enlarge]');
    if (!btn || !dlg?.showModal) return;
    const fig = btn.closest('.figure');
    opener = btn;
    $('#lightbox-title', dlg).textContent = fig.dataset.title;
    const body = $('.lightbox-body', dlg);
    body.innerHTML = '';
    // Clone the whole chart (legend + plot) so it keeps the chart styles; turn scenario
    // toggles into a static legend that reflects what is currently shown.
    const chart = $('.chart', fig).cloneNode(true);
    $$('script, .readout, .chart-guide', chart).forEach((el) => el.remove());
    const toggles = $('.toggles', chart);
    if (toggles) {
      const ul = document.createElement('ul');
      ul.className = 'legend';
      $$('.toggle', toggles).forEach((t) => {
        if (!$('input', t).checked) return;
        const li = document.createElement('li');
        li.className = [...t.classList].filter((c) => c.startsWith('s-')).join(' ');
        li.innerHTML = '<span class="swatch" aria-hidden="true"></span>';
        li.append(t.textContent.trim());
        ul.appendChild(li);
      });
      toggles.replaceWith(ul);
    }
    const plot = $('.plot', chart);
    plot.removeAttribute('tabindex');
    plot.removeAttribute('aria-describedby');
    $$('[id]', chart).forEach((el) => (el.id += '-lb'));
    const svg = $('svg', chart);
    svg.setAttribute('aria-labelledby', svg.getAttribute('aria-labelledby').split(' ').map((x) => x + '-lb').join(' '));
    body.appendChild(chart);
    const cap = $('figcaption', fig).cloneNode(true);
    body.appendChild(cap);
    dlg.showModal();
    $('[data-close]', dlg).focus();
  });
  dlg?.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
  dlg?.addEventListener('close', () => opener?.focus());

  /* ---- video facade ---- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-play]');
    if (!a) return;
    e.preventDefault();
    const box = a.closest('.video');
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${box.dataset.video}?autoplay=1&rel=0&hl=${lang}&cc_lang_pref=${lang}`;
    f.title = box.dataset.title;
    f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    box.replaceChildren(f);
    f.focus();
  });

  /* ---- table of contents: highlight the section in view ---- */
  const tocLinks = $$('.toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const map = new Map(tocLinks.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        tocLinks.forEach((a) => a.classList.remove('active'));
        map.get(en.target.id)?.classList.add('active');
      }
    }, { rootMargin: '-15% 0px -75% 0px' });
    map.forEach((_, id) => { const el = document.getElementById(id); el && io.observe(el); });
  }
})();
