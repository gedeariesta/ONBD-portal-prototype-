/* Plain-English check over what each screen actually says.

   Two classes, both found by looking rather than by any earlier check:

   1. Stray spacing. Assumption markers are hidden when design notes are off,
      but the spaces either side of them are not, so "Requirements A-17: JPG"
      read as "Requirements : JPG". Any space before punctuation in the
      product view is one of these.

   2. Jargon. Words that mean something to the people who wrote the spec and
      nothing to a new hire or a manager. The list is the glossary this
      prototype was cleaned against; add to it when a review finds another.
      Design notes are allowed to use them, because notes are for reviewers,
      so the scan runs with notes off and reads only what a user would see. */
const { launch, BASE } = require('./lib');

const ROUTES = ['', '#/equipment', '#/details', '#/jd', '#/intro', '#/policies', '#/network',
  '#/flow', '#/todos', '#/handoffs', '#/startdate', '#/bgcheck',
  '#/hm/', '#/hm/logistics', '#/hm/computer', '#/hm/software', '#/hm/buddy',
  '#/hm/calendar', '#/hm/welcome', '#/hm/network', '#/hm/intro', '#/hm/card', '#/hm/subtraction',
  '#/pex/', '#/pex/caseload', '#/pex/blueprints', '#/pex/hire/jreyes', '#/pex/hire/wzhang'];

const COMBOS = [{}, {scenario:'inprogress'}, {scenario:'complete'}, {country:'JP'}, {persona:'conversion'}];

/* term → what to say instead. Matched as whole words, case-insensitive. */
const JARGON = {
  'persona': 'role', 'personas': 'roles', 'provisioning': 'setting up access',
  'blueprint': 'location template', 'blueprints': 'location templates',
  'in flight': 'active', 'SLA': 'deadline', 'UAT': 'test build', 'PRD': 'requirements',
  'PEX': 'People Experience', 'CRE': 'Workplace & Real Estate', 'EUT': 'End User Technology',
  'proxy': 'stand-in', 'co-located': 'same office', 'dispositioned': 'decided',
  'fulfilment': 'the team supplying it', 'addenda': 'supplements', 'rail': 'card',
  'lead time': 'wait time', 'application stack': 'apps', 'software stack': 'apps',
  'holds': 'calendar invites', 'concierge': 'coordinator', 'worker record': 'employee record',
  'future state': 'the new process', 'net-new': 'new', 'actioned': 'done', 'to action': 'to do',
  'compliance pack': 'required documents', 'nudge': 'remind', 'chase': 'remind',
  'escalated': 'raised', 'loaner': 'spare laptop', 'modelled': 'sample',
  'surfaced': 'shown', 'surfaces': 'shows', 'downstream': 'later',
};

(async () => {
  const b = await launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const found = new Map();                       // message → first place seen
  const note = (msg, where) => { if (!found.has(msg)) found.set(msg, where); };
  let checked = 0;

  for (const combo of COMBOS) {
    await p.goto(BASE, { waitUntil: 'networkidle' });
    await p.evaluate(() => { try { localStorage.clear(); } catch {} });
    await p.reload({ waitUntil: 'networkidle' });
    await p.waitForTimeout(300);
    const keys = Object.entries(combo);
    if (keys.length) {
      await p.click('#protoFab');
      for (const [k, v] of keys) {
        await p.evaluate(([k, v]) => { const el = document.querySelector(`[data-pc="${k}:${v}"]`); if (el) el.click(); }, [k, v]);
        await p.waitForTimeout(200);
      }
      await p.evaluate(() => document.getElementById('protoDrawer').classList.remove('show'));
    }
    for (const r of ROUTES) {
      await p.evaluate(h => { location.hash = h || '#/'; }, r);
      await p.waitForTimeout(180);
      const text = await p.evaluate(() => document.getElementById('hdrYou').innerText + '\n' + document.getElementById('app').innerText);
      checked++;
      const where = `${JSON.stringify(combo)} ${r || '#/'}`;
      for (const line of text.split('\n')) {
        const m = line.match(/.{0,30}\S\s+[,.;:!?)](?!\d).{0,20}/);
        if (m) note(`SPACE BEFORE PUNCTUATION :: “${m[0].trim()}”`, where);
        for (const [term, instead] of Object.entries(JARGON)) {
          const re = new RegExp(`(^|[^\\w-])${term.replace(/ /g, '\\s+')}(?![\\w-])`, 'i');
          if (re.test(line)) note(`JARGON “${term}” (say “${instead}”) :: “${line.trim().slice(0, 110)}”`, where);
        }
      }
    }
  }
  console.log(`read ${checked} screen-states with design notes off`);
  if (!found.size) console.log('\nno problems found');
  else {
    console.log(`\nPROBLEMS (${found.size}):`);
    for (const [msg, where] of found) console.log(`${msg}\n    at ${where}`);
  }
  await b.close();
})();
