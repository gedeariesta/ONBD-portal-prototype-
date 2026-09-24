/* ============================================================
   New Hire Pre-Day 1 Portal, interactive prototype.  v4, AI-forward
   (restyled to the 2026 Equinix direction, three pre-Day 1 tasks, Sidekick layer)
   Equinix design system (Nexa Text, brand palette, brand icons).

   v2 applies the edit notes: equipment rebuilt from the live UAT
   portal, suggested team network added, identity capture on Tab 1,
   five-phase timeline, four contacts, and a 47-entry register with
   provenance tags and one retired assumption.
   ============================================================ */

'use strict';

/* ---------------- helpers ---------------- */
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => [...el.querySelectorAll(sel)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// In the standalone single-file build, ICON_DATA maps icon filenames to data: URIs.
const iconUrl = name => (typeof ICON_DATA !== 'undefined' && ICON_DATA[name]) ? ICON_DATA[name] : 'assets/icons/' + name;
const ic = (name, cls='') => `<span class="ic ${cls}" style="-webkit-mask-image:url('${iconUrl(name)}');mask-image:url('${iconUrl(name)}')"></span>`;
const am = id => `<span class="am" data-am="${id}" title="Assumption ${id}, click for details">${id}</span>`;

function toast(msg, icon='info-circle.svg') {
  const t = $('#toast');
  t.innerHTML = `${ic(icon)}<span>${msg}</span>`;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 3400);
}

const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const fmtDate = d => d.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' });
const fmtLong = d => d.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
const dueText = d => d.toLocaleDateString('en-GB', { day:'numeric', month:'long' });
const fmtShort = d => d.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' });

/* ---------------- state ---------------- */
const DEFAULT_STATE = () => ({
  // v3: one state object, two lenses. `view` is a prototype device. A real
  // manager and a real new hire are different people on different screens.
  view: 'nh',                    // nh | hm
  buddyRule: 'assignment',       // assignment | 72h   (L-01, the live conflict)
  notes: false,                  // design notes: rationale, A-nn markers, dispositions
  insideOpen: false,             // Inside Equinix strip expanded (A-35)

  persona: 'external',           // external | conversion
  country: 'US',                 // US | JP
  horizon: '2wk',                // 2wk | 3mo  (A-45)
  scenario: 'default',           // default | inprogress | review | overdue | complete
  trackerOpen: null,             // which readiness step is expanded (A-52)
  incTab: 'activity',            // incident tab: activity | attachments | summary (A-54)
  todoPhase: 0,                  // which phase the live to-do view is showing (A-56)
  startdate: { confirmed:false, changeRequested:false, requestedDate:'', reason:'' },
  bgcheck: { launched:false },
  // Done in Workday on Day 1, so the portal only ever learns that it is done (A-65).
  details: { submitted:false },
  equipment: { choice:'', items:{}, shipOffice:'', shipPhone:'', submitted:false, comment:'', comments:[],
    device:'', deviceConfirmed:false },
  // Whether this role maps to one build or offers a choice (A-60). A prototype
  // control, because both states are real and both need reviewing.
  deviceMode: 'single',          // single | choice
  // People Experience owns the orientation blueprint. When they change it,
  // the manager's confirmation goes stale and has to be re-taken (M-32).
  pexUpdate: false,
  // ---- People Experience coordinator lens (third portal) ----
  pex: {
    filters: {}, savedView: 'all', nudged: {},
    size: 24,               // OI-01: the number that decides the whole design
    blueprint: { loc:'Denver, CO', from:'09:00', until:'13:00', dirty:false,
      where:'1225 17th Street, main reception, ground floor',
      expect:'Orientation, then lunch with the other new starters.',
      host:'Ask for the People Experience desk' },
  },
  jd: { state:'notstarted', scrolled:false, acked:false, dissent:false, dissentText:'' },
  intro: { text:'', consent:false, useBadge:false, saved:false, dismissed:[], done:false },
  photo: { uploaded:false, dataUrl:null, consent:false, done:false, confirmedExisting:false, replacing:false },
  policies: { open:{}, read:{}, acked:{}, cobcVisited:false, submitted:false, hbSigned:{}, hbOpen:true },
  network: { booked:{} },
  // Questions passed from Sidekick to a person (A-72). Saved, because the
  // coordinator's Help requests queue reads them (L-13).
  sidekick: { handoffs:[], greeted:{} },
  // ---- hiring manager side ----
  hm: {
    contactConfirmed: false, workPhone: '+1 303 555 0188',
    channels: { accepted:false },
    logistics: { confirmed:false, whereToBe:'', available:true, proxy:'', teamNote:'' },
    computer: { ordered:false, model:'', reason:'' },
    software: { confirmed:false, added:[] },
    // A name is not a commitment. Both roles have to accept (M-27).
    buddy: { assigned:null, notified:false, accepted:false },
    calendar: { confirmed:false, holds:{} },
    welcome: { sent:false, body:'', personal:'', tone:'warm' },
    network: { named:{}, submitted:false },
    intro: { forwarded:false },
    card: { needed:null },            // null = unanswered, true/false = decided (L-10)
  },
});

let S = load();
function load() {
  try {
    const raw = localStorage.getItem('onbd-proto-v4');
    if (raw) {
      const d = DEFAULT_STATE(), saved = JSON.parse(raw);
      const merged = Object.assign(d, saved);
      // hm is nested two deep, so merge it branch by branch
      merged.hm = Object.assign({}, d.hm, saved.hm || {});
      Object.keys(d.hm).forEach(k => {
        if (d.hm[k] && typeof d.hm[k] === 'object' && !Array.isArray(d.hm[k]))
          merged.hm[k] = Object.assign({}, d.hm[k], (saved.hm || {})[k] || {});
      });
      return merged;
    }
  } catch (e) {}
  return DEFAULT_STATE();
}
function save() { localStorage.setItem('onbd-proto-v4', JSON.stringify(S)); }

/* ---------------- dates (A-45: two runways) ---------------- */
function startDate() { return S.horizon === '3mo' ? SIM.start3mo : SIM.start2wk; }
function startDateText() { return fmtLong(startDate()); }
function simToday() {
  // The Overdue scenario sits 3 days out, so it works on either runway.
  return S.scenario === 'overdue' ? addDays(startDate(), -3) : SIM.today;
}
function daysToStart() { return Math.round((startDate() - simToday()) / 86400000); }
function dueFor(key) { return addDays(startDate(), DUE_OFFSETS[key]); }
const isOverdue = key => simToday() > dueFor(key) && !taskDone(key);

/* ---------------- task status model (A-25) ---------------- */
function detailsStatus() { return S.details.submitted ? 'done' : 'notstarted'; }
function startdateStatus() {
  if (S.startdate.changeRequested) return 'review';
  return S.startdate.confirmed ? 'done' : 'notstarted';
}
function bgcheckStatus() { return S.bgcheck.launched ? 'done' : 'notstarted'; }
function equipmentStatus() {
  if (S.equipment.submitted) return 'done';
  return S.equipment.choice ? 'inprogress' : 'notstarted';
}
function jdStatus() { return S.jd.state; }
function introStatus() {
  const a = S.intro.done, b = photoSectionDone();
  if (a && b) return 'done';
  if (a || b || S.intro.text || S.photo.uploaded) return 'inprogress';
  return 'notstarted';
}
function photoSectionDone() {
  if (S.persona === 'conversion' && S.photo.confirmedExisting) return true;
  return S.photo.done;
}
function policiesStatus() {
  if (S.policies.submitted) return 'done';
  return Object.values(S.policies.acked).filter(Boolean).length + hbSignedCount() > 0 ? 'inprogress' : 'notstarted';
}
function hbSignedCount() { return HANDBOOKS.filter(h => (S.policies.hbSigned || {})[h.id]).length;
}
/* v4: three things before Day 1, and only three (A-64). Pre-hire was
   limited to the background check, equipment and the start date in the
   September meetings; personal details, the job description and the
   policies move after the start date, where they are not counted here. */
const COUNTED = ['startdate','bgcheck','equipment'];
function taskDone(key) {
  return ({ startdate: startdateStatus()==='done', bgcheck: bgcheckStatus()==='done',
            equipment: equipmentStatus()==='done', details: detailsStatus()==='done',
            jd: jdStatus()==='done', intro: introStatus()==='done',
            policies: policiesStatus()==='done' })[key];
}
function tasksComplete() { return COUNTED.filter(taskDone).length; }
function allComplete() { return tasksComplete() === COUNTED.length; }

const STATUS_CHIP = {
  notstarted: ['notstarted','Not started'],
  inprogress: ['inprogress','In progress'],
  done: ['done','Done'],
  review: ['review','Under review'],
};
function chip(status, overdue) {
  if (overdue && status !== 'done' && status !== 'review')
    return `<span class="chip overdue">${ic('exclamation-circle.svg','sm')}Overdue</span>`;
  const [cls, label] = STATUS_CHIP[status];
  return `<span class="chip ${cls}">${status==='done' ? ic('check.svg','sm') : ''}${label}</span>`;
}

/* ============================================================
   Landing / task list
   ============================================================ */
/* The three counted pre-Day 1 tasks, in due-date order. Shared, so the
   landing page, Sidekick and the platform's own to-do view read one list
   (A-56). v3 put the background check first because it runs longest; with
   only three, date order reads cleaner and the start date, which every
   other date hangs off, comes first. */
function taskList() {
  return [
    { key:'startdate', route:'#/startdate', icon:'calendar.svg',
      name:'Confirm your start date',
      why:'Everything else is dated from it',
      est:'1 min', estMark:'A-23', status:startdateStatus(), marker:'A-49' },
    { key:'bgcheck', route:'#/bgcheck', icon:'shield-check.svg',
      name:'Start your background check',
      why:'It runs on its own and takes a while, so the sooner it starts the better',
      est:'5 min', estMark:'A-23', status:bgcheckStatus(), marker:'A-50' },
    // Equipment, the earliest of the provisioning tasks. Nothing gates it today (A-33)
    { key:'equipment', route:'#/equipment', icon:'laptop.svg',
      name:'Choose your equipment',
      why:'Your computer and accessories, built and shipped in time for Day 1',
      est:'4 min', estMark:'A-23', status:equipmentStatus(), marker:'A-60' },
  ];
}

/* The first open task, which Sidekick and the hero both point at. */
function nextTask() { return taskList().find(t => t.status !== 'done') || null; }

/* Day 1 and the first week (A-65, A-76, A-67). Each either opens a preview
   of its screen, or explains itself in place like the coming-up cards. */
function day1Items() {
  const jp = S.country === 'JP';
  return [
    { key:'details', route:'#/details', icon:'user-circle.svg', sys:'Workday', marker:'A-65',
      name:'Your personal details, in Workday',
      why:'Address, emergency contact, bank and tax, entered once in Workday' },
    { key:'jd', route:'#/jd', icon:'file-alt.svg', sys:'Workday', marker:'A-67',
      name:'Check your job description',
      why:'You can read it now. You confirm it once you’ve started' },
    ...(jp ? [] : [{ key:'rtw2', icon:'id-card.svg', sys:'In person',
      name:'Show your right to work documents',
      why:'At orientation, to finish the check you start online',
      expl:'US law needs someone to see your documents in person within three days of your start. People Experience does it at orientation, so bring the originals you chose in the Right to Work system.' }]),
  ];
}
function week1Items() {
  return [
    { key:'policies', route:'#/policies', icon:'shield-check.svg', sys:'DocuSign', marker:'A-76',
      name:'Handbooks and notices',
      why:'One task: eight handbooks and a few notices, each signed in DocuSign' },
  ];
}

function renderLanding() {
  const done = tasksComplete();
  const all = allComplete();
  const days = daysToStart();
  const conv = S.persona === 'conversion';
  const jp = S.country === 'JP';
  const tasks = taskList();

  const booked = Object.keys(S.network.booked).length;
  const netList = namedNetwork();          // written by the manager (L-06)
  const netReady = S.hm.network.submitted && netList.length > 0;
  const photoBy = dueText(dueFor('photo'));

  return `
  <section class="scene" data-assume="A-64 A-70">
    <div class="scene-in scene-grid">
      <div>
        <div class="eyebrow">Before Day 1</div>
        <h1>${all ? `You’re ready, <span class="grad">${esc(HIRE.preferred)}</span>.`
                  : `Welcome, <span class="grad">${esc(HIRE.preferred)}</span>.`}</h1>
        <p class="lede">${all
          ? `Everything we needed before <b>${startDateText()}</b> is done. Your laptop ships and your badge gets printed
             without you, and your first-day details turn up here three days before you start.`
          : `You start as ${esc(HIRE.role)} on <b>${startDateText()}</b>. Three things to do before then, and you’re ready.
             Everything else waits until you’ve started.`} ${am('A-64')}</p>
        ${sidekickAskBar('nh')}
      </div>
      <div class="scene-stats" data-assume="A-64">
        <div class="stat"><b>${days}</b><span class="stat-l">day${days === 1 ? '' : 's'} to go</span>
          <span class="stat-s">Starts ${fmtDate(startDate())}</span></div>
        <div class="stat"><b>${done}/${tasks.length}</b><span class="stat-l">things done</span>
          <div class="three">${tasks.map(t => `<i class="${t.status === 'done' ? 'on' : ''}"></i>`).join('')}</div></div>
      </div>
    </div>
  </section>

  <div class="page">
    ${S.hm.welcome.sent ? `
    <div class="welcome-note" data-assume="L-08">
      <div class="avatar mgr">${MANAGER.initials}</div>
      <div class="wn-body">
        <div class="wn-h">A note from ${HIRE.manager}, your manager ${am('L-08')}</div>
        <div class="wn-text">${esc((S.hm.welcome.body || WELCOME_BOILERPLATE) + (S.hm.welcome.personal ? '\n\n' + S.hm.welcome.personal : ''))}</div>
      </div>
    </div>` : ''}

    ${conv ? `
    <div class="panel-note" style="max-width:820px;">${ic('info-circle.svg')} Because you’re converting from a contract role,
      some tasks are shorter. We already hold your details from your time here, so mostly you’ll be checking what we have.</div>` : ''}

    ${/* Reading first, then the high-level view, then the journey itself:
          broad to specific, so the page narrows as you go down it. */''}
    ${insideStrip()}

    ${readinessTracker('nh')}

    <div class="landing-grid">
      <div>
        <div class="section-h stack">
          <span class="eyebrow">Before Day 1 · now to ${fmtShort(addDays(startDate(), -1))}</span>
          <h2>Three things, then you’re ready</h2>
        </div>
        <div class="tcards">${tasks.map(taskCard).join('')}</div>

        <div class="section-h"><h3>Optional, if you have time</h3><span class="hint">Nothing waits on these</span></div>
        ${videoCard('pre')}
        <div class="tcards">
          <div class="tcard optional ${introStatus() === 'done' ? 'done' : ''}" data-task="#/intro" data-assume="A-68">
            <div class="tic">${ic('comment-smile.svg','lg')}</div>
            <div class="t-main">
              <div class="t-name">Add a badge photo, and say hello to your team ${am('A-68')}</div>
              <div class="t-why">Send the photo by ${photoBy} and your badge is printed and waiting on Day 1.
                Or it’s taken at reception when you arrive.</div>
              <div class="t-meta"><span class="m">${ic('clock.svg','sm')}About 5 min, optional</span></div>
            </div>
            <div class="t-side">
              ${introStatus() === 'notstarted' ? `<span class="chip waiting">Optional</span>` : chip(introStatus())}
              ${ic('arrow-right.svg','lg go')}
            </div>
          </div>

          <div class="tcard optional ${netReady?'':'pending'}" data-task="#/network" data-assume="A-43 L-06">
            <div class="tic">${ic('users-connected.svg','lg')}</div>
            <div class="t-main">
              <div class="t-name">Meet your suggested network ${am('A-43')} <span class="chip proposed">Proposed, not in the portal today</span></div>
              <div class="t-why">${netReady
                ? `${HIRE.manager} has named the people you’ll actually work with, and why each one matters`
                : `${HIRE.manager} hasn’t named anyone yet. This fills in when she does ${am('L-06')}`}</div>
              <div class="t-meta">
                <span class="m">${ic('clock.svg','sm')}No due date, optional</span>
                ${booked ? `<span class="mini-prog"><span class="bar"><i style="width:${(booked/netList.length)*100}%"></i></span>${booked} of ${netList.length} booked</span>` : ''}
              </div>
            </div>
            <div class="t-side">
              ${!netReady ? `<span class="chip waiting">Waiting on your manager</span>`
                : booked ? `<span class="chip inprogress">${booked} booked</span>` : `<span class="chip waiting">Optional</span>`}
              ${ic('arrow-right.svg','lg go')}
            </div>
          </div>
        </div>

        <div class="section-h"><h3>Also open now</h3><span class="hint">Yours, but it finishes in another system</span></div>
        <div class="ocards">
          <div class="ocard live">
            <div class="tic">${ic('id-card.svg')}</div>
            <div class="o-main">
              <div class="o-name">Right to work documents <span class="chip info">Available now</span></div>
              <div class="o-note">Proof that you’re allowed to work in the country you’re joining. You can start it now,
              and you finish it in the separate Right to Work system.</div>
            </div>
            <a class="o-go" data-ext="rtw">Open ${ic('external-link.svg','sm')}</a>
          </div>
          ${jp ? `
          <div class="ocard live" data-assume="A-46">
            <div class="tic">${ic('health.svg')}</div>
            <div class="o-main">
              <div class="o-name">Medical check ${am('A-46')} <span class="chip info">Available now</span></div>
              <div class="o-note">A pre-employment health check applies in some countries, and yours is one of them.
              What it involves and when it’s due are still being confirmed.</div>
            </div>
            <a class="o-go" data-ext="medical">Open ${ic('external-link.svg','sm')}</a>
          </div>` : ''}
        </div>

        <div class="section-h"><h3>Opens on its own before Day 1</h3><span class="hint">Nothing to do yet</span></div>
        <div class="ucards">${comingCards('pre')}</div>

        <div class="section-h stack journey-h">
          <span class="eyebrow">Day 1 · ${fmtShort(startDate())}</span>
          <h2>Your first day</h2>
          <span class="hint">About three things, most of them in person</span>
        </div>
        <div class="lcards">${day1Items().map(laterCard).join('')}${comingCards('day1')}</div>
        ${videoCard('day1')}

        <div class="section-h stack journey-h">
          <span class="eyebrow">First week</span>
          <h2>Your first week</h2>
          <span class="hint">Benefits, policies and training, spread out across the week</span>
        </div>
        <div class="lcards">${week1Items().map(laterCard).join('')}
          ${S.hm.card.needed === true ? `
            <div class="ucard" data-ucard="card" data-assume="L-10">
              <div class="u-row">
                ${ic('banking.svg')}
                <span class="u-name">${CARD_FLOW.newHireTask} ${am('L-10')}</span>
                <span class="u-open">${ic('clock.svg','sm')}${CARD_FLOW.timing}</span>
              </div>
              <div class="u-note">${HIRE.manager} has said you'll travel for work, so a corporate card is being set up for you</div>
              <div class="u-expl">You'll review the card agreement and sign it electronically on your second day,
                that timing is on purpose: after you start, not before. Once signed, the card provider sends you an application
                link directly. Nothing for you to do until then. ${am('L-10')}</div>
            </div>` : ''}
          ${comingCards('week1')}
        </div>
        <div class="overflow-line">${ic('info-circle.svg','sm')}<b>More to-dos may be assigned once you’ve started.</b></div>

        <div class="section-h"><h3>Handled by other teams</h3><span class="hint">Nothing for you to do</span><span class="hint pnote">Listed on purpose, so a reviewer can see nothing has been forgotten</span></div>
        <div class="ocards">
          <div class="ocard">
            <div class="tic">${ic('id-card.svg')}</div>
            <div class="o-main">
              <div class="o-name">Tax forms <span class="chip info">Payroll</span></div>
              <div class="o-note">Payroll sends these separately, on their own schedule. Your tax details go into Workday
              with your other personal details on your first day. ${am('A-65')}</div>
            </div>
          </div>
        </div>
      </div>

      ${landingRail()}
    </div>

    <div class="live-link" data-goto="#/todos">
      ${ic('list-tasks.svg','lg')}
      <div><b>See this list the way the current system shows it</b>
      <p>The current system splits your to-dos into stages and counts one stage at a time.</p>
      <p class="pnote">Worth comparing against the list above before either model is agreed. ${am('A-56')}</p></div>
      ${ic('arrow-right.svg','lg go')}
    </div>

  </div>`;
}

