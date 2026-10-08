/* TabViz — a small SVG kit that draws the way Tableau draws.
   ------------------------------------------------------------------
   Purpose: mock up worksheets for the onboarding efficiency /
   effectiveness dashboard so that every chart in the mock is one
   Tableau can actually build, and looks like it will in Tableau.

   Each renderer maps to a Show Me chart type or a standard Tableau
   build pattern. The `build` note on each documents the Tableau
   recipe (Columns / Rows / Marks card), so the mock doubles as a
   build sheet.

   Behaviour mirrored from Tableau:
     - hover        → tooltip ("Field: **Value**" rows)
     - click a mark → highlight it, fade the rest; click empty → clear
     - square mark ends, no rounding, no strokes between stacked bars
     - gridlines on the value axis only, no tick marks, gray tick labels
     - row headers to the left of the pane, column headers on top

   Usage:  TabViz.hbar(element, { data:[{label,value}], ... })
   Requires palettes.js (window.TAB_PALETTES) and components.css.
   ------------------------------------------------------------------ */
(function () {
  'use strict';
  const PAL = window.TAB_PALETTES || { categorical: { 'Tableau 10': ['#4E79A7','#F28E2B','#E15759','#76B7B2','#59A14F','#EDC948','#B07AA1','#FF9DA7','#9C755F','#BAB0AC'] }, sequential: {}, diverging: {} };
  const T10 = PAL.categorical['Tableau 10'];
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------------- helpers ---------------- */
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
  const fmt = {
    num: v => nf.format(v),
    dec1: v => v.toFixed(1),
    int: v => Math.round(v).toLocaleString('en-US'),
    pct: v => (v * 100).toFixed(v < 0.1 && v > 0 ? 1 : 0) + '%',
    pct1: v => (v * 100).toFixed(1) + '%',
    days: v => nf.format(v) + 'd',
    k: v => Math.abs(v) >= 1000 ? nf.format(v / 1000) + 'K' : nf.format(v),
  };
  const getFmt = f => typeof f === 'function' ? f : (fmt[f] || fmt.num);

  function niceTicks(min, max, count = 5) {
    if (min === max) { max = min + 1; }
    const span = max - min, step0 = span / count;
    const mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const err = step0 / mag;
    const step = (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1) * mag;
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
    const t = []; for (let v = lo; v <= hi + step / 2; v += step) t.push(+v.toFixed(10));
    return t;
  }
  const lin = (d0, d1, r0, r1) => v => r0 + (v - d0) / ((d1 - d0) || 1) * (r1 - r0);

  /* Text width estimate for layout (Tableau Book ≈ Arial metrics). */
  let _ctx;
  function tw(s, px = 12) {
    _ctx = _ctx || document.createElement('canvas').getContext('2d');
    _ctx.font = px + 'px "Tableau Book", Arial, sans-serif';
    return _ctx.measureText(String(s)).width;
  }

  /* Sequential / diverging ramps from the Tableau palettes. */
  function ramp(name, t) {
    const stops = (PAL.sequential && PAL.sequential[name]) || (PAL.diverging && PAL.diverging[name]) || ['#B9DDF1', '#2A5783'];
    t = Math.max(0, Math.min(1, t));
    const i = t * (stops.length - 1), a = Math.floor(i), b = Math.min(stops.length - 1, a + 1), f = i - a;
    const h = x => parseInt(x.slice(1), 16), A = h(stops[a]), B = h(stops[b]);
    const ch = s => Math.round(((A >> s) & 255) * (1 - f) + ((B >> s) & 255) * f);
    return '#' + [16, 8, 0].map(s => ch(s).toString(16).padStart(2, '0')).join('');
  }
  const ink = hex => { const n = parseInt(hex.slice(1), 16); const L = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)); return L > 150 ? '#333333' : '#FFFFFF'; };
  const colorOf = (opts, i) => (opts.palette ? PAL.categorical[opts.palette] || T10 : T10)[i % 10];

  /* tooltip payload: array of [field, value] */
  const tip = rows => ` data-tip="${esc(JSON.stringify(rows))}"`;

  function svgOpen(w, h) { return `<svg xmlns="${NS}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">`; }

  /* ---------------- tooltip + highlight (one per page) ---------------- */
  let tipEl;
  function ensureTip() {
    if (tipEl) return tipEl;
    tipEl = document.createElement('div'); tipEl.className = 'tab-tooltip'; document.body.appendChild(tipEl);
    document.addEventListener('mousemove', e => {
      const m = e.target.closest && e.target.closest('[data-tip]');
      if (!m) { tipEl.style.display = 'none'; return; }
      const rows = JSON.parse(m.getAttribute('data-tip'));
      tipEl.innerHTML = rows.map(([k, v]) => v === undefined
        ? `<div class="tt-row">${esc(k)}</div>`
        : `<div class="tt-row"><span class="tt-k">${esc(k)}:</span> <span class="tt-v">${esc(v)}</span></div>`).join('')
        + `<div class="tt-actions">✓ Keep Only &nbsp; ✕ Exclude &nbsp; ▦ View Data</div>`;
      tipEl.style.display = 'block';
      const r = tipEl.getBoundingClientRect();
      let x = e.clientX + 14, y = e.clientY + 14;
      if (x + r.width > innerWidth - 8) x = e.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = e.clientY - r.height - 14;
      tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px';
    });
    document.addEventListener('click', e => {
      const viz = e.target.closest && e.target.closest('.tab-viz');
      if (!viz) return;
      const m = e.target.closest('.mark');
      const marks = viz.querySelectorAll('.mark');
      if (!m) { marks.forEach(x => x.classList.remove('faded')); return; }
      const key = m.getAttribute('data-key');
      const already = !m.classList.contains('faded') && [...marks].some(x => x.classList.contains('faded'));
      if (already) { marks.forEach(x => x.classList.remove('faded')); return; }
      marks.forEach(x => x.classList.toggle('faded', x.getAttribute('data-key') !== key));
    });
    return tipEl;
  }

  /* Mount: renders now, re-renders on resize. */
  function mount(el, fn, opts) {
    if (typeof el === 'string') el = document.querySelector(el);
    ensureTip();
    el.classList.add('tab-viz');
    const draw = () => { el.innerHTML = fn(Math.max(40, el.clientWidth || 400), opts); };
    draw();
    if (window.ResizeObserver) {
      let lastW = el.clientWidth;
      new ResizeObserver(() => { if (Math.abs(el.clientWidth - lastW) > 4) { lastW = el.clientWidth; draw(); } }).observe(el);
    }
    return el;
  }

  /* Value axis (horizontal, at bottom) + vertical gridlines */
  function xAxis(x, ticks, y0, y1, f, title, cx) {
    let s = '';
    ticks.forEach(t => { s += `<line class="${t === 0 ? 'zero' : 'grid'}" x1="${x(t)}" x2="${x(t)}" y1="${y0}" y2="${y1}"/>`; });
    ticks.forEach(t => { s += `<text class="ax-tick" x="${x(t)}" y="${y1 + 14}" text-anchor="middle">${esc(f(t))}</text>`; });
    if (title) s += `<text class="ax-title" x="${cx}" y="${y1 + 30}" text-anchor="middle">${esc(title)}</text>`;
    return s;
  }
  /* Value axis (vertical, at left) + horizontal gridlines */
  function yAxis(y, ticks, x0, x1, f, title, cy) {
    let s = '';
    ticks.forEach(t => { s += `<line class="${t === 0 ? 'zero' : 'grid'}" x1="${x0}" x2="${x1}" y1="${y(t)}" y2="${y(t)}"/>`; });
    ticks.forEach(t => { s += `<text class="ax-tick" x="${x0 - 6}" y="${y(t) + 4}" text-anchor="end">${esc(f(t))}</text>`; });
    if (title) s += `<text class="ax-title" transform="translate(${x0 - 40},${cy}) rotate(-90)" text-anchor="middle">${esc(title)}</text>`;
    return s;
  }

  /* ================================================================
     RENDERERS
     ================================================================ */

  /* Horizontal bars — Show Me "horizontal bars".
     build: Rows = Dimension · Columns = SUM(Measure) · Marks = Bar */
  function hbar(w, o) {
    const f = getFmt(o.format), data = o.sort === false ? o.data : [...o.data].sort((a, b) => b.value - a.value);
    const rowH = o.rowHeight || 24, hdrW = Math.min(w * 0.4, Math.max(...data.map(d => tw(d.label))) + 16);
    const top = 4, plotH = data.length * rowH, h = top + plotH + (o.axisTitle ? 40 : 24);
    const max = o.max ?? Math.max(...data.map(d => Math.max(d.value, d.target || 0)));
    const ticks = niceTicks(Math.min(0, ...data.map(d => d.value)), max, Math.max(2, Math.floor((w - hdrW) / 80)));
    const x = lin(ticks[0], ticks[ticks.length - 1], hdrW, w - 10);
    let s = svgOpen(w, h) + xAxis(x, ticks, top, top + plotH, f, o.axisTitle, (hdrW + w) / 2);
    s += `<line class="div" x1="${hdrW}" x2="${hdrW}" y1="${top}" y2="${top + plotH}"/>`;
    data.forEach((d, i) => {
      const y = top + i * rowH, bh = rowH * (o.barSize || 0.62), by = y + (rowH - bh) / 2;
      const c = d.color || (o.colorBy === 'index' ? colorOf(o, i) : (o.color || T10[0]));
      s += `<text class="hdr" x="8" y="${y + rowH / 2 + 4}">${esc(d.label)}</text>`;
      const x0 = x(Math.min(0, d.value)), x1 = x(Math.max(0, d.value));
      s += `<rect class="mark" data-key="${esc(d.label)}" x="${x0}" y="${by}" width="${Math.max(1, x1 - x0)}" height="${bh}" fill="${c}"${tip([[o.dim || 'Category', d.label], [o.measure || 'Value', f(d.value)], ...(d.extra || [])])}/>`;
      if (d.target != null) s += `<line class="ref" x1="${x(d.target)}" x2="${x(d.target)}" y1="${y + 2}" y2="${y + rowH - 2}" style="stroke-dasharray:none;stroke:#333;stroke-width:2"/>`;
      if (o.labels !== false) s += `<text class="lbl" x="${x1 + 4}" y="${y + rowH / 2 + 4}">${esc(f(d.value))}</text>`;
    });
    if (o.refLine != null) s += `<line class="ref" x1="${x(o.refLine)}" x2="${x(o.refLine)}" y1="${top}" y2="${top + plotH}"/><text class="ax-tick" x="${x(o.refLine) + 4}" y="${top + 10}">${esc(o.refLabel || f(o.refLine))}</text>`;
    return s + '</svg>';
  }

  /* Vertical bars over discrete categories (also: "discrete" bars over months).
     build: Columns = Dimension · Rows = SUM(Measure) · Marks = Bar */
  function vbar(w, o) {
    const f = getFmt(o.format), data = o.data, h = o.height || 220;
    const L = 44, B = 34, top = 8, pw = w - L - 6, ph = h - top - B;
    const max = Math.max(...data.map(d => d.value)), ticks = niceTicks(Math.min(0, ...data.map(d => d.value)), max, 4);
    const y = lin(ticks[0], ticks[ticks.length - 1], top + ph, top), bw = pw / data.length;
    let s = svgOpen(w, h) + yAxis(y, ticks, L, w - 6, f, o.axisTitle, top + ph / 2);
    data.forEach((d, i) => {
      const x = L + i * bw, inner = bw * (o.barSize || 0.68), bx = x + (bw - inner) / 2, c = d.color || o.color || T10[0];
      s += `<rect class="mark" data-key="${esc(d.label)}" x="${bx}" y="${y(Math.max(0, d.value))}" width="${inner}" height="${Math.abs(y(d.value) - y(0))}" fill="${c}"${tip([[o.dim || 'Category', d.label], [o.measure || 'Value', f(d.value)]])}/>`;
      s += `<text class="hdr-col" x="${x + bw / 2}" y="${top + ph + 16}" text-anchor="middle">${esc(d.label)}</text>`;
      if (o.labels) s += `<text class="lbl" x="${x + bw / 2}" y="${y(d.value) - 4}" text-anchor="middle">${esc(f(d.value))}</text>`;
    });
    if (o.refLine != null) s += `<line class="ref" x1="${L}" x2="${w - 6}" y1="${y(o.refLine)}" y2="${y(o.refLine)}"/><text class="ax-tick" x="${w - 8}" y="${y(o.refLine) - 4}" text-anchor="end">${esc(o.refLabel || f(o.refLine))}</text>`;
    return s + '</svg>';
  }

  /* Stacked bars — Show Me "stacked bars". Horizontal.
     build: Rows = Dim A · Columns = SUM(Measure) · Color = Dim B · Marks = Bar
     o.percent → quick table calc "Percent of Total" computed along Dim B. */
  function stackedBar(w, o) {
    const f = getFmt(o.percent ? 'pct' : o.format), rows = o.rows, series = o.series;
    const rowH = o.rowHeight || 26, hdrW = Math.min(w * 0.35, Math.max(...rows.map(r => tw(r.label))) + 16), top = 4;
    const plotH = rows.length * rowH, h = top + plotH + (o.axisTitle ? 40 : 24);
    const totals = rows.map(r => r.values.reduce((a, b) => a + b, 0));
    const max = o.percent ? 1 : Math.max(...totals), ticks = o.percent ? [0, .25, .5, .75, 1] : niceTicks(0, max, Math.max(2, Math.floor((w - hdrW) / 80)));
    const x = lin(0, ticks[ticks.length - 1], hdrW, w - 10);
    let s = svgOpen(w, h) + xAxis(x, ticks, top, top + plotH, f, o.axisTitle, (hdrW + w) / 2);
    s += `<line class="div" x1="${hdrW}" x2="${hdrW}" y1="${top}" y2="${top + plotH}"/>`;
    rows.forEach((r, i) => {
      const y = top + i * rowH, bh = rowH * 0.62, by = y + (rowH - bh) / 2; let acc = 0;
      s += `<text class="hdr" x="8" y="${y + rowH / 2 + 4}">${esc(r.label)}</text>`;
      r.values.forEach((v, j) => {
        const val = o.percent ? v / totals[i] : v, x0 = x(acc), x1 = x(acc + val); acc += val;
        const c = colorOf(o, j);
        s += `<rect class="mark" data-key="${esc(series[j])}" x="${x0}" y="${by}" width="${Math.max(0, x1 - x0)}" height="${bh}" fill="${c}"${tip([[o.dimA || 'Row', r.label], [o.dimB || 'Series', series[j]], [o.measure || 'Value', getFmt(o.format)(v)], ...(o.percent ? [['% of Total', fmt.pct1(val)]] : [])])}/>`;
        if (o.labels && x1 - x0 > tw(f(val), 11) + 6) s += `<text class="${ink(c) === '#FFFFFF' ? 'lbl-in' : 'lbl'}" x="${(x0 + x1) / 2}" y="${y + rowH / 2 + 4}" text-anchor="middle">${esc(f(val))}</text>`;
      });
    });
    return s + '</svg>';
  }

  /* Side-by-side bars — Show Me "side-by-side bars".
     build: Columns = Dim A, Dim B · Rows = SUM(Measure) · Color = Dim B
     Dim A becomes a column header row, panes separated by dividers. */
  function sideBySide(w, o) {
    const f = getFmt(o.format), groups = o.groups, series = o.series, h = o.height || 230;
    const L = 44, top = 22, B = 10, pw = w - L - 6, ph = h - top - B;
    const all = groups.flatMap(g => g.values), ticks = niceTicks(0, Math.max(...all), 4);
    const y = lin(0, ticks[ticks.length - 1], top + ph, top), gw = pw / groups.length;
    let s = svgOpen(w, h) + yAxis(y, ticks, L, w - 6, f, o.axisTitle, top + ph / 2);
    groups.forEach((g, i) => {
      const gx = L + i * gw;
      s += `<text class="hdr-col" x="${gx + gw / 2}" y="14" text-anchor="middle">${esc(g.label)}</text>`;
      if (i) s += `<line class="div" x1="${gx}" x2="${gx}" y1="0" y2="${top + ph}"/>`;
      const bw = (gw - 10) / series.length;
      g.values.forEach((v, j) => {
        const bx = gx + 5 + j * bw + bw * 0.08, c = colorOf(o, j);
        s += `<rect class="mark" data-key="${esc(series[j])}" x="${bx}" y="${y(v)}" width="${bw * 0.84}" height="${y(0) - y(v)}" fill="${c}"${tip([[o.dimA || 'Group', g.label], [o.dimB || 'Series', series[j]], [o.measure || 'Value', f(v)]])}/>`;
      });
    });
    s += `<line class="div" x1="${L}" x2="${w - 6}" y1="${top}" y2="${top}"/>`;
    return s + '</svg>';
  }

  /* Lines (continuous) — Show Me "lines (continuous)" / "dual lines" when two series.
     build: Columns = MONTH(Date) continuous (green pill) · Rows = Measure · Color = Dim · Marks = Line
     o.markers → Marks card > Color > Markers: All. o.endLabels → Label: Line Ends. */
  function line(w, o) {
    const f = getFmt(o.format), xs = o.x, ser = o.series, h = o.height || 220;
    const L = 44, R = o.endLabels ? Math.max(...ser.map(s => tw(s.name, 11))) + 14 : 10, top = 10, B = 28;
    const vals = ser.flatMap(s => s.values.filter(v => v != null));
    const ticks = niceTicks(o.zero === false ? Math.min(...vals) : Math.min(0, ...vals), Math.max(...vals), Math.max(1, Math.min(4, Math.floor((h - top - B) / 30))));
    const y = lin(ticks[0], ticks[ticks.length - 1], h - B, top), x = lin(0, xs.length - 1, L + 6, w - R);
    let s = svgOpen(w, h) + yAxis(y, ticks, L, w - R + 4, f, o.axisTitle, (h - B + top) / 2);
    const every = Math.ceil(xs.length / Math.max(2, Math.floor((w - L - R) / 56)));
    xs.forEach((d, i) => { if (i % every === 0) s += `<text class="ax-tick" x="${x(i)}" y="${h - B + 16}" text-anchor="middle">${esc(d)}</text>`; });
    if (o.band) s += `<rect class="ref-band" x="${L}" y="${y(o.band[1])}" width="${w - R - L}" height="${y(o.band[0]) - y(o.band[1])}"/>`;
    if (o.refLine != null) s += `<line class="ref" x1="${L}" x2="${w - R}" y1="${y(o.refLine)}" y2="${y(o.refLine)}"/><text class="ax-tick" x="${L + 4}" y="${y(o.refLine) - 4}">${esc(o.refLabel || f(o.refLine))}</text>`;
    ser.forEach((sr, j) => {
      const c = sr.color || colorOf(o, j);
      const pts = sr.values.map((v, i) => v == null ? null : [x(i), y(v)]);
      let d = '', pen = false; pts.forEach(p => { if (!p) { pen = false; return; } d += (pen ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1); pen = true; });
      s += `<path class="mark" data-key="${esc(sr.name)}" d="${d}" fill="none" stroke="${c}" stroke-width="${o.lineWidth || 2}" stroke-linejoin="round" ${sr.dashed ? 'stroke-dasharray="4 3"' : ''}/>`;
      pts.forEach((p, i) => {
        if (!p) return;
        const t = tip([[o.xField || 'Period', xs[i]], ...(ser.length > 1 ? [[o.dim || 'Series', sr.name]] : []), [o.measure || 'Value', f(sr.values[i])]]);
        s += `<circle class="mark" data-key="${esc(sr.name)}" cx="${p[0]}" cy="${p[1]}" r="${o.markers ? 3 : 7}" fill="${o.markers ? c : 'transparent'}"${t}/>`;
      });
      if (o.endLabels) { const li = sr.values.length - 1; s += `<text class="lbl" x="${x(li) + 6}" y="${y(sr.values[li]) + 4}">${esc(sr.name)}</text>`; }
    });
    return s + '</svg>';
  }

  /* Area (continuous, stacked) — Show Me "area charts (continuous)".
     build: Columns = continuous date · Rows = Measure · Color = Dim · Marks = Area (Stack Marks on) */
  function area(w, o) {
    const f = getFmt(o.format), xs = o.x, ser = o.series, h = o.height || 220, L = 44, top = 10, B = 28, R = 10;
    const tot = xs.map((_, i) => ser.reduce((a, s) => a + s.values[i], 0));
    const ticks = niceTicks(0, Math.max(...tot), 4), y = lin(0, ticks[ticks.length - 1], h - B, top), x = lin(0, xs.length - 1, L + 1, w - R);
    let s = svgOpen(w, h) + yAxis(y, ticks, L, w - R, f, o.axisTitle, (h - B + top) / 2);
    const every = Math.ceil(xs.length / Math.max(2, Math.floor((w - L) / 56)));
    xs.forEach((d, i) => { if (i % every === 0) s += `<text class="ax-tick" x="${x(i)}" y="${h - B + 16}" text-anchor="middle">${esc(d)}</text>`; });
    const base = xs.map(() => 0);
    ser.forEach((sr, j) => {
      const lo = base.slice(), hi = base.map((b, i) => b + sr.values[i]);
      const d = 'M' + hi.map((v, i) => x(i) + ',' + y(v)).join('L') + 'L' + lo.map((v, i) => x(i) + ',' + y(v)).reverse().join('L') + 'Z';
      s += `<path class="mark" data-key="${esc(sr.name)}" d="${d}" fill="${colorOf(o, j)}"${tip([[o.dim || 'Series', sr.name]])}/>`;
      hi.forEach((v, i) => base[i] = v);
    });
    return s + '</svg>';
  }

  /* Dual combination — Show Me "dual combination": bars + line on a dual axis.
     build: Columns = date · Rows = Measure A, Measure B → Dual Axis, mark types Bar + Line.
     Caution: two y-scales. Synchronize axes when units match, or prefer two stacked sheets. */
  function combo(w, o) {
    const fa = getFmt(o.formatA), fb = getFmt(o.formatB), xs = o.x, h = o.height || 220, L = 44, R = 44, top = 10, B = 28;
    const ta = niceTicks(0, Math.max(...o.bars), 4), tb = niceTicks(0, Math.max(...o.line), 4);
    const ya = lin(0, ta[ta.length - 1], h - B, top), yb = lin(0, tb[tb.length - 1], h - B, top);
    const bw = (w - L - R) / xs.length, xc = i => L + bw * (i + .5);
    let s = svgOpen(w, h) + yAxis(ya, ta, L, w - R, fa, o.titleA, (h - B + top) / 2);
    tb.forEach(t => { s += `<text class="ax-tick" x="${w - R + 6}" y="${yb(t) + 4}">${esc(fb(t))}</text>`; });
    xs.forEach((d, i) => { s += `<text class="ax-tick" x="${xc(i)}" y="${h - B + 16}" text-anchor="middle">${esc(d)}</text>`; });
    o.bars.forEach((v, i) => { s += `<rect class="mark" data-key="b${i}" x="${xc(i) - bw * .32}" y="${ya(v)}" width="${bw * .64}" height="${ya(0) - ya(v)}" fill="${o.colorA || '#A0CBE8'}"${tip([[o.xField || 'Period', xs[i]], [o.measureA, fa(v)], [o.measureB, fb(o.line[i])]])}/>`; });
    s += `<path d="M${o.line.map((v, i) => xc(i) + ',' + yb(v)).join('L')}" fill="none" stroke="${o.colorB || T10[1]}" stroke-width="2"/>`;
    o.line.forEach((v, i) => { s += `<circle class="mark" data-key="b${i}" cx="${xc(i)}" cy="${yb(v)}" r="3" fill="${o.colorB || T10[1]}"${tip([[o.xField || 'Period', xs[i]], [o.measureA, fa(o.bars[i])], [o.measureB, fb(v)]])}/>`; });
    return s + '</svg>';
  }

  /* Pie (and donut via the dual-axis "MIN(0)" trick).
     build: Marks = Pie · Angle = SUM(Measure) · Color = Dim. Donut: Rows = MIN(0), MIN(0) dual axis, second pie white + label. */
  function pie(w, o) {
    const f = getFmt(o.format), data = o.data, h = o.height || 200, r = Math.min(w, h) / 2 - 6, cx = w / 2, cy = h / 2;
    const tot = data.reduce((a, d) => a + d.value, 0); let a0 = -Math.PI / 2;
    let s = svgOpen(w, h);
    data.forEach((d, i) => {
      const a1 = a0 + d.value / tot * Math.PI * 2, large = a1 - a0 > Math.PI ? 1 : 0;
      const p = (a, rr) => [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
      const [x0, y0] = p(a0, r), [x1, y1] = p(a1, r);
      s += `<path class="mark" data-key="${esc(d.label)}" d="M${cx},${cy}L${x0},${y0}A${r},${r} 0 ${large} 1 ${x1},${y1}Z" fill="${d.color || colorOf(o, i)}" stroke="#fff" stroke-width="1"${tip([[o.dim || 'Category', d.label], [o.measure || 'Value', f(d.value)], ['% of Total', fmt.pct1(d.value / tot)]])}/>`;
      a0 = a1;
    });
    if (o.donut) {
      s += `<circle cx="${cx}" cy="${cy}" r="${r * (o.donut === true ? .6 : o.donut)}" fill="#fff" pointer-events="none"/>`;
      if (o.center) s += `<text x="${cx}" y="${cy + 2}" text-anchor="middle" style="font-size:22px;font-family:var(--tab-font-semibold);font-weight:600">${esc(o.center)}</text><text class="ax-tick" x="${cx}" y="${cy + 18}" text-anchor="middle">${esc(o.centerSub || '')}</text>`;
    }
    return s + '</svg>';
  }

  /* Treemap — Show Me "treemap". build: Marks = Square · Size = SUM(Measure) · Color = Dim or measure · Label = Dim */
  function treemap(w, o) {
    const f = getFmt(o.format), h = o.height || 220, data = [...o.data].sort((a, b) => b.value - a.value);
    const tot = data.reduce((a, d) => a + d.value, 0), area = w * h;
    const items = data.map((d, i) => ({ ...d, i, a: d.value / tot * area }));
    const rects = [];
    (function squarify(list, x, y, W, H) {
      if (!list.length) return;
      if (list.length === 1) { rects.push({ ...list[0], x, y, w: W, h: H }); return; }
      const short = Math.min(W, H); let row = [], best = Infinity, k = 0;
      const worst = r => { const s = r.reduce((a, b) => a + b.a, 0), mx = Math.max(...r.map(z => z.a)), mn = Math.min(...r.map(z => z.a)); return Math.max(short * short * mx / (s * s), (s * s) / (short * short * mn)); };
      while (k < list.length) { const cand = [...row, list[k]], wv = worst(cand); if (wv > best) break; row = cand; best = wv; k++; }
      const s = row.reduce((a, b) => a + b.a, 0), thick = s / short; let off = 0;
      row.forEach(r => { const len = r.a / thick; if (W >= H) rects.push({ ...r, x, y: y + off, w: thick, h: len }); else rects.push({ ...r, x: x + off, y, w: len, h: thick }); off += len; });
      if (W >= H) squarify(list.slice(k), x + thick, y, W - thick, H); else squarify(list.slice(k), x, y + thick, W, H - thick);
    })(items, 0, 0, w, h);
    const vmax = data[0].value, vmin = data[data.length - 1].value;
    let s = svgOpen(w, h);
    rects.forEach(r => {
      const c = r.color || (o.colorBy === 'value' ? ramp(o.ramp || 'Blue', (r.value - vmin) / ((vmax - vmin) || 1) * .85 + .15) : colorOf(o, r.i));
      s += `<rect class="mark" data-key="${esc(r.label)}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${c}" stroke="#fff" stroke-width="1"${tip([[o.dim || 'Category', r.label], [o.measure || 'Value', f(r.value)]])}/>`;
      if (r.w > 50 && r.h > 30) s += `<text class="${ink(c) === '#FFFFFF' ? 'lbl-in' : 'lbl'}" x="${r.x + 5}" y="${r.y + 14}">${esc(r.label)}</text><text class="${ink(c) === '#FFFFFF' ? 'lbl-in' : 'lbl'}" x="${r.x + 5}" y="${r.y + 28}">${esc(f(r.value))}</text>`;
    });
    return s + '</svg>';
  }

  /* Circle view / dot plot — Show Me "circle views" & "side-by-side circles".
     build: Rows = Dim A · Columns = Measure · Color = Dim B · Marks = Circle. Add a gray bar on dual axis for a dumbbell. */
  function dots(w, o) {
    const f = getFmt(o.format), rows = o.rows, series = o.series, rowH = 24, top = 4;
    const hdrW = Math.min(w * .35, Math.max(...rows.map(r => tw(r.label))) + 16), plotH = rows.length * rowH, h = top + plotH + (o.axisTitle ? 40 : 24);
    const vals = rows.flatMap(r => r.values), ticks = niceTicks(o.zero === false ? Math.min(...vals) : 0, Math.max(...vals), Math.max(2, Math.floor((w - hdrW) / 80)));
    const x = lin(ticks[0], ticks[ticks.length - 1], hdrW + 6, w - 10);
    let s = svgOpen(w, h) + xAxis(x, ticks, top, top + plotH, f, o.axisTitle, (hdrW + w) / 2);
    s += `<line class="div" x1="${hdrW}" x2="${hdrW}" y1="${top}" y2="${top + plotH}"/>`;
    rows.forEach((r, i) => {
      const cy = top + i * rowH + rowH / 2;
      s += `<text class="hdr" x="8" y="${cy + 4}">${esc(r.label)}</text>`;
      if (o.dumbbell) s += `<line x1="${x(Math.min(...r.values))}" x2="${x(Math.max(...r.values))}" y1="${cy}" y2="${cy}" stroke="#CBCBCB" stroke-width="3"/>`;
      r.values.forEach((v, j) => { s += `<circle class="mark" data-key="${esc(series[j])}" cx="${x(v)}" cy="${cy}" r="6" fill="${colorOf(o, j)}"${tip([[o.dimA || 'Row', r.label], [o.dimB || 'Series', series[j]], [o.measure || 'Value', f(v)]])}/>`; });
    });
    return s + '</svg>';
  }

  /* Scatter plot — Show Me "scatter plot". build: Columns = Measure X · Rows = Measure Y · Detail = Dim · Marks = Circle
     o.trend → Analytics pane > Trend Line (linear). o.quadrants → constant reference lines at medians/targets. */
  function scatter(w, o) {
    const fx = getFmt(o.formatX), fy = getFmt(o.formatY), pts = o.data, h = o.height || 240, L = 46, B = 40, top = 8, R = 10;
    const tx = niceTicks(Math.min(0, ...pts.map(p => p.x)), Math.max(...pts.map(p => p.x)), 5), ty = niceTicks(Math.min(0, ...pts.map(p => p.y)), Math.max(...pts.map(p => p.y)), 4);
    const x = lin(tx[0], tx[tx.length - 1], L, w - R), y = lin(ty[0], ty[ty.length - 1], h - B, top);
    let s = svgOpen(w, h) + yAxis(y, ty, L, w - R, fy, o.titleY, (h - B + top) / 2) + xAxis(x, tx, top, h - B, fx, o.titleX, (L + w - R) / 2).replace(/class="grid"/g, 'class="grid" style="stroke:none"');
    if (o.quadrants) s += `<line class="ref" x1="${x(o.quadrants[0])}" x2="${x(o.quadrants[0])}" y1="${top}" y2="${h - B}"/><line class="ref" x1="${L}" x2="${w - R}" y1="${y(o.quadrants[1])}" y2="${y(o.quadrants[1])}"/>`;
    if (o.trend) {
      const n = pts.length, mx = pts.reduce((a, p) => a + p.x, 0) / n, my = pts.reduce((a, p) => a + p.y, 0) / n;
      const b = pts.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0) / pts.reduce((a, p) => a + (p.x - mx) ** 2, 0), a = my - b * mx;
      const x0 = tx[0], x1 = tx[tx.length - 1];
      s += `<line x1="${x(x0)}" y1="${y(a + b * x0)}" x2="${x(x1)}" y2="${y(a + b * x1)}" stroke="#666" stroke-width="1.2"${tip([['Trend line (linear)'], ['Slope', b.toFixed(3)]])}/>`;
    }
    const groups = [...new Set(pts.map(p => p.group).filter(Boolean))];
    pts.forEach(p => {
      const c = p.group ? colorOf(o, groups.indexOf(p.group)) : T10[0];
      s += `<circle class="mark" data-key="${esc(p.group || p.label)}" cx="${x(p.x)}" cy="${y(p.y)}" r="${p.r || 5}" fill="${c}" fill-opacity=".75" stroke="${c}"${tip([[o.dim || 'Item', p.label], ...(p.group ? [[o.groupField || 'Group', p.group]] : []), [o.measureX || 'X', fx(p.x)], [o.measureY || 'Y', fy(p.y)]])}/>`;
    });
    return s + '</svg>';
  }

  /* Histogram — Show Me "histogram". build: Create Bins on Measure → Columns = Measure (bin) · Rows = CNT(Measure) · Marks = Bar (no gaps) */
  function histogram(w, o) {
    const vals = o.values, size = o.binSize, h = o.height || 200, L = 40, B = 34, top = 8, R = 6;
    const lo = Math.floor(Math.min(...vals) / size) * size, nb = Math.ceil((Math.max(...vals) - lo + 1e-9) / size);
    const bins = Array.from({ length: nb }, (_, i) => ({ x0: lo + i * size, n: 0 })); vals.forEach(v => bins[Math.min(nb - 1, Math.floor((v - lo) / size))].n++);
    const ticks = niceTicks(0, Math.max(...bins.map(b => b.n)), 4), y = lin(0, ticks[ticks.length - 1], h - B, top), bw = (w - L - R) / nb;
    let s = svgOpen(w, h) + yAxis(y, ticks, L, w - R, fmt.int, 'Count', (h - B + top) / 2);
    bins.forEach((b, i) => {
      s += `<rect class="mark" data-key="bin${i}" x="${L + i * bw + .5}" y="${y(b.n)}" width="${bw - 1}" height="${y(0) - y(b.n)}" fill="${o.color || T10[0]}"${tip([[o.measure + ' (bin)', `${b.x0}–${b.x0 + size}`], ['Count', b.n]])}/>`;
      if (nb <= 16 || i % 2 === 0) s += `<text class="ax-tick" x="${L + i * bw}" y="${h - B + 14}" text-anchor="middle">${b.x0}</text>`;
    });
    if (o.refLine != null) { const xr = L + (o.refLine - lo) / size * bw; s += `<line class="ref" x1="${xr}" x2="${xr}" y1="${top}" y2="${h - B}"/><text class="ax-tick" x="${xr + 4}" y="${top + 10}">${esc(o.refLabel || o.refLine)}</text>`; }
    s += `<text class="ax-title" x="${(L + w) / 2}" y="${h - 4}" text-anchor="middle">${esc(o.measure)} (bin)</text>`;
    return s + '</svg>';
  }

  /* Box-and-whisker — Show Me "box-and-whisker plot". build: Columns = Dim · Rows = Measure · Detail = row-level ID · Marks = Circle · Analytics > Box Plot */
  function boxplot(w, o) {
    const f = getFmt(o.format), groups = o.groups, h = o.height || 230, L = 44, B = 28, top = 8, R = 6;
    const all = groups.flatMap(g => g.values), ticks = niceTicks(0, Math.max(...all), 4);
    const y = lin(0, ticks[ticks.length - 1], h - B, top), gw = (w - L - R) / groups.length;
    const q = (a, p) => { const s = [...a].sort((m, n) => m - n), i = (s.length - 1) * p, lo = Math.floor(i); return s[lo] + (s[Math.ceil(i)] - s[lo]) * (i - lo); };
    let s = svgOpen(w, h) + yAxis(y, ticks, L, w - R, f, o.axisTitle, (h - B + top) / 2);
    groups.forEach((g, i) => {
      const cx = L + gw * (i + .5), q1 = q(g.values, .25), q2 = q(g.values, .5), q3 = q(g.values, .75), iqr = q3 - q1;
      const wl = Math.min(...g.values.filter(v => v >= q1 - 1.5 * iqr)), wh = Math.max(...g.values.filter(v => v <= q3 + 1.5 * iqr)), bw = Math.min(46, gw * .45);
      s += `<line x1="${cx}" x2="${cx}" y1="${y(wh)}" y2="${y(q3)}" stroke="#898989"/><line x1="${cx}" x2="${cx}" y1="${y(q1)}" y2="${y(wl)}" stroke="#898989"/>`;
      s += `<line x1="${cx - bw / 4}" x2="${cx + bw / 4}" y1="${y(wh)}" y2="${y(wh)}" stroke="#898989"/><line x1="${cx - bw / 4}" x2="${cx + bw / 4}" y1="${y(wl)}" y2="${y(wl)}" stroke="#898989"/>`;
      s += `<rect x="${cx - bw / 2}" y="${y(q3)}" width="${bw}" height="${y(q2) - y(q3)}" fill="#D4D4D4" stroke="#898989"${tip([[o.dim || 'Group', g.label], ['Upper Hinge', f(q3)], ['Median', f(q2)]])}/><rect x="${cx - bw / 2}" y="${y(q2)}" width="${bw}" height="${y(q1) - y(q2)}" fill="#E6E6E6" stroke="#898989"${tip([[o.dim || 'Group', g.label], ['Median', f(q2)], ['Lower Hinge', f(q1)]])}/>`;
      g.values.forEach((v, k) => { const jx = cx + ((k * 7919) % 100 / 100 - .5) * bw * .7; s += `<circle class="mark" data-key="${esc(g.label)}" cx="${jx}" cy="${y(v)}" r="3" fill="${colorOf(o, i)}" fill-opacity=".7"${tip([[o.dim || 'Group', g.label], [o.measure || 'Value', f(v)]])}/>`; });
      s += `<text class="hdr-col" x="${cx}" y="${h - B + 16}" text-anchor="middle">${esc(g.label)}</text>`;
    });
    return s + '</svg>';
  }

  /* Gantt — Show Me "Gantt chart". build: Columns = Start date (continuous) · Rows = Task · Size = Duration · Color = Status · Marks = Gantt Bar
     o.today → reference line at TODAY(). */
  function gantt(w, o) {
    const tasks = o.tasks, rowH = 22, top = 20, hdrW = Math.min(w * .38, Math.max(...tasks.map(t => tw(t.label))) + 16);
    const plotH = tasks.length * rowH, h = top + plotH + 8, d0 = o.min ?? Math.min(...tasks.map(t => t.start)), d1 = o.max ?? Math.max(...tasks.map(t => t.start + t.dur));
    const x = lin(d0, d1, hdrW + 4, w - 8), statuses = o.statuses || [...new Set(tasks.map(t => t.status))];
    let s = svgOpen(w, h);
    const step = o.tickStep || Math.ceil((d1 - d0) / Math.max(2, Math.floor((w - hdrW) / 60)));
    for (let t = d0; t <= d1; t += step) { s += `<line class="grid" x1="${x(t)}" x2="${x(t)}" y1="${top}" y2="${top + plotH}"/><text class="ax-tick" x="${x(t)}" y="${top - 6}" text-anchor="middle">${esc(o.tickFormat ? o.tickFormat(t) : t)}</text>`; }
    s += `<line class="div" x1="${hdrW}" x2="${hdrW}" y1="${top}" y2="${top + plotH}"/>`;
    tasks.forEach((t, i) => {
      const y = top + i * rowH, c = t.color || (o.statusColors && o.statusColors[t.status]) || colorOf(o, statuses.indexOf(t.status));
      if (t.group && (i === 0 || tasks[i - 1].group !== t.group)) s += `<line class="div" x1="0" x2="${w}" y1="${y}" y2="${y}"/>`;
      s += `<text class="hdr" x="8" y="${y + rowH / 2 + 4}">${esc(t.label)}</text>`;
      s += `<rect class="mark" data-key="${esc(t.status)}" x="${x(t.start)}" y="${y + 5}" width="${Math.max(2, x(t.start + t.dur) - x(t.start))}" height="${rowH - 10}" fill="${c}"${tip([[o.dim || 'Task', t.label], ['Start', o.tickFormat ? o.tickFormat(t.start) : t.start], ['Duration', t.dur + (o.unit || 'd')], [o.colorField || 'Status', t.status]])}/>`;
    });
    if (o.today != null) s += `<line x1="${x(o.today)}" x2="${x(o.today)}" y1="${top - 2}" y2="${top + plotH}" stroke="#E15759" stroke-width="1.5"/><text class="ax-tick" x="${x(o.today) + 3}" y="${top + plotH - 2}" style="fill:#E15759">${esc(o.todayLabel || 'Today')}</text>`;
    return s + '</svg>';
  }

  /* Bullet graph — Show Me "bullet graphs". build: Rows = Dim · Columns = Actual · Detail = Target → Reference line (target) + distribution bands at 60%/80% of target */
  function bullet(w, o) {
    const f = getFmt(o.format), rows = o.rows, rowH = 30, top = 4, hdrW = Math.min(w * .38, Math.max(...rows.map(r => tw(r.label))) + 16);
    const plotH = rows.length * rowH, h = top + plotH + 24, max = Math.max(...rows.map(r => Math.max(r.actual, r.target, ...(r.bands || [])))) * 1.05;
    const ticks = niceTicks(0, max, Math.max(2, Math.floor((w - hdrW) / 80))), x = lin(0, ticks[ticks.length - 1], hdrW, w - 10);
    let s = svgOpen(w, h) + xAxis(x, ticks, top, top + plotH, f, null, 0);
    rows.forEach((r, i) => {
      const y = top + i * rowH, bands = r.bands || [r.target * .6, r.target * .8, ticks[ticks.length - 1]], shades = ['#BDBDBD', '#D4D4D4', '#EBEBEB'];
      s += `<text class="hdr" x="8" y="${y + rowH / 2 + 4}">${esc(r.label)}</text>`;
      [...bands].reverse().forEach((b, k) => { s += `<rect x="${hdrW}" y="${y + 4}" width="${x(b) - hdrW}" height="${rowH - 8}" fill="${shades[2 - k]}"/>`; });
      const ok = o.lowerIsBetter ? r.actual <= r.target : r.actual >= r.target;
      s += `<rect class="mark" data-key="${esc(r.label)}" x="${hdrW}" y="${y + rowH / 2 - 4}" width="${x(r.actual) - hdrW}" height="8" fill="${o.colorByTarget ? (ok ? '#59A14F' : '#E15759') : '#333'}"${tip([[o.dim || 'Measure', r.label], ['Actual', f(r.actual)], ['Target', f(r.target)]])}/>`;
      s += `<line x1="${x(r.target)}" x2="${x(r.target)}" y1="${y + 7}" y2="${y + rowH - 7}" stroke="#000" stroke-width="2"/>`;
    });
    return s + '</svg>';
  }

  /* Packed bubbles — Show Me "packed bubbles". build: Marks = Circle · Size = Measure · Color = Dim · Label = Dim */
  function bubbles(w, o) {
    const f = getFmt(o.format), h = o.height || 220, data = [...o.data].sort((a, b) => b.value - a.value);
    const maxR = Math.min(w, h) / 4.2, rs = data.map(d => Math.sqrt(d.value / data[0].value) * maxR), placed = [];
    data.forEach((d, i) => {
      const r = rs[i]; let best = null;
      if (!placed.length) best = { x: 0, y: 0 };
      else for (let a = 0, rad = 0; !best; a += .3, rad += .6) {
        const cx = Math.cos(a) * rad * 1.3, cy = Math.sin(a) * rad;
        if (placed.every(p => Math.hypot(p.x - cx, p.y - cy) >= p.r + r + 1.5)) best = { x: cx, y: cy };
      }
      placed.push({ ...best, r, d, i });
    });
    const minX = Math.min(...placed.map(p => p.x - p.r)), maxX = Math.max(...placed.map(p => p.x + p.r)), minY = Math.min(...placed.map(p => p.y - p.r)), maxY = Math.max(...placed.map(p => p.y + p.r));
    const k = Math.min((w - 4) / (maxX - minX), (h - 4) / (maxY - minY), 1.4), ox = w / 2 - (minX + maxX) / 2 * k, oy = h / 2 - (minY + maxY) / 2 * k;
    let s = svgOpen(w, h);
    placed.forEach(p => {
      const c = p.d.color || colorOf(o, p.i), cx = ox + p.x * k, cy = oy + p.y * k, r = p.r * k;
      s += `<circle class="mark" data-key="${esc(p.d.label)}" cx="${cx}" cy="${cy}" r="${r}" fill="${c}"${tip([[o.dim || 'Category', p.d.label], [o.measure || 'Value', f(p.d.value)]])}/>`;
      if (r > 22) s += `<text class="${ink(c) === '#FFFFFF' ? 'lbl-in' : 'lbl'}" x="${cx}" y="${cy + 4}" text-anchor="middle">${esc(p.d.label.length * 6 > r * 2 ? p.d.label.slice(0, Math.floor(r / 3.2)) + '…' : p.d.label)}</text>`;
    });
    return s + '</svg>';
  }

  /* Heat map — Show Me "heat map" (square marks sized + colored by a measure)
     and the full-cell variant used for cohort grids.
     build: Columns = Dim B · Rows = Dim A · Color = Measure · (Size = Measure) · Marks = Square */
  function heatmap(w, o) {
    const f = getFmt(o.format), rows = o.rows, cols = o.cols, cellH = o.cellHeight || 24, top = 20;
    const hdrW = Math.min(w * .3, Math.max(...rows.map(r => tw(r.label))) + 14), cw = (w - hdrW - 2) / cols.length, h = top + rows.length * cellH + 4;
    const all = rows.flatMap(r => r.values).filter(v => v != null), mn = o.min ?? Math.min(...all), mx = o.max ?? Math.max(...all);
    let s = svgOpen(w, h);
    cols.forEach((c, j) => { s += `<text class="hdr-col" x="${hdrW + cw * (j + .5)}" y="14" text-anchor="middle">${esc(c)}</text>`; });
    rows.forEach((r, i) => {
      const y = top + i * cellH;
      s += `<text class="hdr" x="6" y="${y + cellH / 2 + 4}">${esc(r.label)}</text>`;
      r.values.forEach((v, j) => {
        if (v == null) return;
        const t = (v - mn) / ((mx - mn) || 1), tt = o.reverse ? 1 - t : t;
        const c = o.diverging ? ramp(o.diverging, tt) : ramp(o.ramp || 'Blue', tt * .9 + .05);
        const sz = o.sized ? Math.max(.25, Math.sqrt(Math.max(0, t))) : 1, cwv = (cw - 2) * sz, chv = (cellH - 2) * sz;
        const x = hdrW + j * cw + (cw - cwv) / 2, yy = y + (cellH - chv) / 2;
        s += `<rect class="mark" data-key="${esc(r.label)}|${j}" x="${x}" y="${yy}" width="${cwv}" height="${chv}" fill="${c}"${tip([[o.rowField || 'Row', r.label], [o.colField || 'Column', cols[j]], [o.measure || 'Value', f(v)]])}/>`;
        if (o.labels && !o.sized) s += `<text x="${hdrW + cw * (j + .5)}" y="${y + cellH / 2 + 4}" text-anchor="middle" style="font-size:11px;fill:${ink(c)}" pointer-events="none">${esc(f(v))}</text>`;
      });
    });
    return s + '</svg>';
  }

  /* Funnel — not in Show Me; standard build: centered bars via Rows = Stage · Columns = -SUM(N) and SUM(N) on dual axis, or one bar with a hidden offset. */
  function funnel(w, o) {
    const f = getFmt(o.format), st = o.stages, rowH = 30, hdrW = Math.min(w * .32, Math.max(...st.map(s => tw(s.label))) + 16), h = st.length * rowH + 6;
    const max = st[0].value, pw = w - hdrW - 70, cx = hdrW + pw / 2;
    let s = svgOpen(w, h);
    st.forEach((d, i) => {
      const y = 3 + i * rowH, bw = d.value / max * pw, conv = i ? d.value / st[i - 1].value : 1;
      s += `<text class="hdr" x="8" y="${y + rowH / 2 + 4}">${esc(d.label)}</text>`;
      s += `<rect class="mark" data-key="${esc(d.label)}" x="${cx - bw / 2}" y="${y + 3}" width="${bw}" height="${rowH - 6}" fill="${o.color || T10[0]}"${tip([[o.dim || 'Stage', d.label], [o.measure || 'Count', f(d.value)], ['% of first stage', fmt.pct1(d.value / max)], ...(i ? [['Step conversion', fmt.pct1(conv)]] : [])])}/>`;
      s += `<text class="lbl-in" x="${cx}" y="${y + rowH / 2 + 4}" text-anchor="middle">${esc(f(d.value))}</text>`;
      if (i) s += `<text class="ax-tick" x="${w - 4}" y="${y + rowH / 2 + 4}" text-anchor="end">${esc(fmt.pct(conv))} ↓</text>`;
    });
    return s + '</svg>';
  }

  /* Sparkline — a line sheet with axes/headers hidden; used inside KPI tiles. */
  function sparkline(w, o) {
    const v = o.values, h = o.height || 32, mn = Math.min(...v), mx = Math.max(...v), x = lin(0, v.length - 1, 2, w - 4), y = lin(mn, mx, h - 3, 3);
    const c = o.color || T10[0];
    return svgOpen(w, h) + `<path d="M${v.map((d, i) => x(i) + ',' + y(d)).join('L')}" fill="none" stroke="${c}" stroke-width="1.5"/><circle cx="${x(v.length - 1)}" cy="${y(v[v.length - 1])}" r="2.5" fill="${c}"/></svg>`;
  }

  /* ---------------- HTML-based sheets ---------------- */

  /* Text table / crosstab — Show Me "text tables". build: Rows = Dim A · Columns = Dim B · Text = Measure · Marks = Text */
  function textTable(el, o) {
    const f = getFmt(o.format), hl = !!o.highlight;
    const all = o.rows.flatMap(r => r.values), mn = Math.min(...all), mx = Math.max(...all);
    let s = `<table class="tab-xtab${hl ? ' hl' : ''}"><thead><tr><th class="corner">${esc(o.corner || '')}</th>${o.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>`;
    o.rows.forEach(r => {
      s += `<tr><th>${esc(r.label)}</th>` + r.values.map((v, j) => {
        let st = '';
        if (hl) { const t = (v - mn) / ((mx - mn) || 1), c = o.diverging ? ramp(o.diverging, o.reverse ? 1 - t : t) : ramp(o.ramp || 'Blue', (o.reverse ? 1 - t : t) * .85 + .05); st = ` style="background:${c};color:${ink(c)}"`; }
        return `<td class="mark" data-key="${esc(r.label)}|${j}"${st}${tip([[o.rowField || 'Row', r.label], [o.colField || 'Column', o.cols[j]], [o.measure || 'Value', f(v)]])}>${esc(f(v))}</td>`;
      }).join('') + '</tr>';
    });
    if (o.totals) { const t = o.cols.map((_, j) => o.rows.reduce((a, r) => a + r.values[j], 0)); s += `<tr class="tot"><th>Grand Total</th>${t.map(v => `<td>${esc(f(o.totalsFormat ? o.totalsFormat(v, o.rows.length) : v))}</td>`).join('')}</tr>`; }
    s += '</tbody></table>';
    return s;
  }

  /* BAN — big-ass number. A Text-mark sheet: Text = AGG(Measure), plus a delta calc and an optional sparkline sheet beside it. */
  function ban(el, o) {
    const better = o.delta == null ? null : (o.lowerIsBetter ? o.delta < 0 : o.delta > 0);
    const arrow = o.delta == null ? '' : (o.delta > 0 ? '▲' : o.delta < 0 ? '▼' : '■');
    return `<div class="tab-ban"><div class="ban-label">${esc(o.label)}</div><div class="ban-value">${esc(o.value)}</div>` +
      (o.delta != null ? `<div class="ban-delta"><span class="${better ? 'up' : 'down'}">${arrow} ${esc(o.deltaText)}</span> ${esc(o.compare || '')}</div>` : '') +
      (o.spark ? `<div class="ban-spark" data-spark></div>` : '') + `</div>`;
  }

  /* Legends */
  function legend(o) {
    if (o.type === 'ramp') {
      const stops = (PAL.sequential[o.ramp] || PAL.diverging[o.ramp] || []);
      return `<div class="tab-legend"><div class="lg-title">${esc(o.title)}</div><div class="lg-ramp" style="background:linear-gradient(90deg,${stops.join(',')})"></div><div class="lg-ends"><span>${esc(o.min)}</span><span>${esc(o.max)}</span></div></div>`;
    }
    const cols = o.colors || o.items.map((_, i) => colorOf(o, i));
    return `<div class="tab-legend${o.inline ? ' inline' : ''}"><div class="lg-title">${esc(o.title)}</div>${o.items.map((it, i) => `<div class="lg-item"><span class="lg-sw" style="background:${cols[i]}"></span>${esc(it)}</div>`).join('')}</div>`;
  }

  /* ---------------- public API ---------------- */
  const svgR = { hbar, vbar, stackedBar, sideBySide, line, area, combo, pie, treemap, dots, scatter, histogram, boxplot, gantt, bullet, bubbles, heatmap, funnel, sparkline };
  const api = { palettes: PAL, ramp, fmt, legend, mount };
  Object.entries(svgR).forEach(([k, fn]) => { api[k] = (el, o) => mount(el, fn, o); });
  api.textTable = (el, o) => { if (typeof el === 'string') el = document.querySelector(el); ensureTip(); el.classList.add('tab-viz'); el.innerHTML = textTable(el, o); return el; };
  api.highlightTable = (el, o) => api.textTable(el, { ...o, highlight: true });
  api.ban = (el, o) => {
    if (typeof el === 'string') el = document.querySelector(el);
    ensureTip(); el.innerHTML = ban(el, o);
    if (o.spark) mount(el.querySelector('[data-spark]'), sparkline, { values: o.spark, color: o.sparkColor });
    return el;
  };
  window.TabViz = api;
})();
