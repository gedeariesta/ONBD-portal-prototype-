/* ============================================================
   Sidekick, the AI layer (v5: Paradox for the new hire, Teams for the rest)

   v4's rule still holds, and every answer below is built to it: Sidekick
   talks, the system decides. Anything with a deadline, a signature or
   personal data is read from the task list and drawn by the system, in a
   card Sidekick cannot word (A-70).

   What v5 changes is where each person meets it (A-82, A-83, A-84):
     - The new hire has no Equinix account before Day 1, so their assistant
       runs on Paradox, the same place the candidate journey ran. It is
       Sidekick powered by Paradox: Sidekick's answers and rules, in
       Paradox's frame, clearly on paradox.ai. Training wheels for the full
       Sidekick they meet in Teams from Day 1.
     - The hiring manager and the coordinator meet Sidekick where it lives,
       in Microsoft Teams. In the portal it opens as a Teams chat window, so
       moving between Teams and the portal feels like one conversation.
       Managers act from the chat; the portal is the full view for when one
       chat is not enough (several hires at once, say).

   Prototype: the answers are written in advance and matched on keywords.
   Nothing here calls a model, and the panel says so. Nothing here is the
   real Teams or Paradox either: both frames are drawn by the prototype.

   Loaded after pex.js and before app.js. Declarations only at load time;
   everything that reads S, $ or ic runs at call time.
   ============================================================ */

'use strict';

/* ---------- the new hire's questions ----------
   `task` is the system card drawn under the answer. `keys` are matched
   against what was typed; the longest match wins. */
const SK_NH = [
  { id:'next', q:'What should I do next?', keys:['next','what now','to do','todo','start with','first thing'],
    src:'Your task list', task:'next',
    say: () => {
      const n = nextTask();
      return n
        ? `Next is <b>${n.name.toLowerCase()}</b>, due ${dueText(dueFor(n.key))}. It’s one of the three things before Day 1, and after those there’s nothing else until you start.`
        : `Nothing. All three things before Day 1 are done, so the next thing you’ll see is your first-day details, three days before you start.`;
    } },
  { id:'laptop', q:'When does my laptop arrive?', keys:['laptop','computer','equipment','arrive','deliver','ship','monitor','headset'],
    src:'Equipment for new starters', task:'equipment',
    say: () => S.equipment.submitted
      ? `It’s ordered. Delivery takes 5 to 7 working days, so it’s on track for ${fmtDate(startDate())}. The table on your equipment task shows where each item is.`
      : `It ships once you place the order on <b>Choose your equipment</b>. Delivery takes 5 to 7 working days, so ordering by ${dueText(dueFor('equipment'))} gets it to you before you start.` },
  { id:'day1', q:'What happens on my first day?', keys:['first day','day 1','day one','orientation','where do i go','reception','parking','arrive on'],
    src: () => `Your first day at Equinix, ${S.country === 'JP' ? 'Tokyo' : 'Denver'}`,
    say: () => {
      const L = S.hm.logistics;
      const where = S.country === 'JP' ? 'Otemachi Financial City Grand Cube, 3rd floor reception' : '1225 17th Street, main reception';
      return `Orientation runs ${S.pex.blueprint.from} to ${S.pex.blueprint.until} at ${where}. Then ${HIRE.manager} picks you up for a one-to-one.
        ${L.confirmed ? `She’s confirmed it: “${esc(L.whereToBe)}”.` : ''} The full details, with what to bring, open here three days before you start.`;
    } },
  { id:'pay', q:'How do I set up direct deposit?', keys:['direct deposit','bank','banking','pay','paid','payday','salary','payroll','account'],
    src:'Getting paid: direct deposit for new starters', task:'details',
    say: () => `You add your bank details in <b>Workday</b> on your first day, with your address, emergency contact and tax details. It’s one task, entered once. There’s nothing to set up before you start.` },
  { id:'buddy', q:'Who is my buddy?', keys:['buddy','mentor','who can i ask'],
    src:'Onboarding buddies',
    say: () => {
      const B = S.hm.buddy, p = B.assigned ? orgPerson(B.assigned) : null;
      if (!p) return `${HIRE.manager} hasn’t named your buddy yet. When she does, their name and how to reach them appear under Your people.`;
      if (!buddyVisibleToNH()) return `${HIRE.manager} has chosen someone. You’ll see who, and how to reach them, 72 hours before you start.`;
      return `Your buddy is <b>${p.name}</b>, ${p.role}. They’re under Your people, with Teams and email.`;
    } },
  { id:'handbook', q:'Do I need to read the handbook before I start?', keys:['handbook','policy','policies','code of conduct','notice','acknowledge','read before'],
    src:'Employee handbooks and notices', task:'policies',
    say: () => `No. They open in your first week as one task: eight handbooks and a few notices, each signed in DocuSign, which keeps the date and time. You can read them now if you like; signing opens on your start date.` },
  { id:'benefits', q:'When do I enrol in benefits?', keys:['benefit','benefits','insurance','medical plan','dental','401k','pension','enrol','enroll'],
    src:'Benefits enrolment for new starters',
    say: () => `On your second day. The task links straight to the enrolment site for your country, so there’s nothing to look up or prepare before you start.` },
  // Janine's example (A-78): a question like this is answered from the
  // office's own article first. Handing to a person is the unhappy path.
  { id:'office', q:'Is there a gym in the office?', keys:['gym','fitness','shower','bike','locker','canteen','cafeteria','kitchen','facilities'],
    src: () => `${S.country === 'JP' ? 'Tokyo' : 'Denver'} office guide`,
    say: () => `The ${S.country === 'JP' ? 'Tokyo' : 'Denver'} office guide lists what’s in the building, including any gym or fitness room, showers, bike storage and where to eat, and who to ask at reception. Your badge works for all of it from Day 1.` },
  { id:'date', q:'Can I change my start date?', keys:['start date','change my start','move my start','delay','different date','later start'],
    src:'Changing your start date', task:'startdate',
    say: () => `Yes. Ask on <b>Confirm your start date</b>. ${PEOPLE.pex.name.split(' ')[0]} and ${HIRE.manager.split(' ')[0]} both see the request, and your other dates stay as they are until it’s agreed.` },
  { id:'badge', q:'Do I need a photo for my badge?', keys:['badge','photo','picture','building access'],
    src:'Building access badges', task:'intro',
    say: () => `It helps. Send one by ${dueText(dueFor('photo'))} and your badge is printed and waiting on Day 1. If you don’t, it’s taken at reception when you arrive, and nothing else waits on it.` },
];

