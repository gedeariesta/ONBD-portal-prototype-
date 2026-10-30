const { launch, BASE, OUT, outDir } = require('./lib');

const ROUTES = ['', '#/equipment', '#/details', '#/jd', '#/intro', '#/policies', '#/network',
  '#/flow', '#/todos', '#/handoffs', '#/startdate', '#/bgcheck',
  '#/hm/', '#/hm/logistics', '#/hm/computer', '#/hm/software', '#/hm/buddy',
  '#/hm/calendar', '#/hm/welcome', '#/hm/network', '#/hm/intro', '#/hm/card', '#/hm/subtraction',
  '#/pex/', '#/pex/caseload', '#/pex/blueprints', '#/pex/hire/jreyes', '#/pex/hire/wzhang'];

const COMBOS = [
  {}, {persona:'conversion'}, {country:'JP'}, {horizon:'3mo'},
  {scenario:'inprogress'}, {scenario:'review'}, {scenario:'overdue'}, {scenario:'complete'},
  {deviceMode:'choice'}, {pexUpdate:'yes'}, {buddyRule:'72h'}, {notes:'on'}, {pexsize:'5'},
];

(async () => {
  const b = await launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const problems = [];
  p.on('pageerror', e => problems.push(`PAGEERROR ${p.url()} :: ${e.message}`));
  p.on('console', m => { if (m.type()==='error' && !m.text().includes('404') && !m.text().includes('favicon'))
    problems.push(`CONSOLE ${p.url()} :: ${m.text()}`); });

  let checked = 0;
  for (const combo of COMBOS) {
    await p.goto(BASE, { waitUntil: 'networkidle' });
    await p.waitForTimeout(350);
    const keys = Object.entries(combo);
    if (keys.length) {
      await p.click('#protoFab');
      for (const [k,v] of keys) {
        const ok = await p.evaluate(([k,v]) => {
          const el = document.querySelector(`[data-pc="${k}:${v}"]`); if (!el) return false; el.click(); return true;
        }, [k,v]);
        if (!ok) problems.push(`MISSING CONTROL ${k}:${v}`);
        await p.waitForTimeout(250);
      }
      await p.evaluate(() => document.getElementById('protoDrawer').classList.remove('show'));
    }
    for (const r of ROUTES) {
      await p.evaluate(h => { location.hash = h || '#/'; }, r);
      await p.waitForTimeout(190);
      const info = await p.evaluate(() => {
        const app = document.getElementById('app');
        const txt = app.innerText || '';
        return {
          len: app.innerHTML.length,
          undef: /(?<![a-z])undefined(?![a-z])|\bNaN\b|\[object Object\]/.test(txt),
          empty: app.innerHTML.length < 400,
          overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
        };
      });
      checked++;
      const tag = `${JSON.stringify(combo)} ${r||'#/'}`;
      if (info.undef)  problems.push(`UNDEFINED/NaN IN TEXT :: ${tag}`);
      if (info.empty)  problems.push(`NEAR-EMPTY SCREEN (${info.len}) :: ${tag}`);
      if (info.overflowX) problems.push(`HORIZONTAL OVERFLOW :: ${tag}`);
    }
  }
  console.log(`checked ${checked} screen-states across ${COMBOS.length} control combinations`);
  console.log(problems.length ? `\nPROBLEMS (${problems.length}):\n` + [...new Set(problems)].slice(0,40).join('\n') : '\nno problems found');
  await b.close();
})();
