/* ============================================================
   New Hire Pre-Day 1 Portal, interactive prototype.  v3
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

/* ---------------- state ---------------- */
const DEFAULT_STATE = () => ({
  // v3: one state object, two lenses. `view` is a prototype device. A real
  // manager and a real new hire are different people on different screens.
  view: 'nh',                    // nh | hm
  buddyRule: 'assignment',       // assignment | 72h   (L-01, the live conflict)
  persona: 'external',           // external | conversion
  country: 'US',                 // US | JP
  horizon: '2wk',                // 2wk | 3mo  (A-45)
  scenario: 'default',           // default | inprogress | review | overdue | complete
  trackerOpen: null,             // which readiness step is expanded (A-52)
  incTab: 'activity',            // incident tab: activity | attachments | summary (A-54)
  todoPhase: 0,                  // which phase the live to-do view is showing (A-56)
  startdate: { confirmed:false, changeRequested:false, requestedDate:'', reason:'' },
  bgcheck: { launched:false },
  details: { tab:0, submitted:false, queryRaised:false, data:{} },
  equipment: { choice:'', items:{}, shipOffice:'', shipPhone:'', submitted:false, comment:'', comments:[] },
  jd: { state:'notstarted', scrolled:false, acked:false, dissent:false, dissentText:'' },
  intro: { text:'', consent:false, useBadge:false, saved:false, dismissed:[], done:false },
  photo: { uploaded:false, dataUrl:null, consent:false, done:false, confirmedExisting:false, replacing:false },
  policies: { open:{}, read:{}, acked:{}, cobcVisited:false, submitted:false },
  network: { booked:{} },
  // ---- hiring manager side ----
  hm: {
    contactConfirmed: false, workPhone: '+1 303 555 0188',
    channels: { accepted:false },
    logistics: { confirmed:false, whereToBe:'', available:true, proxy:'', teamNote:'' },
    computer: { ordered:false, model:'', reason:'' },
    software: { confirmed:false, added:[] },
    // A name is not a commitment. Both roles have to accept (M-27).
    buddy: { assigned:null, notified:false, accepted:false },
    ambassador: { assigned:null, notified:false, accepted:false },
    calendar: { confirmed:false, holds:{} },
    welcome: { sent:false, body:'', personal:'' },
    network: { named:{}, submitted:false },
    intro: { forwarded:false },
    card: { needed:null },            // null = unanswered, true/false = decided (L-10)
  },
});

let S = load();
function load() {
  try {
    const raw = localStorage.getItem('onbd-proto-v3');
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
  return seedDetails(DEFAULT_STATE());
}
function save() { localStorage.setItem('onbd-proto-v3', JSON.stringify(S)); }

function seedDetails(st) {
  // Pre-filled from the offer (A-01): legal name, personal email, mobile, country of hire.
  st.details.data = Object.assign({
    legalFirst: HIRE.legalFirst, legalMiddle:'', legalLast: HIRE.legalLast,
    preferred:'', pronouns:'', country: st.country === 'JP' ? HIRE.countryJP : HIRE.countryUS,
    idDoc:'', idFileName:'',
    addr1:'', addr2:'', city:'', state:'', zip:'',
    email: HIRE.email, ccode: st.country==='JP' ? '+81' : '+1', mobile: HIRE.mobile,
    ec1name:'', ec1rel:'', ec1relOther:'', ec1phone:'', ec1alt:'', ec1email:'',
    ec2on:false, ec2name:'', ec2rel:'', ec2relOther:'', ec2phone:'', ec2alt:'', ec2email:'',
    language: st.country==='JP' ? 'Japanese' : 'English (US)',
    channel:'', updatesOptIn:false,
    adjustText:'', adjustPrivate:false,
    sidOpen:false, sidGender:'', sidEthnicity:'', sidVeteran:'', sidDisability:'',
  }, st.details.data);
  return st;
}
S = seedDetails(S);

const PREFILLED = ['legalFirst','legalLast','email','ccode','mobile'];

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
function detailsProgress() {
  const req = requiredFields();
  return { done: req.filter(validField).length, total: req.length };
}
function detailsStatus() {
  if (S.details.submitted) return 'done';
  const d = S.details.data;
  const touched = ['addr1','city','zip','ec1name','preferred','channel','idDoc'].some(f => d[f]) || d._touched;
  return touched ? 'inprogress' : 'notstarted';
}
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
  return Object.values(S.policies.acked).filter(Boolean).length > 0 ? 'inprogress' : 'notstarted';
}
const COUNTED = ['startdate','bgcheck','equipment','details','jd','intro','policies'];
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
/* The seven counted pre-Day 1 tasks. Shared, so the landing page and the
   platform's own to-do view read the same list (A-56). */
function taskList() {
  const jp = S.country === 'JP';

  const tasks = [
    // Triggered at offer acceptance, so these precede equipment (A-49, A-50)
    { key:'startdate', route:'#/startdate', icon:'calendar.svg',
      name:'Confirm your start date',
      why:'Everything else in this list is dated from it, so it comes first',
      est:'1 min', estMark:'A-23', status:startdateStatus(), marker:'A-49' },
    { key:'bgcheck', route:'#/bgcheck', icon:'shield-check.svg',
      name:'Start your background check',
      why:'It runs in the background and takes a while, so the sooner it starts the better',
      est:'5 min', estMark:'A-23', status:bgcheckStatus(), marker:'A-50' },
    // Equipment, the earliest of the provisioning tasks. Nothing gates it today (A-33)
    { key:'equipment', route:'#/equipment', icon:'laptop.svg',
      name:'Choose your workspace accessories',
      why:'First, so it has time to be built, shipped and waiting for you on Day 1',
      est:'4 min', estMark:'A-23', status:equipmentStatus(), marker:'A-33' },
    { key:'details', route:'#/details', icon:'user-circle.svg',
      name:'Your personal and contact details',
      why:'So we can set up your record, reach you, and know who to call in an emergency',
      est:'5 min', estMark:'', status:detailsStatus(),
      prog: detailsStatus()==='inprogress' ? detailsProgress() : null },
    { key:'jd', route:'#/jd', icon:'file-alt.svg',
      name:'Review your job description',
      why:'Confirm the role you’re joining is the one you agreed to',
      est:'3 min', estMark:'A-22', status:jdStatus() },
    { key:'intro', route:'#/intro', icon:'comment-smile.svg',
      name:'Introduce yourself and add your photo',
      why:'Help your team meet you, and get your badge ready before you arrive',
      est:'5 min', estMark:'A-22', status:introStatus() },
    { key:'policies', route:'#/policies', icon:'shield-check.svg',
      name:'Policies and privacy notices',
      why:'The documents we need you to read and acknowledge before you start',
      est:'10 min', estMark:'A-23', status:policiesStatus(),
      prog: policiesStatus()==='inprogress'
        ? { done:Object.values(S.policies.acked).filter(Boolean).length, total:DOCS.length } : null },
  ];
  return tasks;
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

  return `
  <div class="page">
    ${all ? `
    <div class="ready-banner" data-assume="A-25">
      ${ic('check-circle.svg','xl')}
      <div>
        <h2>You’re ready for Day 1, ${esc(HIRE.preferred)}.</h2>
        <p>Everything we needed before your start date is done. Between now and ${startDateText()},
        two things happen without you: your accessories ship, and your badge gets printed. Three days before you start,
        your first-day details and setup instructions turn up here. More to-dos arrive once you’ve started, and
        nothing before then.</p>
      </div>
    </div>` : ''}

    ${S.hm.welcome.sent ? `
    <div class="welcome-note" data-assume="L-08">
      <div class="avatar mgr">${MANAGER.initials}</div>
      <div class="wn-body">
        <div class="wn-h">A note from ${HIRE.manager}, your manager ${am('L-08')}</div>
        <div class="wn-text">${esc((S.hm.welcome.body || WELCOME_BOILERPLATE) + (S.hm.welcome.personal ? '\n\n' + S.hm.welcome.personal : ''))}</div>
      </div>
    </div>` : ''}

    <div class="hero hexfield">
      ${heroArt()}
      <div class="hero-copy">
        <div class="eyebrow">Before Day 1</div>
        <h1>Welcome, ${esc(HIRE.preferred)}.</h1>
        <p class="lede">You start as ${esc(HIRE.role)} on <b>${startDateText()}</b>, ${days} days from now.
        A few things need doing before then. Take them in any order. Your progress saves as you go.</p>
        <div class="prog-row" data-assume="A-25 A-44">
          <div class="prog-count">
            <div class="nums"><span>${done} of ${tasks.length} tasks done</span>${am('A-25')}</div>
            <div class="prog-bar"><i style="width:${(done/tasks.length)*100}%"></i></div>
          </div>
          <div class="miles">
            ${PHASES.map((p,i) => {
              const st = i === 0 ? (all ? 'done' : 'now') : (all && i === 1 ? 'now' : '');
              return `<div class="mile ${st}" data-goto="#/todos" data-phase="${i}" title="See what sits in this phase">
                <div class="bar"></div>
                <div class="dot">${st==='done' ? ic('check.svg','sm') : st==='now' ? '<i></i>' : ''}</div>
                <div class="lbl">${p}</div>
              </div>`;
            }).join('')}
            <span class="miles-mark">${am('A-44')}</span>
          </div>
        </div>
      </div>
    </div>

    ${conv ? `
    <div class="panel-note" style="max-width:820px;">${ic('info-circle.svg')} Because you’re converting from a contract role,
      some tasks are shorter. We already hold your details from your time here, so mostly you’ll be checking what we have.</div>` : ''}

    <div class="landing-grid">
      <div>
        <div class="section-h"><h2>Do these now</h2><span class="hint">Open for action</span></div>
        <div class="tcards">
          ${tasks.map(taskCard).join('')}

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
              ${ic('chevron-right.svg','lg')}
            </div>
          </div>
        </div>

        <div class="section-h"><h2>Also open now</h2><span class="hint">Yours to do, but they finish somewhere else, so they don’t count towards your progress</span></div>
        <div class="ocards">
          <div class="ocard live">
            <div class="tic">${ic('id-card.svg')}</div>
            <div class="o-main">
              <div class="o-name">Right to work documents <span class="chip info">Available now</span></div>
              <div class="o-note">Country-specific, and nothing is holding it up, so start whenever you like.
              You finish it in the Right to Work system, not here.</div>
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

        <div class="section-h"><h2>Coming up</h2><span class="hint">Nothing to do yet</span></div>
        <div class="overflow-line">${ic('info-circle.svg','sm')}<b>More to-dos may be assigned later.</b></div>
        <div class="ucards">
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
          ${COMING_UP.map((u,i) => `
            <div class="ucard" data-ucard="${i}" ${u.name.includes('first day details') ? 'data-assume="L-07"' : ''}>
              <div class="u-row">
                ${ic(u.icon)}
                <span class="u-name">${u.name}${u.marker ? am(u.marker) : ''}</span>
                ${u.name.includes('first day details') && S.hm.logistics.confirmed
                  ? `<span class="chip done">${ic('check.svg','sm')}Confirmed by ${HIRE.manager.split(' ')[0]}</span>` : ''}
                <span class="u-open">${ic('clock.svg','sm')}${u.opens}</span>
              </div>
              ${u.note ? `<div class="u-note">${u.note}</div>` : ''}
              <div class="u-expl">${u.expl}${u.name.includes('first day details') && S.hm.logistics.confirmed
                ? `<div class="mt8"><b>${HIRE.manager} has already confirmed these:</b> ${esc(S.hm.logistics.whereToBe)}${S.hm.logistics.teamNote ? '. ' + esc(S.hm.logistics.teamNote) : ''}${S.hm.logistics.available ? '' : ` She’s away on your first day; ${esc(S.hm.logistics.proxy)} will meet you instead.`} ${am('L-07')}</div>` : ''}</div>
            </div>`).join('')}
        </div>

        <div class="section-h"><h2>Handled by other teams</h2><span class="hint">Not yours on purpose, listed so you can see nothing has been forgotten</span></div>
        <div class="ocards">
          <div class="ocard" data-assume="A-10 A-11">
            <div class="tic">${ic('banking.svg')}</div>
            <div class="o-main">
              <div class="o-name">Banking and direct deposit ${am('A-11')}</div>
              <div class="o-note">Payroll will be in touch about this separately. Bank details are collected by Payroll in their own
              secure form. Bank data is handled differently from the rest of your profile, so it never passes through this portal. ${am('A-10')}</div>
            </div>
          </div>
          <div class="ocard">
            <div class="tic">${ic('id-card.svg')}</div>
            <div class="o-main">
              <div class="o-name">Tax forms and withholding <span class="chip info">Payroll</span></div>
              <div class="o-note">Country-specific, and Payroll runs it on their own timetable. Nothing passes through this portal.</div>
            </div>
          </div>
        </div>
      </div>

      ${landingRail()}
    </div>

    <div class="live-link" data-goto="#/todos">
      ${ic('list-tasks.svg','lg')}
      <div><b>See the platform's own to-do view</b>
      <p>The live portal groups these by phase and counts one phase at a time. Worth comparing against the
      list above before either model is agreed. ${am('A-56')}</p></div>
      ${ic('chevron-right.svg','lg')}
    </div>

    <div class="section-h" style="margin-top:34px;"><h2>Everything else in motion</h2>
      <span class="hint">Owned by other people, shown so you can see it moving</span></div>
    ${readinessTracker('nh')}

    <div class="section-h" style="margin-top:34px;"><h2>While you wait</h2>
      <span class="hint">Reading, not a task</span></div>
    ${insideCarousel()}
  </div>`;
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
        <b>Stuck on something?</b> <span class="help-link" data-openchat="1">Message Maya</span>. That’s what she’s there for.</span></div>` : ''}
    </div>
    <div class="t-side">
      ${chip(t.status, od)}
      ${ic('chevron-right.svg','lg')}
    </div>
  </div>`;
}

