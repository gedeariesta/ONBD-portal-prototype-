/* ============================================================
   Sidekick, the AI layer of the AI-forward prototype (v4)

   One rule, from the September meetings, and every answer below is built
   to it: Sidekick talks, the system decides. Anything with a deadline, a
   signature or personal data is read from the task list and drawn by the
   system, in a card Sidekick cannot word. Sidekick only explains it and
   points at it. So a wrong answer costs a detour, never a missed task,
   because the card under it still carries the right link (A-70).

   What the meetings asked of it, and where each one lives here:
     - a guided "training wheels" version, not the open employee Sidekick:
       the where-you-are card and the suggested questions (A-71)
     - the same knowledge articles as the employee version: every answer
       names the article it would come from (A-71)
     - a red button to a person, tier one first: Talk to a person, which
       lands in the coordinator's Help requests queue (A-72, L-13)
     - the feedback button Stephanie has been using: Was this right? (A-71)

   Prototype: the answers are written in advance and matched on keywords.
   Nothing here calls a model, and the panel says so.

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
      const list = (soon.length ? soon : open).slice(0, 3).map(t => `<b>${t.label.toLowerCase()}</b>`);
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

const skList = who => who === 'hm' ? SK_HM : SK_NH;
const skSrc = it => typeof it.src === 'function' ? it.src() : it.src;

/* The thread lives in memory only: a conversation is not state the other
   two views read. The handoffs are, so those are saved. */
let SK_THREAD = [];
/* The Sidekick mascot, supplied by Gede from the internal launch banner. */
const SK_AV = 'assets/sidekick/sidekick-head.png';
const skAv = () => `<img class="sk-av" src="${SK_AV}" alt="">`;
let SK_LAST_Q = '';

/* ---------- the brief: one shape on all three homes (A-75) ----------
   Top layer: the time period, one sentence, the one thing to do first and
   a count. "What's coming up" opens the next layer. Every value is read from
   the task list or the queues; Sidekick only words the sentence. The next
   thing appears on its own once the first is done, so nobody is shown every
   open item at once. */
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

/* The new hire's brief. Same structure as the manager's and the
   coordinator's: period, sentence, the one next task, a count. */
function nhBrief() {
  const tasks = taskList(), done = tasks.filter(t => t.status === 'done').length;
  const next = nextTask(), days = daysToStart();
  const od = tasks.filter(t => isOverdue(t.key));
  const say = !next
    ? `Everything before Day 1 is done, and nothing is waiting on you. Your first-day details arrive here three days before you start.`
    : `${od.length ? `${od.length} ${od.length > 1 ? 'things are' : 'thing is'} past due, but ${od.length > 1 ? 'they’re' : 'it’s'} still open. ` : ''}`
      + `One thing to do now. When it’s done, I’ll show you the next.`;
  const more = [
    ...tasks.filter(t => t.status !== 'done' && (!next || t.key !== next.key)).map(t => ({ name:t.name, when:`Due ${dueText(dueFor(t.key))}` })),
    { name:'Your first day details arrive', when:'3 days before you start' },
    ...day1Items().map(t => ({ name:t.name, when:'Day 1' })),
    { name:'Benefits enrolment', when:'Day 2' },
    ...week1Items().map(t => ({ name:t.name, when:'First week' })),
  ];
  return skBrief('nh', {
    period: next ? `This week · ${days} day${days === 1 ? '' : 's'} to go` : 'Before Day 1',
    say,
    focus: next && { label: done ? 'Next' : 'Start here', name: next.name,
      due: `Due ${dueText(dueFor(next.key))}`, route: next.route },
    count: `${done} of ${tasks.length} done before Day 1`,
    more,
    note: 'Drawn from your task list. The order is set by due date, not by Sidekick.',
  });
}