/* ---------- the manager's questions ---------- */
const SK_HM = [
  { id:'week', q:'What needs me this week?', keys:['this week','needs me','to do','what now','next','overdue','behind'],
    src:'Your tasks, read from the portal', task:'hmnext',
    say: () => {
      const open = hmTasks().filter(t => !t.done && t.phase === 0 && t.route);
      const soon = open.filter(t => addDays(startDate(), t.dueOff) <= addDays(simToday(), 7));
      const list = (soon.length ? soon : open).slice(0, 3).map(t => `<b>${t.label.charAt(0).toLowerCase() + t.label.slice(1)}</b>`);
      return list.length
        ? `${soon.length ? 'Due within a week' : 'Nothing is due this week, but still open'}: ${list.join(', ')}. The first one is linked below.`
        : `Nothing. Everything you owe before Day 1 is done.`;
    } },
  { id:'buddyvis', q:'When does Jordan see their buddy?', keys:['buddy','see their buddy','visible','72'],
    src:'Onboarding buddies, for managers',
    say: () => S.buddyRule === '72h'
      ? `72 hours before they start. You can change your mind up to three days out, which is why it waits.`
      : `As soon as you name someone and they accept. The two specifications disagree on this, and the prototype can show both.` },
  { id:'apps', q:'Why can’t you suggest Jordan’s apps?', keys:['apps','applications','software','stack','suggest'],
    src:'Requesting software for a new starter',
    say: () => `Because Jordan’s role isn’t linked to a standard app list yet, so there’s nothing to suggest. You pick them by hand from the IT catalogue until it is. That’s a gap in the system, not something you did.` },
  { id:'nhsees', q:'What does Jordan have to do before Day 1?', keys:['jordan do','before day 1','new hire do','their tasks'],
    src:'What new hires do before Day 1',
    say: () => `Three things: confirm the start date, start the background check and choose equipment. ${tasksComplete()} of 3 are done. Everything else starts once they’ve started. You see whether each is done, never what they entered.` },
];


/* ---------- the coordinator's questions (A-84) ----------
   v4 gave the coordinator no assistant, because she is who Sidekick hands
   questions to. In v5 she has Sidekick in Teams like everyone else at
   Equinix, and it answers from her queues: the answer is the list itself,
   drawn by the system, the same lists as the caseload filters. */
const pexQ = id => PEX_QUEUES.find(q => q.id === id);
const pexRows = hires => hires.slice().sort((a, b) => a.startOff - b.startOff);
const SK_PEX = [
  { id:'today', q:'What needs me today?', keys:['today','needs me','what now','first','start with','priority'],
    src:'Your queues, read from the caseload', list: () => {
      const all = pexAllExceptions();
      return pexRows(pexCaseload().filter(h => all.has(h.id))).slice(0, 4);
    },
    say: () => {
      const groups = PEX_QUEUES.map(q => ({ q, hires: pexQueue(q) })).filter(g => g.hires.length);
      return `${pexSummary(groups).split(' Start with')[0]} The soonest starts are first below.`;
    } },
  { id:'week', q:'Who starts within 7 days?', keys:['7 days','this week','within a week','starts soon','starting'],
    src:'Your caseload', list: () => pexRows(pexCaseload().filter(h => h.startOff <= 7)),
    say: () => { const n = pexCaseload().filter(h => h.startOff <= 7).length;
      return `${n} hire${n === 1 ? ' starts' : 's start'} within seven days.`; } },
  { id:'nohost', q:'Who has no Day 1 host?', keys:['host','proxy','no one','day 1 host','meet them'],
    src:'Queue: No Day 1 host', list: () => pexRows(pexQueue(pexQ('proxy'))),
    say: () => { const n = pexQueue(pexQ('proxy')).length;
      return n ? `${n} hire${n === 1 ? ' has' : 's have'} no manager on site and no proxy named. Each manager gets a Sidekick nudge in Teams when you send it.`
               : 'Every hire starting in the next 30 days has a Day 1 host.'; } },
  { id:'blocked', q:'Who is waiting on another team?', keys:['blocked','waiting','another team','stuck'],
    src:'Queue: Blocked on another team', list: () => pexRows(pexQueue(pexQ('blocked'))),
    say: () => { const n = pexQueue(pexQ('blocked')).length;
      return n ? `${n} hire${n === 1 ? ' is' : 's are'} waiting on another team. Reminders go to that team’s own queue, not to you.`
               : 'Nobody is waiting on another team.'; } },
  { id:'help', q:'Which help requests are open?', keys:['help request','escalat','question','asked'],
    src:'Queue: Help requests', list: () => pexRows(pexQueue(pexQ('escalated'))),
    say: () => { const n = pexQueue(pexQ('escalated')).length;
      return n ? `${n} new hire${n === 1 ? ' has' : 's have'} asked for a person. The question and the conversation are on each record.`
               : 'No open help requests.'; } },
];

