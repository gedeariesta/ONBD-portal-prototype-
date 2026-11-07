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
      so the scan runs with notes off and reads only what a user would see.

   3. Global English (Janine, 6 Nov: put the words "through a global
      translation layer"; her example was "somewhere else"). Idioms, slang and
      phrasal verbs that have a plain one-word alternative, British or
      American colloquialisms, and vague place words. Plus the Equinix
      messaging guide's banned words ("platform", "21st century") and its
      no-hype rule. Each entry names what to say instead.

   4. Long sentences on the new hire's screens: over 30 words is two
      sentences, for the reader and for the translator. */
const { launch, BASE } = require('./lib');

const ROUTES = ['', '#/equipment', '#/details', '#/intro', '#/policies', '#/network',
  '#/flow', '#/todos', '#/handoffs', '#/startdate', '#/bgcheck', '#/rtw',
  '#/hm/', '#/hm/logistics', '#/hm/computer', '#/hm/software', '#/hm/buddy',
  '#/hm/calendar', '#/hm/welcome', '#/hm/network', '#/hm/intro', '#/hm/card', '#/hm/survey', '#/hm/subtraction', '#/servicenow',
  '#/pex/', '#/pex/caseload', '#/pex/blueprints', '#/pex/hire/jreyes', '#/pex/hire/wzhang'];

const COMBOS = [{}, {scenario:'inprogress'}, {scenario:'complete'}, {country:'JP'}, {persona:'conversion'}];
// Sidekick's panel, read open on both sides that have it, after every
// suggested question has been asked and one question has gone unmatched.
const PANELS = ['#/', '#/hm/', '#/pex/'];

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
  // v4 brought an AI layer, and with it a second vocabulary nobody outside
  // the project uses. The panel is scanned too, below.
  'LLM': 'AI', 'large language model': 'AI', 'prompt': 'question', 'prompts': 'questions',
  'agent': 'Sidekick', 'chatbot': 'Sidekick', 'tier one': 'the support team', 'tier-one': 'the support team',
  'escalate': 'pass on', 'escalation': 'handoff', 'knowledge base': 'articles', 'KB': 'articles',
  'engagement layer': 'Sidekick', 'deep link': 'link', 'PII': 'personal details',
};

/* [pattern, flags, what to say instead]. Whole words. 'platform' is
   lowercase only, so a team called Platform in a job title is not flagged. */