/* The coming-up cards for one part of the journey. Each explains itself in
   place rather than opening a screen, because there is nothing to do yet. */
function comingCards(when) {
  return COMING_UP.map((u, i) => u.when !== when ? '' : `
    <div class="ucard" data-ucard="${i}" ${u.id === 'firstday' ? 'data-assume="L-07"' : ''}>
      <div class="u-row">
        ${ic(u.icon)}
        <span class="u-name">${u.name}${u.marker ? am(u.marker) : ''}</span>
        ${u.id === 'firstday' && S.hm.logistics.confirmed
          ? `<span class="chip done">${ic('check.svg','sm')}Confirmed by ${HIRE.manager.split(' ')[0]}</span>` : ''}
        <span class="u-open">${ic('clock.svg','sm')}${u.opens}</span>
      </div>
      ${u.note ? `<div class="u-note">${u.note}</div>` : ''}
      <div class="u-expl">${u.expl}${u.dnote ? `<div class="pnote mt8">${u.dnote}</div>` : ''}${u.id === 'firstday' && S.hm.logistics.confirmed
        ? `<div class="mt8"><b>${HIRE.manager} has already confirmed these:</b> ${esc(S.hm.logistics.whereToBe)}${S.hm.logistics.teamNote ? '. ' + esc(S.hm.logistics.teamNote) : ''}${S.hm.logistics.available ? '' : ` She’s away on your first day; ${esc(S.hm.logistics.proxy)} will meet you instead.`} ${am('L-07')}</div>` : ''}</div>
    </div>`).join('');
}

/* A Day 1 or first-week item, drawn quieter than the three tasks: a row,
   the system it lives in, and an arrow only where it opens a read-ahead
   preview. Without a route it explains itself in place, like the
   coming-up rows beside it. */
/* An existing onboarding video (A-80): not embedded in the prototype. */
function videoCard(id) {
  const v = VIDEOS[id];
  return `
  <button class="vcard" type="button" data-video="${id}" data-assume="A-80">
    <span class="v-thumb">${ic('play.svg','lg')}</span>
    <span class="v-body">
      <span class="v-kicker">Video</span>
      <span class="v-title">${v.title} ${am('A-80')}</span>
      <span class="v-note">${v.note}</span>
    </span>
  </button>`;
}

function laterCard(t) {
  const row = `
    <div class="u-row">
      ${ic(t.icon)}
      <span class="u-name">${t.name}${t.marker ? ' ' + am(t.marker) : ''}</span>
      <span class="sys-tag sm">${t.sys}</span>
      ${t.route ? `<span class="u-go">${ic('arrow-right.svg')}</span>` : ''}
    </div>
    <div class="u-note">${t.why}</div>
    ${t.expl ? `<div class="u-expl">${t.expl}</div>` : ''}`;
  return t.route
    ? `<div class="ucard later" data-task="${t.route}" ${t.marker ? `data-assume="${t.marker}"` : ''}>${row}</div>`
    : `<div class="ucard later" data-ucard="${t.key}">${row}</div>`;
}

function taskCard(t) {
  const od = isOverdue(t.key);
  const due = dueFor(t.key);
  return `
  <div class="tcard ${t.status === 'done' ? 'done' : ''}" data-task="${t.route}" ${t.marker ? `data-assume="${t.marker}"` : ''}>
    <div class="tic">${ic(t.icon,'lg')}</div>
    <div class="t-main">
      <div class="t-name">${t.name}${t.marker ? ' '+am(t.marker) : ''}</div>
      <div class="t-why">${t.why}</div>
      <div class="t-meta">
        <span class="m ${od?'overdue':''}">${ic('calendar.svg','sm')}Due ${dueText(due)}</span>
        <span class="m">${ic('clock.svg','sm')}About ${t.est} ${t.estMark ? am(t.estMark) : ''}</span>
        ${t.prog ? `<span class="mini-prog"><span class="bar"><i style="width:${(t.prog.done/t.prog.total)*100}%"></i></span>${t.prog.done} of ${t.prog.total}</span>` : ''}
      </div>
      ${od ? `<div class="overdue-note">${ic('exclamation-circle.svg','sm')}<span>This was due ${dueText(due)}. It’s still open, and it matters for your first day.
        <b>Stuck on something?</b> <span class="help-link" data-openchat="1">Ask Sidekick, or reach Maya</span>. That’s what they’re there for.</span></div>` : ''}
    </div>
    <div class="t-side">
      ${chip(t.status, od)}
      ${ic('arrow-right.svg','lg go')}
    </div>
  </div>`;
}

/* ---------- right rail: four contacts (A-31, A-32) + reference reading ---------- */
/* `tone` carries the recruiter-to-People-Experience handoff: the concierge is
   promoted, the recruiter stays reachable but visibly stands down. */
function contactRow(p, extra='', tone='') {
  return `
  <div class="contact ${tone}">
    <div class="avatar ${p.cls}">${p.initials}</div>
    <div>
      <div class="c-name">${p.name}</div>
      <div class="c-role">${p.role}</div>
      ${extra}
      <div class="c-links">
        <a data-contact="teams">${ic('comment-lines.svg','sm')}Teams</a>
        <a data-contact="email">${ic('email.svg','sm')}Email</a>
      </div>
    </div>
  </div>`;
}

/* The buddy the manager assigned, subject to the unresolved visibility
   rule (L-01). Both branches are real states, not placeholders. */
function buddyRailBlock() {
  const B = S.hm.buddy;
  const assigned = B.assigned ? orgPerson(B.assigned) : null;
  if (!assigned) {
    return `
    <div class="contact pending" data-assume="L-01">
      <div class="avatar peer">${ic('user.svg','sm')}</div>
      <div>
        <div class="c-name">Your onboarding buddy</div>
        <div class="c-role">Not chosen yet</div>
        <div class="c-extra">Someone in your team to ask the things you’d rather not ask your manager.
        <span class="pnote">${HIRE.manager} picks them. Nobody is assigned automatically, so this stays empty
        until she does. ${am('L-01')}</span></div>
      </div>
    </div>`;
  }
  if (!buddyVisibleToNH()) {
    return `
    <div class="contact pending" data-assume="L-01">
      <div class="avatar peer">${ic('user.svg','sm')}</div>
      <div>
        <div class="c-name">Your onboarding buddy</div>
        <div class="c-role">Chosen. You’ll meet them shortly before you start</div>
        <div class="c-extra">Their details appear here 72 hours before your first day. ${am('L-01')}</div>
      </div>
    </div>`;
  }
  return contactRow(
    { name: assigned.name, role: `Your onboarding buddy, ${assigned.role}`, initials: assigned.initials, cls: 'buddy' },
    `<div class="c-extra">${assigned.tz ? `${ic('clock.svg','sm')} ${assigned.tz}<br>` : ''}Chosen by ${HIRE.manager} ${am('A-31')} ${am('L-01')}</div>`
  );
}

function landingRail() {
  return `
  <div class="rail">
    <div class="rail-card" data-assume="A-31 A-32 L-01 L-03">
      <h3>Your people</h3>
      ${contactRow(Object.assign({}, PEOPLE.manager, { phone: S.hm.contactConfirmed ? S.hm.workPhone : null }),
        `<div class="c-extra">${S.hm.contactConfirmed
            ? `${ic('check.svg','sm')} ${esc(S.hm.workPhone)}, confirmed by ${HIRE.manager.split(' ')[0]} ${am('L-03')}`
            : `${am('A-32')}`}</div>`)}
      ${buddyRailBlock()}
      ${''/* Relationship first, like the manager's row above, and short enough
             to sit on one line: every other role in this card is one line and
             hers ran to two. Her team is named by the green People Experience
             avatar and again in the note at the foot of the card. */}
      ${contactRow(Object.assign({}, PEOPLE.pex, { role:'Your onboarding coordinator' }),
        `<div class="c-extra">Your first stop before Day 1</div>`, 'primary')}
      ${contactRow(PEOPLE.recruiter, `<div class="c-extra">Handed over to ${PEOPLE.pex.name.split(' ')[0]}</div>`, 'handed')}
      <div class="rail-note">${PEOPLE.recruiter.name.split(' ')[0]} handed you over a week after your offer was signed.
      From then on ${PEOPLE.pex.name.split(' ')[0]} is your contact, and someone else from People Experience covers when she is away.</div>
    </div>

    <div class="rail-card">
      <h3>Good to know</h3>
      <ul class="res-list">
        ${/* Inside Equinix used to be listed here too. It has the strip at the
             top of the page now, so the rail entry was the same thing twice. */''}
        <li><a data-res="ninety">${ic('chevron-right.svg','sm')}Your first 90 days ${am('A-36')}</a>
          <div class="u-expl" data-resbody="ninety">
            The new hire checklist and the matching manager checklist, so you can both see what the other is meant to be doing.
            Reference only. Nothing to tick off.
            <div class="intent-note">${ic('bullhorn.svg','sm')}<span><b>Where this is headed:</b> optional tick-off items. The platform already
            already supports this: it has a Required/Optional filter and ships optional to-dos as “No due date, optional”.</span></div>
          </div></li>
        <li><a data-res="expect">${ic('chevron-right.svg','sm')}What to expect before Day 1</a>
          <div class="u-expl" data-resbody="expect">Finish the tasks above, then it goes quiet until 3 days before you start,
          when first-day details arrive. Quiet is normal here. It means nothing is stuck. More to-dos arrive once you’ve started.</div></li>
      </ul>
    </div>
  </div>`;
}

/* Everyone the MANAGER named, with their role (L-06). Keyed by person id
   now that the buddy and the rest live on one screen.
   Empty until submitted, which is what the new hire's waiting state shows. */
function namedNetwork() {
  const H = S.hm, out = [];
  const add = (id, role) => {
    const p = orgPerson(id);
    if (p) out.push(Object.assign({}, p, { meetRole: role, accepted: H[role] ? H[role].accepted : true,
      why: H.network.named[id] || '' }));
  };
  if (H.buddy.assigned) add(H.buddy.assigned, 'buddy');
  Object.keys(H.network.named || {}).forEach(id => {
    if (id !== H.buddy.assigned) add(id, 'other');
  });
  return out;
}

/* ---------- Inside Equinix carousel (A-35) ----------
   Rotating chapters at the top of the portal, plus the rail link.
   No tasks, nothing tracked. Access and reading only. */
let carouselTimer = null;
/* ============================================================
   Readiness tracker, two levels (A-52 / M-22)

   The outer stepper is the whole readiness checklist across every owner.
   Open a step and it shows its own fulfilment tracker, which is where a
   stall stays visible instead of being averaged into a percentage.
   ============================================================ */

/* How far each step has got. `at` is the stage in progress, so stages before
   it are done and `at === stages.length` means the step is finished.
   `blocked` marks a stage that cannot advance for a reason worth showing. */
function readinessState() {
  const E = S.equipment, H = S.hm, d = daysToStart();
  const out = {};

  // Equipment. Both orders have to exist before anything moves, then the
  // simulated clock walks it forward so the prototype controls can show it.
  // Both the computer and the accessories are the new hire's now (A-60), so
  // one submitted task starts the whole order rather than two people's.
  let eq = 0;
  if (E.submitted) { eq = 1; if (d <= 9) eq = 2; if (d <= 6) eq = 3; if (d <= 3) eq = 4; }
  out.equipment = { at: eq, note: E.submitted ? '' :
    (E.deviceConfirmed ? 'Computer chosen. The order goes in when the task is submitted.'
      : 'No order placed. The computer has not been chosen yet.') };

  // Applications. The persona cannot be resolved, so this one is stuck at
  // its first stage on purpose. That is the honest state today (M-04).
  out.apps = H.software.confirmed
    ? { at: 2, note: 'Confirmed by hand, because nothing could be suggested.' }
    : { at: 0, blocked: true, note: 'No persona is mapped for this role, so there is no default stack to confirm.' };

  // Workspace. Badge collection is not a stage: nothing reports it back.
  let ws = 0;
  const photoDone = S.photo.done || S.photo.confirmedExisting;
  if (photoDone) ws = 1;
  if (photoDone && H.logistics.confirmed) ws = 2;
  if (photoDone && H.logistics.confirmed && d <= 5) ws = 3;
  out.workspace = { at: ws, note: photoDone ? '' : 'Badge print needs the photo first.' };

  // People.
  let pp = 0;
  if (H.buddy.assigned) pp = 1;
  if (H.buddy.assigned && H.buddy.notified) pp = 2;
  if (pp === 2 && H.network.submitted) pp = 3;
  if (pp === 3 && H.intro.forwarded) pp = 4;
  out.people = { at: pp, note: H.buddy.assigned ? '' : 'No buddy chosen yet.' };

  // Background check, now its own top-level step. The portal can only see the
  // launch; everything after it happens in the provider's system, so the later
  // stages are walked by the simulated clock rather than claimed as known.
  let bg = 0;
  if (S.bgcheck.launched) { bg = 1; if (d <= 11) bg = 2; if (d <= 7) bg = 3; if (d <= 4) bg = 4; }
  out.bgcheck = { at: bg, note: S.bgcheck.launched ? '' : 'Not started. It runs longest, so it costs the most to leave.' };

  // Paperwork.
  let pw = 0;
  if (S.startdate.confirmed) pw = 1;
  if (pw === 1 && S.details.submitted) pw = 2;
  if (pw === 2 && S.policies.submitted) pw = 3;
  out.paperwork = { at: pw, note: S.startdate.confirmed ? '' : 'Everything else is dated from the start date.' };

  return out;
}

/* The outer stepper. `who` changes only the framing, never the facts. */
function readinessTracker(who) {
  const st = readinessState();
  const open = S.trackerOpen;
  const steps = READINESS.map(r => {
    const s = st[r.id];
    const total = r.stages.length;
    const done = s.at >= total;
    const cls = done ? 'done' : s.blocked ? 'stuck' : s.at > 0 ? 'now' : 'wait';
    return { r, s, total, done, cls };
  });
  const complete = steps.filter(x => x.done).length;
  const lineW = steps.length > 1 ? (complete / (steps.length - 1)) * 100 : 0;

  return `
  <section class="rtrack" data-assume="A-52 M-22">
    <div class="rt-head">
      <div>
        <div class="rt-title">Ready for Day 1?</div>
        <div class="rt-sub">Everything that has to be true before Day 1, whoever owns it.
          ${who === 'hm' ? 'Your tasks are only part of it.' : 'Most of this happens without you.'}
          Open a step to see where it actually is. ${am('A-52')}</div>
      </div>
      <div class="rt-count">${complete} of ${steps.length} ready</div>
    </div>

    <div class="rt-steps">
      <div class="rt-rule"></div>
      <div class="rt-rule fill" style="width:${Math.min(lineW, 100)}%"></div>
      ${steps.map((x, i) => `
        <button class="rt-step ${x.cls} ${open === x.r.id ? 'open' : ''}" data-rtstep="${x.r.id}">
          <span class="rt-dot">${x.done ? ic('check.svg','sm') : x.cls === 'stuck' ? ic('exclamation-circle.svg','sm') : ic(x.r.icon,'sm')}</span>
          <span class="rt-lbl">${x.r.label}</span>
          <span class="rt-stage">${x.done ? 'Ready' : x.cls === 'stuck' ? 'Stuck' : `${x.s.at} of ${x.total}`}</span>
        </button>`).join('')}
    </div>

    ${open ? innerTracker(steps.find(x => x.r.id === open)) : ''}
  </section>`;
}

/* The tracker inside the tracker. One step, every fulfilment stage it has,
   and the stage it is actually sitting on. */
function innerTracker(x) {
  if (!x) return '';
  const { r, s, total } = x;
  return `
  <div class="rt-inner">
    <div class="rt-in-head">
      <span class="rt-in-name">${ic(r.icon,'lg')} ${r.label}</span>
      <span class="sys-tag">${r.sys}</span>
      <span class="rt-in-owners">${r.owners}</span>
      <button class="rt-close" data-rtstep="${r.id}" aria-label="Close">${ic('times.svg','sm')}</button>
    </div>
    ${s.note ? `<div class="rt-in-note ${s.blocked ? 'stuck' : ''}">${s.blocked ? ic('exclamation-circle.svg','sm') : ic('info-circle.svg','sm')}<span>${s.note}</span></div>` : ''}
    <ol class="rt-stages">
      ${r.stages.map((g, i) => {
        const cls = i < s.at ? 'done' : i === s.at ? (s.blocked ? 'stuck' : 'now') : 'wait';
        return `
        <li class="rt-stg ${cls}">
          <span class="rt-stg-dot">${cls === 'done' ? ic('check.svg','sm') : ''}</span>
          <div>
            <div class="rt-stg-lbl">${g.label}
              ${cls === 'now' ? '<span class="rt-chip now">In progress</span>' : ''}
              ${cls === 'stuck' ? '<span class="rt-chip stuck">Cannot start</span>' : ''}
              ${i >= s.at && cls === 'wait' ? '<span class="rt-chip wait">Not yet</span>' : ''}</div>
            <div class="rt-stg-note">${g.note}</div>
          </div>
        </li>`;
      }).join('')}
    </ol>
    <div class="rt-in-foot">${ic('exclamation-triangle.svg','sm')}
      <span>The stages inside a step are only partly evidenced. The request, the routing to IT
      Procurement, the 5 to 7 day lead time and the automatic loaner come from the manager mockup.
      The rest is proposed, and the dates here move with the prototype clock. ${am('A-52')}</span></div>
  </div>`;
}

/* ---------- Inside Equinix, the narrow strip (A-35) ----------
   Was a full-width showcase that took the height of a screen and competed
   with the task list. Now one bar: the chapter headline, dots to move
   between chapters, and See more to open the full chapter underneath.
   Opening it links out to Inside Equinix itself rather than paraphrasing it.
   Siting it as a right-rail widget instead is still an open option (A-35). */
function insideStrip() {
  const i = S.carousel || 0;
  const c = INSIDE_CHAPTERS[i];
  return `
  <section class="inside-strip ${S.insideOpen ? 'open' : ''}" id="insideStrip" data-assume="A-35">
    <div class="is-bar" data-insidemore="1">
      <span class="is-num">${c.n}</span>
      <div class="is-copy">
        <div class="is-eyebrow">Inside Equinix <span class="is-ch">${c.title}</span></div>
        <div class="is-head">${c.head}</div>
      </div>
      <div class="is-dots">
        ${INSIDE_CHAPTERS.map((ch,k) => `
          <button class="is-dot ${k===i?'on':''}" data-cardot="${k}"
            title="${ch.n} ${ch.title}" aria-label="Chapter ${ch.n}, ${ch.title}"></button>`).join('')}
      </div>
      <span class="is-more">
        <span class="is-more-t">${S.insideOpen ? 'Close' : 'See more'}</span>${ic('chevron-down.svg','sm')}
      </span>
    </div>
    <div class="is-body" id="insideBody">${insideChapterBody(i)}</div>
  </section>`;
}

/* The full chapter, revealed under the bar. Repainted in place when the
   chapter changes, so moving between chapters never moves the page. */