const skList = who => who === 'hm' ? SK_HM : who === 'pex' ? SK_PEX : SK_NH;
const skSrc = it => typeof it.src === 'function' ? it.src() : it.src;

/* Who is asking, and which frame they get. */
function skWho() { return S.view === 'hm' ? 'hm' : S.view === 'pex' ? 'pex' : 'nh'; }
const skMode = who => who === 'nh' ? 'paradox' : 'teams';

/* The thread lives in memory only: a conversation is not state the other
   two views read. The handoffs are, so those are saved. Each entry is
   drawn by whichever frame is open. */
let SK_THREAD = [];
const SK_AV = 'assets/sidekick/sidekick.png';   // the whole robot, as it appears in use
const skAv = () => `<img class="sk-av" src="${SK_AV}" alt="">`;
let SK_LAST_Q = '';
/* Teams stamps every message. The prototype clock is fixed, so the times are too. */
const skAt = n => { const m = 16 + n; return `Today ${9 + Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')} AM`; };

/* ---------- the brief, on the coordinator's Today (A-74, A-75) ----------
   Top layer: the time period, one sentence, the one thing to do first and
   a count. "What's coming up" opens the next layer. Every value is read from
   the queues; Sidekick only words the sentence. The new hire and the
   manager get the same content in the Sidekick panel instead of on the page
   (Gede's review: the panel already does the job), and a one-time hello. */
const SK_MORE = {};
function skBrief(who, o) {
  const open = !!SK_MORE[who];
  return `
  <div class="sk-brief" data-assume="A-75">
    <span class="sk-sum-mark">${skAv()}</span>
    <div class="skb-main">
      <div class="skb-h"><b>Sidekick</b><span class="skb-period">${o.period}</span></div>
      <p class="skb-say">${o.say}</p>
      ${o.focus ? `
      <button class="skb-focus" type="button" ${o.focus.route ? `data-goto="${o.focus.route}"` : ''}>
        <span class="skb-fl">${o.focus.label}</span>
        <span class="skb-fn">${o.focus.name}</span>
        <span class="skb-fd">${o.focus.due}</span>
        ${ic('arrow-right.svg','sm')}
      </button>` : ''}
      <div class="skb-foot">
        <span class="skb-count">${o.count}</span>
        ${o.more && o.more.length ? `<button class="skb-more" type="button" data-skmore="${who}" aria-expanded="${open}">
          ${open ? 'Hide what’s coming up' : 'What’s coming up'} ${ic(open ? 'chevron-up.svg' : 'chevron-down.svg','sm')}</button>` : ''}
      </div>
      ${open ? `<ul class="skb-list">${o.more.map(m => `<li><span>${m.name}</span><span class="skb-when">${m.when}</span></li>`).join('')}</ul>` : ''}
      <span class="sk-sum-l">${o.note} ${am('A-75')}</span>
    </div>
  </div>`;
}

/* What comes after the next task, for the new hire. Shown inside the
   Sidekick panel behind "What's coming up" (A-75), not on the page: the
   home already carries the task list, and a second block above it only
   repeated it (Gede's review). */
function nhComing() {
  const next = nextTask();
  return [
    ...taskList().filter(t => t.status !== 'done' && (!next || t.key !== next.key)).map(t => ({ name:t.name, when:`Due ${dueText(dueFor(t.key))}` })),
    { name:'Your first day details arrive', when:'3 days before you start' },
    ...day1Items().map(t => ({ name:t.name, when:'Day 1' })),
    { name:'Benefits enrolment', when:'Day 2' },
    ...week1Items().map(t => ({ name:t.name, when:'First week' })),
  ];
}


/* ---------- the greeting ----------
   Once per person per lens, from the launcher, then out of the way (A-75).
   The new hire's comes from the Paradox chat bubble; the manager's and the
   coordinator's arrive the way Teams delivers a message: a notification. */
