/* Interaction check (7 Nov UX pass), on all three sides at 1440 and 1280.

   1. Clickable but not focusable. Anything that acts on a click but cannot
      take keyboard focus fails WCAG 2.1.1 (Level A). The landing page's task
      cards were divs with a click handler and no tab stop until 7 Nov.
   2. Targets under 24 by 24 px (WCAG 2.2, 2.5.8), counting a checkbox's
      label as part of its target. Links inside a sentence are exempt, as
      the criterion allows.
   3. Headings: exactly one h1 a page, and no skipped level.
   4. Focus hidden under the sticky ribbon and header (WCAG 2.2, 2.4.11),
      found by tabbing through the page.
   5. Sideways scroll: the page must fit its own width (the ribbon was
      1,324px wide at 1280 until 7 Nov). */
const { launch, BASE } = require('./lib');

const ROUTES = ['#/', '#/startdate', '#/bgcheck', '#/rtw', '#/equipment', '#/details', '#/intro', '#/policies', '#/network',
  '#/hm/', '#/hm/logistics', '#/hm/software', '#/hm/buddy', '#/hm/calendar', '#/hm/welcome', '#/hm/card', '#/hm/survey',
  '#/pex/', '#/pex/caseload', '#/pex/blueprints', '#/pex/hire/jreyes'];

(async () => {
  const b = await launch();
  const found = new Map();
  const note = (msg, where) => { if (!found.has(msg)) found.set(msg, where); };
  for (const width of [1440, 1280]) {
    const p = await b.newPage({ viewport: { width, height: 900 } });
    await p.goto(BASE, { waitUntil: 'networkidle' });
    await p.evaluate(() => { try { localStorage.clear(); } catch {} });
    await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(300);
    await p.evaluate(() => { const c = document.querySelector('[data-skhello="close"]'); if (c) c.click(); });
    for (const r of ROUTES) {
      await p.evaluate(h => { location.hash = h; }, r); await p.waitForTimeout(250);
      const where = `${width} ${r}`;
      const res = await p.evaluate(() => {
        const vis = e => { const rc = e.getBoundingClientRect(); const st = getComputedStyle(e); return rc.width > 0 && rc.height > 0 && st.visibility !== 'hidden' && st.display !== 'none'; };
        const focusable = e => e.matches('a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])') && !e.disabled;
        const desc = e => `${e.tagName.toLowerCase()}.${[...e.classList].slice(0, 2).join('.')} “${(e.innerText || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40)}”`;
        const out = { nofocus: [], small: [], h1: 0, skips: [], wide: document.documentElement.scrollWidth - document.documentElement.clientWidth };
        for (const e of document.querySelectorAll('body *')) {
          if (!vis(e) || focusable(e) || e.closest('button, a[href], label, .pnote, .am, .snm, [tabindex]')) continue;
          const hooked = [...e.attributes].some(a => /^data-(task|ucard|goto|res|openchat|contact|ext|reopen|view|meet|book|hold|sw|polread|polagree|polpreview)$/.test(a.name));
          if (getComputedStyle(e).cursor === 'pointer' && (hooked || e.id)) out.nofocus.push(desc(e));
        }
        for (const e of document.querySelectorAll('button, a[href], input[type=checkbox], input[type=radio], select, [role=button], [role=link], [tabindex="0"]')) {
          if (!vis(e) || e.closest('.pnote, .am, .snm, .panel, #protoDrawer') || e.matches('.am, .snm')) continue;
          const inline = getComputedStyle(e).display === 'inline' && e.parentElement && /[a-z]/i.test(e.parentElement.textContent.replace(e.textContent, ''));
          if (inline) continue;
          const rc = e.getBoundingClientRect(); let w = rc.width, h = rc.height;
          const lab = e.closest('label'); if (lab) { const lr = lab.getBoundingClientRect(); w = Math.max(w, lr.width); h = Math.max(h, lr.height); }
          if (w < 23.5 || h < 23.5) out.small.push(`${desc(e)} ${Math.round(w)}×${Math.round(h)}`);
        }
        const hs = [...document.querySelectorAll('#app h1, #app h2, #app h3, #app h4')].filter(vis).map(h => +h.tagName[1]);
        out.h1 = hs.filter(x => x === 1).length;
        for (let i = 1; i < hs.length; i++) if (hs[i] > hs[i - 1] + 1) out.skips.push(`h${hs[i - 1]} then h${hs[i]}`);
        return out;
      });
      res.nofocus.forEach(x => note(`CLICKABLE BUT NOT FOCUSABLE :: ${x}`, where));
      res.small.forEach(x => note(`TARGET UNDER 24px :: ${x}`, where));
      if (res.h1 !== 1) note(`${res.h1} H1 ON THE PAGE :: ${r}`, where);
      [...new Set(res.skips)].forEach(x => note(`HEADING LEVEL SKIPPED :: ${x} on ${r}`, where));
      if (res.wide > 0) note(`SIDEWAYS SCROLL :: page is ${res.wide}px wider than the window on ${r}`, where);
      // tab through the page; nothing focused may sit under the sticky bars
      await p.evaluate(() => { window.scrollTo(0, 0); if (document.activeElement) document.activeElement.blur(); });
      for (let i = 0; i < 45; i++) {
        await p.keyboard.press('Tab');
        const o = await p.evaluate(() => {
          const e = document.activeElement; if (!e || e === document.body) return null;
          if (e.closest('.proto-ribbon, .hdr, .panel, #protoDrawer, .chat-fab, .sk-hello')) return null;
          const rc = e.getBoundingClientRect();
          const top = Math.max(...[...document.querySelectorAll('.proto-ribbon, .hdr')].map(x => x.getBoundingClientRect().bottom));
          return rc.bottom <= top + 1 || rc.top < top - 2 ? `${e.tagName.toLowerCase()}.${[...e.classList].slice(0, 2).join('.')} “${(e.innerText || '').trim().slice(0, 30)}”` : null;
        });
        if (o) note(`FOCUS HIDDEN UNDER THE STICKY BARS :: ${o}`, where);
      }
    }
    await p.close();
  }
  console.log(`checked ${ROUTES.length} screens at 1440 and 1280`);
  if (!found.size) console.log('\nno problems found');
  else {
    console.log(`\nPROBLEMS (${found.size}):`);
    for (const [msg, where] of found) console.log(`${msg}\n    at ${where}`);
  }
  await b.close();
})();
