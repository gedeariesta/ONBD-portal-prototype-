const { launch, BASE, OUT, outDir } = require('./lib');
const ok = [], bad = [];
const check = (name, cond, detail='') => (cond ? ok : bad).push(name + (detail ? ` :: ${detail}` : ''));

(async () => {
  const b = await launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const go = async h => { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(320); };
  const txt = async () => (await p.evaluate(() => document.getElementById('app').innerText));

  await p.goto(BASE, { waitUntil: 'networkidle' }); await p.waitForTimeout(500);

  // 1. v4: three things before Day 1, in due-date order, start date first (A-64)
  const pre = await p.evaluate(() => [...document.querySelectorAll('.landing-grid .tcards')][0].querySelectorAll('.tcard').length);
  check('three things before Day 1', pre === 3, `${pre} task cards`);
  const firstTask = await p.evaluate(() => document.querySelector('.tcard .t-name').innerText.trim());
  check('start date is task 1', /start date/i.test(firstTask), firstTask);
  check('personal details moved to Day 1', /Your personal details, in Workday/.test(await txt()));

  // 2. Start the background check
  await go('#/bgcheck');
  await p.evaluate(() => { const b=[...document.querySelectorAll('button')].find(x=>/start the check/i.test(x.innerText)); if(b) b.click(); });
  await p.waitForTimeout(1800); // the launch simulates an external redirect
  check('background check launches', /launched|started|running|in progress/i.test(await txt()));

  // 3. Equipment: confirm the single build
  await go('#/equipment');
  await p.evaluate(() => { const b=document.getElementById('devConfirm'); if(b) b.click(); });
  await p.waitForTimeout(400);
  check('equipment confirm works', (await txt()).includes('Confirmed'));

  // 4. Equipment: choice mode + pick
  await p.click('#protoFab');
  await p.evaluate(() => document.querySelector('[data-pc="deviceMode:choice"]').click());
  await p.waitForTimeout(450);
  await p.evaluate(() => document.getElementById('protoDrawer').classList.remove('show'));
  await go('#/equipment');
  const cards = await p.evaluate(() => document.querySelectorAll('.dev-card').length);
  check('choice mode shows the catalogue', cards === 4, `${cards} cards`);
  await p.evaluate(() => document.querySelector('[data-device="mac"]').click());
  await p.waitForTimeout(400);
  check('late-delivery warning fires', (await txt()).includes('after you start'));

  // 5. Details are a Workday handoff now (A-65): nothing personal is typed
  //    into the portal, and Workday opens on the start date, not before.
  await go('#/details');
  const inputs = await p.evaluate(() => document.querySelectorAll('#app input, #app select, #app textarea').length);
  check('the portal collects no personal details', inputs === 0, `${inputs} inputs`);
  check('Workday opens on Day 1, not before', await p.evaluate(() => document.getElementById('wdOpen').disabled));

  // 5b. Policies are first-week work (A-66): readable now, nothing signable
  await go('#/policies');
  await p.evaluate(() => document.querySelector('[data-dochead]').click()); await p.waitForTimeout(250);
  const ackLocked = await p.evaluate(() => [...document.querySelectorAll('[data-ack], [data-hback]')].every(x => x.disabled));
  check('policies cannot be acknowledged before the start date', ackLocked);

  // 6. Inside Equinix strip: chapter change must not scroll
  await go('#/');
  await p.evaluate(() => window.scrollTo(0, 500)); await p.waitForTimeout(200);
  const y0 = await p.evaluate(() => window.scrollY);
  await p.evaluate(() => document.querySelectorAll('.is-dot')[2].click()); await p.waitForTimeout(350);
  check('carousel does not scroll the page', y0 === await p.evaluate(() => window.scrollY));

  // 7. Design notes toggle
  await p.click('#protoFab');
  await p.evaluate(() => document.querySelector('[data-pc="notes:on"]').click()); await p.waitForTimeout(350);
  const marks = await p.evaluate(() => [...document.querySelectorAll('.am')].filter(e=>e.offsetParent).length);
  check('design notes reveal markers', marks > 10, `${marks} markers`);
  await p.evaluate(() => document.querySelector('[data-pc="notes:off"]').click()); await p.waitForTimeout(300);
  check('design notes hide again', await p.evaluate(() => ![...document.querySelectorAll('.am')].some(e=>e.offsetParent)));
  await p.evaluate(() => document.getElementById('protoDrawer').classList.remove('show'));

  // 8. Manager side: PEX reopen
  await p.click('#protoFab');
  await p.evaluate(() => document.querySelector('[data-pc="scenario:inprogress"]').click()); await p.waitForTimeout(450);
  await p.evaluate(() => document.querySelector('[data-pc="pexUpdate:yes"]').click()); await p.waitForTimeout(450);
  await p.evaluate(() => document.getElementById('protoDrawer').classList.remove('show'));
  await go('#/hm/');
  check('PEX change reopens the task', await p.evaluate(() => !!document.querySelector('.tcard.reopened')));
  check('PEX change raises a blocker', /People Experience moved orientation/.test(await txt()));

  // 9. Welcome tone templates
  await go('#/hm/welcome');
  const before = await p.evaluate(() => document.getElementById('wcBody').value.slice(0,30));
  await p.evaluate(() => document.querySelector('[data-tone="formal"]').click()); await p.waitForTimeout(400);
  const after = await p.evaluate(() => document.getElementById('wcBody').value.slice(0,30));
  check('tone switch rewrites the draft', before !== after && /Dear/.test(after), after);

  // 10. Sidekick (A-70, A-71, A-72): an answer names its article and comes
  //     with a system-drawn card; an unmatched question offers a person, and
  //     the handoff lands in the coordinator's Help requests queue (L-13).
  await go('#/');
  await p.evaluate(() => document.getElementById('chatFab').click()); await p.waitForTimeout(350);
  await p.evaluate(() => document.querySelector('#chatBody .chat-quick [data-skq]').click()); await p.waitForTimeout(400);
  check('Sidekick answers', await p.evaluate(() => document.querySelectorAll('#chatMsgs .msg.bot').length >= 2));
  check('the answer names its article', await p.evaluate(() => !!document.querySelector('#chatMsgs .sk-src')));
  check('a system card sits under the answer', await p.evaluate(() => !!document.querySelector('#chatMsgs .sk-sys')));
  await p.evaluate(() => { const i=document.getElementById('chatInput'); i.value='Is there a gym in the office?'; document.getElementById('chatSendBtn').click(); });
  await p.waitForTimeout(350);
  const offers = await p.evaluate(() => !!document.querySelector('#chatMsgs [data-skhuman]'));
  check('an unmatched question offers a person', offers);
  await p.evaluate(() => document.querySelector('#chatMsgs [data-skhuman]').click()); await p.waitForTimeout(350);
  await p.evaluate(() => document.querySelector('.panel.show .x').click()); await p.waitForTimeout(250);
  await go('#/pex/');
  const helpForJordan = await p.evaluate(() => [...document.querySelectorAll('.px-queue')].some(q =>
    /Help requests/.test(q.innerText) && /Jordan Reyes/.test(q.innerText)));
  check('the handoff reaches the coordinator’s Help requests', helpForJordan);

  // 10b. The ask bar in the scene opens Sidekick with an answer
  await go('#/');
  await p.fill('[data-askinput]', 'When does my laptop arrive?'); await p.keyboard.press('Enter'); await p.waitForTimeout(450);
  check('the ask bar opens Sidekick with an answer', await p.evaluate(() =>
    document.getElementById('chatPanel').classList.contains('show') && /ships|ordered/.test(document.getElementById('chatMsgs').innerText)));
  await p.evaluate(() => document.querySelector('.panel.show .x').click()); await p.waitForTimeout(250);

  // 10c. On Today, a question becomes a caseload filter (A-74)
  await go('#/pex/');
  await p.evaluate(() => document.querySelector('[data-pexask="week"]').click()); await p.waitForTimeout(450);
  const within = await p.evaluate(() => location.hash === '#/pex/caseload' &&
    [...document.querySelectorAll('.px-table tbody tr')].every(tr => { const m = tr.innerText.match(/In (\d+) days?/); return !m || +m[1] <= 7; }));
  check('a Sidekick question filters the caseload', within);
  await go('#/');

  // 11. Assumptions panel opens and links
  await p.evaluate(() => document.querySelector('.panel.show .x')?.click()); await p.waitForTimeout(250);
  await p.evaluate(() => document.getElementById('rbAssume').click()); await p.waitForTimeout(400);
  const entries = await p.evaluate(() => document.querySelectorAll('#assumeBody .a-entry').length);
  check('assumption register renders', entries > 50, `${entries} entries`);

  // 12. Keyboard: tab to first control and check a visible focus ring
  await p.evaluate(() => document.querySelector('.panel.show .x').click()); await p.waitForTimeout(250);
  await p.keyboard.press('Tab'); await p.keyboard.press('Tab');
  const hasRing = await p.evaluate(() => { const a=document.activeElement; if(!a) return false;
    const s=getComputedStyle(a); return (s.boxShadow && s.boxShadow!=='none') || (s.outlineStyle && s.outlineStyle!=='none'); });
  // 17-19. Scroll behaviour: a state change must hold position, navigation
  // must start at the top. render() used to scrollTo(0,0) unconditionally,
  // so every button press yanked the page up.
  await go('#/hm/');
  await p.evaluate(() => window.scrollTo(0, 600)); await p.waitForTimeout(200);
  const sBefore = await p.evaluate(() => Math.round(window.scrollY));
  await p.evaluate(() => document.querySelector('[data-quickconfirm]')?.click()); await p.waitForTimeout(420);
  const sAfter = await p.evaluate(() => Math.round(window.scrollY));
  check('a state change holds scroll position', Math.abs(sAfter - sBefore) <= 40, `${sBefore} -> ${sAfter}`);

  await p.evaluate(() => window.scrollTo(0, 600)); await p.waitForTimeout(200);
  await go('#/hm/buddy');
  check('navigation starts at the top', await p.evaluate(() => window.scrollY) === 0);

  // 20. Flow diagram: nothing outside its track, nothing overlapping, and
  // every axis dot still on its true date after the labels were packed.
  await go('#/flow');
  await p.waitForTimeout(400);
  const flow = await p.evaluate(() => {
    const bad = [];
    const scan = (sel, boxSel) => document.querySelectorAll(boxSel).forEach(bx => {
      const br = bx.getBoundingClientRect();
      const items = [...bx.querySelectorAll(sel)].map(e => e.getBoundingClientRect());
      items.forEach(r => { if (r.left < br.left - 1 || r.right > br.right + 1) bad.push('outside ' + sel); });
      for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
        const a = items[i], c = items[j];
        if (Math.min(a.right,c.right) - Math.max(a.left,c.left) > 1 &&
            Math.min(a.bottom,c.bottom) - Math.max(a.top,c.top) > 1) bad.push('overlap ' + sel);
      }
    });
    scan('.axis-pt', '.flow-axis'); scan('.fnode', '.lane-track');
    document.querySelectorAll('.axis-pt').forEach(pt => {
      const ax = pt.closest('.flow-axis').getBoundingClientRect();
      const want = ax.left + (parseFloat(pt.dataset.x) / 100) * ax.width;
      const d = pt.querySelector('.apt-dot').getBoundingClientRect();
      if (Math.abs((d.left + d.right) / 2 - want) > 1.5) bad.push('dot off date');
    });
    return [...new Set(bad)];
  });
  check('flow diagram packs without clipping or overlap', flow.length === 0, flow.join(', '));

  check('keyboard focus is visible', hasRing);

  console.log(`PASS ${ok.length}`); ok.forEach(o => console.log('  ok  ', o));
  console.log(`\nFAIL ${bad.length}`); bad.forEach(x => console.log('  FAIL', x));
  if (errs.length) console.log('\nPAGE ERRORS:', [...new Set(errs)].join(' | '));
  await b.close();
})();