const GLOBAL = [
  ['somewhere else', 'i', 'a different address, or name the place'], ['to hand', 'i', 'ready'],
  ['heads-up', 'i', 'notice'], ['all set', 'i', 'ready'], ['good to go', 'i', 'ready'],
  ['hang tight', 'i', 'wait'], ['touch base', 'i', 'talk'], ['kick(?:-|\\s)?off', 'i', 'start'],
  ['swing by', 'i', 'visit'], ['loop (?:you |them )?in', 'i', 'include'], ['in the loop', 'i', 'informed'],
  ['up to speed', 'i', 'informed'], ['ballpark', 'i', 'estimate'], ['no-brainer', 'i', 'an easy decision'],
  ['shout', 'i', 'message'], ['fortnight', 'i', 'two weeks'], ['up next', 'i', 'next'],
  ['coming up', 'i', 'upcoming'], ['on track', 'i', 'on schedule'], ['fills in', 'i', 'appears'],
  ['carries on', 'i', 'continues'], ['handed (?:you )?over', 'i', 'passed'], ['hands you over', 'i', 'sends you'],
  ['the basics', 'i', 'the standard tools'], ['whatever', 'i', 'any'], ['tick(?:s|ed)?', 'i', 'select or agree'],
  ['untick(?:s|ed)?', 'i', 'clear'], ['straight away', 'i', 'immediately'], ['picks? you up', 'i', 'meets you'],
  ['walk them in', 'i', 'meet them'], ['your call', 'i', 'your decision'], ['the bit', 'i', 'the part'],
  ['new starters?', 'i', 'new hire'], ['People Operations', '', 'People Experience'],
  ['e\\.g\\.', 'i', 'for example'], ['i\\.e\\.', 'i', 'that is'], ['etc\\.?', 'i', 'and so on, or list them'],
  ['platform', '', 'Equinix, the portal or the system (messaging guide)'], ['21st century', 'i', 'modern (messaging guide)'],
  ['world-class', 'i', 'say what it does'], ['cutting-edge', 'i', 'say what it does'], ['seamless(?:ly)?', 'i', 'say what it does'],
  ['best-in-class', 'i', 'say what it does'], ['game-changer', 'i', 'say what it does'],
];
const NH_ONLY = r => !/^#\/(hm|pex|flow|handoffs|servicenow|todos)/.test(r || '#/');
const scanLine = (line, where, note, longToo) => {
  const m = line.match(/.{0,30}\S\s+[,.;:!?)](?!\d).{0,20}/);
  if (m) note(`SPACE BEFORE PUNCTUATION :: “${m[0].trim()}”`, where);
  for (const [term, instead] of Object.entries(JARGON)) {
    const re = new RegExp(`(^|[^\\w-])${term.replace(/ /g, '\\s+')}(?![\\w-])`, 'i');
    if (re.test(line)) note(`JARGON “${term}” (say “${instead}”) :: “${line.trim().slice(0, 110)}”`, where);
  }
  for (const [pat, flags, instead] of GLOBAL) {
    const re = new RegExp(`(^|[^\\w-])${pat.replace(/ /g, '\\s+')}(?![\\w-])`, flags);
    if (re.test(line)) note(`GLOBAL ENGLISH “${pat}” (say “${instead}”) :: “${line.trim().slice(0, 110)}”`, where);
  }
  if (longToo) for (const sentence of line.split(/(?<=[.!?])\s+/)) {
    const n = sentence.split(/\s+/).filter(Boolean).length;
    if (n > 30) note(`LONG SENTENCE (${n} words, make it two) :: “${sentence.trim().slice(0, 110)}…”`, where);
  }
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
        await p.evaluate(([k, v]) => { const el = document.querySelector(`[data-pc="${k}:${v}"]`); if (el) { el.disabled = false; el.click(); } }, [k, v]);
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
      for (const line of text.split('\n')) scanLine(line, where, note, NH_ONLY(r));
    }
  }
  for (const r of PANELS) {
    await p.goto(BASE, { waitUntil: 'networkidle' });
    await p.evaluate(() => { try { localStorage.clear(); } catch {} });
    await p.reload({ waitUntil: 'networkidle' });
    await p.evaluate(h => { location.hash = h; }, r); await p.waitForTimeout(300);
    await p.evaluate(() => document.getElementById('chatFab').click()); await p.waitForTimeout(250);
    const n = await p.evaluate(() => document.querySelectorAll('#chatBody .chat-quick [data-skq]').length);
    for (let i = 0; i < n; i++) {
      await p.evaluate(i => document.querySelectorAll('#chatBody .chat-quick [data-skq]')[i].click(), i);
      await p.waitForTimeout(120);
    }
    await p.evaluate(() => { const i = document.getElementById('chatInput'); i.value = 'Is there a gym in the office?'; document.getElementById('chatSendBtn').click(); });
    await p.waitForTimeout(200);
    const text = await p.evaluate(() => document.getElementById('chatPanel').innerText);
    checked++;
    const where = `Sidekick panel on ${r}`;
    for (const line of text.split('\n')) scanLine(line, where, note, r === '#/');
  }
  console.log(`read ${checked} screen-states with design notes off`);
  if (!found.size) console.log('\nno problems found');
  else {
    console.log(`\nPROBLEMS (${found.size}):`);
    for (const [msg, where] of found) console.log(`${msg}\n    at ${where}`);
  }
  await b.close();
})();