let SK_HELLO_T = null;
function skGreet() {
  if ($('#chatPanel').classList.contains('show')) return;
  const who = skWho();
  S.sidekick.greeted = S.sidekick.greeted || {};
  if (S.sidekick.greeted[who]) return;
  S.sidekick.greeted[who] = true; save();
  const next = who === 'nh' ? nextTask() : null;
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  if (who === 'nh') {
    el.className = 'sk-hello pdx-hello';
    el.innerHTML = `
      <span class="pdx-bub">${ic('pdx-bubble.svg','lg')}</span>
      <div class="skh-body">
        <span class="pdx-tag">Powered by Paradox</span>
        <b>Hi ${esc(HIRE.preferred)}! Questions before you start?</b>
        <span>${next ? `Ask me anything. First up: <b>${next.name.toLowerCase()}</b>.` : 'Ask me anything. You’re all done before Day 1.'}</span>
        <div class="skh-acts">
          <button class="btn pdx-btn sm" type="button" data-skhello="open">Chat now</button>
          ${next ? `<button class="btn quiet sm" type="button" data-skhello="go" data-route="${next.route}">Go to it</button>` : ''}
        </div>
      </div>
      <button class="x skh-x" type="button" data-skhello="close" aria-label="Close">${ic('times.svg','sm')}</button>`;
  } else {
    const line = who === 'hm'
      ? (() => { const n = hmTasks().filter(t => !t.phase && !t.done).length + (S.sidekick.phoneOk ? 0 : 1);   // the checklist card's phone item counts too
          return `${esc(HIRE.preferred)} starts in ${daysToStart()} days. You have ${n} thing${n === 1 ? '' : 's'} open on your checklist.`; })()
      : (() => { const n = pexAllExceptions().size; return `${n} hire${n === 1 ? ' needs' : 's need'} you today. Want the list?`; })();
    el.className = 'sk-hello tm-toast';
    el.innerHTML = `
      <div class="tmt-app">${ic('tm-chat.svg','sm')}<span>Teams</span><span class="tmt-now">now</span></div>
      <div class="tmt-row">
        <span class="tm-av">${skAv()}</span>
        <div class="skh-body"><b>Sidekick</b><span>${line}</span></div>
      </div>
      <div class="skh-acts">
        <button class="btn tm-primary sm" type="button" data-skhello="open">Open chat</button>
        <button class="btn quiet sm" type="button" data-skhello="close">Dismiss</button>
      </div>`;
  }
  skHelloClose();
  document.body.appendChild(el);
  $('#chatFab').classList.add('ping');
  requestAnimationFrame(() => el.classList.add('show'));
  SK_HELLO_T = setTimeout(skHelloClose, 12000);
}
function skHelloClose() {
  clearTimeout(SK_HELLO_T);
  document.querySelectorAll('.sk-hello').forEach(x => x.remove());
  const f = $('#chatFab'); if (f) f.classList.remove('ping');
}

/* The launcher. The new hire's is Paradox's chat bubble in the page margin.
   The manager's and coordinator's sits in the header like a Teams app
   button: at the bottom right it covered the caseload's action column. */
function skLauncher() {
  const f = $('#chatFab'); if (!f) return;
  const who = skWho();
  if (who === 'nh') {
    f.className = 'chat-fab pdx-fab';
    f.setAttribute('aria-label', 'Chat with Sidekick, powered by Paradox');
    f.innerHTML = `<span class="pdx-fab-ic">${ic('pdx-bubble.svg','xl')}</span><span class="cf-label">Questions? Chat with us</span>`;
    if (f.parentElement !== document.body) document.body.appendChild(f);
  } else {
    f.className = 'chat-fab tm-launch';
    f.setAttribute('aria-label', 'Open Sidekick, as in Teams');
    f.innerHTML = `<span class="tm-av">${skAv()}</span><span class="tml-t"><b>Sidekick</b><span>Same chat as Teams</span></span>`;
    const you = $('#hdrYou');
    if (you && f.nextElementSibling !== you) you.parentElement.insertBefore(f, you);
  }
}

/* ---------- where you are: drawn by the system, not by Sidekick ----------
   The new hire's sits at the top of the Paradox chat. The manager's and the
   coordinator's are Teams cards in the thread instead (see skHmChecklist). */
function skWhereCard() {
  const n = nextTask();
  return `
  <div class="sk-where" data-assume="A-70">
    <div class="sk-sys-l">${ic('list-tasks.svg','sm')}From your task list, not written by Sidekick</div>
    <div class="sk-where-n"><b>${tasksComplete()} of 3</b> things done before Day 1</div>
    <div class="three dark">${taskList().map(t => `<i class="${t.status === 'done' ? 'on' : ''}"></i>`).join('')}</div>
    ${n ? skSysRow({ name:n.name, meta:`Due ${dueText(dueFor(n.key))} · ${STATUS_CHIP[n.status][1]}`, route:n.route, icon:n.icon })
        : `<div class="sk-where-done">${ic('check-circle.svg','sm')}Nothing else until your first-day details arrive.</div>`}
    <button class="sk-more" type="button" data-skmore="panel" aria-expanded="${!!SK_MORE.panel}">
      ${SK_MORE.panel ? 'Hide what’s coming up' : 'What’s coming up'} ${ic(SK_MORE.panel ? 'chevron-up.svg' : 'chevron-down.svg','sm')}</button>
    ${SK_MORE.panel ? `<ul class="sk-coming">${nhComing().map(m => `<li><span>${m.name}</span><span>${m.when}</span></li>`).join('')}</ul>` : ''}
  </div>`;
}

/* ---------- Teams cards ----------
   The way Sidekick posts structured things in Teams: a card with the action
   in it, so the manager can act without leaving the chat. Every value is
   read from the record; "Open in portal" is there for the full view. */