/* ---------- the ask bar, drawn inside a scene ---------- */
function sidekickAskBar(who) {
  const list = skList(who).slice(who === 'hm' ? 0 : 1, who === 'hm' ? 3 : 4);
  return `
  <form class="ask-bar" data-askform="${who}" data-assume="A-71">
    <span class="ask-av">${skAv()}</span>
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

/* ---------- where you are: drawn by the system, not by Sidekick ---------- */
function skWhereCard(who) {
  if (who === 'hm') {
    const t = hmTasks().filter(x => x.phase === 0), open = t.find(x => !x.done && x.route);
    return `
    <div class="sk-where" data-assume="A-70">
      <div class="sk-sys-l">${ic('list-tasks.svg','sm')}From your task list, not written by Sidekick</div>
      <div class="sk-where-n"><b>${t.filter(x => x.done).length} of ${t.length}</b> of your tasks before Day 1 done</div>
      ${open ? skSysRow({ name:open.label, meta:`Due ${dueText(addDays(startDate(), open.dueOff))}`, route:open.route, icon:open.icon }) : ''}
    </div>`;
  }
  const n = nextTask();
  return `
  <div class="sk-where" data-assume="A-70">
    <div class="sk-sys-l">${ic('list-tasks.svg','sm')}From your task list, not written by Sidekick</div>
    <div class="sk-where-n"><b>${tasksComplete()} of 3</b> things done before Day 1</div>
    <div class="three dark">${taskList().map(t => `<i class="${t.status === 'done' ? 'on' : ''}"></i>`).join('')}</div>
    ${n ? skSysRow({ name:n.name, meta:`Due ${dueText(dueFor(n.key))} · ${STATUS_CHIP[n.status][1]}`, route:n.route, icon:n.icon })
        : `<div class="sk-where-done">${ic('check-circle.svg','sm')}Nothing else until your first-day details arrive.</div>`}
  </div>`;
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

/* ---------- the panel ---------- */
function skWho() { return S.view === 'hm' ? 'hm' : 'nh'; }

function renderSidekick() {
  const who = skWho();
  const handed = S.sidekick.handoffs.filter(h => h.who === who).length;
  $('#chatBody').innerHTML = `
    ${skWhereCard(who)}
    <div class="chat-msgs" id="chatMsgs">
      <div class="msg bot">${who === 'hm'
        ? `Hi ${MANAGER.name.split(' ')[0]}. I can tell you what needs you before ${HIRE.preferred} starts, and why things are the way they are. I read the same record you see.`
        : `Hi ${esc(HIRE.preferred)}. I’m Sidekick, your guide until you start and for your first weeks. Ask me anything. I’ll point you to the right task, and tell you when I’m not sure.`}</div>
      ${SK_THREAD.filter(m => m.who === who).map(m => m.html).join('')}
    </div>
    <div class="chat-quick">
      ${skList(who).map(it => `<button class="p-chip" data-skq="${esc(it.q)}">${it.q}</button>`).join('')}
    </div>
    ${handed ? `<div class="sk-handed">${ic('check-circle.svg','sm')}<span>${handed === 1 ? 'One question is' : `${handed} questions are`} with the People Operations team. They reply by email.</span></div>` : ''}
    ${who === 'hm' ? skTeamsPreview() : ''}
    ${skDesignNotes(who)}`;
}

/* How the same reminder reaches a manager: in Teams, where they already
   are, with the action in the message (A-73). New hires have no Equinix
   account yet, so theirs go by email. */
function skTeamsPreview() {
  const b = hmBlockers()[0];
  return `
  <div class="sk-teams" data-assume="A-73">
    <div class="sk-teams-h">${ic('comment-lines.svg','sm')}How Sidekick reminds you, in Teams ${am('A-73')}</div>
    <div class="sk-teams-card">
      <div class="skt-from"><span class="skt-av">${skAv()}</span><b>Sidekick</b><span>Onboarding</span></div>
      <div class="skt-msg">${b ? `${HIRE.preferred} starts in ${daysToStart()} days. ${b.text.split('.')[0]}.` : `${HIRE.preferred} starts in ${daysToStart()} days, and nothing needs you.`}</div>
      ${b && b.route ? `<div class="skt-acts"><span class="skt-btn">${b.action}</span><span class="skt-btn ghost">Remind me Friday</span></div>` : ''}
    </div>
  </div>`;
}

function skDesignNotes(who) {
  return `
  <div class="sk-notes pnote">
    <b>The rule this is built to.</b> Sidekick talks, the system decides. Every date, status and link in a grey
    card is read from the task list, and nothing Sidekick writes can change one. ${am('A-70')}
    ${who === 'nh' ? `
    <div class="sk-fail">
      <div class="sk-fail-h">If Sidekick gets it wrong</div>
      <div class="msg bot wrong">You can set up direct deposit in ADP.</div>
      ${skTaskCard('details')}
      <p>Stephanie hit exactly this in testing: a direct deposit question sent her to ADP, but new starters do it in
      Workday. The wrong sentence costs a detour; the card underneath still opens the right task. ${am('A-71')}</p>
    </div>
    <p>Still open: whether a pre-hire’s Sidekick sees the same articles as an employee’s. If security trims them, the
    answers above get thinner, and more questions end at a person. ${am('A-71')}</p>` : ''}
  </div>`;
}

function skAsk(q) {
  q = (q || '').trim();
  if (!q) return;
  const who = skWho();
  SK_LAST_Q = q;
  const it = skMatch(q, who);
  const me = `<div class="msg me">${esc(q)}</div>`;
  const bot = it
    ? `<div class="msg bot">${it.say()}
         <div class="sk-src">${ic('file-alt.svg','sm')}From the article <b>${skSrc(it)}</b></div>
         <div class="sk-fb" data-skfb="${it.id}"><span>Was this right?</span>
           <button type="button" data-skfbv="yes">Yes</button><button type="button" data-skfbv="no">No</button></div>
       </div>${skTaskCard(it.task)}`
    : `<div class="msg bot">I looked, and nothing I can read answers that, so I’d rather not guess.
         <div class="sk-searched">${ic('search.svg','sm')}Searched ${skSources(who)}. Nothing matched.</div>
         A person on the People Operations team can answer it. They’ll see this conversation, so you won’t need to explain again.
         <div class="sk-fb"><button type="button" class="btn brand sm" data-skhuman="1">Talk to a person</button></div>
       </div>`;
  SK_THREAD.push({ who, html: me + bot });
  if (!$('#chatPanel').classList.contains('show')) { openChat(); }
  else renderSidekick();
  const b = $('#chatPanel .panel-b'); if (b) b.scrollTop = b.scrollHeight;
}

/* What an unanswered question was checked against before a person is
   offered (A-72, A-78). Escalation is the unhappy path, not the default. */
const skSources = who => who === 'hm'
  ? 'the HR articles for managers and the onboarding guide for managers'
  : `the HR knowledge articles, the ${S.country === 'JP' ? 'Tokyo' : 'Denver'} office guide and the new starter FAQ`;

/* The red button. Lands in the coordinator's Help requests queue for
   Jordan, with the question attached (L-13), and says so. */
function skHandoff() {
  const who = skWho();
  S.sidekick.handoffs.push({ who, q: SK_LAST_Q || 'Asked for a person', at: fmtDate(simToday()) });
  save();
  SK_THREAD.push({ who, html: `<div class="msg bot handed">${ic('check-circle.svg','sm')} Passed to the People Operations support team,
    with this conversation attached. They answer most questions directly and pass anything complex to a specialist.
    They reply by email, and ${PEOPLE.pex.name} can see it too. ${am('A-72')}</div>` });
  renderSidekick();
  const b = $('#chatPanel .panel-b'); if (b) b.scrollTop = b.scrollHeight;
  toast('Passed to a person. They reply by email.', 'check-circle.svg');
}

/* Clicks inside the panel and the ask bars, called from app.js's one
   document click handler. Returns true when it handled the click. */
function skClick(t) {
  const q = t.closest('[data-skq]');
  if (q) { skAsk(q.dataset.skq); return true; }
  if (t.closest('[data-skhuman]')) { skHandoff(); return true; }
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