/* ---------- right rail: four contacts (A-31, A-32) + reference reading ---------- */
function contactRow(p, extra='') {
  return `
  <div class="contact">
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
        <div class="c-extra">${HIRE.manager} picks someone from your team, a person to ask the things you’d rather
        not ask your manager, for your first three months and beyond. If she hasn’t by the day before you start, one is
        assigned automatically. ${am('L-01')}</div>
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
    `<div class="c-extra">${ic('clock.svg','sm')} ${assigned.tz}<br>Chosen by ${HIRE.manager} ${am('A-31')} ${am('L-01')}</div>`
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
      ${contactRow(PEOPLE.pex)}
      ${contactRow(PEOPLE.recruiter)}
      <div class="rail-note">Daniel hands over to Maya a week after your offer was signed. From then on, Maya is your first contact.</div>
    </div>

    <div class="rail-card">
      <h3>Good to know</h3>
      <ul class="res-list">
        <li><a data-res="inside">${ic('chevron-right.svg','sm')}Inside Equinix ${am('A-35')}</a>
          <div class="u-expl" data-resbody="inside">
            Six short modules, here whenever you want them:
            <ul class="mod-list">${insideModules().map(m => `<li>${m}</li>`).join('')}</ul>
            <b>Nothing here is required, and nothing is tracked.</b>
            <div class="intent-note">${ic('bullhorn.svg','sm')}<span><b>Where this is headed:</b> a carousel above your progress tracker, releasing
            modules as your start date gets closer. It currently lives as a <b>Day 1</b> to-do in the live portal, and moving it
            here is a move, not a re-skin.</span></div>
          </div></li>
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
        <li><a data-res="who">${ic('chevron-right.svg','sm')}Who to contact for what</a>
          <div class="u-expl" data-resbody="who">Your offer or your role, ask Daniel. These tasks, your start date and logistics, ask Maya.
          What the job is actually like day to day, ask Nina, your buddy. Anything technical with this portal, use the assistant at the bottom right.</div></li>
      </ul>
    </div>
  </div>`;
}

/* Everyone the MANAGER named, with their role (L-06). Keyed by person id
   now that the buddy, the ambassador and the rest live on one screen.
   Empty until submitted, which is what the new hire's waiting state shows. */