function skCard(title, sub, body, foot) {
  return `
  <div class="tm-card" data-assume="A-70">
    <div class="tmc-h"><b>${title}</b>${sub ? `<span>${sub}</span>` : ''}</div>
    <div class="tmc-b">${body}</div>
    ${foot ? `<div class="tmc-f">${foot}</div>` : ''}
    <div class="tmc-sys">${ic('lock.svg','sm')}From the onboarding record, not written by Sidekick</div>
  </div>`;
}

/* The manager's Pre-Day 1 checklist, the Sidekick action window Janine
   described (A-83): one card, every item actionable from it, including the
   phone number check, which shows what Workday holds. */
function skHmChecklist() {
  const t = hmTasks().filter(x => x.phase === 0 || x.phase === undefined);
  const done = t.filter(x => x.done).length;
  const phone = S.sidekick.phoneOk;
  const rows = t.map(x => `
    <div class="tmc-row ${x.done ? 'done' : ''}">
      <span class="tmc-tick">${x.done ? ic('check.svg','sm') : ''}</span>
      <span class="tmc-l">${x.label}${x.done ? '' : `<span class="tmc-due">Due ${dueText(addDays(startDate(), x.dueOff))}</span>`}</span>
      ${x.done ? '<span class="tmc-st">Done</span>' : x.route ? `<button class="tm-btn" type="button" data-goto="${x.route}" data-skclose="1">Do it</button>` : ''}
    </div>`).join('');
  const phoneRow = `
    <div class="tmc-row ${phone ? 'done' : ''}" data-assume="A-83">
      <span class="tmc-tick">${phone ? ic('check.svg','sm') : ''}</span>
      <span class="tmc-l">Verify your contact phone number
        <span class="tmc-due">${esc(MANAGER.workPhone)} · from Workday${phone ? ', verified' : ''}</span></span>
      ${phone ? '<span class="tmc-st">Verified</span>' : `<span class="tmc-acts">
        <button class="tm-btn primary" type="button" data-skphone="ok">Verify</button>
        <button class="tm-btn" type="button" data-skphone="change">Change in Workday</button></span>`}
    </div>`;
  return skCard(`Pre-Day 1 checklist · ${esc(HIRE.preferred)} ${esc(HIRE.legalLast)}`,
    `Starts ${fmtDate(startDate())} · ${done + (phone ? 1 : 0)} of ${t.length + 1} done`,
    rows + phoneRow,
    `<button class="tm-btn" type="button" data-goto="#/hm/" data-skclose="1">${ic('portal-window.svg','sm')}Open in portal</button>`);
}

/* The coordinator's list cards: the hires an answer is about, as rows. */
function skPexList(hires) {
  if (!hires.length) return '';
  return skCard(`${hires.length} hire${hires.length === 1 ? '' : 's'}`, 'Soonest start first', hires.slice(0, 6).map(h => `
    <div class="tmc-row">
      <span class="tmc-l"><b>${esc(h.preferred)} ${esc(h.last)}</b><span class="tmc-due">Starts in ${h.startOff} day${h.startOff === 1 ? '' : 's'} · ${esc(h.loc)}</span></span>
      <button class="tm-btn" type="button" data-goto="#/pex/hire/${h.id}" data-skclose="1">Open</button>
    </div>`).join('') + (hires.length > 6 ? `<div class="tmc-more">and ${hires.length - 6} more in the caseload</div>` : ''),
    `<button class="tm-btn" type="button" data-goto="#/pex/caseload" data-skclose="1">${ic('portal-window.svg','sm')}Open the caseload</button>`);
}

/* ---------- the ask bar, drawn inside a scene ---------- */
function sidekickAskBar(who) {
  const list = skList(who).slice(who === 'hm' ? 0 : 1, who === 'hm' ? 3 : 4);
  return `
  <form class="ask-bar" data-askform="${who}" data-assume="A-71">
    <span class="ask-av ${who === 'nh' ? 'pdx' : ''}">${who === 'nh' ? ic('pdx-bubble.svg') : skAv()}</span>
    <input type="text" data-askinput="1" aria-label="Ask Sidekick"
      placeholder="${who === 'hm' ? 'Ask Sidekick about Jordan’s start' : 'Ask Sidekick anything about starting at Equinix'}">
    <button class="btn primary sm" type="submit">Ask</button>
  </form>
  <div class="ask-chips">
    ${list.map(it => `<button class="ask-chip" type="button" data-skq="${esc(it.q)}">${it.q}</button>`).join('')}
  </div>
  <div class="ask-note">${ic('lock.svg','sm')}<span>Deadlines, forms and anything personal stay in your task list.
    Sidekick explains them and points you there. ${am('A-70')}</span></div>`;
}

function skSysRow(r) {
  return `
  <div class="sk-sys-row">
    <span class="sk-sys-ic">${ic(r.icon || 'file-alt.svg','sm')}</span>
    <div class="sk-sys-t"><b>${r.name}</b><span>${r.meta}</span></div>
    ${r.route ? `<button class="btn secondary sm" data-goto="${r.route}" data-skclose="1">Open</button>` : ''}
  </div>`;
}

/* The system card under an answer. Names, dates and links come from the
   task list; the answer above it cannot change them. */