function insideChapterBody(i) {
  const c = INSIDE_CHAPTERS[i];
  const a = CHAPTER_ART[i];
  return `
  <div class="is-inner">
    <div class="is-stage hexfield">
      <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="bg${i}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${a.g[0]}"/>
            <stop offset="55%" stop-color="${a.g[1]}"/>
            <stop offset="100%" stop-color="${a.g[0]}"/>
          </linearGradient>
          <linearGradient id="f1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity=".92"/>
            <stop offset="100%" stop-color="#85F0F8" stop-opacity=".72"/>
          </linearGradient>
        </defs>
        <rect width="400" height="260" fill="url(#bg${i})"/>
        ${a.art}
      </svg>
    </div>
    <div class="is-text">
      <p class="is-line">${c.line}</p>
      ${c.facts ? `<div class="sc-facts">${c.facts.map(f => `
        <div class="sc-fact"><b>${f[0]}</b><span>${f[1]}</span></div>`).join('')}</div>` : ''}
      ${c.list ? `<ul class="sc-list">${c.list.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}
      ${c.watch ? `<div class="sc-watch">${ic('image.svg','sm')}<span>${c.watch}</span></div>` : ''}
      <div class="is-reflect">
        <b>${ic('comment-smile.svg','sm')} Worth thinking about</b>
        <ul>${c.reflect.map(q => `<li>${q}</li>`).join('')}</ul>
        <p class="pnote">${REFLECT_NOTE} ${am('L-12')}</p>
      </div>
      <a class="is-out" data-ext="inside">Read this chapter on Inside Equinix ${ic('external-link.svg','sm')}</a>
      <p class="is-foot">Six short chapters about the company you are joining. Nothing here is a
      task and nothing is tracked. ${am('A-35')}</p>
    </div>
  </div>`;
}

/* Chapter changes repaint the strip rather than re-rendering the route,
   which is what used to throw the reader back to the top of the page. */
function paintInside() {
  const strip = $('#insideStrip');
  if (!strip) return;
  const i = S.carousel || 0, c = INSIDE_CHAPTERS[i];
  $('.is-num', strip).textContent = c.n;
  $('.is-ch', strip).textContent = c.title;
  $('.is-head', strip).textContent = c.head;
  $$('.is-dot', strip).forEach((d,k) => d.classList.toggle('on', k === i));
  const body = $('#insideBody', strip);
  if (body) body.innerHTML = insideChapterBody(i);
}

/* ============================================================
   Confirm your start date (A-49, L-11)
   ============================================================ */
function renderStartDate() {
  const D = S.startdate;
  if (D.changeRequested) {
    return `
    <div class="page">
      ${crumbs('Confirm your start date')}
      <div class="task-head"><h1>Confirm your start date</h1></div>
      <div class="review-banner" data-assume="L-11">
        ${ic('info-circle.svg','lg')}
        <div><b>Change requested ${am('L-11')}</b>
        <p>You asked to start on <b>${esc(D.requestedDate)}</b> instead. ${HIRE.manager} and ${PEOPLE.pex.name} can both see
        the request, and someone will come back to you. Until it is agreed, everything in your list keeps its current dates.</p></div>
      </div>
      <div class="task-shell">
        <div class="wiz-body">
          <div class="callout pnote">
            ${ic('exclamation-triangle.svg')}
            <div><b>Nobody has defined what happens next.</b> Who approves a change, how late one can be requested, and what
            happens to work already under way, such as an equipment order placed, a badge queued for print or calendar holds booked,
            are all unanswered. The prototype shows the request being made, not resolved. ${am('L-11')}</div>
          </div>
          <button class="btn quiet mt16" id="sdUndo">Cancel the request and keep ${startDateText()}</button>
        </div>
      </div>
    </div>`;
  }
  return `
  <div class="page">
    ${crumbs('Confirm your start date')}
    <div class="task-head" data-assume="A-49">
      <h1>Confirm your start date ${am('A-49')}</h1>
      <p class="why">Everything else in your list is dated from this one. Two seconds now saves a reshuffle later.</p>
    </div>
    <div class="task-shell">
      <div class="wiz-body">
        <div class="date-card ${D.confirmed?'ok':''}">
          ${ic('calendar.svg','xl')}
          <div>
            <div class="dc-label">Your start date, from your offer</div>
            <div class="dc-date">${startDateText()}</div>
            <div class="dc-sub">${daysToStart()} days from today</div>
          </div>
          ${D.confirmed ? `<span class="chip done">${ic('check.svg','sm')}Confirmed</span>` : ''}
        </div>

        ${D.confirmed ? `
          <div class="callout soft mt16">${ic('check-circle.svg')}
            <div>Confirmed. Your other due dates are set from this one, and you can see them on each task.</div></div>
          <button class="btn quiet mt16" id="sdReopen">Actually, I need to change it</button>
        ` : `
          <div class="mt24" style="display:flex; gap:12px; align-items:center;">
            <button class="btn primary" id="sdConfirm">Yes, that's right</button>
            <button class="btn quiet" id="sdChange">I need a different date</button>
          </div>
          <div class="dissent-box hidden" id="sdBox">
            <div class="field">
              <label>What date would work?</label>
              <input type="text" id="sdDate" placeholder="e.g. 1 September 2026" value="${esc(D.requestedDate)}">
            </div>
            <div class="field" style="max-width:none;">
              <label>Anything we should know?</label>
              <textarea rows="3" id="sdReason" placeholder="Optional. A notice period, a commitment you can't move.">${esc(D.reason)}</textarea>
              <div class="note">This goes to ${PEOPLE.pex.name} and ${HIRE.manager}. Changing your start date moves every other
              date in this list with it. ${am('L-11')}</div>
            </div>
            <div style="display:flex; gap:12px;">
              <button class="btn primary" id="sdSend" disabled>Request this date</button>
              <button class="btn quiet" id="sdCancel">Never mind</button>
            </div>
          </div>
        `}
      </div>
    </div>
  </div>`;
}

/* ============================================================
   Background check (A-50)
   ============================================================ */
function renderBgCheck() {
  const B = S.bgcheck;
  return `
  <div class="page">
    ${crumbs('Start your background check')}
    <div class="task-head" data-assume="A-50">
      <h1>Start your background check ${am('A-50')}</h1>
      <p class="why">It runs on its own once you start it, and it can take a couple of weeks. The sooner it begins, the less it can delay your start.</p>
    </div>
    <div class="task-shell">
      <div class="wiz-body">
        ${B.launched ? `
          <div class="bg-status">
            ${ic('shield-check.svg','xl')}
            <div>
              <div class="bg-state">${ic('clock.svg','sm')}Running. Nothing further from you</div>
              <p>You've handed over what the check needs. It runs with our screening provider from here, and you'll be told
              if anything is missing. ${HIRE.manager} and ${PEOPLE.pex.name} can see that it is running, but not what is in it.</p>
            </div>
          </div>
          <div class="callout soft mt16">${ic('info-circle.svg')}
            <div>What the check covers, and how long it takes, varies by country. This screen shows one path
            and does not yet show that variation. ${am('A-50')}</div></div>
          <button class="btn quiet mt16" id="bgUndo">Undo (prototype)</button>
        ` : `
          <p style="font-size:var(--t-ui); font-weight:var(--fw-book); max-width:640px; margin-bottom:16px;">
            The check itself happens with our screening provider, not here. This hands you over to them with your details
            already filled in, and brings the status back to this page.</p>
          <div class="callout">
            ${ic('external-link.svg')}
            <div><b>This opens another company's site.</b> You'll finish there and come back. The status then appears on this
            page automatically. Nothing about the check is stored in this portal.</div>
          </div>
          <button class="btn primary mt16" id="bgLaunch">${ic('external-link.svg','sm')} Start the check</button>
        `}
      </div>
    </div>
  </div>`;
}

/* ============================================================
   Personal details, in Workday (A-65)

   v3 collected all of this in the portal, banking included (A-61). The
   September meetings put it back where it belongs: Workday stays the system
   of record for anything personal, and a new starter enters the fields
   payroll needs once, in one Workday task, instead of in the portal and
   again downstream. So this screen is a signpost, drawn in full so the
   hand-off itself can be argued with.
   ============================================================ */
function renderDetails() {
  const jp = S.country === 'JP';
  const conv = S.persona === 'conversion';
  const done = S.details.submitted;
  const pre = daysToStart() > 0;
  const asked = [
    ['user.svg', 'Your legal name, and the name you go by'],
    ['globe.svg', 'Your home address'],
    ['users-friends.svg', 'One or two emergency contacts'],
    ['banking.svg', 'Bank details, so you get paid'],
    ['file-alt.svg', jp ? 'Tax and social insurance details' : 'Tax withholding'],
    ['shield-check.svg', 'Voluntary self-identification, if you choose to'],
  ];
  return `
  <div class="page">
    ${crumbs('Your personal details, in Workday')}
    <div class="task-head" data-assume="A-65">
      <div class="eyebrow">Day 1 · ${fmtShort(startDate())}</div>
      <h1>Your personal details, in Workday ${am('A-65')}</h1>
      <p class="why">${conv
        ? `You’re already in Workday from your contract, so this is a check of what’s there rather than a form to fill.`
        : `One task on your first day, in Workday, the system that keeps anything personal. You enter each thing once, and payroll, benefits and IT all read it from there.`}</p>
    </div>
    <div class="task-shell">
      <div class="wiz-body">
        <h3 class="wd-h">What Workday asks for</h3>
        <ul class="wd-list">
          ${asked.map(([i, t]) => `<li>${ic(i,'sm')}<span>${t}</span></li>`).join('')}
        </ul>
        <div class="callout soft mt16">
          ${ic('lock.svg')}
          <div><b>None of it is kept in this portal.</b> ${HIRE.manager} and People Experience see only that the task
          is done, never what you entered.</div>
        </div>
        <div class="callout pnote mt16">
          ${ic('question-circle.svg')}
          <div><b>Is Day 1 early enough?</b> Bank details on the first day have to reach the first payroll run. If they
          cannot, this becomes a Workday task before the start date, which would be a fourth thing before Day 1.
          Address is the other one to watch: a laptop shipped to someone's home needs it earlier, so equipment takes it
          from the offer instead. ${am('A-65')}</div>
        </div>
      </div>
      <div class="wiz-foot">
        <span class="saved-state">${ic(done ? 'check-circle.svg' : 'clock.svg','sm')}${done
          ? 'Done in Workday. The portal only knows that it is finished.'
          : pre ? `Opens on ${fmtLong(startDate())}. Nothing to do before then.` : 'Open now, in Workday.'}</span>
        <span class="missing"></span>
        <button class="btn primary" id="wdOpen" ${done || pre ? 'disabled' : ''}>${ic('external-link.svg','sm')} Open Workday</button>
      </div>
    </div>
  </div>`;
}

/* ============================================================
   Equipment, rebuilt from the live UAT portal
   (A-34, A-37, A-38, A-39, A-41, A-42)
   ============================================================ */
function officeAddress() { return S.country === 'JP' ? HIRE.officeAddressJP : HIRE.officeAddress; }

/* One equipment table, rendered on both sides (L-04). Whichever side you
   change it from, the other sees the same three rows and the same blocker. */
/* The live case names both people at the top of the equipment section, with
   the start date and the manager's email, before the table itself. The layout
   is kept from the live case; the wording is plain English (A-63). */
function caseParties() {
  return `
    <div class="case-top">
      <span class="case-num">Case HRC0943697</span>
      <span class="chip info">Open</span>
      <span class="case-when">Opened 21 days ago</span>
      <span class="case-when">Updated just now</span>
    </div>
    <div class="case-parties" data-assume="A-63">
      <div class="cp-side">
        <div class="cp-lbl">New hire</div>
        <div class="cp-who"><div class="avatar sm">${HIRE.initials}</div>
          <span>${HIRE.legalFirst} ${HIRE.legalLast} (${HIRE.username})</span></div>
        <div class="cp-lbl mt12">Start date</div>
        <div class="cp-val">${fmtDate(startDate())}</div>
      </div>
      <div class="cp-side">
        <div class="cp-lbl">Hiring manager</div>
        <div class="cp-who"><div class="avatar sm mgr">${MANAGER.initials}</div>
          <span>${MANAGER.name} (${MANAGER.username})</span></div>
        <div class="cp-lbl mt12">Manager’s email</div>
        <div class="cp-val">${MANAGER.email}</div>
      </div>
    </div>`;
}

function equipmentTable(forManager) {
  return `
    <div class="eq-status" data-assume="A-60 A-42 M-16 L-04 A-63">
      <div class="eqs-bar">Equipment for ${HIRE.legalFirst} ${HIRE.legalLast}</div>
      ${caseParties()}
      <div class="eqs-h">
        <span class="eqs-note">${forManager
          ? `Where each item is up to. ${am('M-16')}`
          : `Where each item is up to. ${am('A-60')}`}</span>
      </div>
      <table class="eq-table">
        <thead><tr><th>Equipment</th><th>Status</th></tr></thead>
        <tbody>
          ${equipmentRows(forManager).map(r => `
            <tr>
              <td><span class="eq-item">${ic(r.icon)} ${r.item}${r.marker ? ' '+am(r.marker) : ''}</span></td>
              <td class="eq-unblock">
                <span class="status-pill ${r.ok?'ok':''}">${r.ok ? ic('check.svg','sm') : ''}${r.status}</span>
                ${r.unblock}
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

/* Ownership is carried in the sentence, the way the live table does it,
   rather than in a separate column. The live strings themselves were
   replaced with plain ones in the plain-English pass (A-63, retiring A-54). */
function equipmentRows(forManager) {
  const E = S.equipment;
  const first = HIRE.preferred;
  // Addressed to whoever is reading (A-63): "you" for the new hire, the new
  // hire by name for the manager. The live case wrote both in the third person.
  const who = forManager ? first : 'you';
  const whoCap = forManager ? first : 'You';
  return [
    // The computer is the new hire's own pick now (A-60), so this row reports
    // their choice rather than waiting on the manager to place an order.
    { item:'Computer', icon:'laptop.svg',
      status: E.deviceConfirmed ? 'Chosen' : 'Not chosen yet', ok: E.deviceConfirmed,
      unblock: E.deviceConfirmed
        ? `${(deviceById(E.device) || DEVICE_CATALOG[0]).name}, chosen by ${who}. It’s ordered when ${who === 'you' ? 'you submit' : first + ' submits'} the order below.`
        : forManager ? `${first} hasn’t chosen yet. It’s their task, and nothing waits on you.`
        : `Choose your computer above to order it.`,
      marker:'A-60' },
    { item:'Computer accessories', icon:'desktop.svg',
      status: E.submitted ? 'Ordered' : 'Not ordered yet', ok:E.submitted,
      unblock: E.submitted
        ? `Order INC6369627, with the IT help desk. ${forManager ? 'Ordered by ' + first + '.' : ''}`
        : forManager ? `${first} orders these themselves, on their equipment task.`
        : `Choose your accessories below and submit the order.` },
    { item:'Mobile phone', icon:'mobile.svg',
      status:'Not ordered yet', ok:false,
      unblock:`${whoCap} can order one on the first day, if the role needs it.`, marker:'A-40' },
  ];
}

/* ---------- The computer, now the new hire's to pick (A-60) ----------
   Two states, both real. Most roles resolve from role and location to a
   single build: the new hire sees what they are getting and confirms it,
   with no edit, because there is nothing to decide. Some roles carry a
   genuine choice and get the full catalogue with specifications. */
function devicePicker() {
  const E = S.equipment;
  const single = S.deviceMode === 'single';
  const chosen = single ? DEVICE_CATALOG[0] : deviceById(E.device);

  const card = (d, picked, readonly) => `
    <div class="dev-card ${picked ? 'on' : ''} ${readonly ? 'fixed' : ''}"
      ${readonly ? '' : `data-device="${d.id}"`}>
      <div class="dev-art ${d.family}">${deviceArt(d.family)}</div>
      <div class="dev-body">
        <div class="dev-h">
          <div>
            <div class="dev-name">${d.name}</div>
            <div class="dev-sub">${d.sub}</div>
          </div>
          ${readonly ? '' : `<span class="dev-tick">${picked ? ic('check-circle.svg','lg') : ''}</span>`}
        </div>
        <p class="dev-fits">${d.fits}</p>
        <dl class="dev-specs">
          ${d.specs.map(([k,v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}
        </dl>
        <div class="dev-lead ${d.leadOk ? '' : 'late'}">
          ${ic(d.leadOk ? 'check-circle.svg' : 'exclamation-triangle.svg','sm')}${d.lead}
        </div>
      </div>
    </div>`;

  return `
  <div class="task-shell" data-assume="A-60">
    <div class="wiz-body">
      <div class="form-sec">
        <h3>Your computer ${am('A-60')}</h3>
        ${single ? `
          <p class="sec-note">Your role and location decide this one, so there is nothing to choose.
          Check it over and confirm.</p>
          ${card(chosen, true, true)}
          <div class="dev-confirm">
            ${E.deviceConfirmed
              ? `<span class="chip done">${ic('check.svg','sm')}Confirmed</span>
                 <span class="dev-confirm-note">Ordered when you submit this task.</span>`
              : `<button class="btn primary" id="devConfirm">This is right, confirm it</button>
                 <span class="dev-confirm-note">Not what your role needs?
                 <span class="help-link" data-openchat="1">Ask ${PEOPLE.pex.name.split(' ')[0]}</span>.</span>`}
          </div>
        ` : `
          <p class="sec-note">Your role carries a choice. Pick the one that fits how you work.
          You can change it until the order is placed.</p>
          <div class="dev-grid">${DEVICE_CATALOG.map(d => card(d, E.device === d.id, false)).join('')}</div>
          ${E.device && !deviceById(E.device).leadOk ? `
            <div class="callout mt16">${ic('exclamation-triangle.svg')}
              <div><b>This one would arrive after you start.</b> ${deviceById(E.device).lead}, against
              ${daysToStart()} days until your first day. You would be issued a loaner until it lands.</div>
            </div>` : ''}
        `}
        <p class="pnote mt12">Models and specifications here are illustrative. The approved catalogue
        sits with End User Technology and has not been supplied. ${am('A-60')}</p>
      </div>
    </div>
  </div>`;
}

function renderEquipment() {
  const E = S.equipment;
  if (E.submitted) return equipmentSubmitted();

  const needsShipping = !!E.choice;
  const shipHome = E.shipOffice === 'no';

  return `
  <div class="page">
    ${crumbs('Choose your equipment')}
    <div class="task-head" data-assume="A-33 A-34 A-60">
      <h1>Choose your equipment ${am('A-60')}</h1>
      <p class="why">Early on your list, so there’s time to build it, ship it and have it waiting for you. ${am('A-33')}
      Your computer and your accessories are both yours to pick. A phone is a Day 1 choice if your role needs one.</p>
    </div>

    ${devicePicker()}

    ${equipmentTable(false)}

    <div class="task-shell mt24">
      <div class="wiz-body">
        <div class="form-sec" data-assume="A-37 A-39">
          <h3>Accessories for working from home</h3>
          <div class="callout soft">
            ${ic('info-circle.svg')}
            <div><b>These are for your at-home workspace.</b> You have the option of an Equinix-approved headset, or
            that headset plus additional equipment such as a camera, speakerphone, monitor, keyboard and mouse.
            Your in-office workspace will already be supplied with monitor(s), keyboard and mouse. ${am('A-37')}</div>
          </div>

          <div class="field mt16">
            <label>Select accessories <span class="req">required</span></label>
            <select id="eqChoice">
              <option value="" ${!E.choice?'selected':''}>Choose one</option>
              <option value="headset" ${E.choice==='headset'?'selected':''}>Headset only</option>
              <option value="more" ${E.choice==='more'?'selected':''}>Headset and other accessories</option>
            </select>
            <div class="note">Two options, and neither of them is “no thank you”. The headset comes either way. ${am('A-39')}</div>
          </div>

          ${E.choice === 'more' ? `
            <div class="callout soft">
              ${ic('check-circle.svg')}
              <div>You will receive our standard <b>Zoom-optimized headset</b> in addition to the boxes you check below. ${am('A-39')}</div>
            </div>
            <div class="acc-grid">
              ${ACCESSORY_OPTIONS.map(o => `
                <label class="check acc">
                  <input type="checkbox" data-acc="${o.id}" ${E.items[o.id]?'checked':''}>
                  <span>${o.label}</span>
                </label>`).join('')}
            </div>` : ''}

          ${E.choice === 'headset' ? `
            <div class="callout soft">
              ${ic('check-circle.svg')}
              <div>You will receive our standard <b>Zoom-optimized headset</b>. ${am('A-39')}</div>
            </div>` : ''}



          <div class="adjust-link">
            ${ic('users-friends.svg')}
            <div>
              <b>Need something different?</b> If an adjustment would help you work comfortably, tell
              ${PEOPLE.pex.name.split(' ')[0]} privately, by <a data-contact="email">email</a> or <a data-contact="teams">Teams</a>.
              Asking changes nothing about your role.
            </div>
          </div>
        </div>

        ${needsShipping ? `
        <div class="form-sec" data-assume="A-38">
          <h3>Where should it go? ${am('A-38')}</h3>
          <div class="office-card">
            ${ic('portal-window.svg','lg')}
            <div>
              <div class="oc-label">Your office, from your role and location</div>
              <div class="oc-addr">${officeAddress()}</div>
            </div>
          </div>
          <div class="field mt16">
            <label>Ship to the office address?</label>
            <div class="radio-row col">
              <label><input type="radio" name="shipOffice" data-ship="yes" ${E.shipOffice==='yes'?'checked':''}>Yes, ship to the address above</label>
              <label><input type="radio" name="shipOffice" data-ship="no" ${E.shipOffice==='no'?'checked':''}>No, ship to me directly</label>
            </div>
          </div>

          ${shipHome ? `
            <div class="gcard" data-assume="A-65">
              <h4>Ship to me at</h4>
              <div class="gbody">
                <div class="home-addr">${S.country === 'JP' ? HIRE.homeAddressJP : HIRE.homeAddress}</div>
                <div class="note">The home address on your offer. Moved since then? Tell ${PEOPLE.pex.name.split(' ')[0]}, and it’s
                corrected in Workday before anything ships. ${am('A-65')}</div>
              </div>
            </div>` : ''}

          <div class="field" style="max-width:340px;">
            <label>Phone number for the courier</label>
            <input type="tel" id="shipPhone" value="${esc(E.shipPhone)}" placeholder="e.g. +1 303 555 0117">
            <div class="note">Include the country code. The courier needs it and the order won’t go through without it.</div>
          </div>
        </div>` : ''}
      </div>
      <div class="wiz-foot">
        <span class="saved-state">${ic('save.svg','sm')}Your choices save as you make them</span>
        <span class="missing" id="eqMissing">${eqMissingText()}</span>
        <button class="btn primary" id="eqSubmit" ${eqReady()?'':'disabled'}>Submit my order</button>
      </div>
    </div>
  </div>`;
}

function eqReady() {
  const E = S.equipment;
  if (!E.choice) return false;
  if (!E.shipOffice) return false;
  if (E.shipPhone.replace(/\D/g,'').length < 7) return false;
  return true;
}
function eqMissingText() {
  const E = S.equipment;
  if (!E.choice) return 'Choose what you need to continue.';
  const missing = [];
  if (!E.shipOffice) missing.push('a delivery address');
  if (E.shipPhone.replace(/\D/g,'').length < 7) missing.push('a phone number for the courier');
  return missing.length ? `Still needed: ${missing.join(', ')}.` : 'Everything needed is filled in.';
}

function equipmentSubmitted() {
  const E = S.equipment;
  const picked = ['Standard Zoom-optimized headset (automatic)']
    .concat(E.choice === 'more' ? ACCESSORY_OPTIONS.filter(o => E.items[o.id]).map(o => o.label) : []);

  return `
  <div class="page">
    ${crumbs('Choose your equipment')}
    <div class="task-head">
      <h1>Your equipment order</h1>
      <p class="why">Submitted. Here’s where it went and how to change it.</p>
    </div>

    ${equipmentTable(false)}

    ${incidentCard(picked)}

    <div class="mt24"><button class="btn primary" data-goto="#/">Back to your tasks</button></div>
  </div>`;
}

/* The incident as it actually appears in the live portal: a header carrying
   the number, state, requester and urgency, then three tabs. Drawn from the
   UAT screens so the team can see today's behaviour, including the parts
   that are awkward (A-42, A-54, A-55). */
function incidentCard(picked) {
  const E = S.equipment;
  const tab = S.incTab || 'activity';
  const choiceLabel = E.choice === 'headset' ? 'Headset only' : 'Headset and other accessories';

  return `
  <div class="inc-card mt24" data-assume="A-42 A-63 A-55">
    <div class="inc-h">
      <div class="inc-num">INC6369627 ${am('A-42')}</div>
      <span class="chip inprogress">New</span>
      <span class="inc-team">Created just now</span>
    </div>

    <div class="inc-meta">
      <div><div class="inc-lbl">Requested by</div>
        <div class="inc-who"><div class="avatar sm">${HIRE.initials}</div>
          <span>${HIRE.legalFirst} ${HIRE.legalLast} (${HIRE.username})</span></div></div>
      <div><div class="inc-lbl">Urgency</div>
        <div class="inc-val urg">3 - Low ${am('A-55')}</div></div>
      <div><div class="inc-lbl">Assignment group</div>
        <div class="inc-val">Global Helpdesk Tier 2</div></div>
    </div>

    <div class="inc-tabs">
      <button class="inc-tab ${tab==='activity'?'on':''}" data-inctab="activity">Activity</button>
      <button class="inc-tab ${tab==='attachments'?'on':''}" data-inctab="attachments">Attachments</button>
      <button class="inc-tab ${tab==='summary'?'on':''}" data-inctab="summary">Summary</button>
    </div>

    <div class="inc-body">
      ${tab === 'activity' ? `
        <div class="inc-lbl">Additional comments</div>
        <div class="inc-add">
          <input type="text" id="incComment" placeholder="Type your message here…">
          <button class="btn primary sm" id="incSend">Post</button>
        </div>
        <div class="inc-feed">
          ${E.comments.slice().reverse().map(c => `
            <div class="inc-ev">
              <div class="avatar sm">${HIRE.initials}</div>
              <div class="ev-body"><div class="ev-name">${HIRE.legalFirst} ${HIRE.legalLast}</div>
                <div class="ev-text">${esc(c)}</div></div>
              <span class="ev-when">${ic('clock.svg','sm')}just now</span>
            </div>`).join('')}
          <div class="inc-ev">
            <div class="avatar sm">${HIRE.initials}</div>
            <div class="ev-body"><div class="ev-name">${HIRE.legalFirst} ${HIRE.legalLast}</div>
              <div class="ev-file">Accessories Details.csv</div><div class="ev-size">782 B</div></div>
            <span class="ev-when">${ic('clock.svg','sm')}just now</span>
          </div>
          <div class="inc-ev">
            <div class="avatar sm">${HIRE.initials}</div>
            <div class="ev-body"><div class="ev-name">${HIRE.legalFirst} ${HIRE.legalLast}</div>
              <div class="ev-text">INC6369627 Created</div></div>
            <span class="ev-when">${ic('clock.svg','sm')}just now</span>
          </div>
        </div>
        <div class="callout soft mt16">
          ${ic('exclamation-triangle.svg')}
          <div><b>This is how people amend orders today</b>, by typing into the ticket after submitting.
          It works, but nobody designed it. A proper “change my order” path would beat a comment thread. ${am('A-42')}</div>
        </div>
        <button class="btn secondary mt16" id="eqChange">Change my order</button>`
      : tab === 'attachments' ? `
        <div class="inc-lbl">Attachments</div>
        <div class="attach">${ic('file-alt.svg','sm')}<b>Accessories Details.csv</b> <span>782 B</span></div>
        <p class="inc-note">The whole order travels as one CSV on the ticket. Nothing in the portal reads it back,
        so a change has to be made by a person at the other end. ${am('A-42')}</p>`
      : `
        <div class="inc-lbl">Summary</div>
        <dl class="inc-summary">
          <dt>HR task SysID</dt><dd class="mono">443ab46133968f981b4ee642cd5c7bf9</dd>
          <dt>Requested For</dt><dd>${HIRE.legalFirst} ${HIRE.legalLast} (${HIRE.username})</dd>
          <dt>Select accessories</dt><dd>${choiceLabel}</dd>
          ${ACCESSORY_OPTIONS.map(o => `
            <dt>${o.label}</dt><dd class="raw">${E.items[o.id] ? 'true' : 'false'}</dd>`).join('')}
          <dt>Ship to the office address?</dt><dd class="raw">${E.shipOffice === 'yes' ? 'true' : 'false'}</dd>
        </dl>
        <div class="callout soft mt16">
          ${ic('exclamation-triangle.svg')}
          <div><b>This tab shows the stored record, not a summary a person would write.</b>
          Checkboxes read as <span class="mono">true</span> and <span class="mono">false</span>, the system ID is on
          display, and the accessories choice is stored as a sentence. Readable by someone who knows the form,
          confusing to someone checking their own order. ${am('A-55')}</div>
        </div>`}
    </div>
  </div>`;
}

/* ============================================================
   Suggested team network (A-43)
   ============================================================ */
/* Slots sit in the week after the start date, so they stay plausible
   on both the two-week and three-month runways (A-45). */
const SLOT_TIMES = ['10:00', '14:30', '09:00'];
function slotsFor(id) {
  const i = ORG_PEOPLE.findIndex(p => p.id === id);
  return SLOT_TIMES.map((t, j) => {
    const d = addDays(startDate(), 5 + Math.max(i, 0) + j * 2);
    return `${d.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })}, ${t}`;
  });
}

function renderNetwork() {
  const booked = S.network.booked;
  const list = namedNetwork();

  // Nothing to show until the manager has named people (L-06).
  if (!S.hm.network.submitted || !list.length) {
    return `
    <div class="page">
      ${crumbs('Your suggested network')}
      <div class="task-head" data-assume="A-43 L-06">
        <h1>Your suggested network ${am('A-43')}</h1>
      </div>
      <div class="waiting-panel">
        ${ic('users-connected.svg','xl')}
        <div>
          <h2>${HIRE.manager} hasn’t named anyone yet</h2>
          <p>This fills in when your manager picks the people you’ll work with most, the ones outside your own team,
          and writes a line about why each of them matters. You’ll get their names, her reasons, and times you can book.</p>
          <p class="wp-note">${ic('info-circle.svg','sm')} Nothing is waiting on you. This is here so you know it’s coming,
          not so you have to ask about it. ${am('L-06')}</p>
        </div>
      </div>
    </div>`;
  }

  return `
  <div class="page">
    ${crumbs('Your suggested network')}
    <div class="task-head" data-assume="A-43">
      <h1>Your suggested network ${am('A-43')}</h1>
      <p class="why">${HIRE.manager} has named the people you’ll actually work with, chosen for your role rather than your reporting line.
      Each of them knows you’re starting and knows why they’re on your list.</p>
    </div>

    <div class="proposed-banner">
      ${ic('exclamation-triangle.svg','lg')}
      <div>
        <b>Proposed. This does not exist in the portal today.</b>
        <p>It needs a new manager task, a notification to each named person, and a booking integration. It may also belong on
        Day 1 rather than before you start. Shown here so the shape can be argued before any of that is built. ${am('A-43')}</p>
      </div>
    </div>

    <div class="net-grid">
      <div>
        <div class="section-h"><h2>${list.length} ${list.length===1?'person':'people'}, and why</h2><span class="hint">Optional. Book what’s useful, ignore the rest</span></div>
        <div class="net-cards">
          ${list.map((p,i) => `
            <div class="net-card ${booked[p.id]?'booked':''}">
              <div class="nc-top">
                <div class="avatar lg ${p.meetRole === 'buddy' ? 'buddy' : 'peer'}">${p.initials}</div>
                <div class="nc-id">
                  <div class="nc-name">${p.name} <span class="role-tag ${p.meetRole}">${PEOPLE_ROLES[p.meetRole].label}</span></div>
                  <div class="nc-role">${p.role}, ${p.dept}</div>
                </div>
                ${booked[p.id] ? `<span class="chip done">${ic('check.svg','sm')}${esc(booked[p.id])}</span>` : `<span class="chip waiting">Not booked</span>`}
              </div>
              ${p.why ? `<div class="nc-why">
                <div class="ncw-h">${ic('comment-lines.svg','sm')} Why ${HIRE.manager.split(' ')[0]} picked them</div>
                ${esc(p.why)}
              </div>` : ''}
              ${p.meetRole !== 'other' && !p.accepted
                ? `<div class="nc-slots"><span class="ncs-lbl">${p.name.split(' ')[0]} has been asked and has not accepted yet, so there is nothing to book.</span></div>`
                : booked[p.id]
                ? `<div class="nc-slots"><button class="btn quiet sm" data-unbook="${p.id}">Cancel this 1:1</button></div>`
                : `<div class="nc-slots">
                    <span class="ncs-lbl">Suggested times:</span>
                    ${slotsFor(p.id).map(x => `<button class="slot-btn" data-book="${p.id}" data-slot="${esc(x)}">${x}</button>`).join('')}
                  </div>`}
            </div>`).join('')}
        </div>
      </div>

      <div class="rail">
        <div class="rail-card">
          <h3>What this is, and what it isn’t</h3>
          <div class="distinct">
            <div class="dist-row">
              <div class="dr-h">${ic('users-connected.svg','sm')} Your network</div>
              <p>Several people, across other teams, for the <b>job itself</b>. Chosen by your manager for your role.</p>
            </div>
            <div class="dist-row">
              <div class="dr-h">${ic('user-circle.svg','sm')} Your buddy</div>
              <p>One person on your team, for <b>culture and logistics</b>. The questions you would rather not ask your manager.</p>
            </div>
            <div class="dist-row">
              <div class="dr-h">${ic('users-three.svg','sm')} Your team</div>
              <p>Your reporting line is on <a data-goto="#/jd">your job description</a>. <b>This list is not that</b>.
              <span class="pnote">Deliberately so: rendering it as a hierarchy would mislead.</span></p>
            </div>
          </div>
        </div>
        <div class="rail-card">
          <h3>What happened behind this</h3>
          <ol class="mech-list">
            <li>${HIRE.manager} named a <b>buddy</b> and anyone else worth meeting early.</li>
            <li>Where she wrote a reason, it is on the card. She knows you can see it.</li>
            <li>Each of them was <b>asked</b>, not told, and had to accept. ${am('M-27')}</li>
            <li>You get the list, the reasons, and times you can book.</li>
          </ol>
          <div class="rail-note">The problem this is meant to solve, in the platform owner’s words:
          <i>“I don’t even know what I’m supposed to be doing, or who I’m supposed to reach out to.”</i></div>
        </div>
      </div>
    </div>
  </div>`;
}

/* ============================================================
   Job description
   ============================================================ */
function renderJD() {
  const jd = S.jd;
  const done = jd.state === 'done';
  const review = jd.state === 'review';
  return `
  <div class="page">
    ${crumbs('Check your job description')}
    <div class="task-head" data-assume="A-67">
      <div class="eyebrow">Day 1 · ${fmtShort(startDate())}</div>
      <h1>Check your job description ${am('A-67')}</h1>
      <p class="why">You confirm it on your first day. You can read it now, and if anything looks different from your
      conversations, say so now rather than waiting.</p>
    </div>

    ${review ? `
    <div class="review-banner" data-assume="A-27">
      ${ic('info-circle.svg','lg')}
      <div><b>Under review ${am('A-27')}</b>
      <p>You told us something doesn’t match. Recruiting has your note and someone will be in touch within 2 working days.
      This task stays open, and there’s nothing else for you to do on it right now.</p></div>
    </div>` : ''}
    ${done ? `
    <div class="review-banner ok">
      ${ic('check-circle.svg','lg')}
      <div><b>Confirmed</b><p>You confirmed this reflects the role you accepted. It stays here for reference.</p></div>
    </div>` : ''}

    <div class="jd-grid">
      <div>
        <div class="rail-card role-card" style="margin-bottom:18px;" data-assume="A-12">
          <h3 style="display:flex; align-items:center; gap:10px;">Role summary <span class="src-tag">${ic('portal-window.svg','sm')}From the official record</span></h3>
          <dl class="kv">
            <dt>Job title</dt><dd>${HIRE.role}</dd>
            <dt>Department</dt><dd>${HIRE.dept}</dd>
            <dt>Reports to</dt><dd>${HIRE.manager}</dd>
            <dt>Location &amp; arrangement</dt><dd>${HIRE.location}, ${HIRE.arrangement}</dd>
            <dt>Employment type</dt><dd>${HIRE.employmentType}</dd>
            <dt>Start date</dt><dd>${startDateText()}</dd>
          </dl>
          <div class="comp-line">${ic('lock.svg','sm')}Your compensation details are in your signed offer letter. ${am('A-12')}</div>
        </div>

        <div class="rail-card" style="margin-bottom:18px;" data-assume="A-13 A-24">
          <h3 style="display:flex; align-items:center; gap:10px;">The job description ${am('A-13')}</h3>
          <p style="font-size:var(--t-meta); margin:4px 0 12px;">Placeholder content, marked as such. The real text comes from the official record.</p>
          <div class="jd-doc" id="jdDoc">${JD_TEXT}</div>
          <div class="scroll-hint ${jd.scrolled?'ok':''}" id="scrollHint">
            ${jd.scrolled ? ic('check.svg','sm')+'Read to the end, so you can confirm below.' : ic('chevron-down.svg','sm')+'Scroll to the end to unlock the confirmation. '+am('A-24')}
          </div>
          <div class="mt16">
            <span class="internal-link" data-ext="workday">${ic('portal-window.svg')}View in Workday <small>another Equinix system, same sign-in</small></span>
          </div>
        </div>

        ${!done && !review ? `
        <div class="rail-card">
          <label class="check ${jd.scrolled && daysToStart() <= 0 ? '' : 'disabled'}">
            <input type="checkbox" id="jdAck" ${jd.scrolled && daysToStart() <= 0 ? '' : 'disabled'} ${jd.acked?'checked':''}>
            <span>I’ve read my job description and confirm it reflects the role I accepted.</span>
          </label>
          ${daysToStart() > 0 ? `<div class="note mt8">${ic('clock.svg','sm')} Confirming opens on ${fmtLong(startDate())}.</div>` : ''}
          <div class="mt16" style="display:flex; gap:14px; align-items:center;">
            <button class="btn primary" id="jdConfirm" ${jd.acked?'':'disabled'}>Confirm my role</button>
            <button class="btn quiet" id="jdDissent">This doesn’t match what I agreed</button>
          </div>
          <div class="dissent-box hidden" id="dissentBox">
            <div class="field" style="max-width:none;">
              <label>Tell us what’s different</label>
              <textarea rows="4" id="dissentText" placeholder="What did you agree that you’re not seeing here?">${esc(jd.dissentText)}</textarea>
              <div class="note">This goes to Recruiting with your name on it, and they’ll come back to you directly.</div>
            </div>
            <div style="display:flex; gap:12px;">
              <button class="btn primary" id="dissentSend" disabled>Send to recruiting</button>
              <button class="btn quiet" id="dissentCancel">Never mind, back to confirming</button>
            </div>
          </div>
        </div>` : ''}
      </div>

      <div class="rail">
        <div class="rail-card" data-assume="A-13">
          <h3>Your team ${am('A-13')}</h3>
          <div class="team-view">
            <div class="tnode"><div class="avatar sm mgr">${HIRE.managerInitials}</div>
              <div><div class="tn-name">${HIRE.manager}</div><div class="tn-role">Your manager, Director of FP&amp;A</div></div></div>
            <div class="tline"></div>
            <div class="tnode you"><div class="avatar sm">${HIRE.initials}</div>
              <div><div class="tn-name">${HIRE.legalFirst} ${HIRE.legalLast}, you</div><div class="tn-role">${HIRE.role}</div></div></div>
            <div class="tline"></div>
            <div class="peer-row">
              ${PEOPLE.peers.map(p => `
                <div class="tnode"><div class="avatar sm peer">${p.initials}</div>
                <div><div class="tn-name">${p.name}</div><div class="tn-role">${p.role}</div></div></div>`).join('')}
            </div>
          </div>
          <div class="rail-note">This is your reporting line. The people you’ll work with <i>outside</i> it are on
          <a data-goto="#/network">your suggested network</a>.</div>
        </div>
      </div>
    </div>
  </div>`;
}

/* ============================================================
   Introduce yourself & badge photo
   ============================================================ */
const CHIP_SCAFFOLDS = [
  { id:'from', label:'Where you’re from', text:'I’m originally from … and these days I’m based in …' },
  { id:'work', label:'What you’ll be working on', text:'I’ll be joining the FP&A team to work on …' },
  { id:'outside', label:'Something you do outside work', text:'Outside work you’ll usually find me …' },
];

function renderIntro() {
  const conv = S.persona === 'conversion';
  const introDone = S.intro.done;
  const photoDone = photoSectionDone();
  return `
  <div class="page">
    ${crumbs('A badge photo, and a hello')}
    <div class="task-head" data-assume="A-16 A-68">
      <div class="eyebrow">Optional · before Day 1</div>
      <h1>Add a badge photo, and say hello to your team ${am('A-68')}</h1>
      <p class="why">Both optional, and nothing waits on either. The photo gets your badge printed before you arrive;
      the hello lets ${HIRE.manager.split(' ')[0]} introduce you to the team in your own words. ${am('A-16')}</p>
    </div>
    <div class="two-sec">

      <div class="sec-card" data-assume="A-14 A-15">
        <div class="sec-top">
          <h2>Introduce yourself</h2>
          ${introDone ? chip('done') : (S.intro.text ? chip('inprogress') : `<span class="chip waiting">Optional</span>`)}
        </div>
        <div class="due-line">${ic('clock.svg','sm')}Optional, no due date ${am('A-68')}</div>
        <p style="font-size:var(--t-sm); font-weight:var(--fw-book); margin-bottom:12px;">${HIRE.manager} will share this with the team before you start,
        so nobody has to write a “please welcome…” post from scratch and you get to describe yourself in your own words.</p>

        <div class="field" style="max-width:none;">
          <textarea rows="5" id="introText" maxlength="500" placeholder="A few lines is plenty…">${esc(S.intro.text)}</textarea>
          <div class="char-count" id="charCount">${S.intro.text.length} / 500 ${am('A-15')}</div>
        </div>
        <div class="chips-row" id="chipsRow">
          ${CHIP_SCAFFOLDS.filter(c => !S.intro.dismissed.includes(c.id)).map(c => `
            <button class="p-chip" data-chip="${c.id}">${c.label}<span class="x" data-chipx="${c.id}" title="Dismiss">${ic('times.svg','sm')}</span></button>`).join('')}
          ${CHIP_SCAFFOLDS.some(c => !S.intro.dismissed.includes(c.id)) ? am('A-15') : ''}
        </div>

        <div class="preview-panel">
          <div class="pv-h">How ${HIRE.manager.split(' ')[0]} will see it when she forwards it</div>
          <div class="pv-msg">
            ${S.intro.useBadge && S.photo.dataUrl
              ? `<img src="${S.photo.dataUrl}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex:none;">`
              : `<div class="avatar sm">${HIRE.initials}</div>`}
            <div class="pv-body">
              <div class="pv-name">${HIRE.legalFirst} ${HIRE.legalLast}</div>
              <div class="pv-sub">${HIRE.role}, starts ${dueText(startDate())}</div>
              <div class="pv-text" id="pvText">${S.intro.text ? esc(S.intro.text) : '<span class="pv-empty">Your introduction appears here as you write it.</span>'}</div>
            </div>
          </div>
        </div>

        <div class="share-model" data-assume="A-14">
          ${ic('info-circle.svg')}
          <span><b>How sharing works:</b> ${HIRE.manager} receives this and chooses when to share it with the team.
          It is never posted automatically. ${am('A-14')}</span>
        </div>

        <label class="check mt16">
          <input type="checkbox" id="introConsent" ${S.intro.consent?'checked':''}>
          <span>I’m happy for my manager to share this with my new team.</span>
        </label>
        ${(S.photo.dataUrl || (conv && S.photo.confirmedExisting)) ? `
        <label class="check mt8">
          <input type="checkbox" id="useBadge" ${S.intro.useBadge?'checked':''}>
          <span>Use my badge photo with this introduction.</span>
        </label>` : ''}

        <div class="mt16" style="display:flex; gap:12px; align-items:center;">
          <button class="btn primary" id="saveIntro" ${S.intro.text.trim()?'':'disabled'}>${introDone?'Update introduction':'Save introduction'}</button>
          ${S.intro.saved && !S.intro.consent ? `<span style="font-size:var(--t-meta); color:var(--carbon);">Saved. It won’t be shared until you tick the consent box.</span>` : ''}
        </div>
      </div>

      <div class="sec-card" data-assume="A-17 A-18">
        <div class="sec-top">
          <h2>Photo for your badge</h2>
          ${photoDone ? chip('done') : (S.photo.uploaded ? chip('inprogress') : chip('notstarted'))}
        </div>
        <div class="due-line">${ic('calendar.svg','sm')}Optional. Send it by <b>${dueText(dueFor('photo'))}</b> and your badge is printed before Day 1. Otherwise it’s taken at reception when you arrive.</div>
        <p style="font-size:var(--t-sm); font-weight:var(--fw-book); margin-bottom:14px;">Send it now and your badge is printed and waiting for you on Day 1.</p>

        ${conv && !S.photo.replacing ? convPhotoBlock() : uploadBlock()}

        <div class="divider"></div>
        <div class="req-list" data-assume="A-17">
          <b>Requirements:</b> ${am('A-17')} JPG or PNG, under 5MB, at least 600 by 600 pixels<br>
          <b>Guidelines:</b> ${am('A-17')} plain light background, face the camera with both eyes visible, no hats or sunglasses, taken within the last six months<br>
          <em style="color:var(--ink-faint)">Placeholder values. The real badge specification comes from the workplace team.</em>
        </div>

        ${(!conv || S.photo.replacing) ? `
        <label class="check mt16 ${S.photo.uploaded?'':'disabled'}" data-assume="A-18">
          <input type="checkbox" id="photoConsent" ${S.photo.uploaded?'':'disabled'} ${S.photo.consent?'checked':''}>
          <span>I’m OK with this photo being used for my building access badge, the internal employee directory, and my Teams profile. ${am('A-18')}</span>
        </label>
        <div class="mt16">
          <button class="btn primary" id="submitPhoto" ${S.photo.uploaded && S.photo.consent ? '' : 'disabled'}>${S.photo.done ? ic('check.svg','sm')+' Photo submitted' : 'Submit photo'}</button>
        </div>` : ''}
      </div>
    </div>
  </div>`;
}

function uploadBlock() {
  if (S.photo.uploaded) {
    return `
    <div class="photo-preview">
      <div class="photo-frame">
        <img src="${S.photo.dataUrl}" alt="Your photo">
        <div class="crop-guide"></div><div class="crop-ring"></div>
      </div>
      <div>
        <p style="font-size:var(--t-sm); font-weight:var(--fw-book); margin-bottom:4px;">The circle shows the badge crop, so your face should fill it.</p>
        ${S.photo.done ? `<span class="verified">${ic('check.svg','sm')}Submitted. Your badge will be ready on Day 1</span>` : ''}
        <div class="mt8"><button class="btn secondary sm" id="rechoose">Choose a different photo</button></div>
      </div>
    </div>`;
  }
  return `
    <div class="dropzone" id="dropzone">
      ${ic('image.svg','xl')}<br>
      Drag a photo here, or <b>browse your files</b>
      <input type="file" id="fileInput" accept="image/jpeg,image/png" style="display:none;">
    </div>`;
}

function convPhotoBlock() {
  return `
    <div class="onfile">
      <div class="photo-frame">
        ${S.photo.dataUrl
          ? `<img src="${S.photo.dataUrl}" alt="Photo on file"><div class="crop-guide"></div><div class="crop-ring"></div>`
          : `<div class="onfile-sil">${ic('user.svg','xl')}</div>`}
      </div>
      <div>
        <p style="font-size:var(--t-sm); font-weight:var(--fw-book); margin-bottom:6px;"><b>We already have this photo from your time here.</b><br>
        If it still looks like you, you’re done in one click.</p>
        ${S.photo.confirmedExisting
          ? `<span class="verified">${ic('check.svg','sm')}Confirmed. Same photo, same badge</span>`
          : `<div style="display:flex; gap:10px;">
              <button class="btn primary sm" id="confirmExisting">Confirm, still me</button>
              <button class="btn secondary sm" id="replacePhoto">Replace this photo</button>
            </div>`}
      </div>
    </div>`;
}

/* ============================================================
   Policies & privacy notices
   ============================================================ */
function renderPolicies() {
  const P = S.policies;
  const jp = S.country === 'JP';
  const acked = Object.values(P.acked).filter(Boolean).length + hbSignedCount();
  const total = DOCS.length + HANDBOOKS.length;
  const ro = P.submitted && P._viewing;

  if (P.submitted && !ro) {
    return `
    <div class="page">
      ${crumbs('Handbooks and notices')}
      <div class="task-shell">
        <div class="confirm-panel">
          <div class="big-check">${ic('check.svg','xl')}</div>
          <h2>All ${total} acknowledged. This task is closed.</h2>
          <p>Each one was signed in DocuSign, which keeps the date and time, the document version and the language you read it in.
          The documents stay available here whenever you want them.</p>
          <button class="btn secondary" data-reopen="policies">Reopen the documents</button>
          <button class="btn primary" data-goto="#/">Back to your tasks</button>
        </div>
      </div>
    </div>`;
  }

  return `
  <div class="page">
    ${crumbs('Handbooks and notices')}
    <div class="task-head" data-assume="A-76">
      <div class="eyebrow">First week</div>
      <h1>Handbooks and notices ${am('A-76')}</h1>
      <p class="why">One task in your first week: eight handbooks and a few notices, each signed in DocuSign. About 20 minutes, ${am('A-23')}
      and you can stop any time. ${polOpen() ? '' : `You can read ahead now. Signing opens on ${fmtLong(startDate())}.`}</p>
    </div>
    <div class="pol-head">
      <div class="prog-count">
        <div class="nums" style="color:var(--eq-dark-blue)"><span>${acked} of ${total} signed</span></div>
        <div class="prog-bar" style="background:var(--cloud)"><i style="width:${(acked/total)*100}%"></i></div>
      </div>
      <span class="chip info">${ic('globe.svg','sm')}In ${docLanguage()}, the language for your country of hire ${am('A-03')}</span>
      ${jp ? `<span class="chip info">${ic('flag.svg','sm')}Japan, so your list includes a Japan supplement</span>` : ''}
    </div>

    ${handbookCard(jp)}
    <div class="section-h"><h2>Notices</h2><span class="hint">${DOCS.length} to read and sign</span></div>
    <div class="doc-list">${DOCS.map(d => docCard(d, jp)).join('')}</div>

    <div class="read-group">
      <div class="section-h"><h2>Also here for you, nothing to sign</h2><span class="hint">Reading material, not tasks</span></div>
      <div class="read-cards">
        <div class="read-card">
          <div class="tic">${ic('file-alt.svg')}</div>
          <div><div class="o-name">Company factsheet</div>
          <div class="o-note">Who we are, what we do, and the numbers that matter. English only.</div></div>
        </div>
      </div>
    </div>

    ${ro
      ? `<div class="mt24 review-banner ok" style="max-width:720px;">${ic('check-circle.svg','lg')}
          <div><b>Task closed</b><p>Everything is acknowledged and recorded. The documents stay readable here.</p></div></div>`
      : `<div class="mt24" style="display:flex; align-items:center; gap:16px;">
          <button class="btn primary" id="submitPolicies" ${acked===total && polOpen() ?'':'disabled'}>Finish this task</button>
          <span style="font-size:var(--t-meta); color:var(--carbon);">${!polOpen() ? `Opens on ${fmtLong(startDate())}. Nothing to do before then.`
            : acked===total ? 'Everything is signed. One click finishes the task.' : `${total-acked} still to sign before you can finish.`}</span>
        </div>`}
  </div>`;
}

/* Document language is derived from country of hire, not chosen (A-03). */
function docLanguage() { return S.country === 'JP' ? 'Japanese' : 'English'; }

function docCard(d, jp) {
  const P = S.policies;
  const open = !!P.open[d.id];
  const read = !!P.read[d.id];
  const acked = !!P.acked[d.id];
  const lang = docLanguage();

  let body = '';
  if (open) {
    if (d.external) {
      body = `
      <div class="doc-body">
        ${P.cobcVisited
          ? `<div class="return-banner">${ic('check-circle.svg')}Welcome back. You opened the Code site, so you can acknowledge below.</div>`
          : `<div class="ext-banner">${ic('external-link.svg')}
              <span>This one lives on its own Equinix site, not in the portal. It <b>opens in a new tab</b>, you’ll need your
              <b>Equinix sign-in</b>, and when you’ve read it you come back here to acknowledge.</span></div>
            <button class="btn secondary" data-cobc="1">${ic('external-link.svg','sm')} Open codeofbusinessconduct.equinix.com</button>`}
        ${ackRow(d, P.cobcVisited && polOpen(), acked, lang)}
      </div>`;
    } else {
      body = `
      <div class="doc-body">
        <div class="doc-text" data-doctext="${d.id}">
          ${d.hasAddendum && jp
            ? `<p>${FILLER[0]}</p>
               <div class="addendum" data-assume="A-20">
                 <div class="add-h">${ic('flag.svg','sm')}Japan addendum, which applies because your country of hire is Japan ${am('A-20')}</div>
                 ${JP_ADDENDUM_TEXT}
               </div>
               ${FILLER.slice(1).map(p=>`<p>${p}</p>`).join('')}`
            : d.body}
        </div>
        <div class="scroll-hint ${read?'ok':''}" data-dochint="${d.id}">
          ${read ? ic('check.svg','sm')+'Read to the end.' : ic('chevron-down.svg','sm')+'Scroll to the end to unlock the acknowledgement. '+am('A-24')}
        </div>
        ${ackRow(d, read && polOpen(), acked, lang)}
      </div>`;
    }
  }

  return `
  <div class="doc ${acked?'acked':''} ${open?'open':''} ${d.external?'external':''}" data-doc="${d.id}">
    <div class="doc-h" data-dochead="${d.id}">
      <div class="dic">${acked ? ic('check.svg') : ic(d.external ? 'external-link.svg' : 'file-alt.svg')}</div>
      <div class="d-main">
        <div class="d-name">${d.title} ${d.marker ? am(d.marker) : ''} ${d.external ? '<span class="chip info">External site</span>' : ''}</div>
        <div class="d-desc">${d.desc}</div>
      </div>
      ${acked ? `<span class="chip done">${ic('check.svg','sm')}Acknowledged</span>` : `<span class="chip notstarted">Required</span>`}
      ${ic(open?'chevron-up.svg':'chevron-down.svg','lg')}
    </div>
    ${body}
  </div>`;
}

/* Handbooks, as agreed with Janine (A-76): one task with the eight
   acknowledgements nested inside it, rather than eight tasks, and each one
   signed in DocuSign rather than built into ServiceNow. What the live
   process sends today stays in the design notes, because it is the
   argument for the change (A-51). */
function handbookCard(jp) {
  const pack = CURRENT_PACK[jp ? 'JP' : 'US'];
  const H = S.policies, signed = H.hbSigned || {}, n = hbSignedCount();
  return `
  <div class="doc hb-card ${n === HANDBOOKS.length ? 'acked' : ''} ${H.hbOpen ? 'open' : ''}" data-assume="A-76 A-51">
    <div class="doc-h" data-hbhead="1">
      <div class="dic">${n === HANDBOOKS.length ? ic('check.svg') : ic('file-alt.svg')}</div>
      <div class="d-main">
        <div class="d-name">Employee handbooks ${am('A-76')}</div>
        <div class="d-desc">Eight handbooks, one task. Each is signed on its own in DocuSign, which keeps the record.</div>
      </div>
      <span class="chip ${n === HANDBOOKS.length ? 'done' : 'notstarted'}">${n} of ${HANDBOOKS.length} signed</span>
      ${ic(H.hbOpen ? 'chevron-up.svg' : 'chevron-down.svg','lg')}
    </div>
    ${H.hbOpen ? `
    <div class="doc-body">
      <ol class="hb-list">
        ${HANDBOOKS.map(h => `
        <li class="hb-item ${signed[h.id] ? 'signed' : ''}">
          <span class="hb-n">${signed[h.id] ? ic('check.svg','sm') : ''}</span>
          <span class="hb-name">${esc(jp ? h.jp : h.us)}</span>
          <a class="hb-read" data-ext="handbooks">Read ${ic('external-link.svg','sm')}</a>
          ${signed[h.id]
            ? `<span class="hb-when">Signed ${esc(signed[h.id])}</span>`
            : `<button class="btn secondary sm" data-hbsign="${h.id}" ${polOpen() ? '' : 'disabled'}>${ic('edit-pen.svg','sm')}Sign in DocuSign</button>`}
        </li>`).join('')}
      </ol>
      ${polOpen() ? '' : `<div class="hb-note">${ic('lock.svg','sm')}You can read them now. Signing opens on ${fmtLong(startDate())}.</div>`}
    </div>` : ''}
    <div class="pack-flag pnote">
      ${ic('exclamation-triangle.svg','sm')}
      <span><b>What this replaces.</b> Today a US hire is sent the ${esc(pack.handbook)}${pack.addenda ? `, all ${pack.addenda} state
      supplements whether or not they apply` : ''}${pack.extras.length ? `, ${pack.extras.join(' and ')}` : ''}: ${pack.total} documents, and
      416 document instances across all countries. Netherlands and Canada contracts point at the handbook, so whether a
      new hire can see it before they start is still open. ${am('A-51')}</span>
    </div>
  </div>`;
}

/* Acknowledging opens on the start date (A-76). Before then the notices
   can be read ahead, but nothing can be signed. */
function polOpen() { return daysToStart() <= 0; }

function ackRow(d, canAck, acked, lang) {
  if (acked) {
    return `<div class="ack-done">${ic('check-circle.svg')}Signed in DocuSign
      <span class="rec-note">${fmtDate(simToday())}, version 3.2, ${esc(lang)}. DocuSign keeps the date and time for audit.</span></div>`;
  }
  return `
  <div class="ack-row">
    <button class="btn secondary sm" data-ack="${d.id}" ${canAck?'':'disabled'}>${ic('edit-pen.svg','sm')}Sign in DocuSign</button>
    <span class="ack-hint">${canAck ? 'Opens DocuSign, then brings you back here.' : polOpen() ? 'Read it to the end first.' : `Opens on ${fmtLong(startDate())}.`}</span>
  </div>`;
}

/* ============================================================
   Flow overview
   ============================================================ */
function renderFlow() {
  // v4 runs past Day 1 into the first week, because that is where most of
  // the journey went (A-64). x is a date position, not a pixel.
  const axis = [
    { x:2, lbl:'Offer accepted', sub:'and signed', major:true },
    { x:11, lbl:'Identity verified', sub:'account created' },
    { x:20, lbl:'Portal opens', sub:'you are here', major:true },
    { x:37, lbl:'13 days before', sub:'three things due' },
    { x:52, lbl:'8 days before', sub:'optional photo' },
    { x:66, lbl:'3 days before', sub:'first-day details' },
    { x:82, lbl:'Day 1', sub:'in person', major:true },
    { x:96, lbl:'First week', sub:'policies, benefits' },
  ];
  const you = [
    { x:32, r:22, cls:'you', lbl:'Start date', sub:'confirm, 14 days before' },
    { x:38, r:72, cls:'you', lbl:'Background check', sub:'start, 13 days before' },
    { x:44, r:22, cls:'you', lbl:'Equipment', sub:'choose, 12 days before' },
    { x:52, r:72, cls:'you opt', lbl:'Badge photo', sub:'optional' },
    { x:58, r:22, cls:'you opt', lbl:'Say hello', sub:'optional' },
    { x:66, r:72, cls:'you opt', lbl:'Suggested network', sub:'optional' },
    { x:82, r:50, cls:'day1', lbl:'Day 1', sub:'badge and laptop waiting' },
  ];
  const after = [
    { x:80, r:22, cls:'later', lbl:'Personal details', sub:'in Workday, Day 1' },
    { x:84, r:72, cls:'later', lbl:'Job description', sub:'confirm on Day 1' },
    { x:95, r:22, cls:'later', lbl:'Handbooks and notices', sub:'first week' },
    { x:96, r:72, cls:'later', lbl:'Benefits', sub:'first week, one link' },
  ];
  const later = [
    { x:22, r:30, cls:'later', lbl:'Right to work', sub:'open now, other system' },
    ...(S.country === 'JP' ? [{ x:24, r:74, cls:'later', lbl:'Medical check', sub:'some countries only' }] : []),
    { x:64, r:74, cls:'later', lbl:'Setup instructions', sub:'3 days before' },
    { x:68, r:30, cls:'later', lbl:'First day details', sub:'3 days before' },
    { x:76, r:74, cls:'later', lbl:'Sign-in details', sub:'1 day before' },
  ];
  const other = [
    { x:30, r:50, cls:'other', lbl:'Background check', sub:'running, nothing for you to do' },
    { x:50, r:50, cls:'other', lbl:'Laptop delivery', sub:'5 to 7 working days' },
    { x:70, r:50, cls:'other', lbl:'Badge printing', sub:'not tracked here' },
    { x:92, r:50, cls:'other', lbl:'Tax forms, Payroll', sub:'their schedule' },
  ];
  // The AI layer, across all of it: the same Sidekick from the day the
  // portal opens, moving into Teams once there is an account (A-71, A-73).
  const sk = [
    { x:22, r:50, cls:'sk', lbl:'Ask Sidekick', sub:'answers from the articles' },
    { x:46, r:50, cls:'sk', lbl:'Reminders', sub:'by email before Day 1' },
    { x:64, r:50, cls:'sk', lbl:'Talk to a person', sub:'People Operations' },
    { x:88, r:50, cls:'sk', lbl:'Sidekick in Teams', sub:'once you have an account' },
  ];
  // x is the date position and r the row. Both are intent, not final geometry:
  // a node is as wide as its label, so layoutFlowLanes() below corrects the
  // two things percentages alone cannot know about. Before it existed,
  // "Accessories order" sat underneath "Badge photo" and "Phone, info
  // governance" hung off the right edge of its track.
  const lane = (title, icon, nodes, cls='', h=120) => `
    <div class="flow-lane">
      <div class="lane-h">${ic(icon,'sm')}${title}</div>
      <div class="lane-track ${cls}" style="height:${h}px;">
        ${nodes.map(n => `<div class="fnode ${n.cls}" data-x="${n.x}" data-r="${n.r}" style="left:${n.x}%; top:${n.r}%;">${n.lbl}<small>${n.sub}</small></div>`).join('')}
      </div>
    </div>`;

  return `
  <div class="page flow-page">
    ${crumbs('The whole flow on one screen')}
    <h1>From the offer to the first week</h1>
    <p class="flow-sub">Three things before Day 1, and everything else after it: what ${HIRE.preferred} does, what opens on its own,
    what other teams handle, and where Sidekick sits across all of it. This is the review screen: argue with the shape here,
    not in the individual pages. ${am('A-64')}</p>

    <div class="phase-band">
      ${PHASES.map((p,i) => `<div class="pb ${i===0?'on':''}">${p}</div>`).join('')}
      <span class="pb-mark">${am('A-44')}</span>
    </div>

    <div class="flow-wrap">
      <div class="flow-axis">
        <div class="axis-line"></div>
        ${axis.map(a => `<div class="axis-pt ${a.major?'major':''}" data-x="${a.x}" style="left:${a.x}%"><div class="apt-dot"></div>
          <div class="apt-lbl">${a.lbl}</div><div class="apt-sub">${a.sub}</div></div>`).join('')}
      </div>
      ${lane(`Before Day 1: three things in the portal, and three optional`, 'user-circle.svg', you, '', 130)}
      ${lane('Day 1 and the first week', 'calendar.svg', after, '', 130)}
      ${lane('Opens on its own, or in another system', 'clock.svg', later, '', 130)}
      ${lane('Handled by other teams, nothing for you to do', 'users-friends.svg', other, 'other', 100)}
      ${lane('Sidekick, alongside all of it', 'sparkle.svg', sk, 'sk', 100)}
      <div class="flow-legend">
        <span class="lg-item"><span class="lg-swatch you"></span>Your tasks, in this portal</span>
        <span class="lg-item"><span class="lg-swatch later"></span>Later, or elsewhere</span>
        <span class="lg-item"><span class="lg-swatch other"></span>Other teams, status only</span>
        <span class="lg-item"><span class="lg-swatch sk"></span>Sidekick</span>
        <span class="lg-item pnote">${am('A-33')} ${am('A-40')} ${am('A-11')} timing and ownership carry assumptions</span>
      </div>
      <div class="flow-foot">${ic('info-circle.svg','sm')}<b>More to-dos are assigned after the first week.</b> This diagram
      stops there. The current system carries on through the first month. ${am('A-48')}</div>
    </div>
  </div>`;
}

/* ============================================================
   Shell: header, panels
   ============================================================ */
function crumbs(here) {
  return `<div class="crumbs"><button class="back" data-goto="#/">${ic('chevron-left.svg','sm')}All tasks</button>
  <span>/</span><span>${here}</span></div>`;
}

function renderShell() {
  const hm = S.view === 'hm', pex = S.view === 'pex';
  $('#hdrYou').innerHTML = pex
    ? `<div>
         <div class="who">${PEOPLE.pex.name}</div>
         <div class="when">${PEOPLE.pex.role}, ${pexCaseload().length} active hires</div>
       </div>
       <div class="avatar pex">${PEOPLE.pex.initials}</div>`
    : hm
    ? `<div>
         <div class="who">${MANAGER.name}</div>
         <div class="when">${MANAGER.role}, ${HIRES.length} incoming hires</div>
       </div>
       <div class="avatar mgr">${MANAGER.initials}</div>`
    : `<div>
         <div class="who">${esc(HIRE.preferred)} ${esc(HIRE.legalLast)}</div>
         <div class="when">Starts <b>${startDateText()}</b>, ${daysToStart()} days to go</div>
       </div>
       <div class="avatar">${HIRE.initials}</div>`;
  $('#hdrSub').textContent = pex ? 'People Experience, coordinator view'
    : hm ? 'Hiring manager, before Day 1' : 'Your onboarding, before Day 1';
  const live = ASSUMPTIONS.filter(a => a.group !== 'retired').length;
  // “marked” promised on-screen chips; those now sit behind the design-notes switch
  $('#rbAssume').textContent = `${live} assumptions`;
  $$('#viewSwitch .vs').forEach(b => b.classList.toggle('on', b.dataset.view === S.view));
  document.body.classList.toggle('hm-side', hm);
  // The assistant is for people going through onboarding. The coordinator is
  // the person it escalates TO, so offering her "Questions? Ask here" inverts
  // the relationship. It also sat on top of the caseload's action column,
  // which is right-aligned, so it covered the button on the bottom row.
  document.body.classList.toggle('no-chat', pex);
  document.body.classList.toggle('pex-side', pex);
}

/* ---------- assumptions panel ---------- */
let panelSide = 'all';   // all | nh | hm | pex | link

function renderAssumptions(highlightId) {
  const groups = ['blocks','content','design','retired'];
  const all = ASSUMPTIONS;
  const live = all.filter(a => a.group !== 'retired').length;
  // A-series entries predate the side key, so they default to the new hire.
  const sideOf = a => a.side || 'nh';
  const bySide = { nh:0, hm:0, pex:0, link:0 };
  all.forEach(a => bySide[sideOf(a)]++);
  const shown = panelSide === 'all' ? all : all.filter(a => sideOf(a) === panelSide);

  $('#assumeBody').innerHTML = `
    <div class="panel-note">Where this prototype rests on an assumption instead of a confirmed requirement, the element
    carries a marker like ${am('A-04')}. <b>${live} are marked on screen</b>, out of ${all.length} in the register,
    across all three views. Every entry says where it came from.</div>

    <div class="decide">
      <div class="dc-h">${ic('list-tasks.svg','lg')}
        <div><b>Decide first</b>
        <span>${DECIDE_FIRST.length} things, in the order I would take them. My read, not an agreed order, and every one has its own
        entry below.</span></div>
      </div>
      ${DECIDE_FIRST.map((d, i) => `
        <div class="dc-item">
          <span class="dc-n">${i + 1}</span>
          <div class="dc-body">
            <div class="dc-head">${d.head} ${d.ids.map(x => am(x)).join(' ')}</div>
            <div class="dc-why">${d.why}</div>
            <div class="dc-when">${ic('clock.svg','sm')}${d.when}</div>
          </div>
        </div>`).join('')}
    </div>

    <div class="side-filter">
      <button class="sf ${panelSide==='all'?'on':''}" data-side="all">All <span>${all.length}</span></button>
      <button class="sf ${panelSide==='nh'?'on':''}" data-side="nh">New hire <span>${bySide.nh}</span></button>
      <button class="sf ${panelSide==='hm'?'on':''}" data-side="hm">Manager <span>${bySide.hm}</span></button>
      <button class="sf ${panelSide==='pex'?'on':''}" data-side="pex">Coordinator <span>${bySide.pex}</span></button>
      <button class="sf ${panelSide==='link'?'on':''}" data-side="link">Connections <span>${bySide.link}</span></button>
    </div>

    <div class="prov-key">
      ${Object.entries(PROV_LABELS).map(([k,v]) => `<span class="pk"><span class="prov ${k.replace(':','')}">${k}</span>${v}</span>`).join('')}
    </div>

    ${groups.map(g => {
      const list = shown.filter(a => a.group===g);
      if (!list.length) return '';
      return `
      <div class="ag-h ${g==='retired'?'ret':''}">${GROUP_LABELS[g].label} <span class="cnt">${list.length}. ${GROUP_LABELS[g].hint}</span></div>
      ${list.map(a => `
        <div class="a-entry ${g==='retired'?'retired':''} ${a.id===highlightId?'hl':''}" data-aentry="${a.id}" id="ae-${a.id}">
          <div class="a-top">
            <span class="a-id ${a.side}">${a.id}</span>
            <span class="prov ${a.prov.replace(':','')}" title="${PROV_LABELS[a.prov]}">${a.prov}</span>
            <span class="side-tag ${sideOf(a)}">${SIDE_LABELS[sideOf(a)].label}</span>
            <span class="a-screen">${a.screen}</span>
            <span class="a-oi">${a.oi || ''}</span>
          </div>
          <div class="a-text">${a.assumed}</div>
          <div class="a-resolve"><b>${g==='retired' ? 'What changed:' : 'To resolve:'}</b> ${a.resolve}</div>
          ${a.nolink ? '<div class="nolink">Global assumption. Nothing on screen to highlight.</div>' : ''}
        </div>`).join('')}`;
    }).join('')}

    ${panelSide === 'all' || panelSide === 'nh' ? `
    <div class="ag-h">Also closed by observation <span class="cnt">workbook items</span></div>
    <div class="a-entry retired">
      <div class="a-text"><b>OI-28</b>, the equipment address dependency and the equipment confirmation gate. Both closed:
      shipping defaults to the office address, and no one operates the role-and-location gate.</div>
      <div class="a-resolve"><b>And:</b> the “false floor” concern is answered by one line of live copy,
      <i>“More to-dos may be assigned later.”</i></div>
    </div>` : ''}

    <div class="ag-h">Open before build <span class="cnt">${OPEN_BEFORE_BUILD.length + HM_OPEN_BEFORE_BUILD.length} questions, no marker</span></div>
    ${panelSide === 'all' || panelSide === 'nh' ? `
      <div class="obb-h">New hire side</div>
      <ol class="obb">${OPEN_BEFORE_BUILD.map(q => `<li>${q}</li>`).join('')}</ol>` : ''}
    ${panelSide === 'all' || panelSide === 'hm' || panelSide === 'link' ? `
      <div class="obb-h">Hiring manager side</div>
      <ol class="obb">${HM_OPEN_BEFORE_BUILD.map(q => `<li>${q}</li>`).join('')}</ol>` : ''}

    ${panelSide === 'all' || panelSide === 'hm' ? `
    <div class="ag-h">Source integrity <span class="cnt">problems in the workbook itself</span></div>
    <ol class="obb">
      <li><b>The master inventory is missing a manager task.</b> The master tab holds 67 rows; the phase tabs hold 68.
      The missing one is a manager task, and the file’s own phase summary agrees with the phase tab, not the master.</li>
      <li><b>Sequence numbers diverge by one from 34 onward.</b> The same number refers to different tasks depending on
      which tab you read. One of the two candidates is a manager task, the other a new hire survey. If that number is
      used as a build key, tasks will be mismatched.</li>
      <li><b>The corporate card row is truncated.</b> Seven attributes are blank where every other row in the tab is complete.</li>
      <li><b>Label drift on the equipment task</b>: “accessories” in one tab, “access” in another. Different scopes, so
      the drift sits on top of a real question, not only a typo.</li>
    </ol>` : ''}`;

  if (highlightId) {
    const el = $('#ae-'+highlightId);
    if (el) setTimeout(() => el.scrollIntoView({ block:'center', behavior:'smooth' }), 60);
  }
}
function openAssumptions(id) {
  if (id) {
    const entry = ASSUMPTIONS.find(a => a.id === id);
    if (entry && panelSide !== 'all' && (entry.side || 'nh') !== panelSide) panelSide = 'all';
  }
  renderAssumptions(id);
  $('#assumePanel').classList.add('show');
  $('#overlay').classList.add('show');
}
function closePanels() {
  $$('.panel').forEach(p => p.classList.remove('show'));
  $('#overlay').classList.remove('show');
}

/* ---------- prototype controls ---------- */
function renderProtoDrawer() {
  $('#protoDrawer').innerHTML = `
    <h3>${ic('exclamation-triangle.svg','sm')}Prototype controls</h3>
    <div class="warn-line">A prototype device. None of this exists in the real product. Clock is fixed at ${fmtDate(simToday())}.</div>
    <div class="pc-h">Design notes</div>
    <div class="pc-row">
      <button class="pc-btn ${S.notes?'':'on'}" data-pc="notes:off">Hidden</button>
      <button class="pc-btn ${S.notes?'on':''}" data-pc="notes:on">Shown</button>
    </div>
    <div class="pc-sub">Rationale, ${ASSUMPTIONS.length} assumption markers and the manager dispositions. Off by default so the portal reads as itself.</div>
    <div class="pc-h">Type of hire</div>
    <div class="pc-row">
      <button class="pc-btn ${S.persona==='external'?'on':''}" data-pc="persona:external">External new hire</button>
      <button class="pc-btn ${S.persona==='conversion'?'on':''}" data-pc="persona:conversion">Contract-to-permanent</button>
    </div>
    <div class="pc-h">Country of hire</div>
    <div class="pc-row">
      <button class="pc-btn ${S.country==='US'?'on':''}" data-pc="country:US">United States</button>
      <button class="pc-btn ${S.country==='JP'?'on':''}" data-pc="country:JP">Japan</button>
    </div>
    <div class="pc-h">Caseload size <span class="pc-mark">OI-01</span></div>
    <div class="pc-row">
      ${[5, 12, 24].map(n => `<button class="pc-btn ${S.pex.size===n?'on':''}" data-pc="pexsize:${n}">${n} hires</button>`).join('')}
    </div>
    <div class="pc-sub">The spec's first open item, and the one that decides the shape: at five a plain list is
    the home screen, at fifty only triage works.</div>
    <div class="pc-h">People Experience <span class="pc-mark">M-32</span></div>
    <div class="pc-row">
      <button class="pc-btn ${!S.pexUpdate?'on':''}" data-pc="pexUpdate:no">Office details unchanged</button>
      <button class="pc-btn ${S.pexUpdate?'on':''}" data-pc="pexUpdate:yes">Office details changed</button>
    </div>
    <div class="pc-h">Equipment for this role <span class="pc-mark">A-60</span></div>
    <div class="pc-row">
      <button class="pc-btn ${S.deviceMode==='single'?'on':''}" data-pc="deviceMode:single">Single build</button>
      <button class="pc-btn ${S.deviceMode==='choice'?'on':''}" data-pc="deviceMode:choice">Choice of builds</button>
    </div>
    <div class="pc-h">Time until Day 1 <span class="pc-mark">A-45</span></div>
    <div class="pc-row">
      <button class="pc-btn ${S.horizon==='2wk'?'on':''}" data-pc="horizon:2wk">Two weeks out</button>
      <button class="pc-btn ${S.horizon==='3mo'?'on':''}" data-pc="horizon:3mo">Three months out</button>
    </div>
    <div class="pc-h">Task state</div>
    <div class="pc-row">
      <button class="pc-btn ${S.scenario==='default'?'on':''}" data-pc="scenario:default">Not started</button>
      <button class="pc-btn ${S.scenario==='inprogress'?'on':''}" data-pc="scenario:inprogress">In progress</button>
      <button class="pc-btn ${S.scenario==='review'?'on':''}" data-pc="scenario:review">Under review</button>
      <button class="pc-btn ${S.scenario==='overdue'?'on':''}" data-pc="scenario:overdue">Overdue</button>
      <button class="pc-btn ${S.scenario==='complete'?'on':''}" data-pc="scenario:complete">Complete</button>
    </div>
    <div class="pc-h">Buddy visibility <span class="pc-mark">L-01</span></div>
    <div class="pc-row">
      <button class="pc-btn ${S.buddyRule==='assignment'?'on':''}" data-pc="buddyRule:assignment">On assignment</button>
      <button class="pc-btn ${S.buddyRule==='72h'?'on':''}" data-pc="buddyRule:72h">72 hours before start</button>
    </div>
    <div class="pc-h">Review screens</div>
    <div class="pc-links">
      <a data-goto="#/handoffs">${ic('users-connected.svg','sm')} How the portals connect, ${handoffRows().length} handoffs</a>
      <a data-goto="#/hm/subtraction">${ic('list-tasks.svg','sm')} The subtraction review, manager side</a>
      <a data-goto="#/flow">${ic('rocket.svg','sm')} Flow overview, the new hire journey</a>
      <a data-openassume="1">${ic('question-circle.svg','sm')} Assumptions &amp; gaps, ${ASSUMPTIONS.length} entries</a>
    </div>`;
}

function applyScenario(name) {
  const { persona, country, horizon, view, buddyRule, notes, pex } = S;
  S = DEFAULT_STATE();
  Object.assign(S, { persona, country, horizon, view, buddyRule, notes, pex, scenario: name });

  const namePeople = () => {
    S.hm.network.named = {};
    NETWORK_POOL.filter(p => p.suggested).forEach((p, i) => {
      const id = ORG_PEOPLE[4 + i] ? ORG_PEOPLE[4 + i].id : null;
      if (id) S.hm.network.named[id] = p.why;
    });
    S.hm.network.submitted = true;
  };
  const hmPartial = () => {
    S.hm.card.needed = true;
    S.hm.buddy = { assigned:'nina', notified:true, accepted:true };
    S.hm.contactConfirmed = true;
    Object.assign(S.hm.logistics, { confirmed:true, whereToBe:'9:00, main reception. Ask for me at the desk', available:true });
  };
  const hmComplete = () => {
    hmPartial(); namePeople();
    S.hm.computer = { ordered:true, model:'win-std', reason:'' };
    S.hm.software = { confirmed:true, added:['Anaplan','Tableau','Power BI'] };
    S.hm.calendar = { confirmed:true, holds:{ teamIntro:true, buddy:true } };
    S.hm.welcome = { sent:true, body:WELCOME_BOILERPLATE, personal:'Looking forward to having you on the team. Shout if anything is unclear before the 18th.' };
    S.hm.channels.accepted = true;
  };

  if (name === 'inprogress') {
    S.startdate.confirmed = true;
    S.bgcheck.launched = true;
    hmPartial();
    S.hm.computer = { ordered:true, model:'win-std', reason:'' };
    S.equipment.choice = 'more'; S.equipment.items = { monitor:true };
    S.intro.text = 'I’m Jordan, joining the FP&A team from a fintech in Denver. Outside work you’ll usually find me on a trail or attempting sourdough.';
    S.network.booked = { 0: slotsFor(0)[0] };
  }
  // Under review, in v4, is the start date: the job description it used to
  // hang off is a Day 1 task now (A-67), so it cannot be disputed before start.
  if (name === 'review') {
    S.bgcheck.launched = true;
    S.startdate.changeRequested = true;
    S.startdate.requestedDate = 'Tuesday 1 September 2026';
    S.startdate.reason = 'My notice period runs two weeks longer than I expected.';
    equipComplete(); hmPartial(); namePeople();
  }
  if (name === 'complete') {
    S.startdate.confirmed = true; S.bgcheck.launched = true;
    equipComplete(); hmComplete();
    S.intro.text = 'I’m Jordan, joining the FP&A team from a fintech in Denver. I’ll be picking up the forecast for the Americas portfolios. Outside work you’ll usually find me on a trail or attempting sourdough.';
    S.intro.consent = true; S.intro.saved = true; S.intro.done = true;
    if (persona === 'conversion') { S.photo.confirmedExisting = true; }
    else { S.photo.uploaded = true; S.photo.consent = true; S.photo.done = true; S.photo.dataUrl = PLACEHOLDER_PHOTO; }
    S.network.booked = { 0: slotsFor(0)[0], 2: slotsFor(2)[1], 4: slotsFor(4)[2] };
    S.hm.intro.forwarded = true;
  }
  save();
}
function equipComplete() {
  Object.assign(S.equipment, {
    choice:'more', items:{ monitor:true, keyboard:true, mouse:true },
    shipOffice:'yes', shipPhone:'+1 303 555 0117', submitted:true,
    comments:['can you please add a webcam'],
  });
}
/* a soft neutral placeholder "photo" for the all-complete scenario */
const PLACEHOLDER_PHOTO = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 300;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0,0,300,300);
  g.addColorStop(0,'#CCE3FF'); g.addColorStop(1,'#C7FDFF');
  x.fillStyle = g; x.fillRect(0,0,300,300);
  x.fillStyle = '#00408C'; x.font = '800 90px sans-serif';
  x.textAlign='center'; x.textBaseline='middle'; x.fillText('JR',150,160);
  return c.toDataURL('image/png');
})();

/* ============================================================
   Router + events
   ============================================================ */
/* ============================================================
   The platform's own to-do timeline (A-56)

   Drawn from UAT. The prototype's landing page is the designed future
   state; this is what the platform ships today, so both can be seen and
   compared rather than argued about from memory.
   ============================================================ */
function renderTodos() {
  const phase = S.todoPhase || 0;
  const tasks = taskList();
  const P = PHASE_TODOS[phase];

  // Phase 0 is this prototype's own list, so it reports live state.
  const items = phase === 0
    ? tasks.filter(t => COUNTED.includes(t.key)).map(t => ({
        name: t.name, state: t.status === 'done' ? 'Completed'
          : t.status === 'notstarted' ? `Due ${dueText(dueFor(t.key))}` : 'In progress',
        done: t.status === 'done', route: t.route }))
    : P.items;
  const total = phase === 0 ? COUNTED.length : (P.total != null ? P.total : P.items.length);
  const done = phase === 0 ? items.filter(i => i.done).length : 0;

  return `
  <div class="page">
    ${crumbs('All to-dos')}
    <h1>All to-dos</h1>
    <p class="why">This is the view the current system has, as its test build shows it: one stage at a time, each with its own count.
    Your task list on the home screen is the proposed replacement. Both are here so the difference is visible. ${am('A-56')}</p>

    <div class="td-bar">Tasks/To-Dos</div>
    <div class="td-wrap" data-assume="A-56 A-44">
      <div class="td-rail">
        <div class="td-rail-h">Timeline</div>
        ${PHASES.map((p, i) => `
          <button class="td-phase ${i === phase ? 'on' : ''} ${i < phase ? 'past' : ''}" data-todophase="${i}">
            <span class="td-dot"></span><span class="td-pname">${p}</span>
          </button>`).join('')}
        <div class="td-all">${ic('list-tasks.svg','sm')} View all to-dos</div>
      </div>

      <div class="td-main">
        <div class="td-head">
          <h2>${PHASES[phase]}</h2>
          <span class="td-rule"></span>
          <span class="td-count">${done} of ${total} to-dos completed</span>
        </div>

        <div class="td-filters">
          ${TODO_FILTERS.map(f => `
            <div class="td-filter"><span class="tdf-lbl">${f.label}</span>
              <span class="tdf-val">${f.value} ${ic('chevron-down.svg','sm')}</span></div>`).join('')}
        </div>

        <div class="td-overflow">More to-dos may be assigned later.</div>

        ${items.length ? `<div class="td-list">
          ${items.map(i => `
            <div class="td-item ${i.done ? 'done' : ''}" ${i.route ? `data-goto="${i.route}"` : ''}>
              <div class="avatar sm">${HIRE.initials}</div>
              <div class="td-body">
                <div class="td-name">${i.name}${i.marker ? ' ' + am(i.marker) : ''}</div>
                <div class="td-state">${i.state}</div>
              </div>
              ${i.route ? ic('chevron-right.svg','lg') : ''}
            </div>`).join('')}
        </div>` : ''}

        ${phase !== 0 && PHASE_TODOS[phase] && PHASE_TODOS[phase].note ? `
          <div class="td-note">${ic('exclamation-triangle.svg','sm')}<span>${PHASE_TODOS[phase].note} ${am('A-56')}</span></div>` : ''}

        ${phase === 0 ? `
          <div class="td-note">${ic('info-circle.svg','sm')}<span>The platform counts only this phase, so a new hire
          sees a small number and no sense of what is still coming. The home screen counts the whole pre-Day 1 list
          instead. Which is less alarming is worth testing. ${am('A-64')}</span></div>` : ''}
      </div>
    </div>

    <div class="mt24"><button class="btn primary" data-goto="#/">Back to your tasks</button></div>
  </div>`;
}

const ROUTES = {
  '#/': renderLanding,
  '#/todos': renderTodos,
  '#/startdate': renderStartDate,
  '#/bgcheck': renderBgCheck,
  '#/equipment': renderEquipment,
  '#/details': renderDetails,
  '#/jd': renderJD,
  '#/intro': renderIntro,
  '#/network': renderNetwork,
  '#/policies': renderPolicies,
  '#/flow': renderFlow,
};
Object.assign(ROUTES, HM_ROUTES);    // hiring manager screens (js/hm.js)
Object.assign(ROUTES, PEX_ROUTES);  // coordinator screens (js/pex.js)

/* The route this screen was last drawn for. render() is both "navigate" and
   "redraw after a state change", and those want opposite scroll behaviour:
   arriving at a screen should start at the top, ticking a checkbox should
   leave you looking at the checkbox. Scrolling to top on every redraw is
   what made buttons feel like they teleported you. */
let lastRoute = null;

function render() {
  const route = location.hash || '#/';
  // The route decides the lens, so a deep link lands on the right side.
  if (route.startsWith('#/pex/')) S.view = 'pex';
  else if (route.startsWith('#/hm/')) S.view = 'hm';
  else if (route !== '#/handoffs') S.view = 'nh';
  if (route !== '#/policies') S.policies._viewing = false;
  // #/pex/hire/<id> carries a parameter, so it cannot come from the table.
  const fn = route.startsWith('#/pex/hire/') ? renderPexHire : (ROUTES[route] || renderLanding);
  $('#app').innerHTML = fn();
  renderShell();
  renderProtoDrawer();
  applyNotes();
  bindScreen(route);
  if (route !== lastRoute) { window.scrollTo(0, 0); lastRoute = route; skHelloClose(); }
  skGreet();
}
/* Design notes are a body class, not a re-render: the markup always carries
   the commentary, CSS decides whether this viewer is reading it. */
function applyNotes() { document.body.classList.toggle('notes', !!S.notes); }

function rerender() { render(); }

/* Keep every flow label inside its container and off its neighbours.

   Labels are placed by date as a percentage, but each is as wide as its own
   text, so two close dates collide and anything near either end hangs
   outside. Percentages cannot express "and do not overlap", so this measures
   what actually rendered and corrects it.

   Before it existed: "Accessories order" sat underneath "Badge photo",
   "Phone, info governance" hung off the right edge of its track, and on the
   axis "Offer accepted" ran into "Identity verified".

   The axis matters more than the lanes, because a dot there marks a real
   date. So the dot is pinned to the true position and only its label block
   is moved, which is why the label carries a compensating transform. */
function packRow(items, W, pad, gap) {
  items.sort((a, b) => a.want - b.want);
  items.forEach(it => { it.c = Math.min(Math.max(it.want, it.half + pad), W - it.half - pad); });
  // Forwards: never begin before the previous one ends.
  for (let i = 1; i < items.length; i++) {
    const prev = items[i - 1], cur = items[i];
    const min = prev.c + prev.half + gap + cur.half;
    if (cur.c < min) cur.c = min;
  }
  // Backwards: that can push the tail past the right edge, so walk it back.
  for (let i = items.length - 1; i >= 0; i--) {
    const cur = items[i];
    const limit = i === items.length - 1
      ? W - cur.half - pad
      : items[i + 1].c - items[i + 1].half - gap - cur.half;
    if (cur.c > limit) cur.c = limit;
  }
  // If the row genuinely does not fit, keep it inside on the left and let it
  // read as tight rather than silently clipping the first label.
  if (items.length) items[0].c = Math.max(items[0].c, items[0].half + pad);
  return items;
}

function layoutFlowLanes() {
  const place = (el, c, W) => { el.style.left = ((c / W) * 100).toFixed(3) + '%'; };

  $$('.flow-axis').forEach(axis => {
    const W = axis.clientWidth;
    if (!W) return;
    const items = $$('.axis-pt', axis).map(n => ({
      n, half: n.offsetWidth / 2, want: (parseFloat(n.dataset.x) / 100) * W,
    }));
    packRow(items, W, 0, 6).forEach(it => {
      place(it.n, it.c, W);
      // Pin the dot to the real date after the label block was nudged.
      const dot = $('.apt-dot', it.n);
      if (dot) dot.style.transform = `translateX(${(it.want - it.c).toFixed(1)}px)`;
    });
  });

  const VGAP = 18, VPAD = 10;
  $$('.lane-track').forEach(track => {
    const W = track.clientWidth;
    if (!W) return;
    const rows = new Map();
    $$('.fnode', track).forEach(n => {
      const key = parseFloat(n.dataset.r ?? n.style.top);
      if (!rows.has(key)) rows.set(key, []);
      rows.get(key).push({ n, half: n.offsetWidth / 2, want: (parseFloat(n.dataset.x) / 100) * W });
    });
    rows.forEach(items => packRow(items, W, 8, 10).forEach(it => place(it.n, it.c, W)));

    /* Rows are authored as percentages of a hand-picked lane height, so two
       of them can end up a few pixels apart and read as one box split in
       half rather than two cards. "Right to work" and "Medical check" sat
       7px from each other. The lane height is treated as a MINIMUM: if the
       rows do not fit with a real gap between them, the lane grows and the
       rows are distributed evenly. Nothing here has to be re-tuned when a
       label changes. */
    const keys = [...rows.keys()].sort((a, b) => a - b);
    if (keys.length < 2) return;
    const hs = keys.map(k => Math.max(...rows.get(k).map(it => it.n.offsetHeight)));
    const need = hs.reduce((a, b) => a + b, 0) + VGAP * (keys.length - 1) + VPAD * 2;
    const H = Math.max(track.clientHeight, need);
    if (H > track.clientHeight) track.style.height = H + 'px';
    const slack = (H - VPAD * 2 - hs.reduce((a, b) => a + b, 0)) / (keys.length - 1);
    let y = VPAD;
    keys.forEach((k, i) => {
      const centre = y + hs[i] / 2;
      rows.get(k).forEach(it => { it.n.style.top = ((centre / H) * 100).toFixed(3) + '%'; });
      y += hs[i] + slack;
    });
  });
}

function bindScreen(route) {
  startCarousel(route === '#/');
  if (route === '#/flow') {
    layoutFlowLanes();
    requestAnimationFrame(layoutFlowLanes);   // after fonts settle
  }
  if (route.startsWith('#/pex/')) { bindPex(); return; }
  if (route.startsWith('#/hm/')) { bindHm(route); return; }
  if (route === '#/startdate') return bindStartDate();
  if (route === '#/bgcheck') return bindBgCheck();
  if (route === '#/equipment') bindEquipment();
  if (route === '#/jd') bindJD();
  if (route === '#/intro') bindIntro();
  if (route === '#/policies') bindPolicies();
}

/* ---------- carousel ----------
   Rotates only while the strip is closed: once someone has opened a chapter
   to read it, moving it under them would be hostile. */
function startCarousel(on) {
  clearInterval(carouselTimer); carouselTimer = null;
  if (!on) return;
  carouselTimer = setInterval(() => {
    if (!$('#insideStrip')) { clearInterval(carouselTimer); carouselTimer = null; return; }
    if (S.insideOpen) return;
    S.carousel = ((S.carousel || 0) + 1) % INSIDE_CHAPTERS.length;
    paintInside();
  }, 6000);
}

/* ---------- start date bindings ---------- */
function bindStartDate() {
  const D = S.startdate;
  const c = $('#sdConfirm');
  if (c) c.addEventListener('click', () => {
    D.confirmed = true; save(); rerender();
    toast('Start date confirmed. Every other due date is set from it.', 'check-circle.svg');
  });
  const ch = $('#sdChange');
  if (ch) ch.addEventListener('click', () => {
    $('#sdBox').classList.remove('hidden'); ch.classList.add('hidden'); $('#sdConfirm').classList.add('hidden');
  });
  const dt = $('#sdDate');
  if (dt) dt.addEventListener('input', () => {
    D.requestedDate = dt.value; save();
    $('#sdSend').disabled = !dt.value.trim();
  });
  const rs = $('#sdReason');
  if (rs) rs.addEventListener('input', () => { D.reason = rs.value; save(); });
  const sn = $('#sdSend');
  if (sn) sn.addEventListener('click', () => {
    D.changeRequested = true; D.confirmed = false; save(); rerender();
    toast('Request sent to Maya and Priya. Your dates stay as they are until it is agreed.');
  });
  const ca = $('#sdCancel');
  if (ca) ca.addEventListener('click', () => rerender());
  const ro = $('#sdReopen');
  if (ro) ro.addEventListener('click', () => { D.confirmed = false; save(); rerender(); });
  const un = $('#sdUndo');
  if (un) un.addEventListener('click', () => {
    D.changeRequested = false; D.requestedDate = ''; D.reason = ''; save(); rerender();
  });
}

/* ---------- background check bindings ---------- */
function bindBgCheck() {
  const l = $('#bgLaunch');
  if (l) l.addEventListener('click', () => {
    toast('Opening the screening provider in a new tab (simulated).', 'external-link.svg');
    setTimeout(() => { S.bgcheck.launched = true; save(); rerender(); }, 1300);
  });
  const u = $('#bgUndo');
  if (u) u.addEventListener('click', () => { S.bgcheck.launched = false; save(); rerender(); });
}

/* ---------- equipment bindings ---------- */
function bindEquipment() {
  const dc = $('#devConfirm');
  if (dc) dc.addEventListener('click', () => {
    S.equipment.deviceConfirmed = true;
    S.equipment.device = DEVICE_CATALOG[0].id;
    save(); rerender();
    toast('Computer confirmed. It is ordered when you submit this task.', 'check-circle.svg');
  });
  $$('[data-device]').forEach(el => el.addEventListener('click', () => {
    S.equipment.device = el.dataset.device;
    S.equipment.deviceConfirmed = true;
    save(); rerender();
  }));
  const sel = $('#eqChoice');
  if (sel) sel.addEventListener('change', () => {
    S.equipment.choice = sel.value;
    if (sel.value !== 'more') S.equipment.items = {};
    save(); rerender();
  });
  $$('[data-acc]').forEach(cb => cb.addEventListener('change', () => {
    S.equipment.items[cb.dataset.acc] = cb.checked;
    save(); updateEqChrome();
  }));
  $$('[data-ship]').forEach(r => r.addEventListener('change', () => {
    S.equipment.shipOffice = r.dataset.ship; save(); rerender();
  }));
  const ph = $('#shipPhone');
  if (ph) ph.addEventListener('input', () => { S.equipment.shipPhone = ph.value; save(); updateEqChrome(); });
  const sub = $('#eqSubmit');
  if (sub) sub.addEventListener('click', () => {
    S.equipment.submitted = true; save(); rerender();
    toast('Order submitted. The IT help desk has it as INC6369627.', 'check-circle.svg');
  });
  const send = $('#incSend');
  if (send) send.addEventListener('click', () => {
    const t = $('#incComment');
    if (!t.value.trim()) return;
    S.equipment.comments.push(t.value.trim()); save(); rerender();
    toast('Comment added to the ticket. Someone in Tier 2 will pick it up.');
  });
  const chg = $('#eqChange');
  if (chg) chg.addEventListener('click', () => {
    S.equipment.submitted = false; save(); rerender();
    toast('Reopened your order. In the live portal this is where people type into the ticket instead.');
  });
}
function updateEqChrome() {
  const m = $('#eqMissing'); if (m) m.textContent = eqMissingText();
  const b = $('#eqSubmit'); if (b) b.disabled = !eqReady();
}

/* ---------- jd bindings ---------- */
function bindJD() {
  const doc = $('#jdDoc');
  if (doc && !S.jd.scrolled) {
    doc.addEventListener('scroll', () => {
      if (doc.scrollTop + doc.clientHeight >= doc.scrollHeight - 24) {
        S.jd.scrolled = true;
        if (S.jd.state === 'notstarted') S.jd.state = 'inprogress';
        save(); rerender();
      }
    });
  }
  const ack = $('#jdAck');
  if (ack) ack.addEventListener('change', () => {
    S.jd.acked = ack.checked;
    if (S.jd.state === 'notstarted') S.jd.state = 'inprogress';
    save();
    $('#jdConfirm').disabled = !ack.checked;
  });
  const confirm = $('#jdConfirm');
  if (confirm) confirm.addEventListener('click', () => {
    S.jd.state = 'done'; save(); rerender();
    toast('Role confirmed. Task complete.', 'check-circle.svg');
  });
  const dis = $('#jdDissent');
  if (dis) dis.addEventListener('click', () => {
    $('#dissentBox').classList.remove('hidden');
    $('#jdAck').closest('.check').classList.add('hidden');
    $('#jdConfirm').classList.add('hidden');
    dis.classList.add('hidden');
  });
  const dt = $('#dissentText');
  if (dt) dt.addEventListener('input', () => {
    S.jd.dissentText = dt.value; save();
    $('#dissentSend').disabled = !dt.value.trim();
  });
  const send = $('#dissentSend');
  if (send) send.addEventListener('click', () => {
    S.jd.state = 'review'; S.jd.dissent = true; save(); rerender();
    toast('Sent to Recruiting. They’ll be in touch within 2 working days.');
  });
  const cancel = $('#dissentCancel');
  if (cancel) cancel.addEventListener('click', () => { rerender(); });
}

/* ---------- intro bindings ---------- */
function bindIntro() {
  const ta = $('#introText');
  if (ta) {
    ta.addEventListener('input', () => {
      S.intro.text = ta.value; save();
      const cc = $('#charCount');
      cc.innerHTML = `${ta.value.length} / 500 ${am('A-15')}`;
      cc.classList.toggle('warn', ta.value.length > 460);
      $('#pvText').innerHTML = ta.value ? esc(ta.value) : '<span class="pv-empty">Your introduction appears here as you write it.</span>';
      $('#saveIntro').disabled = !ta.value.trim();
    });
  }
  $$('[data-chip]').forEach(b => b.addEventListener('click', e => {
    if (e.target.dataset.chipx) return;
    const c = CHIP_SCAFFOLDS.find(c => c.id === b.dataset.chip);
    const cur = $('#introText').value;
    const next = cur ? (cur.replace(/\s+$/,'') + '\n' + c.text) : c.text; // never overwrite
    if (next.length <= 500) {
      $('#introText').value = next; S.intro.text = next; save();
      $('#introText').dispatchEvent(new Event('input'));
      $('#introText').focus();
    } else toast('Not enough room left for that prompt. 500 characters max.');
  }));
  $$('[data-chipx]').forEach(x => x.addEventListener('click', e => {
    e.stopPropagation();
    S.intro.dismissed.push(x.dataset.chipx); save(); rerender();
  }));
  const consent = $('#introConsent');
  if (consent) consent.addEventListener('change', () => {
    S.intro.consent = consent.checked;
    if (S.intro.saved) S.intro.done = consent.checked && !!S.intro.text.trim();
    save(); rerender();
  });
  const ub = $('#useBadge');
  if (ub) ub.addEventListener('change', () => { S.intro.useBadge = ub.checked; save(); rerender(); });
  const saveBtn = $('#saveIntro');
  if (saveBtn) saveBtn.addEventListener('click', () => {
    S.intro.saved = true;
    S.intro.done = S.intro.consent && !!S.intro.text.trim();
    save(); rerender();
    toast(S.intro.consent ? 'Introduction saved. Priya can share it when she’s ready.' : 'Saved. It won’t be shared until you tick the consent box.', 'check-circle.svg');
  });

  const dz = $('#dropzone');
  if (dz) {
    const fi = $('#fileInput');
    dz.addEventListener('click', () => fi.click());
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
    dz.addEventListener('drop', e => {
      e.preventDefault(); dz.classList.remove('drag');
      if (e.dataTransfer.files[0]) loadPhoto(e.dataTransfer.files[0]);
    });
    fi.addEventListener('change', () => { if (fi.files[0]) loadPhoto(fi.files[0]); });
  }
  const rechoose = $('#rechoose');
  if (rechoose) rechoose.addEventListener('click', () => {
    Object.assign(S.photo, { uploaded:false, dataUrl:null, consent:false, done:false });
    save(); rerender();
  });
  const pc = $('#photoConsent');
  if (pc) pc.addEventListener('change', () => {
    S.photo.consent = pc.checked; save();
    $('#submitPhoto').disabled = !(S.photo.uploaded && pc.checked);
  });
  const sp = $('#submitPhoto');
  if (sp) sp.addEventListener('click', () => {
    S.photo.done = true; save(); rerender();
    toast('Photo submitted. Your badge will be printed and waiting on Day 1.', 'check-circle.svg');
  });
  const ce = $('#confirmExisting');
  if (ce) ce.addEventListener('click', () => {
    S.photo.confirmedExisting = true; save(); rerender();
    toast('Confirmed. Same photo, same badge.', 'check-circle.svg');
  });
  const rp = $('#replacePhoto');
  if (rp) rp.addEventListener('click', () => { S.photo.replacing = true; save(); rerender(); });
}
function loadPhoto(file) {
  if (!/^image\/(jpeg|png)$/.test(file.type)) { toast('JPG or PNG only, please.'); return; }
  if (file.size > 5 * 1024 * 1024) { toast('That file is over 5MB. Try a smaller one.'); return; }
  const r = new FileReader();
  r.onload = () => { S.photo.uploaded = true; S.photo.dataUrl = r.result; save(); rerender(); };
  r.readAsDataURL(file);
}

/* ---------- policies bindings ---------- */
function bindPolicies() {
  const hbh = $('[data-hbhead]');
  if (hbh) hbh.addEventListener('click', e => {
    if (e.target.closest('.am')) return;
    S.policies.hbOpen = !S.policies.hbOpen; save(); rerender();
  });
  // DocuSign is simulated: a short hand-off, then the signature comes back
  // with its time (A-76).
  $$('[data-hbsign]').forEach(b => b.addEventListener('click', () => {
    b.disabled = true; b.textContent = 'Opening DocuSign…';
    setTimeout(() => {
      (S.policies.hbSigned = S.policies.hbSigned || {})[b.dataset.hbsign] = `${dueText(simToday())}, ${new Date().toTimeString().slice(0, 5)}`;
      save(); rerender(); toast('Signed in DocuSign. The signed copy stays in DocuSign.', 'check-circle.svg');
    }, 700);
  }));
  $$('[data-dochead]').forEach(h => h.addEventListener('click', e => {
    if (e.target.closest('.am')) return;
    const id = h.dataset.dochead;
    S.policies.open[id] = !S.policies.open[id];
    save(); rerender();
  }));
  let autoRead = false;
  $$('[data-doctext]').forEach(box => {
    const id = box.dataset.doctext;
    const check = () => {
      if (S.policies.read[id]) return;
      if (box.scrollTop + box.clientHeight >= box.scrollHeight - 16) { S.policies.read[id] = true; save(); rerender(); }
    };
    box.addEventListener('scroll', check);
    if (!S.policies.read[id] && box.scrollHeight <= box.clientHeight + 4) { S.policies.read[id] = true; save(); autoRead = true; }
  });
  if (autoRead) { rerender(); return; }
  $$('[data-ack]').forEach(b => b.addEventListener('click', () => {
    b.disabled = true; b.textContent = 'Opening DocuSign…';
    setTimeout(() => { S.policies.acked[b.dataset.ack] = true; save(); rerender(); }, 700);
  }));
  const cobc = $('[data-cobc]');
  if (cobc) cobc.addEventListener('click', () => {
    toast('Opening codeofbusinessconduct.equinix.com in a new tab (simulated, so in the real thing you’d sign in with your Equinix account).', 'external-link.svg');
    setTimeout(() => { S.policies.cobcVisited = true; save(); rerender(); }, 1400);
  });
  const sub = $('#submitPolicies');
  if (sub) sub.addEventListener('click', () => {
    S.policies.submitted = true; save(); rerender();
    toast('Everything signed. Task complete.', 'check-circle.svg');
  });
}

/* ---------- global delegation ---------- */
document.addEventListener('click', e => {
  const t = e.target;

  if (typeof hmGlobalClick === 'function' && hmGlobalClick(t)) return;

  const amEl = t.closest('.am');
  if (amEl) { e.stopPropagation(); openAssumptions(amEl.dataset.am); return; }

  // Sidekick: suggested questions, feedback, the person handoff (js/sidekick.js)
  if (skClick(t)) return;

  const ae = t.closest('[data-aentry]');
  if (ae) {
    const a = ASSUMPTIONS.find(x => x.id === ae.dataset.aentry);
    if (!a || !a.route) return;
    closePanels();
    const go = () => setTimeout(() => {
      $$('[data-assume]').forEach(el => {
        if (el.dataset.assume.split(' ').includes(a.id)) {
          el.classList.add('assume-flash');
          el.scrollIntoView({ block:'center', behavior:'smooth' });
          setTimeout(() => el.classList.remove('assume-flash'), 2400);
        }
      });
    }, 120);
    if (location.hash !== a.route) { location.hash = a.route; setTimeout(go, 150); }
    else go();
    return;
  }

  // the live to-do timeline: switch phase (A-56)
  const tp = t.closest('[data-todophase]');
  if (tp) { S.todoPhase = +tp.dataset.todophase; save(); rerender(); return; }

  // incident tabs, as the live ticket has them (A-54)
  const itab = t.closest('[data-inctab]');
  if (itab) { S.incTab = itab.dataset.inctab; save(); rerender(); return; }

  // readiness tracker: open one step's own fulfilment tracker (A-52)
  const rt = t.closest('[data-rtstep]');
  if (rt) {
    S.trackerOpen = S.trackerOpen === rt.dataset.rtstep ? null : rt.dataset.rtstep;
    save(); rerender(); return;
  }

  if (t.closest('[data-video]')) { toast('This plays the existing onboarding video. It isn’t embedded in the prototype.', 'play.svg'); return; }
  const more = t.closest('[data-skmore]');
  if (more) {
    const w = more.dataset.skmore; SK_MORE[w] = !SK_MORE[w];
    if (w === 'panel') renderSidekick(); else rerender();
    return;
  }
  const nav = t.closest('[data-goto]');
  if (nav) { closePanels(); $('#protoDrawer').classList.remove('show');
    if (nav.dataset.phase != null) { S.todoPhase = +nav.dataset.phase; save(); }
    if (location.hash === nav.dataset.goto) rerender(); else location.hash = nav.dataset.goto; return; }
  const tc = t.closest('[data-task]');
  if (tc && !t.closest('[data-openchat]')) { location.hash = tc.dataset.task; return; }

  // jump to the adjustments section on Tab 3 (mirrored link from equipment)
  const car = t.closest('[data-car]');
  if (car) {
    const n = INSIDE_CHAPTERS.length;
    S.carousel = (((S.carousel || 0) + (+car.dataset.car)) % n + n) % n;
    save(); rerender(); return;
  }
  const dot = t.closest('[data-cardot]');
  if (dot) { S.carousel = +dot.dataset.cardot; save(); paintInside(); return; }

  const insideMore = t.closest('[data-insidemore]');
  if (insideMore) {
    S.insideOpen = !S.insideOpen; save();
    const strip = $('#insideStrip');
    if (strip) {
      strip.classList.toggle('open', S.insideOpen);
      $('.is-more-t', strip).textContent = S.insideOpen ? 'Close' : 'See more';
    }
    return;
  }

  const uc = t.closest('[data-ucard]');
  if (uc) { uc.classList.toggle('open'); return; }
  const res = t.closest('[data-res]');
  if (res) { const b = $(`[data-resbody="${res.dataset.res}"]`); if (b) b.style.display = b.style.display==='block'?'none':'block'; return; }
  if (t.closest('[data-openchat]')) { openChat(); return; }
  const contact = t.closest('[data-contact]');
  if (contact) { toast(contact.dataset.contact==='teams' ? 'This would open a Teams chat (prototype).' : 'This would open your email app (prototype).'); return; }
  const ext = t.closest('[data-ext]');
  if (ext) {
    const which = ext.dataset.ext;
    toast(which === 'rtw' ? 'This opens the Right to Work system, a separate country-specific task that isn’t built in this prototype.'
      : which === 'handbooks' ? 'This opens the SharePoint site that holds every handbook. Not built in this prototype.'
      : which === 'medical' ? 'This would open the medical-check booking flow. Not built, because what it involves is still being confirmed.'
      : 'This opens another Equinix system, which is not part of this prototype.', 'external-link.svg');
    return;
  }

  const book = t.closest('[data-book]');
  if (book) {
    S.network.booked[book.dataset.book] = book.dataset.slot; save(); rerender();
    toast(`1:1 booked with ${orgPerson(book.dataset.book).name}, ${book.dataset.slot}. They already know you’re starting.`, 'check-circle.svg');
    return;
  }
  const unbook = t.closest('[data-unbook]');
  if (unbook) { delete S.network.booked[unbook.dataset.unbook]; save(); rerender(); return; }

  const reopen = t.closest('[data-reopen]');
  if (reopen) {
    if (reopen.dataset.reopen === 'policies') S.policies._viewing = true;
    save(); rerender(); return;
  }

  const sf = t.closest('[data-side]');
  if (sf) { panelSide = sf.dataset.side; renderAssumptions(); return; }
  if (t.closest('[data-openassume]')) { $('#protoDrawer').classList.remove('show'); openAssumptions(); return; }
  if (t.closest('#chatFab')) { openChat(); return; }
  if (t.closest('#protoFab')) { $('#protoDrawer').classList.toggle('show'); return; }
  if (t.closest('.panel-h .x') || t.id === 'overlay') { closePanels(); return; }

  const pcBtn = t.closest('[data-pc]');
  if (pcBtn) {
    const [k, v] = pcBtn.dataset.pc.split(':');
    if (k === 'scenario') applyScenario(v);
    else if (k === 'notes') { S.notes = (v === 'on'); applyNotes(); save(); }
    else if (k === 'pexUpdate') { S.pexUpdate = (v === 'yes'); save(); }
    else if (k === 'pexsize') { S.pex.size = +v; save(); }
    else {
      S[k] = v;

      if (k === 'persona' && v === 'external') { S.photo.confirmedExisting = false; S.photo.replacing = false; }
      save();
    }
    rerender();
    $('#protoDrawer').classList.add('show');
    return;
  }
  /* ---------- People Experience coordinator ---------- */
  const nudge = t.closest('[data-pexnudge]');
  if (nudge) {
    const [hid, qid] = nudge.dataset.pexnudge.split(':');
    (S.pex.nudged[hid] = S.pex.nudged[hid] || {})[qid] = true;
    const h = pexHire(hid), q = PEX_QUEUES.find(x => x.id === qid);
    const w = q.waiting(h);
    save(); rerender();
    if (q.say) { toast(q.say(h), 'check-circle.svg'); return; }
    if (w === 'you') {
      const asked = h.live && S.sidekick.handoffs.length ? S.sidekick.handoffs[S.sidekick.handoffs.length - 1].q : '';
      toast(asked ? `${h.preferred} asked Sidekick: “${esc(asked)}”. Your reply goes by email.`
                  : `Opened for ${h.preferred} ${h.last}. Marked as yours.`, 'check-circle.svg');
    } else {
      const to = w === 'new hire' ? h.preferred : w === 'hiring manager' ? h.mgr : w;
      toast(`Reminder sent to ${to} ${pexChannel(w)}: ${q.label.toLowerCase()}.`, w === 'hiring manager' ? 'comment-lines.svg' : 'email.svg');
    }
    return;
  }
  const batch = t.closest('[data-pexbatch]');
  if (batch) {
    const qid = batch.dataset.pexbatch, q = PEX_QUEUES.find(x => x.id === qid);
    const hires = pexQueue(q).filter(h => q.waiting(h) !== 'you');
    hires.forEach(h => { (S.pex.nudged[h.id] = S.pex.nudged[h.id] || {})[qid] = true; });
    save(); rerender();
    const w = hires.length ? q.waiting(hires[0]) : '';
    if (q.sayAll && hires.length) { toast(q.sayAll(hires), 'check-circle.svg'); return; }
    toast(hires.length
      ? `${hires.length} reminder${hires.length > 1 ? 's' : ''} sent ${pexChannel(w)}, for ${q.label.toLowerCase()}.`
      : 'Nothing to send: every item in that queue is yours to work.', 'email.svg');
    return;
  }
  // Sidekick's questions on Today become a caseload filter (A-74)
  const pask = t.closest('[data-pexask]');
  if (pask) {
    const a = PEX_ASKS.find(x => x.id === pask.dataset.pexask);
    S.pex.filters = Object.assign({}, a.f); S.pex.savedView = null; save();
    location.hash = '#/pex/caseload';
    toast(`Sidekick filtered your caseload: ${a.q.charAt(0).toLowerCase() + a.q.slice(1)}`, 'sparkle.svg');
    return;
  }
  const pview = t.closest('[data-pexview]');
  if (pview) {
    const v = PEX_SAVED_VIEWS.find(x => x.id === pview.dataset.pexview);
    S.pex.filters = Object.assign({}, v.f); S.pex.savedView = v.id;
    save(); rerender(); return;
  }
  if (t.closest('[data-pexsaveview]')) {
    toast('Saved views can be private or shared with the team. Prototype: not stored.', 'save.svg');
    return;
  }
  if (t.closest('[data-pexclear]')) { S.pex.filters = {}; S.pex.savedView = null; save(); rerender(); return; }
  const pfil = t.closest('[data-pexfilter]');
  if (pfil) { S.pex.filters = { queue: pfil.dataset.pexfilter }; S.pex.savedView = null; save(); return; }
  const wait = t.closest('[data-pexwait]');
  if (wait) { wait.closest('td').classList.toggle('open'); return; }
  const bploc = t.closest('[data-pexbploc]');
  if (bploc) { S.pex.blueprint.loc = bploc.dataset.pexbploc; S.pex.blueprint.dirty = false; save(); rerender(); return; }
  if (t.closest('[data-pexbppublish]')) {
    S.pex.blueprint.dirty = false;
    S.pexUpdate = true;                 // the same flag the prototype control sets (M-32)
    save(); rerender();
    toast(`Published to ${S.pex.blueprint.loc}. Managers who already confirmed have had that task reopened.`, 'bullhorn.svg');
    return;
  }


  if (t.closest('#brandHome')) { location.hash = S.view === 'hm' ? '#/hm/' : S.view === 'pex' ? '#/pex/' : '#/'; return; }

  const vs = t.closest('[data-view]');
  if (vs) {
    const want = vs.dataset.view;
    if (want !== S.view) {
      S.view = want; save();
      location.hash = want === 'hm' ? '#/hm/' : want === 'pex' ? '#/pex/' : '#/';
    }
    return;
  }
  if (t.closest('#rbAssume')) { openAssumptions(); return; }
  if (t.closest('#rbFlow')) { location.hash = '#/flow'; return; }

  if (!t.closest('#protoDrawer') && !t.closest('#protoFab')) $('#protoDrawer').classList.remove('show');
});

function openChat() {
  skHelloClose();
  renderSidekick();
  $('#chatPanel').classList.add('show');
  $('#overlay').classList.add('show');
}
function sendChat() {
  const inp = $('#chatInput');
  if (inp && inp.value.trim()) { const q = inp.value.trim(); inp.value = ''; skAsk(q); }
}

window.addEventListener('hashchange', render);
// The flow lanes are packed against a measured track width, so a resize has
// to re-pack them. Cheap, and only does work when that screen is open.
window.addEventListener('resize', () => {
  if ((location.hash || '#/') === '#/flow') layoutFlowLanes();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closePanels(); $('#protoDrawer').classList.remove('show'); } });

// The ask bars in the scenes are forms, so Enter and the button both land here.
document.addEventListener('submit', e => {
  const f = e.target.closest('[data-askform]');
  if (!f) return;
  e.preventDefault();
  const inp = f.querySelector('[data-askinput]');
  const q = inp ? inp.value.trim() : '';
  if (inp) inp.value = '';
  if (q) skAsk(q); else openChat();
});

document.addEventListener('DOMContentLoaded', () => {
  $('#chatSendBtn').addEventListener('click', sendChat);
  $('#chatInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });
  render();
});