function namedNetwork() {
  const H = S.hm, out = [];
  const add = (id, role) => {
    const p = orgPerson(id);
    if (p) out.push(Object.assign({}, p, { meetRole: role, accepted: H[role] ? H[role].accepted : true,
      why: H.network.named[id] || '' }));
  };
  if (H.buddy.assigned) add(H.buddy.assigned, 'buddy');
  if (H.ambassador && H.ambassador.assigned) add(H.ambassador.assigned, 'ambassador');
  Object.keys(H.network.named || {}).forEach(id => {
    if (id !== H.buddy.assigned && !(H.ambassador && id === H.ambassador.assigned)) add(id, 'other');
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
  const bothOrdered = H.computer.ordered && E.submitted;
  let eq = 0;
  if (H.computer.ordered || E.submitted) eq = 0;
  if (bothOrdered) { eq = 1; if (d <= 9) eq = 2; if (d <= 6) eq = 3; if (d <= 3) eq = 4; }
  out.equipment = { at: eq, note: bothOrdered ? '' :
    (H.computer.ordered ? 'Waiting on the accessories order.'
      : E.submitted ? 'Waiting on the manager to order the computer.'
      : 'Neither order has been placed.') };

  // Applications. The persona cannot be resolved, so this one is stuck at
  // its first stage on purpose. That is the honest state today (M-04).
  out.apps = H.software.confirmed
    ? { at: 2, note: 'Confirmed by hand, because nothing could be suggested.' }
    : { at: 0, blocked: true, note: 'No persona is mapped for this role, so there is no default stack to confirm.' };

  // Badge and workspace.
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

  // Paperwork.
  let pw = 0;
  if (S.startdate.confirmed) pw = 1;
  if (pw === 1 && S.bgcheck.launched) pw = 2;
  if (pw === 2 && S.details.submitted) pw = 3;
  if (pw === 3 && S.policies.submitted) pw = 4;
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
        <div class="rt-title">Onboarding readiness</div>
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
      <button class="rt-close" data-rtstep="${r.id}" aria-label="Close">✕</button>
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

/* Hero art. Three nested Fortress hexagons on the brand tilt, the innermost
   filled with a linear gradient. Abstract, one idea, no radial fills. */
function heroArt() {
  return `
  <div class="hero-art" aria-hidden="true">
    <svg viewBox="0 0 340 300" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="heroCore" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#85F0F8" stop-opacity=".95"/>
          <stop offset="100%" stop-color="#7739D9" stop-opacity=".55"/>
        </linearGradient>
      </defs>
      <g transform="translate(-40 36) scale(1.3) rotate(20 200 107)">
        <path d="M118 60 l82 -47 82 47 v94 l-82 47 -82 -47z" fill="none" stroke="rgba(255,255,255,.62)" stroke-width="2"/>
        <path d="M145 76 l55 -31 55 31 v62 l-55 31 -55 -31z" fill="none" stroke="rgba(255,255,255,.44)" stroke-width="1.5"/>
        <path d="M172 92 l28 -16 28 16 v32 l-28 16 -28 -16z" fill="url(#heroCore)"/>
      </g>
    </svg>
  </div>`;
}

function insideCarousel() {
  const i = S.carousel || 0;
  const c = INSIDE_CHAPTERS[i];
  const a = CHAPTER_ART[i];
  return `
  <section class="showcase" data-assume="A-35">
    <div class="sc-stage hexfield">
      <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${a.g[0]}"/>
            <stop offset="55%" stop-color="${a.g[1]}"/>
            <stop offset="100%" stop-color="${a.g[0]}"/>
          </linearGradient>
          <linearGradient id="f1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity=".92"/>
            <stop offset="100%" stop-color="#85F0F8" stop-opacity=".72"/>
          </linearGradient>
        </defs>
        <rect width="400" height="260" fill="url(#bg)"/>
        ${a.art}
      </svg>
      <span class="sc-num">${c.n}</span>
    </div>

    <div class="sc-copy">
      <div class="sc-eyebrow">Inside Equinix <span class="sc-ch">${c.n} ${c.title}</span></div>
      <h2 class="sc-title">${c.head}</h2>
      <p class="sc-line">${c.line}</p>

      ${c.facts ? `<div class="sc-facts">${c.facts.map(f => `
        <div class="sc-fact"><b>${f[0]}</b><span>${f[1]}</span></div>`).join('')}</div>` : ''}

      ${c.list ? `<ul class="sc-list">${c.list.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}

      ${c.watch ? `<div class="sc-watch">${ic('image.svg','sm')}<span>${c.watch}</span></div>` : ''}

      <div class="sc-thumbs">
        ${INSIDE_CHAPTERS.map((ch,k) => `
          <button class="sc-thumb ${k===i?'on':''}" data-cardot="${k}" title="${ch.n} ${ch.title}">
            <span class="sct-swatch" style="background:linear-gradient(135deg, ${CHAPTER_ART[k].g[0]}, ${CHAPTER_ART[k].g[1]})"></span>
            <span class="sct-n">${ch.n}</span>
          </button>`).join('')}
      </div>
    </div>
  </section>

  <div class="reflect" data-assume="A-35 L-12">
    <div class="rf-h">${ic('comment-smile.svg','lg')}<h3>Reflection prompt</h3></div>
    <ul class="rf-q">${c.reflect.map(q => `<li>${q}</li>`).join('')}</ul>
    <p class="rf-note">${REFLECT_NOTE} ${am('L-12')}</p>
  </div>

  <p class="sc-foot">Six short chapters about the company you are joining. Read them whenever you like.
  Nothing here is a task and nothing is tracked. ${am('A-35')}</p>`;
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
          <div class="callout">
            ${ic('exclamation-triangle.svg')}
            <div><b>Nobody has defined what happens next.</b> Who approves a change, how late one can be requested, and what
            happens to work already in flight, such as an equipment order placed, a badge queued for print or calendar holds booked,
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
      <p class="why">It runs on its own once you start it, and it can take a couple of weeks. The sooner it begins, the less it holds up.</p>
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
            <div>What the check covers, and how long it takes, varies by country. This screen doesn’t show that variation yet.
            the prototype shows one path. ${am('A-50')}</div></div>
          <button class="btn quiet mt16" id="bgUndo">Undo (prototype)</button>
        ` : `
          <p style="font-size:14px; font-weight:350; max-width:640px; margin-bottom:16px;">
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
   Personal & contact details wizard
   ============================================================ */
const REL_OPTIONS = ['Spouse or partner','Parent','Sibling','Child','Friend','Other'];

function requiredFields() {
  const d = S.details.data;
  let req = ['legalFirst','legalLast','addr1','city','state','zip','email','ccode','mobile',
             'ec1name','ec1rel','ec1phone','language','channel'];
  if (d.ec1rel === 'Other') req.push('ec1relOther');
  if (d.ec2on) {
    req = req.concat(['ec2name','ec2rel','ec2phone']);
    if (d.ec2rel === 'Other') req.push('ec2relOther');
  }
  return req;
}
const FIELD_LABELS = {
  legalFirst:'Legal first name', legalLast:'Legal last name', addr1:'Address line 1', city:'City',
  state: () => S.country==='JP' ? 'Prefecture' : 'State', zip: () => S.country==='JP' ? 'Postal code' : 'ZIP code',
  email:'Personal email', ccode:'Country code', mobile:'Mobile number',
  ec1name:'Emergency contact name', ec1rel:'Relationship', ec1relOther:'Relationship (other)',
  ec1phone:'Emergency contact phone', ec2name:'Second contact name', ec2rel:'Second contact relationship',
  ec2relOther:'Second contact relationship (other)', ec2phone:'Second contact phone',
  language:'Preferred language', channel:'Preferred contact channel',
};
const fieldLabel = f => typeof FIELD_LABELS[f]==='function' ? FIELD_LABELS[f]() : (FIELD_LABELS[f]||f);
const FIELD_TAB = f => {
  if (f.startsWith('ec')) return 1;
  if (['language','channel'].includes(f)) return 2;
  return 0;
};

function validField(f) {
  const v = (S.details.data[f] ?? '').toString().trim();
  if (!v) return false;
  if (f.includes('email')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  if (f.includes('phone') || f === 'mobile') return v.replace(/\D/g,'').length >= 7;
  return true;
}
function tabCounts() {
  const req = requiredFields();
  return [0,1,2].map(t => {
    const fs = req.filter(f => FIELD_TAB(f) === t);
    return { done: fs.filter(validField).length, total: fs.length };
  });
}

function inp(f, label, opts={}) {
  const d = S.details.data;
  const pre = PREFILLED.includes(f);
  const req = requiredFields().includes(f);
  const invalid = d['_err_'+f];
  return `
  <div class="field ${pre?'prefilled':''} ${invalid?'invalid':''} ${opts.cls||''}" data-f="${f}">
    <label>${label}${req ? '' : ' <span class="opt">(optional)</span>'}${pre ? `<span class="prefill-tag">${ic('check.svg','sm')}From your offer</span>` : ''}${opts.marker ? ' '+am(opts.marker) : ''}</label>
    <input type="${opts.type||'text'}" value="${esc(d[f])}" data-input="${f}" ${opts.ph?`placeholder="${opts.ph}"`:''}>
    <div class="err">${opts.err || `Please add your ${label.toLowerCase()}.`}</div>
    ${opts.note ? `<div class="note">${opts.note}</div>` : ''}
  </div>`;
}

function renderDetails() {
  if (S.details.submitted && !S.details._viewing) return detailsDoneScreen();
  const ro = S.details.submitted && S.details._viewing;
  const counts = tabCounts();
  const tab = S.details.tab;
  const jp = S.country === 'JP';
  const tabs = ['Details','Emergency contact','Preferences'];
  const missing = requiredFields().filter(f => !validField(f));

  return `
  <div class="page">
    ${crumbs('Your personal and contact details')}
    <div class="task-head" data-assume="A-10">
      <h1>Your personal and contact details ${am('A-10')}</h1>
      <p class="why">So we can set up your record, reach you, and know who to call in an emergency.
      Fields marked <span class="prefill-tag">${ic('check.svg','sm')}From your offer</span> came from what you gave us earlier ${am('A-01')}. Check them, and change anything that’s wrong. The rest is yours to add.</p>
    </div>
    <div class="task-shell" data-assume="A-01">
      <div class="wiz-tabs">
        ${tabs.map((t,i) => `
          <button class="wiz-tab ${i===tab?'on':''}" data-tab="${i}">
            ${t}
            <span class="tab-count ${counts[i].done===counts[i].total?'ok':''}" data-tabcount="${i}">${counts[i].done===counts[i].total ? '✓' : counts[i].done+' of '+counts[i].total}</span>
          </button>`).join('')}
      </div>
      <div class="wiz-body">
        ${tab===0 ? tabDetails(jp) : tab===1 ? tabEmergency() : tabPreferences()}
      </div>
      <div class="wiz-foot">
        ${ro
          ? `<span class="saved-state">${ic('check-circle.svg','sm')}Submitted, and read-only from here. If something changes, tell ${PEOPLE.pex.name}.</span>
             <span class="missing"></span>
             <button class="btn secondary" data-goto="#/">Back to your tasks</button>`
          : `<span class="saved-state" id="savedState">${ic('save.svg','sm')}Draft saves automatically as you type</span>
             <span class="missing" id="missingLine">${missing.length ? `Still needed: ${missing.slice(0,4).map(fieldLabel).join(', ')}${missing.length>4 ? ` and ${missing.length-4} more` : ''}` : 'Everything required is filled in.'}</span>
             <button class="btn primary" id="submitDetails" ${missing.length?'disabled':''}>Submit my details</button>`}
      </div>
    </div>
  </div>`;
}

function tabDetails(jp) {
  const d = S.details.data;
  const addrDone = ['addr1','city','state','zip'].every(validField);
  const docs = ID_DOCS[jp ? 'JP' : 'US'];
  const chosen = docs.find(x => x.v === d.idDoc);
  return `
    <div class="form-sec">
      <h3>Legal name</h3>
      <p class="sec-note">This has to match your official documents. It’s what goes on your record.</p>
      <div class="field-row">
        ${inp('legalFirst','First name')}
        ${inp('legalMiddle','Middle name')}
      </div>
      ${inp('legalLast','Last name')}
      ${inp('preferred','Preferred name',{note:'What we’ll use in communications and on the team directory. If you leave it blank, we’ll use your legal first name.'})}
      ${inp('pronouns','Pronouns',{marker:'A-04', ph:'e.g. she/her, they/them', note:'Optional, shown alongside your name where you choose.'})}
    </div>

    <div class="form-sec">
      <h3>Country of hire</h3>
      <div class="field readonly">
        <label>Country of hire</label>
        <input type="text" value="${esc(d.country)}" readonly>
        <div class="note">From your offer. It decides what we ask you for. <a data-countryquery="1">This isn’t right</a>
        ${S.details.queryRaised ? `<b style="color:var(--eq-dark-green)"> Thanks. We’re checking this with you, so keep going in the meantime.</b>` : ''}</div>
      </div>
    </div>

    <div class="form-sec" data-assume="A-29 A-30">
      <h3>Proof of identity ${am('A-29')}</h3>
      <p class="sec-note">Optional here, and a photo from your phone is fine. Sending it now means it’s already with us when the
      right-to-work check runs.</p>

      <div class="callout">
        ${ic('exclamation-triangle.svg')}
        <div>
          <b>This overlaps another task on purpose, and it isn’t agreed yet.</b>
          Right to work is a separate, country-specific task that you complete in its own system. Capturing your document once,
          here, is a <b>proposal</b> to save you doing it twice. It is not a decision. ${am('A-29')}
        </div>
      </div>

      <div class="field">
        <label>Which document are you sending us? ${am('A-30')}</label>
        <select data-input="idDoc">
          <option value="">Choose…</option>
          ${docs.map(o => `<option ${d.idDoc===o.v?'selected':''}>${o.v}</option>`).join('')}
        </select>
        <div class="note">The list depends on your country of hire. <em>Illustrative. Not checked against ${jp ? 'Japanese' : 'US'} legal requirements.</em></div>
      </div>

      ${chosen ? `
        <div class="shoot-line">${ic('photo.svg','sm')}<span>${chosen.shoot}</span></div>
        ${d.idFileName ? `
          <div class="file-done">
            ${ic('check-circle.svg','lg')}
            <div>
              <div class="fd-name">${esc(d.idFileName)}</div>
              <div class="fd-who">${ic('lock.svg','sm')} Visible to HR Operations and the right-to-work reviewer only. Not to your manager, and not to your team.</div>
            </div>
            <button class="btn quiet sm" data-removeid="1">Remove</button>
          </div>`
        : `
          <div class="dropzone sm" id="idDrop">
            ${ic('id-card.svg','xl')}<br>
            Drag your photo or scan here, or <b>browse your files</b>
            <input type="file" id="idFile" accept="image/jpeg,image/png,application/pdf" style="display:none;">
          </div>`}
      ` : ''}
    </div>

    <div class="form-sec">
      <h3>Home address</h3>
      ${jp ? `<p class="sec-note">Address format for Japan.</p>` : ''}
      ${jp ? inp('zip','Postal code',{ph:'e.g. 150-0002'}) : ''}
      ${inp('addr1','Address line 1')}
      ${inp('addr2','Address line 2')}
      <div class="field-row">
        ${inp('city', jp ? 'City / ward' : 'City')}
        ${inp('state', jp ? 'Prefecture' : 'State', {cls:'narrow'})}
        ${jp ? '' : inp('zip','ZIP code',{cls:'narrow'})}
      </div>
      ${addrDone ? `<span class="verified">${ic('check-circle.svg','sm')}Address verified</span>` : ''}
      <div class="note" style="max-width:520px; margin-top:10px;">This is your home address for your worker record.
      Where your equipment ships is decided in <a data-goto="#/equipment">your accessories order</a>, and it defaults to your office.</div>
    </div>

    <div class="form-sec">
      <h3>How we reach you</h3>
      ${inp('email','Personal email',{type:'email', err:'That doesn’t look like an email address.', note:'Only used until your Equinix account is active.'})}
      <div class="field-row">
        ${inp('ccode','Country code',{cls:'narrow'})}
        ${inp('mobile','Mobile number',{type:'tel', err:'That doesn’t look like a phone number.'})}
      </div>
    </div>`;
}

function contactBlock(prefix, title, removable) {
  const d = S.details.data;
  const rel = d[prefix+'rel'];
  return `
    <div class="gcard">
      <div class="gcard-h">
        <h4>${title}</h4>
        ${removable ? `<button class="btn quiet sm" data-removeec2="1">${ic('trash.svg','sm')} Remove</button>` : ''}
      </div>
      <div class="gbody">
        ${inp(prefix+'name','Full name')}
        <div class="field ${d['_err_'+prefix+'rel']?'invalid':''}">
          <label>Relationship</label>
          <select data-input="${prefix}rel">
            <option value="">Choose…</option>
            ${REL_OPTIONS.map(o => `<option ${rel===o?'selected':''}>${o}</option>`).join('')}
          </select>
          <div class="err">Please choose a relationship.</div>
        </div>
        ${rel==='Other' ? inp(prefix+'relOther','Relationship (tell us)') : ''}
        <div class="field-row">
          ${inp(prefix+'phone','Primary phone',{type:'tel', err:'That doesn’t look like a phone number.'})}
          ${inp(prefix+'alt','Alternate phone',{type:'tel'})}
        </div>
        ${inp(prefix+'email','Email',{type:'email', err:'That doesn’t look like an email address.'})}
      </div>
    </div>`;
}

function tabEmergency() {
  const d = S.details.data;
  return `
    <div class="form-sec" data-assume="A-08">
      <h3>Emergency contact ${am('A-08')}</h3>
      <p class="sec-note">Only used in an emergency, and never shared with your team. One contact is required. Add a second if you’d like a backup.</p>
      ${contactBlock('ec1','Contact 1', false)}
      ${d.ec2on
        ? contactBlock('ec2','Contact 2 <span class="opt" style="font-weight:350">(optional)</span>', true)
        : `<button class="btn secondary sm" data-addec2="1">${ic('plus.svg','sm')} Add another contact</button>`}
    </div>`;
}

function tabPreferences() {
  const d = S.details.data;
  return `
    <div class="form-sec" data-assume="A-02">
      <h3>Preferences and voluntary disclosures ${am('A-02')}</h3>
      <p class="sec-note">The first two are practical. The last two are optional and personal. Treat them as invitations, not requirements.</p>

      <div class="gcard" data-assume="A-03">
        <h4>Language for messages from us ${am('A-03')}</h4>
        <div class="gbody">
          <div class="field">
            <label>Language</label>
            <select data-input="language">
              ${['English (US)','English (UK)','Japanese','Spanish','French','German','Portuguese (BR)'].map(l =>
                `<option ${d.language===l?'selected':''}>${l}</option>`).join('')}
            </select>
            <div class="note">Emails and portal messages only. <b>Your policy documents are served in the language required
            for ${esc(d.country)}</b>. Law sets that, not preference, so there’s nothing to choose here. ${am('A-03')}</div>
          </div>
        </div>
      </div>

      <div class="gcard" data-assume="A-05">
        <h4>How we contact you before you start ${am('A-05')}</h4>
        <div class="gbody">
          <div class="field ${d['_err_channel']?'invalid':''}">
            <label>Preferred channel</label>
            <div class="radio-row">
              ${['Email','Text message','Either'].map(c => `
                <label><input type="radio" name="channel" data-input="channel" data-kind="radio" value="${c}" ${d.channel===c?'checked':''}>${c}</label>`).join('')}
            </div>
            <div class="err">Please pick how you’d like to hear from us.</div>
          </div>
          <label class="check">
            <input type="checkbox" data-input="updatesOptIn" data-kind="check" ${d.updatesOptIn?'checked':''}>
            <span>Also send me non-essential updates: team news, tips for Day 1, that sort of thing.</span>
          </label>
        </div>
      </div>

      <div class="gcard" id="adjustments" data-assume="A-06">
        <h4>Workplace adjustments ${am('A-06')}</h4>
        <div class="gbody">
          <p class="sec-note" style="margin-bottom:10px;">If something would help you do your best work, we want to hear it. Equipment, setup, how we run your first weeks, anything. Entirely optional.</p>
          <div class="field" style="max-width:none;">
            <textarea rows="3" data-input="adjustText" ${d.adjustPrivate?'disabled':''} placeholder="Tell us what would help…">${esc(d.adjustText)}</textarea>
          </div>
          <label class="check">
            <input type="checkbox" data-input="adjustPrivate" data-kind="check" ${d.adjustPrivate?'checked':''}>
            <span><b>I’d rather discuss this privately.</b> We’ll ask ${PEOPLE.pex.name} to get in touch instead, and nothing is stored in this form.</span>
          </label>
        </div>
      </div>

      <div class="gcard tinted" data-assume="A-07">
        <div class="gcard-h" data-togglesid="1">
          <h4>Voluntary self-identification ${am('A-07')}</h4>
          ${ic(d.sidOpen ? 'chevron-up.svg' : 'chevron-down.svg')}
        </div>
        ${d.sidOpen ? `
        <div class="gbody">
          <p class="sec-note">Entirely voluntary. Your answers don’t affect your employment or anything in this portal, and every question has a “prefer not to say”.
          How this information is used is covered in the <a data-goto="#/policies">Self-Identification Privacy Notice</a>.</p>
          ${sidSelect('sidGender','Gender identity',['Woman','Man','Non-binary','Prefer to self-describe','Prefer not to say'])}
          ${sidSelect('sidEthnicity','Race / ethnicity',['Asian','Black or African American','Hispanic or Latino','White','Two or more races','Another identity','Prefer not to say'])}
          ${sidSelect('sidVeteran','Veteran status',['I am a veteran','I am not a veteran','Prefer not to say'])}
          ${sidSelect('sidDisability','Disability status',['Yes','No','Prefer not to say'])}
          <p class="note"><em>Categories shown are placeholders. The real sets are country-specific and set by regulation.</em></p>
        </div>` : `<p class="sec-note" style="margin:6px 0 0;">Collapsed. Expand it if you’d like to share. Entirely voluntary.</p>`}
      </div>

      <div class="boundary" data-assume="A-10 A-11">
        ${ic('lock.svg','lg')}
        <div>
          <h4>Banking and direct deposit ${am('A-10')} ${am('A-11')}</h4>
          <p>Payroll collects bank details separately, in their own secure form, because bank data is handled differently
          from the rest of this profile. Payroll will be in touch. Nothing to prepare.</p>
          <p class="excl-note">Tax and W-4, swag sizes and dietary requirements are handled elsewhere too. All four are
          <b>left out on purpose</b>, confirmed. They are not gaps in this form.</p>
          <a data-ext="payroll">About Payroll’s process ${ic('external-link.svg','sm')}</a>
        </div>
      </div>
    </div>`;
}
function sidSelect(f, label, opts) {
  const d = S.details.data;
  return `
    <div class="field">
      <label>${label} <span class="opt">(optional)</span></label>
      <select data-input="${f}">
        <option value="">Choose, or leave blank…</option>
        ${opts.map(o => `<option ${d[f]===o?'selected':''}>${o}</option>`).join('')}
      </select>
    </div>`;
}

function detailsDoneScreen() {
  return `
  <div class="page">
    ${crumbs('Your personal and contact details')}
    <div class="task-shell">
      <div class="confirm-panel">
        <div class="big-check">${ic('check.svg','xl')}</div>
        <h2>Details submitted. Thank you.</h2>
        <p>Your record is set up with what you gave us. If anything changes before you start, a move or a new number,
        come back here and update it.</p>
        <button class="btn secondary" data-reopen="details">Review what I submitted</button>
        <button class="btn primary" data-goto="#/">Back to your tasks</button>
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
   the start date and the manager's email, before the table itself (A-54). */
function caseParties() {
  return `
    <div class="case-top">
      <span class="case-num">HRC0943697</span>
      <span class="chip done">Ready</span>
      <span class="case-when">Created 21d ago</span>
      <span class="case-when">Last updated just now</span>
      <span class="case-hide">Hide details</span>
    </div>
    <div class="case-parties" data-assume="A-54">
      <div class="cp-side">
        <div class="cp-lbl">New hire</div>
        <div class="cp-who"><div class="avatar sm">${HIRE.initials}</div>
          <span>${HIRE.legalFirst} ${HIRE.legalLast} (${HIRE.username})</span></div>
        <div class="cp-lbl mt12">Employment start date</div>
        <div class="cp-val">${startDate().toISOString().slice(0,10)}</div>
      </div>
      <div class="cp-side">
        <div class="cp-lbl">Hiring manager</div>
        <div class="cp-who"><div class="avatar sm mgr">${MANAGER.initials}</div>
          <span>${MANAGER.name} (${MANAGER.username})</span></div>
        <div class="cp-lbl mt12">Hiring manager email</div>
        <div class="cp-val">${MANAGER.email}</div>
      </div>
    </div>`;
}

function equipmentTable(forManager) {
  return `
    <div class="eq-status" data-assume="A-41 A-42 M-16 L-04 A-54">
      <div class="eqs-bar">Equipment orders for ${HIRE.legalFirst} ${HIRE.legalLast} (${HIRE.username})</div>
      ${caseParties()}
      <div class="eqs-h">
        <span class="eqs-note">${forManager
          ? `Three items, three different owners. The same table Jordan sees. ${am('M-16')}`
          : `Three items, three different owners. This table is the answer to “where is my equipment?” ${am('A-41')}`}</span>
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

/* Status wording follows the live case as closely as it can. The live strings
   name the person as "Name (username)" and quote the task title in full
   (A-54). Ownership is carried in the sentence, the way the live table does
   it, rather than in a separate column. */
function equipmentRows(forManager) {
  const E = S.equipment;
  const hire = `<b>${HIRE.legalFirst} ${HIRE.legalLast} (${HIRE.username})</b>`;
  const mgr = `<b>${MANAGER.name} (${MANAGER.username})</b>`;
  return [
    { item:'Computer', icon:'laptop.svg',
      status: S.hm.computer.ordered ? 'ORDERED' : 'NOT ORDERED YET', ok: S.hm.computer.ordered,
      unblock: S.hm.computer.ordered
        ? `Ordered by ${mgr}${S.hm.computer.model ? ', ' + (COMPUTER_OPTIONS.find(o => o.id === S.hm.computer.model) || {}).label : ''}.`
        : `To place an order for a computer the hiring manager, ${mgr}, must first complete the
           <b>“Order equipment for new hire ${HIRE.legalFirst} ${HIRE.legalLast} (${HIRE.username})”</b> task.`,
      marker:'A-41' },
    { item:'Computer accessories', icon:'desktop.svg',
      status: E.submitted ? 'INC6369627' : 'NOT ORDERED YET', ok:E.submitted,
      unblock: E.submitted
        ? `New, with Global Helpdesk Tier 2. ${forManager ? 'Ordered by ' + hire + '.' : ''}`
        : `To place an order for computer accessories the new hire, ${hire}, must complete the
           <b>“Order your workspace tech accessories”</b> task.` },
    { item:'Mobile phone', icon:'mobile.svg',
      status:'NOT ORDERED YET', ok:false,
      unblock:`To place an order for a mobile phone the new hire, ${hire}, must complete the
        <b>“Order a phone”</b> task, which is available on their first day.`, marker:'A-40' },
  ];
}

function renderEquipment() {
  const E = S.equipment;
  if (E.submitted) return equipmentSubmitted();

  const needsShipping = !!E.choice;
  const shipHome = E.shipOffice === 'no';
  const d = S.details.data;

  return `
  <div class="page">
    ${crumbs('Choose your workspace accessories')}
    <div class="task-head" data-assume="A-33 A-34">
      <h1>Choose your workspace accessories ${am('A-34')}</h1>
      <p class="why">First on your list, so there’s time to build it, ship it and have it waiting for you. ${am('A-33')}
      This orders <b>accessories only</b>. Your manager orders your computer, and a phone is a Day 1 choice if your role needs one.</p>
    </div>

    ${equipmentTable(false)}

    <div class="task-shell mt24">
      <div class="wiz-body">
        <div class="form-sec" data-assume="A-37 A-39">
          <h3>Order your workspace tech accessories</h3>
          <div class="callout soft">
            ${ic('info-circle.svg')}
            <div><b>These are for your at-home workspace.</b> You have the option of an Equinix-approved headset, or
            that headset plus additional equipment such as a camera, speakerphone, monitor, keyboard and mouse.
            Your in-office workspace will already be supplied with monitor(s), keyboard and mouse. ${am('A-37')}</div>
          </div>

          <div class="field mt16">
            <label>Select accessories <span class="req">required</span></label>
            <select id="eqChoice">
              <option value="" ${!E.choice?'selected':''}>-- None --</option>
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



          <div class="adjust-link" data-assume="A-06">
            ${ic('users-friends.svg')}
            <div>
              <b>Need something different?</b> If an adjustment would help you work comfortably, tell us.
              <a data-goto-adjust="1">review adjustments and formal accommodations</a>. Asking changes nothing about your role.
              ${am('A-06')}
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
            <div class="gcard">
              <h4>Ship to me at</h4>
              <div class="gbody">
                ${d.addr1
                  ? `<div class="home-addr">${esc(d.addr1)}${d.addr2 ? ', '+esc(d.addr2) : ''}<br>${esc(d.city)}, ${esc(d.state)} ${esc(d.zip)}</div>
                     <div class="note">From your personal details. Changing where this parcel goes doesn’t change your home address on your record.</div>`
                  : `<div class="note">You haven’t added a home address yet. <a data-goto="#/details">Add it in your personal details</a> and it’ll appear here.</div>`}
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
  if (E.shipOffice === 'no' && !S.details.data.addr1) return false;
  return true;
}
function eqMissingText() {
  const E = S.equipment;
  if (!E.choice) return 'Choose what you need to continue.';
  const missing = [];
  if (!E.shipOffice) missing.push('a delivery address');
  if (E.shipPhone.replace(/\D/g,'').length < 7) missing.push('a phone number for the courier');
  if (E.shipOffice === 'no' && !S.details.data.addr1) missing.push('your home address (in personal details)');
  return missing.length ? `Still needed: ${missing.join(', ')}.` : 'Everything needed is filled in.';
}

function equipmentSubmitted() {
  const E = S.equipment;
  const picked = ['Standard Zoom-optimized headset (automatic)']
    .concat(E.choice === 'more' ? ACCESSORY_OPTIONS.filter(o => E.items[o.id]).map(o => o.label) : []);

  return `
  <div class="page">
    ${crumbs('Choose your workspace accessories')}
    <div class="task-head">
      <h1>Your accessories order</h1>
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
  <div class="inc-card mt24" data-assume="A-42 A-54 A-55">
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
          <p class="wp-note">${ic('info-circle.svg','sm')} Nothing is waiting on you. This is here so you can see it exists,
          not so you can chase it. ${am('L-06')}</p>
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
              <div class="dr-h">${ic('users-friends.svg','sm')} Your ambassador</div>
              <p>One person <b>outside your function</b>, to help you navigate and make connections.
              The name of this role is a placeholder. ${am('M-26')}</p>
            </div>
            <div class="dist-row">
              <div class="dr-h">${ic('users-three.svg','sm')} Your team</div>
              <p>Your reporting line, on <a data-goto="#/jd">your job description</a>. <b>This list is not that</b>, on purpose.
              rendering it as a hierarchy would mislead.</p>
            </div>
          </div>
        </div>
        <div class="rail-card">
          <h3>What happened behind this</h3>
          <ol class="mech-list">
            <li>${HIRE.manager} named a <b>buddy</b>, an <b>ambassador</b> and anyone else worth meeting early.</li>
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
    ${crumbs('Review your job description')}
    <div class="task-head">
      <h1>Review your job description</h1>
      <p class="why">Confirm the role you’re joining is the one you agreed to. If anything looks different from your conversations, say so. That’s what this step is for.</p>
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
          <p style="font-size:12.5px; margin:4px 0 12px;">Placeholder content, marked as such. The real text comes from the official record.</p>
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
          <label class="check ${jd.scrolled?'':'disabled'}">
            <input type="checkbox" id="jdAck" ${jd.scrolled?'':'disabled'} ${jd.acked?'checked':''}>
            <span>I’ve read my job description and confirm it reflects the role I accepted.</span>
          </label>
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
    ${crumbs('Introduce yourself and add your photo')}
    <div class="task-head" data-assume="A-16">
      <h1>Introduce yourself and add your photo ${am('A-16')}</h1>
      <p class="why">Two things in one place. Both help your team meet you before you arrive, but they go to different
      places and have different deadlines, so each completes on its own.</p>
    </div>
    <div class="two-sec">

      <div class="sec-card" data-assume="A-14 A-15">
        <div class="sec-top">
          <h2>Introduce yourself</h2>
          ${introDone ? chip('done') : (S.intro.text ? chip('inprogress') : chip('notstarted'))}
        </div>
        <div class="due-line">${ic('calendar.svg','sm')}Due <b>${dueText(dueFor('intro'))}</b> ${am('A-22')}</div>
        <p style="font-size:13.5px; font-weight:350; margin-bottom:12px;">${HIRE.manager} will share this with the team before you start,
        so nobody has to write a “please welcome…” post from scratch and you get to describe yourself in your own words.</p>

        <div class="field" style="max-width:none;">
          <textarea rows="5" id="introText" maxlength="500" placeholder="A few lines is plenty…">${esc(S.intro.text)}</textarea>
          <div class="char-count" id="charCount">${S.intro.text.length} / 500 ${am('A-15')}</div>
        </div>
        <div class="chips-row" id="chipsRow">
          ${CHIP_SCAFFOLDS.filter(c => !S.intro.dismissed.includes(c.id)).map(c => `
            <button class="p-chip" data-chip="${c.id}">${c.label}<span class="x" data-chipx="${c.id}" title="Dismiss">✕</span></button>`).join('')}
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
          ${S.intro.saved && !S.intro.consent ? `<span style="font-size:12.5px; color:var(--carbon);">Saved. It won’t be shared until you tick the consent box.</span>` : ''}
        </div>
      </div>

      <div class="sec-card" data-assume="A-17 A-18">
        <div class="sec-top">
          <h2>Photo for your badge</h2>
          ${photoDone ? chip('done') : (S.photo.uploaded ? chip('inprogress') : chip('notstarted'))}
        </div>
        <div class="due-line">${ic('calendar.svg','sm')}Due <b>${dueText(dueFor('photo'))}</b>, earlier than your introduction because your badge needs print time before Day 1</div>
        <p style="font-size:13.5px; font-weight:350; margin-bottom:14px;">Send it now and your badge is printed and waiting for you on Day 1.</p>

        ${conv && !S.photo.replacing ? convPhotoBlock() : uploadBlock()}

        <div class="divider"></div>
        <div class="req-list" data-assume="A-17">
          <b>Requirements</b> ${am('A-17')}: JPG or PNG, under 5MB, at least 600 by 600 pixels<br>
          <b>Guidelines</b> ${am('A-17')}: plain light background, face the camera with both eyes visible, no hats or sunglasses, taken within the last six months<br>
          <em style="color:var(--ink-faint)">Placeholder values. The real badge specification comes from the workplace team.</em>
        </div>

        ${(!conv || S.photo.replacing) ? `
        <label class="check mt16 ${S.photo.uploaded?'':'disabled'}" data-assume="A-18">
          <input type="checkbox" id="photoConsent" ${S.photo.uploaded?'':'disabled'} ${S.photo.consent?'checked':''}>
          <span>I’m OK with this photo being used for my building access badge, the internal employee directory, and my Teams profile. ${am('A-18')}</span>
        </label>
        <div class="mt16">
          <button class="btn primary" id="submitPhoto" ${S.photo.uploaded && S.photo.consent ? '' : 'disabled'}>${S.photo.done ? 'Photo submitted ✓' : 'Submit photo'}</button>
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
        <p style="font-size:13px; font-weight:350; margin-bottom:4px;">The circle shows the badge crop, so your face should fill it.</p>
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
        <p style="font-size:13.5px; font-weight:350; margin-bottom:6px;"><b>We already have this photo from your time here.</b><br>
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
  const acked = Object.values(P.acked).filter(Boolean).length;
  const total = DOCS.length;
  const ro = P.submitted && P._viewing;

  if (P.submitted && !ro) {
    return `
    <div class="page">
      ${crumbs('Policies and privacy notices')}
      <div class="task-shell">
        <div class="confirm-panel">
          <div class="big-check">${ic('check.svg','xl')}</div>
          <h2>All ${total} acknowledged. This task is closed.</h2>
          <p>Each acknowledgement was recorded with the document version and the language you read it in.
          The documents stay available here whenever you want them.</p>
          <button class="btn secondary" data-reopen="policies">Reopen the documents</button>
          <button class="btn primary" data-goto="#/">Back to your tasks</button>
        </div>
      </div>
    </div>`;
  }

  return `
  <div class="page">
    ${crumbs('Policies and privacy notices')}
    <div class="task-head">
      <h1>Policies and privacy notices</h1>
      <p class="why">The documents we need you to read and acknowledge before you start. About 10 minutes ${am('A-23')}, and you can stop
      any time. What you’ve acknowledged stays acknowledged.</p>
    </div>
    <div class="pol-head">
      <div class="prog-count">
        <div class="nums" style="color:var(--eq-dark-blue)"><span>${acked} of ${total} acknowledged</span></div>
        <div class="prog-bar" style="background:var(--cloud)"><i style="width:${(acked/total)*100}%"></i></div>
      </div>
      <span class="chip info">${ic('globe.svg','sm')}Served in ${docLanguage()}, set by your country of hire rather than by preference ${am('A-03')}</span>
      ${jp ? `<span class="chip info">${ic('flag.svg','sm')}Japan, so your list includes a country addendum</span>` : ''}
    </div>

    <div class="doc-list">${DOCS.map(d => docCard(d, jp)).join('')}</div>

    <div class="read-group">
      <div class="section-h"><h2>Also here for you, nothing to sign</h2><span class="hint">Reading material, not tasks</span></div>
      <div class="read-cards">
        <div class="read-card">
          <div class="tic">${ic('file-alt.svg')}</div>
          <div><div class="o-name">Company factsheet</div>
          <div class="o-note">Who we are, what we do, and the numbers that matter. English only.</div></div>
        </div>
        ${currentPackCard(jp)}
      </div>
    </div>

    ${ro
      ? `<div class="mt24 review-banner ok" style="max-width:720px;">${ic('check-circle.svg','lg')}
          <div><b>Task closed</b><p>Everything is acknowledged and recorded. The documents stay readable here.</p></div></div>`
      : `<div class="mt24" style="display:flex; align-items:center; gap:16px;">
          <button class="btn primary" id="submitPolicies" ${acked===total?'':'disabled'}>Submit all acknowledgements</button>
          <span style="font-size:12.5px; color:var(--carbon);">${acked===total ? 'Everything is acknowledged. One click finishes the task.' : `${total-acked} still to acknowledge before you can submit.`}</span>
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
        ${ackRow(d, P.cobcVisited, acked, lang)}
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
        ${ackRow(d, read, acked, lang)}
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

/* What the live process actually sends alongside the acknowledgement pack (A-51). */
function currentPackCard(jp) {
  const pack = CURRENT_PACK[jp ? 'JP' : 'US'];
  return `
  <div class="read-card stack" data-assume="A-51">
    <div class="rc-top">
      <div class="tic">${ic('file-alt.svg')}</div>
      <div>
        <div class="o-name">Employee handbook, ${jp ? 'Japan' : 'United States'}
          <span class="chip waiting">${pack.total} documents ${am('A-51')}</span></div>
        <div class="o-note">${esc(pack.handbook)}${pack.addenda ? `, plus <b>${pack.addenda} ${pack.addendaNote}</b>` : ''}${pack.extras.length ? `, ${pack.extras.join(' and ')}` : ''}.
        Reference only. Nothing to acknowledge.</div>
      </div>
    </div>
    ${pack.addenda ? `
    <div class="pack-flag">
      ${ic('exclamation-triangle.svg','sm')}
      <span><b>Shown because it is true today, not because it is right.</b> Every US hire receives all ${pack.addenda} state
      addenda regardless of where they work, so ${pack.addenda - 1} of them do not apply to you. Across all countries the live
      process sends 416 document instances. Which of those stay pre-Day 1 is the largest open decision in this workstream. ${am('A-51')}</span>
    </div>` : ''}
  </div>`;
}

function ackRow(d, canAck, acked, lang) {
  if (acked) {
    return `<div class="ack-done">${ic('check-circle.svg')}Acknowledged
      <span class="rec-note">Version 3.2, ${esc(lang)}, recorded</span></div>`;
  }
  return `
  <div class="ack-row">
    <label class="check ${canAck?'':'disabled'}">
      <input type="checkbox" data-ack="${d.id}" ${canAck?'':'disabled'}>
      <span>I have read and I agree to the ${d.title}.</span>
    </label>
  </div>`;
}

/* ============================================================
   Flow overview
   ============================================================ */
function renderFlow() {
  const axis = [
    { x:2, lbl:'Offer accepted', sub:'and signed', major:true },
    { x:10, lbl:'Identity verified', sub:'account created' },
    { x:19, lbl:'Portal opens', sub:'you are here', major:true },
    { x:36, lbl:'Day −12', sub:'accessories' },
    { x:48, lbl:'Day −7', sub:'JD + intro' },
    { x:63, lbl:'Day −4', sub:'details + policies' },
    { x:80, lbl:'Day −1', sub:'credentials' },
    { x:95, lbl:'Day 1', sub:'and beyond', major:true },
  ];
  const you = [
    { x:36, r:22, cls:'you', lbl:'Accessories order', sub:'first, due Day −12' },
    { x:30, r:72, cls:'you', lbl:'Suggested network', sub:'optional, no due date' },
    { x:44, r:22, cls:'you', lbl:'Badge photo', sub:'due Day −10, print lead' },
    { x:52, r:72, cls:'you', lbl:'Job description', sub:'confirm, due Day −7' },
    { x:60, r:22, cls:'you', lbl:'Introduce yourself', sub:'due Day −7' },
    { x:70, r:72, cls:'you', lbl:'Personal details', sub:'3 tabs, due Day −4' },
    { x:78, r:22, cls:'you', lbl:'Policies pack', sub:'6 documents, due Day −4' },
    { x:95, r:50, cls:'day1', lbl:'Day 1', sub:'badge waiting, kit set' },
  ];
  const later = [
    { x:22, r:30, cls:'later', lbl:'Right to work', sub:'open now, other system' },
    { x:22, r:74, cls:'later', lbl:'Medical check', sub:'country-conditional' },
    { x:44, r:30, cls:'later', lbl:'Benefits enrolment', sub:'opens Day −30' },
    { x:66, r:74, cls:'later', lbl:'Setup instructions', sub:'Day −3' },
    { x:78, r:74, cls:'later', lbl:'First day details', sub:'Day −3' },
    { x:88, r:30, cls:'later', lbl:'Credentials', sub:'Day −1' },
    { x:97, r:74, cls:'later', lbl:'Phone, info governance', sub:'Day 1, Week 1' },
  ];
  const other = [
    { x:26, r:50, cls:'other', lbl:'Background check', sub:'running, no action from you' },
    { x:48, r:50, cls:'other', lbl:'Computer, your manager', sub:'their task, not yours' },
    { x:70, r:50, cls:'other', lbl:'Banking, Payroll', sub:'their secure form, no date yet' },
    { x:88, r:50, cls:'other', lbl:'Badge printed', sub:'24h lead after your photo' },
  ];
  const lane = (title, icon, nodes, cls='', h=120) => `
    <div class="flow-lane">
      <div class="lane-h">${ic(icon,'sm')}${title}</div>
      <div class="lane-track ${cls}" style="height:${h}px;">
        ${nodes.map(n => `<div class="fnode ${n.cls}" style="left:${n.x}%; top:${n.r}%;">${n.lbl}<small>${n.sub}</small></div>`).join('')}
      </div>
    </div>`;

  return `
  <div class="page flow-page">
    ${crumbs('The whole flow on one screen')}
    <h1>Pre-Day 1, end to end</h1>
    <p class="flow-sub">Everything between accepting the offer and walking in on Day 1: what ${HIRE.preferred} does, what opens later,
    and what other teams handle. This is the review screen: argue with the shape here, not in the individual pages.</p>

    <div class="phase-band">
      ${PHASES.map((p,i) => `<div class="pb ${i===0?'on':''}">${p}</div>`).join('')}
      <span class="pb-mark">${am('A-44')}</span>
    </div>

    <div class="flow-wrap">
      <div class="flow-axis">
        <div class="axis-line"></div>
        ${axis.map(a => `<div class="axis-pt ${a.major?'major':''}" style="left:${a.x}%"><div class="apt-dot"></div>
          <div class="apt-lbl">${a.lbl}</div><div class="apt-sub">${a.sub}</div></div>`).join('')}
      </div>
      ${lane(`What ${HIRE.preferred} does in this portal, under “Do these now”`, 'user-circle.svg', you, '', 130)}
      ${lane('Open elsewhere, or opens later, visible so the list has an end', 'clock.svg', later, '', 130)}
      ${lane('Handled by other teams, visible but never actioned here', 'users-friends.svg', other, 'other', 100)}
      <div class="flow-legend">
        <span class="lg-item"><span class="lg-swatch you"></span>Your tasks, in this portal</span>
        <span class="lg-item"><span class="lg-swatch later"></span>Elsewhere or not yet open</span>
        <span class="lg-item"><span class="lg-swatch other"></span>Other teams, status only</span>
        <span class="lg-item">${am('A-33')} ${am('A-40')} ${am('A-11')} timing and ownership carry assumptions</span>
      </div>
      <div class="flow-foot">${ic('info-circle.svg','sm')}<b>More to-dos are assigned after Day 1.</b> This diagram
      stops at the start date. The live portal carries on through the first week and the first month. ${am('A-48')}</div>
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
  const hm = S.view === 'hm';
  $('#hdrYou').innerHTML = hm
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
  $('#hdrSub').textContent = hm ? 'Hiring manager, before Day 1' : 'Your onboarding, before Day 1';
  const live = ASSUMPTIONS.filter(a => a.group !== 'retired').length;
  $('#rbAssume').textContent = `${live} assumptions marked`;
  $$('#viewSwitch .vs').forEach(b => b.classList.toggle('on', (b.dataset.view === 'hm') === hm));
  document.body.classList.toggle('hm-side', hm);
}

/* ---------- assumptions panel ---------- */
let panelSide = 'all';   // all | nh | hm | link

function renderAssumptions(highlightId) {
  const groups = ['blocks','content','design','retired'];
  const all = ASSUMPTIONS;
  const live = all.filter(a => a.group !== 'retired').length;
  const bySide = { nh:0, hm:0, link:0 };
  all.forEach(a => bySide[a.side]++);
  const shown = panelSide === 'all' ? all : all.filter(a => a.side === panelSide);

  $('#assumeBody').innerHTML = `
    <div class="panel-note">Where this prototype rests on an assumption instead of a confirmed requirement, the element
    carries a marker like ${am('A-04')}. <b>${live} are marked on screen</b>, out of ${all.length} in the register,
    across both portals. Every entry says where it came from.</div>

    <div class="decide">
      <div class="dc-h">${ic('list-tasks.svg','lg')}
        <div><b>Decide first</b>
        <span>Eight things, in the order I would take them. My read, not an agreed order, and every one has its own
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
            <span class="side-tag ${a.side}">${SIDE_LABELS[a.side].label}</span>
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
    if (entry && panelSide !== 'all' && entry.side !== panelSide) panelSide = 'all';
  }
  renderAssumptions(id);
  $('#assumePanel').classList.add('show');
  $('#overlay').classList.add('show');
}
function closePanels() {
  $$('.panel').forEach(p => p.classList.remove('show'));
  $('#overlay').classList.remove('show');
}

/* ---------- chat panel ---------- */
const CHAT_ANSWERS = {
  'When does my equipment arrive?': 'Your accessories ship once you order them, which is the first task on your list. Your computer is ordered by Priya, your manager, and the status table on that task shows exactly what each item is waiting on.',
  'Why is my laptop not on my list?': 'Because today your manager orders it, not you. The equipment task shows its status so you can see it moving, but the action sits with Priya.',
  'What if I can’t finish a task in time?': 'Nothing breaks. The task stays open and Maya gets a nudge so she can help. If a date is a real problem, message her and it gets sorted.',
  'Who sees my emergency contact?': 'Only the people who would need it in an emergency. It’s never shared with your team or your manager.',
  'When do I hear about pay and banking?': 'Payroll runs that separately, in their own secure form, and they’ll contact you directly. It never goes through this portal.',
};
function renderChat() {
  $('#chatBody').innerHTML = `
    <div class="chat-msgs" id="chatMsgs">
      <div class="msg bot">Hi ${esc(HIRE.preferred)}. I’m the onboarding assistant. I can answer questions about your tasks,
      dates and who to contact. What can I help with?</div>
    </div>
    <div class="chat-quick">
      ${Object.keys(CHAT_ANSWERS).map(q => `<button class="p-chip" data-q="${esc(q)}">${q}</button>`).join('')}
    </div>`;
}
function chatAsk(q) {
  const msgs = $('#chatMsgs');
  msgs.insertAdjacentHTML('beforeend', `<div class="msg me">${esc(q)}</div>`);
  setTimeout(() => {
    msgs.insertAdjacentHTML('beforeend', `<div class="msg bot">${CHAT_ANSWERS[q] || 'That one needs a human, so I’ve passed it to Maya Chen. She’ll come back to you by email. (Prototype: canned response.)'}</div>`);
    msgs.parentElement.scrollTop = msgs.parentElement.scrollHeight;
  }, 350);
}

/* ---------- prototype controls ---------- */
function renderProtoDrawer() {
  $('#protoDrawer').innerHTML = `
    <h3>${ic('exclamation-triangle.svg','sm')}Prototype controls</h3>
    <div class="warn-line">A prototype device. None of this exists in the real product. Clock is fixed at ${fmtDate(simToday())}.</div>
    <div class="pc-h">Persona</div>
    <div class="pc-row">
      <button class="pc-btn ${S.persona==='external'?'on':''}" data-pc="persona:external">External new hire</button>
      <button class="pc-btn ${S.persona==='conversion'?'on':''}" data-pc="persona:conversion">Contract-to-permanent</button>
    </div>
    <div class="pc-h">Country of hire</div>
    <div class="pc-row">
      <button class="pc-btn ${S.country==='US'?'on':''}" data-pc="country:US">United States</button>
      <button class="pc-btn ${S.country==='JP'?'on':''}" data-pc="country:JP">Japan</button>
    </div>
    <div class="pc-h">Runway to Day 1 <span class="pc-mark">A-45</span></div>
    <div class="pc-row">
      <button class="pc-btn ${S.horizon==='2wk'?'on':''}" data-pc="horizon:2wk">2 weeks out</button>
      <button class="pc-btn ${S.horizon==='3mo'?'on':''}" data-pc="horizon:3mo">3 months out</button>
    </div>
    <div class="pc-h">Task-state scenario</div>
    <div class="pc-row">
      <button class="pc-btn ${S.scenario==='default'?'on':''}" data-pc="scenario:default">First visit</button>
      <button class="pc-btn ${S.scenario==='inprogress'?'on':''}" data-pc="scenario:inprogress">In progress</button>
      <button class="pc-btn ${S.scenario==='review'?'on':''}" data-pc="scenario:review">Under review</button>
      <button class="pc-btn ${S.scenario==='overdue'?'on':''}" data-pc="scenario:overdue">Overdue</button>
      <button class="pc-btn ${S.scenario==='complete'?'on':''}" data-pc="scenario:complete">All complete</button>
    </div>
    <div class="pc-h">Buddy visibility <span class="pc-mark">L-01</span></div>
    <div class="pc-row">
      <button class="pc-btn ${S.buddyRule==='assignment'?'on':''}" data-pc="buddyRule:assignment">From assignment</button>
      <button class="pc-btn ${S.buddyRule==='72h'?'on':''}" data-pc="buddyRule:72h">72h before start</button>
    </div>
    <div class="pc-h">Review screens</div>
    <div class="pc-links">
      <a data-goto="#/handoffs">${ic('users-connected.svg','sm')} How the two portals connect, 9 handoffs</a>
      <a data-goto="#/hm/subtraction">${ic('list-tasks.svg','sm')} The subtraction review, manager side</a>
      <a data-goto="#/flow">${ic('rocket.svg','sm')} Flow overview, the new hire journey</a>
      <a data-openassume="1">${ic('question-circle.svg','sm')} Assumptions &amp; gaps, ${ASSUMPTIONS.length} entries</a>
    </div>`;
}

function applyScenario(name) {
  const { persona, country, horizon, view, buddyRule } = S;
  S = seedDetails(DEFAULT_STATE());
  Object.assign(S, { persona, country, horizon, view, buddyRule, scenario: name });
  syncCountry();

  const fillDetails = () => {
    Object.assign(S.details.data, {
      preferred:'Jordan', addr1:'2180 Curtis Street, Apt 14', city:'Denver', state:'CO', zip:'80205',
      ec1name:'Sam Reyes', ec1rel:'Spouse or partner', ec1phone:'(303) 555-0142',
      channel:'Email',
    });
  };

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
    S.hm.ambassador = { assigned:'lena', notified:true, accepted:true };
    S.hm.contactConfirmed = true;
    Object.assign(S.hm.logistics, { confirmed:true, whereToBe:'9:00, main reception. Ask for me at the desk', available:true });
  };
  const hmComplete = () => {
    hmPartial(); namePeople();
    S.hm.computer = { ordered:true, model:'win-std', reason:'' };
    S.hm.software = { confirmed:true, added:['Anaplan','Tableau','Power BI'] };
    S.hm.calendar = { confirmed:true, holds:{ teamIntro:true, buddy:true, itSetup:true } };
    S.hm.welcome = { sent:true, body:WELCOME_BOILERPLATE, personal:'Looking forward to having you on the team. Shout if anything is unclear before the 18th.' };
    S.hm.channels.accepted = true;
  };

  if (name === 'inprogress') {
    fillDetails();
    S.startdate.confirmed = true;
    S.bgcheck.launched = true;
    hmPartial();
    S.hm.computer = { ordered:true, model:'win-std', reason:'' };
    S.details.data.ec1name=''; S.details.data.ec1rel=''; S.details.data.ec1phone='';
    S.details.data._touched = true;
    S.equipment.choice = 'more'; S.equipment.items = { monitor:true };
    S.policies.acked = { aup:true, edpn:true };
    S.policies.read = { aup:true, edpn:true };
    S.intro.text = 'I’m Jordan, joining the FP&A team from a fintech in Denver. Outside work you’ll usually find me on a trail or attempting sourdough.';
    S.network.booked = { 0: slotsFor(0)[0] };
  }
  if (name === 'review') {
    fillDetails(); S.details.submitted = true;
    S.startdate.confirmed = true; S.bgcheck.launched = true;
    equipComplete(); hmPartial(); namePeople();
    S.jd.state = 'review'; S.jd.dissent = true;
    S.jd.dissentText = 'The role we discussed was hybrid, two days in office. The summary says something different.';
  }
  if (name === 'complete') {
    fillDetails(); S.details.submitted = true;
    S.startdate.confirmed = true; S.bgcheck.launched = true;
    equipComplete(); hmComplete();
    S.jd.state = 'done'; S.jd.scrolled = true; S.jd.acked = true;
    S.intro.text = 'I’m Jordan, joining the FP&A team from a fintech in Denver. I’ll be picking up the forecast for the Americas portfolios. Outside work you’ll usually find me on a trail or attempting sourdough.';
    S.intro.consent = true; S.intro.saved = true; S.intro.done = true;
    if (persona === 'conversion') { S.photo.confirmedExisting = true; }
    else { S.photo.uploaded = true; S.photo.consent = true; S.photo.done = true; S.photo.dataUrl = PLACEHOLDER_PHOTO; }
    S.policies.acked = Object.fromEntries(DOCS.map(d => [d.id, true]));
    S.policies.read = Object.fromEntries(DOCS.map(d => [d.id, true]));
    S.policies.cobcVisited = true; S.policies.submitted = true;
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
function syncCountry() {
  const jp = S.country === 'JP';
  S.details.data.country = jp ? HIRE.countryJP : HIRE.countryUS;
  if (!S.details.data._touched) {
    S.details.data.language = jp ? 'Japanese' : 'English (US)';
    S.details.data.ccode = jp ? '+81' : '+1';
  }
  // Identity document lists are per-country; a stale selection would be wrong.
  if (S.details.data.idDoc && !ID_DOCS[jp?'JP':'US'].some(x => x.v === S.details.data.idDoc)) {
    S.details.data.idDoc = ''; S.details.data.idFileName = '';
  }
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
    <p class="why">This is the platform's own view, as UAT shows it: one phase at a time, with its own count.
    Your task list on the home screen is the designed alternative. Both are here so the difference is visible. ${am('A-56')}</p>

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
          instead. Which is less alarming is worth testing. ${am('A-25')}</span></div>` : ''}
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
Object.assign(ROUTES, HM_ROUTES);   // hiring manager screens (js/hm.js)

function render() {
  const route = location.hash || '#/';
  // The route decides the lens, so a deep link lands on the right side.
  if (route.startsWith('#/hm/')) S.view = 'hm';
  else if (route !== '#/handoffs') S.view = 'nh';
  if (route !== '#/details') S.details._viewing = false;
  if (route !== '#/policies') S.policies._viewing = false;
  const fn = ROUTES[route] || renderLanding;
  $('#app').innerHTML = fn();
  renderShell();
  renderProtoDrawer();
  bindScreen(route);
  window.scrollTo(0, 0);
}
function rerender() { render(); }

function bindScreen(route) {
  startCarousel(route === '#/');
  if (route.startsWith('#/hm/')) { bindHm(route); return; }
  if (route === '#/startdate') return bindStartDate();
  if (route === '#/bgcheck') return bindBgCheck();
  if (route === '#/details') bindDetails();
  if (route === '#/equipment') bindEquipment();
  if (route === '#/jd') bindJD();
  if (route === '#/intro') bindIntro();
  if (route === '#/policies') bindPolicies();
}

/* ---------- carousel ---------- */
function startCarousel(on) {
  clearInterval(carouselTimer); carouselTimer = null;
  if (!on) return;
  carouselTimer = setInterval(() => {
    if (!$('.carousel')) { clearInterval(carouselTimer); return; }
    S.carousel = ((S.carousel || 0) + 1) % INSIDE_CHAPTERS.length;
    const c = INSIDE_CHAPTERS[S.carousel];
    $('.car-num').textContent = c.n;
    $('.car-title').textContent = c.title;
    $('.car-line').textContent = c.line;
    $$('.car-dot').forEach((d,k) => d.classList.toggle('on', k === S.carousel));
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

/* ---------- details bindings ---------- */
function bindDetails() {
  if (S.details.submitted && S.details._viewing) {
    $$('#app input, #app select, #app textarea').forEach(el => { el.disabled = true; });
    return;
  }
  $$('[data-input]').forEach(el => {
    const f = el.dataset.input;
    const kind = el.dataset.kind;
    const evt = (el.tagName === 'SELECT' || kind === 'check' || kind === 'radio') ? 'change' : 'input';
    el.addEventListener(evt, () => {
      S.details.data[f] = (kind === 'check') ? el.checked : el.value;
      S.details.data._touched = true;
      if (f === 'adjustPrivate') { if (el.checked) S.details.data.adjustText=''; rerender(); return; }
      if (f.endsWith('rel') || f === 'idDoc') { rerender(); return; }
      touchSave();
      updateWizardChrome();
      if (['addr1','city','state','zip'].includes(f) && ['addr1','city','state','zip'].every(validField)) rerender();
    });
    if (evt === 'input') el.addEventListener('blur', () => {
      S.details.data['_err_'+f] = requiredFields().includes(f) && !validField(f);
      const wrap = el.closest('.field');
      if (wrap) wrap.classList.toggle('invalid', !!S.details.data['_err_'+f]);
      updateWizardChrome();
    });
  });

  // identity document upload (A-29)
  const dz = $('#idDrop');
  if (dz) {
    const fi = $('#idFile');
    dz.addEventListener('click', () => fi.click());
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
    dz.addEventListener('drop', e => {
      e.preventDefault(); dz.classList.remove('drag');
      if (e.dataTransfer.files[0]) acceptId(e.dataTransfer.files[0]);
    });
    fi.addEventListener('change', () => { if (fi.files[0]) acceptId(fi.files[0]); });
  }
}
function acceptId(file) {
  if (file.size > 10 * 1024 * 1024) { toast('That file is over 10MB. Try a smaller one.'); return; }
  S.details.data.idFileName = file.name;
  S.details.data._touched = true;
  save(); rerender();
  toast('Document received. It goes to HR Operations, not to your manager.', 'check-circle.svg');
}
let saveT = null;
function touchSave() {
  save();
  const el = $('#savedState');
  if (!el) return;
  el.innerHTML = `${ic('check.svg','sm')}Draft saved just now`;
  clearTimeout(saveT);
  saveT = setTimeout(() => { const e = $('#savedState'); if (e) e.innerHTML = `${ic('save.svg','sm')}Draft saves automatically as you type`; }, 2500);
}
function updateWizardChrome() {
  tabCounts().forEach((c,i) => {
    const el = $(`[data-tabcount="${i}"]`);
    if (el) { el.textContent = c.done===c.total ? '✓' : `${c.done} of ${c.total}`; el.classList.toggle('ok', c.done===c.total); }
  });
  const missing = requiredFields().filter(f => !validField(f));
  const line = $('#missingLine');
  if (line) line.textContent = missing.length
    ? `Still needed: ${missing.slice(0,4).map(fieldLabel).join(', ')}${missing.length>4 ? ` and ${missing.length-4} more` : ''}`
    : 'Everything required is filled in.';
  const btn = $('#submitDetails');
  if (btn) btn.disabled = missing.length > 0;
}

/* ---------- equipment bindings ---------- */
function bindEquipment() {
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
    toast('Order submitted. Incident INC6369627 raised with Global Helpdesk Tier 2.', 'check-circle.svg');
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
  $$('[data-ack]').forEach(cb => cb.addEventListener('change', () => {
    if (cb.checked) { S.policies.acked[cb.dataset.ack] = true; save(); rerender(); }
  }));
  const cobc = $('[data-cobc]');
  if (cobc) cobc.addEventListener('click', () => {
    toast('Opening codeofbusinessconduct.equinix.com in a new tab (simulated, so in the real thing you’d sign in with your Equinix account).', 'external-link.svg');
    setTimeout(() => { S.policies.cobcVisited = true; save(); rerender(); }, 1400);
  });
  const sub = $('#submitPolicies');
  if (sub) sub.addEventListener('click', () => {
    S.policies.submitted = true; save(); rerender();
    toast('All acknowledgements recorded. Task complete.', 'check-circle.svg');
  });
}

/* ---------- global delegation ---------- */
document.addEventListener('click', e => {
  const t = e.target;

  if (typeof hmGlobalClick === 'function' && hmGlobalClick(t)) return;

  const amEl = t.closest('.am');
  if (amEl) { e.stopPropagation(); openAssumptions(amEl.dataset.am); return; }

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

  const nav = t.closest('[data-goto]');
  if (nav) { closePanels(); $('#protoDrawer').classList.remove('show');
    if (nav.dataset.phase != null) { S.todoPhase = +nav.dataset.phase; save(); }
    if (location.hash === nav.dataset.goto) rerender(); else location.hash = nav.dataset.goto; return; }
  const tc = t.closest('[data-task]');
  if (tc && !t.closest('[data-openchat]')) { location.hash = tc.dataset.task; return; }

  // jump to the adjustments section on Tab 3 (mirrored link from equipment)
  if (t.closest('[data-goto-adjust]')) {
    S.details.tab = 2; save();
    if (location.hash === '#/details') rerender(); else location.hash = '#/details';
    setTimeout(() => {
      const el = $('#adjustments');
      if (el) { el.classList.add('assume-flash'); el.scrollIntoView({ block:'center', behavior:'smooth' });
        setTimeout(() => el.classList.remove('assume-flash'), 2400); }
    }, 260);
    return;
  }

  const car = t.closest('[data-car]');
  if (car) {
    const n = INSIDE_CHAPTERS.length;
    S.carousel = (((S.carousel || 0) + (+car.dataset.car)) % n + n) % n;
    save(); rerender(); return;
  }
  const dot = t.closest('[data-cardot]');
  if (dot) { S.carousel = +dot.dataset.cardot; save(); rerender(); return; }

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
      : which === 'medical' ? 'This would open the medical-check booking flow. Not built, because what it involves is still being confirmed.'
      : 'This opens another Equinix system, which is not part of this prototype.', 'external-link.svg');
    return;
  }

  if (t.closest('[data-countryquery]')) {
    e.preventDefault();
    S.details.queryRaised = true; save(); rerender();
    toast('Query raised with Maya. The field stays as it is until we’ve checked.', 'check-circle.svg');
    return;
  }
  if (t.closest('[data-removeid]')) {
    S.details.data.idFileName = ''; save(); rerender(); return;
  }
  if (t.closest('[data-addec2]')) { S.details.data.ec2on = true; save(); rerender(); return; }
  if (t.closest('[data-removeec2]')) {
    Object.assign(S.details.data, { ec2on:false, ec2name:'', ec2rel:'', ec2relOther:'', ec2phone:'', ec2alt:'', ec2email:'' });
    save(); rerender(); return;
  }
  if (t.closest('[data-togglesid]')) { S.details.data.sidOpen = !S.details.data.sidOpen; save(); rerender(); return; }

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
    if (reopen.dataset.reopen === 'details') S.details._viewing = true;
    if (reopen.dataset.reopen === 'policies') S.policies._viewing = true;
    save(); rerender(); return;
  }

  const wt = t.closest('[data-tab]');
  if (wt) { S.details.tab = +wt.dataset.tab; save(); rerender(); return; }
  if (t.closest('#submitDetails')) {
    if (!requiredFields().filter(f => !validField(f)).length) {
      S.details.submitted = true; save(); rerender();
      toast('Details submitted. Your record is set up.', 'check-circle.svg');
    }
    return;
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
    else {
      S[k] = v;
      if (k === 'country') syncCountry();
      if (k === 'persona' && v === 'external') { S.photo.confirmedExisting = false; S.photo.replacing = false; }
      save();
    }
    rerender();
    $('#protoDrawer').classList.add('show');
    return;
  }
  const q = t.closest('[data-q]');
  if (q) { chatAsk(q.dataset.q); return; }

  if (t.closest('#brandHome')) { location.hash = S.view === 'hm' ? '#/hm/' : '#/'; return; }

  const vs = t.closest('[data-view]');
  if (vs) {
    const want = vs.dataset.view;
    if ((want === 'hm') !== (S.view === 'hm')) {
      S.view = want; save();
      location.hash = want === 'hm' ? '#/hm/' : '#/';
    }
    return;
  }
  if (t.closest('#rbAssume')) { openAssumptions(); return; }
  if (t.closest('#rbFlow')) { location.hash = '#/flow'; return; }

  if (!t.closest('#protoDrawer') && !t.closest('#protoFab')) $('#protoDrawer').classList.remove('show');
});

function openChat() {
  renderChat();
  $('#chatPanel').classList.add('show');
  $('#overlay').classList.add('show');
}
function sendChat() {
  const inp = $('#chatInput');
  if (inp && inp.value.trim()) { chatAsk(inp.value.trim()); inp.value=''; }
}

window.addEventListener('hashchange', render);
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closePanels(); $('#protoDrawer').classList.remove('show'); } });

document.addEventListener('DOMContentLoaded', () => {
  $('#chatSendBtn').addEventListener('click', sendChat);
  $('#chatInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });
  render();
});