function skTaskCard(key) {
  if (!key) return '';
  if (key === 'hmnext') {
    const open = hmTasks().find(t => !t.done && t.phase === 0 && t.route);
    return open ? `<div class="sk-sys">${skSysRow({ name:open.label, meta:`Due ${dueText(addDays(startDate(), open.dueOff))}`, route:open.route, icon:open.icon })}</div>` : '';
  }
  if (key === 'next') { const n = nextTask(); if (!n) return ''; key = n.key; }
  const t = taskList().find(x => x.key === key);
  if (t) return `<div class="sk-sys">${skSysRow({ name:t.name, meta:`Due ${dueText(dueFor(t.key))} · ${STATUS_CHIP[t.status][1]}`, route:t.route, icon:t.icon })}</div>`;
  const later = [...day1Items(), ...week1Items()].find(x => x.key === key);
  if (later) return `<div class="sk-sys">${skSysRow({ name:later.name,
    meta:`${week1Items().includes(later) ? 'Your first week' : `Day 1, ${dueText(startDate())}`} · ${later.sys}`, route:later.route, icon:later.icon })}</div>`;
  if (key === 'intro') return `<div class="sk-sys">${skSysRow({ name:'Add a badge photo, and say hello to your team',
    meta:`Optional · photo by ${dueText(dueFor('photo'))}`, route:'#/intro', icon:'comment-smile.svg' })}</div>`;
  return '';
}

/* ---------- matching ---------- */
function skMatch(q, who) {
  const text = q.toLowerCase();
  const exact = skList(who).find(it => it.q.toLowerCase() === text);
  if (exact) return exact;
  let best = null, bestLen = 0;
  skList(who).forEach(it => it.keys.forEach(k => {
    if (text.includes(k) && k.length > bestLen) { best = it; bestLen = k.length; }
  }));
  return best;
}

/* ---------- the window ----------
   One element, two frames. The whole panel is redrawn for the person
   viewing, so the ids the harness and app.js use (chatInput, chatSendBtn,
   chatMsgs) exist in both. */
function skMsgs(who, mode) {
  const intro = who === 'nh'
    ? `Hi ${esc(HIRE.preferred)}! I’m Sidekick, here on Paradox until you start. Ask me anything about joining Equinix. I’ll point you to the right task, and tell you when I’m not sure.`
    : who === 'hm'
    ? `Hi ${esc(MANAGER.name.split(' ')[0])}. ${hmSummary()} Your checklist for ${esc(HIRE.preferred)} is below; you can do each item from here.`
    : `Morning, ${esc(PEOPLE.pex.name.split(' ')[0])}. ${pexSummary(PEX_QUEUES.map(q => ({ q, hires: pexQueue(q) })).filter(g => g.hires.length)).split(' Start with')[0]}`;
  const lead = who === 'hm' ? skHmChecklist()
    : who === 'pex' ? skPexList(SK_PEX[0].list()) : '';
  const all = [{ role:'bot', body:intro, card:lead }, ...SK_THREAD.filter(m => m.who === who)];
  return all.map((m, i) => skMsg(m, mode, i)).join('');
}
function skMsg(m, mode, i) {
  if (mode === 'paradox') {
    if (m.role === 'me') return `<div class="pdx-who me">You</div><div class="msg me">${esc(m.text)}</div>`;
    if (m.role === 'note') return `<div class="msg bot handed">${m.body}</div>`;
    return `<div class="pdx-who">Sidekick</div><div class="msg bot">${m.body}</div>${m.card || ''}`;
  }
  if (m.role === 'me') return `
    <div class="tm-msg me"><div class="tm-col"><div class="tm-meta"><span>${skAt(i)}</span></div>
      <div class="tm-bubble me">${esc(m.text)}</div></div></div>`;
  return `
    <div class="tm-msg"><span class="tm-av">${skAv()}</span><div class="tm-col">
      <div class="tm-meta"><b>Sidekick</b><span>${skAt(i)}</span></div>
      <div class="tm-bubble ${m.role === 'note' ? 'handed' : ''}">${m.body}</div>${m.card || ''}</div></div>`;
}

