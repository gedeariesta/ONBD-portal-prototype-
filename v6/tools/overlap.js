/* overlap.js: controls, chips and tags that touch or overlap.

   Gede found a waiting-on chip running into its row's button on Today. The
   other audits look at positioned content and clipped text; neither looks
   at two ordinary inline things colliding inside a grid row. This does: any
   two visible chips, tags, buttons, links or fields that overlap, or sit
   side by side with less than 4px between them, at 1440 and 1280, across
   every route and the states that change widths (a long team name, the
   Japan variant, the brief opened, the Sidekick panel open). */
const { launch, BASE } = require('./lib');
const ROUTES = ['', '#/equipment', '#/details', '#/jd', '#/intro', '#/policies', '#/network', '#/flow', '#/todos',
  '#/handoffs', '#/startdate', '#/bgcheck', '#/hm/', '#/hm/logistics', '#/hm/computer', '#/hm/software', '#/hm/buddy',
  '#/hm/calendar', '#/hm/welcome', '#/hm/network', '#/hm/intro', '#/hm/card', '#/hm/subtraction',
  '#/pex/', '#/pex/caseload', '#/pex/blueprints', '#/pex/hire/jreyes', '#/pex/hire/wzhang'];
const SEL = 'button, a, input, select, textarea, .chip, .px-waiting, .sys-tag, .tag, .pill, .p-chip, .pxq-n, .risk-dot, .avatar, .ic';

(async () => {
  const b = await launch();
  const found = new Map();
  for (const width of [1440, 1280]) {
    for (const country of ['US', 'JP']) {
      const p = await b.newPage({ viewport: { width, height: 1000 } });
      await p.goto(BASE, { waitUntil: 'networkidle' });
      await p.evaluate(() => localStorage.clear()); await p.reload({ waitUntil: 'networkidle' });
      if (country === 'JP') {
        await p.evaluate(() => { document.getElementById('protoFab').click(); });
        await p.waitForTimeout(200);
        await p.evaluate(() => { document.querySelector('[data-pc="country:JP"]').click();
          document.getElementById('protoDrawer').classList.remove('show'); });
      }
      for (const r of ROUTES) {
        await p.evaluate(h => { location.hash = h || '#/'; }, r); await p.waitForTimeout(260);
        // open every disclosure that changes layout on this screen
        await p.evaluate(() => document.querySelectorAll('[data-skmore][aria-expanded="false"]').forEach(x => x.click()));
        await p.waitForTimeout(120);
        const bad = await p.evaluate(SEL => {
          // Anything inside a transparent parent (a closed hover popover) is not on screen.
          const shown = e => { for (let n = e; n && n !== document.body; n = n.parentElement) if (+getComputedStyle(n).opacity === 0) return false; return true; };
          const vis = e => { const s = getComputedStyle(e); const r = e.getBoundingClientRect();
            return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 1 && r.height > 1 && e.offsetParent !== null && shown(e); };
          const els = [...document.querySelectorAll('#app ' + SEL.split(', ').join(', #app '))].filter(vis)
            // an icon inside its own button or chip is part of it
            .filter(e => !(e.classList.contains('ic') && e.parentElement.closest('button, a, .chip, .px-waiting, .sys-tag')))
            // the readiness tracker's steps are equal cells that meet edge to edge by design
            .filter(e => !e.classList.contains('rt-step'));
          const out = [];
          const name = e => (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/)[0] : e.tagName.toLowerCase())
            + ' “' + (e.innerText || e.value || e.getAttribute('aria-label') || '').trim().slice(0, 28) + '”';
          for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
            const a = els[i], c = els[j];
            if (a.contains(c) || c.contains(a)) continue;
            const A = a.getBoundingClientRect(), C = c.getBoundingClientRect();
            const vOver = Math.min(A.bottom, C.bottom) - Math.max(A.top, C.top);
            if (vOver < Math.min(A.height, C.height) * 0.5) continue;
            const hOver = Math.min(A.right, C.right) - Math.max(A.left, C.left);
            // hOver > 1: overlapping. -4 < hOver <= 1: touching.
            if (hOver > 1 || hOver > -4) out.push(`${hOver > 1 ? 'OVERLAP' : 'TOUCH'} ${name(a)} × ${name(c)} (${Math.round(hOver)}px)`);
          }
          return out;
        }, SEL);
        bad.forEach(x => { const k = `${r || '#/'} :: ${x}`; if (!found.has(k)) found.set(k, `${width} ${country}`); });
      }
      await p.close();
    }
  }
  await b.close();
  if (!found.size) { console.log('no problems found: no touching or overlapping controls'); return; }
  console.log(`PROBLEMS (${found.size}):`);
  for (const [k, where] of found) console.log(`  ${k}  [${where}]`);
  process.exitCode = 1;
})();
