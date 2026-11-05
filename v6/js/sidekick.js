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
    say: () => `You add your bank details here in the portal on your first day, with your tax details and emergency contacts. It’s one task, entered once. Before then, it’s worth checking the details we already have, so your first pay goes to the right place.` },
  { id:'buddy', q:'Who is my buddy?', keys:['buddy','mentor','who can i ask'],
    src:'Onboarding buddies',
    say: () => {
      const B = S.hm.buddy, p = B.assigned ? orgPerson(B.assigned) : null;
      if (!p) return `${HIRE.manager} hasn’t named your buddy yet. When she does, their name and how to reach them appear under Your people.`;
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
    say: () => `As soon as you name them. They appear under Jordan’s people straight away, so Jordan has someone to talk to before Day 1.` },
  { id:'apps', q:'Which apps will Jordan get?', keys:['apps','applications','software','stack','suggest'],
    src:'Requesting software for a new starter',
    say: () => `The standard set for a ${esc(HIRE.role)}: ${hmAppsChosen().map(a => `<b>${a}</b>`).join(', ')}. ${S.hm.software.confirmed ? 'You’ve confirmed them.' : 'Confirm them, or add anything else Jordan needs, from the checklist.'}` },
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
      ? (() => { const n = skHmOpenCount();   // the same count the checklist card shows
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

/* The manager's checklist, the Sidekick action window (A-83, M-37). One card
   for every manager task, before and after Day 1, and every item is done
   from the chat: "Do it" opens that task as a card in the thread. A manager
   never has to open the portal (Gede, 5 Nov); it is there for the full view.
   Every control below writes to the same record the portal screens read. */
const skPhoneOk = () => !!S.hm.contactConfirmed;
function skHmOpenCount() {
  // Equipment is the new hire's to do, so it is shown but never counted as open.
  return hmTasks().filter(t => !t.phase && !t.done && t.id !== 'computer').length + (skPhoneOk() ? 0 : 1) + (S.hm.channels.accepted ? 0 : 1);
}
function skHmRow(x) {
  const when = x.dueOff != null ? `Due ${dueText(addDays(startDate(), x.dueOff))}` : '';
  const act = x.done ? '<span class="tmc-st">Done</span>'
    : x.id === 'computer' ? '<span class="tmc-st">Nothing to do</span>'
    : x.route ? `<button class="tm-btn" type="button" data-skdo="${x.id}">Do it</button>`
    : '<span class="tmc-st">In your calendar</span>';
  return `
    <div class="tmc-row ${x.done ? 'done' : ''}">
      <span class="tmc-tick">${x.done ? ic('check.svg','sm') : ''}</span>
      <span class="tmc-l">${x.label}${x.done ? '' : `<span class="tmc-due">${when}</span>`}</span>
      ${act}
    </div>`;
}
function skHmChecklist() {
  const all = hmTasks();
  const sink = list => [...list.filter(x => !x.done), ...list.filter(x => x.done)];
  const pre = sink(all.filter(x => !x.phase)), later = sink(all.filter(x => x.phase));
  const phone = skPhoneOk(), chan = S.hm.channels.accepted;
  const quick = `
    <div class="tmc-row ${phone ? 'done' : ''}" data-assume="A-83">
      <span class="tmc-tick">${phone ? ic('check.svg','sm') : ''}</span>
      <span class="tmc-l">Verify your contact phone number
        <span class="tmc-due">${esc(MANAGER.workPhone)} · from Workday${phone ? ', verified' : ''}</span></span>
      ${phone ? '<span class="tmc-st">Verified</span>' : `<span class="tmc-acts">
        <button class="tm-btn primary" type="button" data-skphone="ok">Verify</button>
        <button class="tm-btn" type="button" data-skphone="change">Change in Workday</button></span>`}
    </div>
    <div class="tmc-row ${chan ? 'done' : ''}">
      <span class="tmc-tick">${chan ? ic('check.svg','sm') : ''}</span>
      <span class="tmc-l">Add Jordan to the team’s channels
        <span class="tmc-due">${CHANNEL_SUGGESTIONS.length} suggested from your team${chan ? ', queued for Day 1' : ''}</span></span>
      ${chan ? '<span class="tmc-st">Added</span>' : `<button class="tm-btn primary" type="button" data-skact="channels">Add all</button>`}
    </div>`;
  const mine = pre.filter(x => x.id !== 'computer');
  const preDone = mine.filter(x => x.done).length + (phone ? 1 : 0) + (chan ? 1 : 0);
  return skCard(`Checklist · ${esc(HIRE.preferred)} ${esc(HIRE.legalLast)}`,
    `Starts ${fmtDate(startDate())} · ${preDone} of ${mine.length + 2} done before Day 1`,
    `<div class="tmc-sub">Before Day 1</div>${pre.map(skHmRow).join('')}${quick}
     <div class="tmc-sub">From Day 1</div>${later.map(skHmRow).join('')}`,
    `<span class="tmc-hint">You can do all of it here. The portal is there if you want the full view. ${am('M-37')}</span>
     <button class="tm-btn" type="button" data-goto="#/hm/" data-skclose="1">${ic('portal-window.svg','sm')}Open in portal</button>`);
}

/* "Do it": the task as a card in the thread. The card is drawn live from the
   record, so it always shows the current state. */
const SK_DO_SAY = {
  logistics: 'Here are Jordan’s first-day details. People Experience set the office part; only the rest is yours.',
  software: `These are the standard apps for a ${HIRE.role}. Untick anything Jordan won’t use, add anything missing, then confirm.`,
  card: 'One question, and only if they’ll travel on behalf of Equinix.',
  buddy: 'Pick someone from Jordan’s team or function. I’ll ask them for you, and tell them what being a buddy means.',
  calendar: 'Most of Day 1 is already in your calendar. Check it and confirm.',
  welcome: 'The welcome note is already written. Add a line of your own if you like, and send it.',
  intro: 'Jordan wrote an introduction and said you can share it. Forward it when you’re ready.',
  survey: 'Nine quick questions about how recruiting went, while it’s fresh.',
};
function skDo(id) {
  const last = SK_THREAD.filter(m => m.who === 'hm').pop();
  if (!last || last.act !== id) SK_THREAD.push({ who:'hm', role:'bot', body: SK_DO_SAY[id] || 'Here it is.', act: id });
  if (!$('#chatPanel').classList.contains('show')) openChat(); else renderSidekick();
  const cards = $$('#chatMsgs .tm-act[data-act]');
  const card = cards[cards.length - 1];
  const b = $('#chatPanel .panel-b');
  if (card && b) b.scrollTop = card.offsetTop - b.offsetTop - 60;
}
const skOn = (on, attrs, label, cls = '') =>
  `<button class="tm-btn ${on ? 'on' : ''} ${cls}" type="button" ${attrs} aria-pressed="${!!on}">${label}</button>`;
function skActCard(id) {
  const H = S.hm, t = hmTasks().find(x => x.id === id) || {};
  const doneLine = t.done ? `<div class="tmc-ok">${ic('check-circle.svg','sm')}Done. You can still change it here.</div>` : '';
  let title = t.label || '', body = '', foot = '';
  if (id === 'logistics') {
    const L = H.logistics, jp = S.country === 'JP', ok = skReady('logistics');
    body = `<div class="tmc-p"><b>Set by People Experience:</b> ${jp ? 'Otemachi Financial City Grand Cube, reception, 3rd floor' : '1225 17th Street, main reception, ground floor'}.
        Orientation until ${S.pexUpdate ? S.pex.blueprint.until : '12:00'}.</div>
      <label class="tmc-lab" for="skWhere">When and where should Jordan find you?</label>
      <input class="tm-in" id="skWhere" data-skin="logistics.whereToBe" value="${esc(L.whereToBe)}" placeholder="e.g. 13:00, main reception. Ask for me at the desk">
      <div class="tmc-lab">Will you be there on Day 1?</div>
      <div class="tmc-acts">${skOn(L.available, 'data-skset="avail:yes"', 'Yes, I’ll be there')}${skOn(!L.available, 'data-skset="avail:no"', 'No, someone covers')}</div>
      ${!L.available ? `<label class="tmc-lab" for="skProxy">Who covers for you?</label>
      <select class="tm-in" id="skProxy" data-skin="logistics.proxy"><option value="">Choose someone…</option>
        ${ORG_PEOPLE.filter(p => p.team).map(p => `<option ${L.proxy === p.name ? 'selected' : ''}>${p.name}</option>`).join('')}</select>` : ''}`;
    foot = `<button class="tm-btn primary" type="button" data-skact="logistics" ${ok ? '' : 'disabled'}>${L.confirmed ? 'Update' : 'Confirm'}</button>`;
  } else if (id === 'software') {
    const A = H.software;
    body = `<div class="tmc-lab">Standard for the role</div>
      <div class="tmc-chips">${ROLE_APPS.map(a => skOn(!A.removed.includes(a), `data-skset="swstd:${esc(a)}"`, a, 'chip')).join('')}</div>
      <div class="tmc-lab">Anything else</div>
      <div class="tmc-chips">${SOFTWARE_CATALOG.map(a => skOn(A.added.includes(a), `data-skset="sw:${esc(a)}"`, a, 'chip')).join('')}</div>`;
    foot = `<button class="tm-btn primary" type="button" data-skact="software">${A.confirmed ? 'Update' : `Confirm ${hmAppsChosen().length} apps`}</button>`;
  } else if (id === 'card') {
    const C = H.card;
    body = `<div class="tmc-p">${CARD_FLOW.managerQuestion}</div>
      <div class="tmc-acts">${skOn(C.needed === true, 'data-skset="card:yes"', 'Yes, they’ll travel')}${skOn(C.needed === false, 'data-skset="card:no"', 'No, not needed')}</div>
      ${C.needed === true ? `<div class="tmc-p sub">Jordan signs the card agreement on Day 2. Nothing else for you.</div>` : ''}`;
  } else if (id === 'buddy') {
    const B = H.buddy, p = B.assigned ? orgPerson(B.assigned) : null;
    body = p ? `<div class="tmc-p"><b>${p.name}</b>, ${p.role}.
        ${B.accepted ? 'They said yes. Their first month with Jordan gets booked.' : B.notified ? 'I’ve asked them. Waiting for a yes.' : 'Not asked yet.'}</div>
        <div class="tmc-p sub">They get a message from me saying what to do before Day 1, on Day 1 and in the first month.</div>`
      : `<label class="tmc-lab" for="skBuddy">Buddy</label>
      <select class="tm-in" id="skBuddy" data-skin="buddy"><option value="">Choose someone…</option>
        ${ORG_PEOPLE.filter(o => o.team || o.dept === 'Global FP&A').map(o => `<option value="${o.id}">${o.name}, ${o.role}</option>`).join('')}</select>`;
    foot = !p ? '' : !B.notified ? `<button class="tm-btn primary" type="button" data-skact="buddyask">Ask ${p.name.split(' ')[0]}</button>
        <button class="tm-btn" type="button" data-skact="buddyclear">Change</button>`
      : !B.accepted ? `<button class="tm-btn" type="button" data-skact="buddyaccept">Simulate their yes</button>` : '';
  } else if (id === 'calendar') {
    const C = H.calendar;
    body = DAY1_HOLDS.map(h => `
      <div class="tmc-hold"><span class="tmc-time">${h.time}</span><span class="tmc-l">${h.label}</span>
        ${h.auto ? `<span class="tmc-st">${h.blueprint ? 'Set by People Experience' : 'Placed for you'}</span>`
          : skOn(C.holds[h.id], `data-skset="hold:${h.id}"`, C.holds[h.id] ? 'Added' : 'Add')}</div>`).join('');
    foot = `<button class="tm-btn primary" type="button" data-skact="calendar">${C.confirmed ? 'Confirmed' : 'Looks right'}</button>`;
  } else if (id === 'welcome') {
    const W = H.welcome, text = W.body || WELCOME_BOILERPLATE;
    body = `<div class="tmc-quote">${esc(text.length > 260 ? text.slice(0, 260).trim() + '…' : text)}</div>
      <label class="tmc-lab" for="skPersonal">A line of your own <span class="tmc-opt">(optional)</span></label>
      <input class="tm-in" id="skPersonal" data-skin="welcome.personal" value="${esc(W.personal)}" placeholder="e.g. Looking forward to the forecast work together">`;
    foot = W.sent ? '' : `<button class="tm-btn primary" type="button" data-skact="welcome">Send to Jordan</button>`;
  } else if (id === 'intro') {
    body = `<div class="tmc-quote">${esc(S.intro.text)}</div>`;
    foot = H.intro.forwarded ? '' : `<button class="tm-btn primary" type="button" data-skact="intro">Forward to the team</button>`;
  } else if (id === 'survey') {
    const V = H.survey;
    const rated = HM_SURVEY.filter(q => q.kind === 'scale');
    body = `<div class="tmc-p sub">1 is strongly disagree, 5 is strongly agree.</div>` + HM_SURVEY.map(q => q.kind === 'scale' ? `
      <div class="tmc-sq"><div class="tmc-sq-q">${q.n}. ${q.q}${q.flag ? ` ${am('M-35')}` : ''}</div>
        <div class="tmc-scale" role="group" aria-label="Question ${q.n}">${[1, 2, 3, 4, 5].map(v =>
          skOn(V.answers[q.n] === v, `data-skset="svq:${q.n}:${v}" aria-label="${v} of 5"`, String(v), 'sq')).join('')}</div></div>`
      : q.kind === 'text' ? `<label class="tmc-lab" for="skSv8">${q.n}. ${q.q}</label>
        <input class="tm-in" id="skSv8" data-skin="survey.${q.n}" value="${esc(V.answers[q.n] || '')}" placeholder="Optional">`
      : `<div class="tmc-p sub">${q.n}. Recruiter: <b>${PEOPLE.recruiter.name}</b>, filled in from the hire.</div>`).join('');
    const n = rated.filter(q => V.answers[q.n]).length;
    foot = V.sent ? '' : `<button class="tm-btn primary" type="button" data-skact="survey" ${n === rated.length ? '' : 'disabled'}>Send (${n} of ${rated.length} rated)</button>`;
  }
  return `<div data-act="${id}" class="tm-act">${skCard(title, t.dueOff != null && !t.done ? `Due ${dueText(addDays(startDate(), t.dueOff))}` : '',
    doneLine + body,
    foot + (t.route ? `<button class="tm-btn" type="button" data-goto="${t.route}" data-skclose="1">${ic('portal-window.svg','sm')}See it in the portal</button>` : ''))}</div>`;
}
function skReady(id) {
  const L = S.hm.logistics;
  if (id === 'logistics') return !!(L.whereToBe.trim() && (L.available || L.proxy));
  return true;
}
/* Redraw the page underneath and the chat, keeping the chat where it was. */
function skRefresh() {
  const b = $('#chatPanel .panel-b'), y = b ? b.scrollTop : 0;
  save(); render(); renderSidekick();
  const b2 = $('#chatPanel .panel-b'); if (b2) b2.scrollTop = y;
}
function skSet(spec) {
  const H = S.hm, [k, a, b] = spec.split(':');
  if (k === 'avail') { H.logistics.available = a === 'yes'; if (H.logistics.available) H.logistics.proxy = ''; }
  else if (k === 'card') {
    H.card.needed = a === 'yes';
    toast(H.card.needed ? 'Recorded. The agreement is now on Jordan’s list for Day 2.' : 'Recorded. Jordan is not asked about a card at all.', 'check-circle.svg');
  }
  else if (k === 'swstd') H.software.removed = H.software.removed.includes(a) ? H.software.removed.filter(x => x !== a) : [...H.software.removed, a];
  else if (k === 'sw') H.software.added = H.software.added.includes(a) ? H.software.added.filter(x => x !== a) : [...H.software.added, a];
  else if (k === 'hold') H.calendar.holds[a] = !H.calendar.holds[a];
  else if (k === 'svq') H.survey.answers[a] = +b;
  skRefresh();
}
function skAct(what) {
  const H = S.hm, who = H.buddy.assigned ? orgPerson(H.buddy.assigned) : null;
  const done = {
    logistics: () => { H.logistics.confirmed = true; return 'First-day details confirmed. They feed Jordan’s first-day card.'; },
    software:  () => { H.software.confirmed = true; return `Apps confirmed: ${hmAppsChosen().length} for Jordan’s first day.`; },
    buddyask:  () => { H.buddy.notified = true; return `${who.name} has been asked, with what being a buddy means. Nothing is booked until they say yes.`; },
    buddyaccept: () => { H.buddy.accepted = true; return `${who.name} said yes. A prototype control, so you can see what follows.`; },
    buddyclear: () => { H.buddy = { assigned:null, notified:false, accepted:false }; return ''; },
    calendar:  () => { H.calendar.confirmed = true; return 'Day 1 confirmed.'; },
    welcome:   () => { H.welcome.sent = true; return 'Sent. It’s the first thing Jordan sees on their portal.'; },
    intro:     () => { H.intro.forwarded = true; return 'Forwarded to the team channel. Jordan has been told it was shared.'; },
    survey:    () => { H.survey.sent = true; return 'Survey sent. Thank you.'; },
    channels:  () => { H.channels.accepted = true; return 'All four queued to be added on Jordan’s first day.'; },
  }[what];
  if (!done) return;
  const msg = done();
  skRefresh();
  if (msg) toast(msg, 'check-circle.svg');
}
/* Typing in a card saves as you go, without redrawing under the cursor. */
function skInput(el) {
  const k = el.dataset.skin; if (!k) return false;
  const H = S.hm;
  if (k === 'logistics.whereToBe') H.logistics.whereToBe = el.value;
  else if (k === 'welcome.personal') H.welcome.personal = el.value;
  else if (k.startsWith('survey.')) H.survey.answers[k.split('.')[1]] = el.value;
  else if (k === 'logistics.proxy') { H.logistics.proxy = el.value; skRefresh(); return true; }
  else if (k === 'buddy') {
    if (!el.value) return true;
    H.buddy = { assigned: el.value, notified:false, accepted:false };
    skRefresh(); toast(`${orgPerson(el.value).name} chosen. They haven’t been asked yet.`); return true;
  }
  save();
  $$('[data-skact="logistics"]').forEach(b => { b.disabled = !skReady('logistics'); });
  return true;
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
      <div class="tm-bubble ${m.role === 'note' ? 'handed' : ''}">${m.body}</div>${m.act ? skActCard(m.act) : (m.card || '')}</div></div>`;
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
    <p>Why a Teams window: managers and coordinators already use Sidekick in Teams. A manager can do every task
    from this chat, so they never need to open the portal; it is the full view, for when one chat is not enough, such
    as several hires at once. ${am('A-83')} ${am('M-37')}</p>`}
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
  const sdo = t.closest('[data-skdo]');
  if (sdo) { skDo(sdo.dataset.skdo); return true; }
  const sset = t.closest('[data-skset]');
  if (sset) { skSet(sset.dataset.skset); return true; }
  const sact = t.closest('[data-skact]');
  if (sact && !sact.disabled) { skAct(sact.dataset.skact); return true; }
  const ph = t.closest('[data-skphone]');
  if (ph) {
    if (ph.dataset.skphone === 'ok') { S.hm.contactConfirmed = true; skRefresh(); toast('Phone number verified.', 'check-circle.svg'); }
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