function renderSidekick() {
  const who = skWho(), mode = skMode(who);
  const P = $('#chatPanel');
  P.className = (mode === 'paradox' ? 'panel sk-panel mode-paradox' : 'panel sk-panel mode-teams') + (P.classList.contains('show') ? ' show' : '');
  P.setAttribute('aria-label', mode === 'paradox' ? 'Sidekick, powered by Paradox' : 'Sidekick chat, as in Microsoft Teams');
  const handed = S.sidekick.handoffs.filter(h => h.who === who).length;
  const asked = new Set(SK_THREAD.filter(m => m.who === who && m.role === 'me').map(m => m.text.toLowerCase()));
  const chips = `<div class="chat-quick">${skList(who).filter(it => !asked.has(it.q.toLowerCase())).slice(0, 3)
    .map(it => `<button class="p-chip" data-skq="${esc(it.q)}">${it.q}</button>`).join('')}</div>`;
  if (mode === 'paradox') {
    P.innerHTML = `
      <div class="pdx-top">
        <span class="pdx-url">${ic('lock.svg','sm')}paradox.ai</span>
        <button class="x" type="button" data-skx="1" aria-label="Close">${ic('times.svg')}</button>
      </div>
      <div class="pdx-h">
        <span class="pdx-bub">${ic('pdx-bubble.svg','lg')}</span>
        <div class="pdx-id"><b>Onboarding assistant</b><span>Sidekick · powered by Paradox</span></div>
        <span class="pdx-stage">Before Day 1</span>
      </div>
      <div class="panel-b pdx-b" id="chatBody">
        ${skWhereCard()}
        <div class="chat-msgs" id="chatMsgs">${skMsgs(who, mode)}</div>
        ${chips}
        ${handed ? `<div class="sk-handed">${ic('check-circle.svg','sm')}<span>${handed === 1 ? 'One question is' : `${handed} questions are`} with the People Operations team. They reply by email.</span></div>` : ''}
        ${skDesignNotes(who)}
      </div>
      <div class="pdx-foot">
        <div class="pdx-in">
          <input type="text" id="chatInput" placeholder="Type a message…" aria-label="Message Sidekick">
          <button class="pdx-send" id="chatSendBtn" type="button" aria-label="Send">${ic('tm-send.svg')}</button>
        </div>
        <div class="pdx-person">Rather ask a person? <button class="pdx-link" type="button" data-skhuman="1">Talk to a person</button></div>
        <div class="pdx-note" data-assume="A-82">${ic('info-circle.svg','sm')}<span>Runs on Paradox until your first day; from Day 1 it’s Sidekick in Teams.
          Prototype answers are written in advance. ${am('A-82')}</span></div>
      </div>`;
  } else {
    const rail = [['tm-bell.svg','Activity'], ['tm-chat.svg','Chat'], ['calendar.svg','Calendar'], ['tm-phone.svg','Calls'],
                  ['sk','Sidekick'], ['user-circle.svg','MyHR'], ['tm-cloud.svg','OneDrive'], ['tm-dots.svg',''], ['tm-apps.svg','Apps']];
    P.innerHTML = `
      <div class="tm-bar">
        <span class="tm-dots3"><i></i><i></i><i></i></span>
        <span class="tm-search">${ic('search.svg','sm')}Search</span>
        <button class="tm-open" type="button" data-skteams="1">${ic('tm-popout.svg','sm')}Open in Teams</button>
        <button class="x" type="button" data-skx="1" aria-label="Close">${ic('times.svg')}</button>
      </div>
      <div class="tm-main">
        <nav class="tm-rail" aria-hidden="true">
          ${rail.map(([icn, l]) => `<span class="tm-ri ${l === 'Sidekick' ? 'on' : ''}">${icn === 'sk' ? `<img src="${SK_AV}" alt="">` : ic(icn)}${l ? `<span>${l}</span>` : ''}</span>`).join('')}
        </nav>
        <section class="tm-chat">
          <div class="tm-h">
            <span class="tm-av lg">${skAv()}</span><b>Sidekick</b>
            <span class="tm-tab on">Chat</span><span class="tm-tab">Shared</span>
            <span class="tm-sync" data-assume="A-83"><i></i>Synced with Teams</span>
          </div>
          <div class="panel-b tm-b" id="chatBody">
            <div class="tm-day">Today</div>
            <div class="chat-msgs tm-msgs" id="chatMsgs">${skMsgs(who, mode)}</div>
            ${handed ? `<div class="sk-handed">${ic('check-circle.svg','sm')}<span>${handed === 1 ? 'One question is' : `${handed} questions are`} with the People Operations team.</span></div>` : ''}
            ${skDesignNotes(who)}
          </div>
          <div class="tm-foot">
            ${chips}
            <div class="tm-compose">
              <input type="text" id="chatInput" placeholder="Type a message" aria-label="Message Sidekick">
              <span class="tm-tools">${ic('tm-emoji.svg')}${ic('tm-clip.svg')}</span>
              <button class="tm-send" id="chatSendBtn" type="button" aria-label="Send">${ic('tm-send.svg')}</button>
            </div>
            <div class="tm-note">
              ${who === 'hm' ? `<span>Rather ask a person? <button class="pdx-link tm-link" type="button" data-skhuman="1">Talk to a person</button></span>` : '<span></span>'}
              <span class="tm-proto">Prototype: drawn to look like Teams; answers are written in advance.</span>
            </div>
          </div>
        </section>
      </div>`;
  }
}

function skDesignNotes(who) {
  return `
  <div class="sk-notes pnote">
    <b>The rule this is built to.</b> Sidekick talks, the system decides. Every date, status and link in a grey
    card is read from the task list, and nothing Sidekick writes can change one. ${am('A-70')}
    ${who === 'nh' ? `
    <p>Why Paradox: a new hire has no Equinix account before Day 1, and the candidate journey already ran on Paradox,
    so the assistant stays where they already are. It is still Sidekick’s answers and rules, labelled as running on
    Paradox, so nobody is surprised when Day 1 moves them into Teams. ${am('A-82')}</p>
    <div class="sk-fail">
      <div class="sk-fail-h">If Sidekick gets it wrong</div>
      <div class="msg bot wrong">You can set up direct deposit in ADP.</div>
      ${skTaskCard('details')}
      <p>Stephanie hit exactly this in testing: a direct deposit question sent her to ADP, but new starters do it in
      Workday. The wrong sentence costs a detour; the card underneath still opens the right task. ${am('A-71')}</p>
    </div>` : `
    <p>Why a Teams window: managers and coordinators already use Sidekick in Teams, and most managers will never open
    the portal. Drawn the same way here, the chat is one conversation in both places; the portal is the full view for
    when one chat is not enough, such as several hires at once. ${am('A-83')}</p>`}
  </div>`;
}

function skAsk(q) {
  q = (q || '').trim();
  if (!q) return;
  const who = skWho();
  SK_LAST_Q = q;
  const it = skMatch(q, who);
  SK_THREAD.push({ who, role:'me', text:q });
  if (it) {
    const card = who === 'pex' ? skPexList(it.list()) : who === 'hm' && it.task === 'hmnext' ? skHmChecklist() : skTaskCard(it.task);
    SK_THREAD.push({ who, role:'bot', card, body:`${it.say()}
      <div class="sk-src">${ic('file-alt.svg','sm')}${who === 'pex' ? 'From' : 'From the article'} <b>${skSrc(it)}</b></div>
      <div class="sk-fb" data-skfb="${it.id}"><span>Was this right?</span>
        <button type="button" data-skfbv="yes">Yes</button><button type="button" data-skfbv="no">No</button></div>` });
  } else {
    SK_THREAD.push({ who, role:'bot', body: who === 'pex'
      ? `I can only answer from your queues and the caseload, and nothing there matches that.
         <div class="sk-searched">${ic('search.svg','sm')}Searched ${skSources(who)}. Nothing matched.</div>
         Try one of the questions below, or open the caseload and filter it.`
      : `I looked, and nothing I can read answers that, so I’d rather not guess.
         <div class="sk-searched">${ic('search.svg','sm')}Searched ${skSources(who)}. Nothing matched.</div>
         A person on the People Operations team can answer it. They’ll see this conversation, so you won’t need to explain again.
         <div class="sk-fb"><button type="button" class="btn brand sm" data-skhuman="1">Talk to a person</button></div>` });
  }
  if (!$('#chatPanel').classList.contains('show')) openChat();
  else renderSidekick();
  skScroll();
}
function skScroll() {
  const b = $('#chatPanel .panel-b'); if (!b) return;
  const mine = b.querySelectorAll('.msg.me, .tm-msg.me');
  const last = mine[mine.length - 1];
  b.scrollTop = last ? last.offsetTop - b.offsetTop - 12 : b.scrollHeight;
}

/* What an unanswered question was checked against before a person is
   offered (A-72, A-78). Escalation is the unhappy path, not the default. */
const skSources = who => who === 'hm'
  ? 'the HR articles for managers and the onboarding guide for managers'
  : who === 'pex' ? 'your queues and the caseload'
  : `the HR knowledge articles, the ${S.country === 'JP' ? 'Tokyo' : 'Denver'} office guide and the new starter FAQ`;

/* The red button. Lands in the coordinator's Help requests queue for
   Jordan, with the question attached (L-13), and says so. */
function skHandoff() {
  const who = skWho();
  S.sidekick.handoffs.push({ who, q: SK_LAST_Q || 'Asked for a person', at: fmtDate(simToday()) });
  save();
  SK_THREAD.push({ who, role:'note', body:`${ic('check-circle.svg','sm')} Passed to the People Operations support team,
    with this conversation attached. They answer most questions directly and pass anything complex to a specialist.
    They reply by ${who === 'nh' ? 'email' : 'Teams'}, and ${PEOPLE.pex.name} can see it too. ${am('A-72')}` });
  renderSidekick();
  skScroll();
  toast(`Passed to a person. They reply by ${who === 'nh' ? 'email' : 'Teams'}.`, 'check-circle.svg');
}

/* Clicks inside the panel and the ask bars, called from app.js's one
   document click handler. Returns true when it handled the click. */
function skClick(t) {
  const q = t.closest('[data-skq]');
  if (q) { skAsk(q.dataset.skq); return true; }
  if (t.closest('#chatSendBtn')) { sendChat(); return true; }
  if (t.closest('[data-skhuman]')) { skHandoff(); return true; }
  if (t.closest('[data-skx]')) { closePanels(); return true; }
  if (t.closest('[data-skteams]')) { toast('In the product, this opens the same chat in Microsoft Teams.', 'external-link.svg'); return true; }
  const ph = t.closest('[data-skphone]');
  if (ph) {
    if (ph.dataset.skphone === 'ok') { S.sidekick.phoneOk = true; save(); renderSidekick(); toast('Phone number verified.', 'check-circle.svg'); }
    else toast('In the product, this opens your contact details in Workday.', 'external-link.svg');
    return true;
  }
  const hello = t.closest('[data-skhello]');
  if (hello) {
    const a = hello.dataset.skhello; skHelloClose();
    if (a === 'open') openChat();
    if (a === 'go') location.hash = hello.dataset.route;
    return true;
  }
  const fb = t.closest('[data-skfbv]');
  if (fb) {
    const box = fb.closest('[data-skfb]');
    if (box) box.innerHTML = fb.dataset.skfbv === 'yes'
      ? `<span>${ic('check.svg','sm')}Thanks.</span>`
      : `<span>${ic('info-circle.svg','sm')}Thanks. That goes to the knowledge team so the article gets fixed.</span>`;
    return true;
  }
  if (t.closest('[data-skclose]')) { closePanels(); return false; }   // let data-goto navigate
  return false;
}
