/* ============================================================
   Hiring Manager portal, v3
   Companion to the new hire side, sharing one state object so every
   handoff between the two is real rather than illustrated.

   The design problem here is subtraction: several of these screens
   exist in order to be argued out of existence, so every manager task
   carries its disposition on screen (M-09).

   Loaded BEFORE app.js. Only function declarations and HM_ROUTES are
   evaluated at load; everything referencing shared globals ($, ic, S)
   runs at call time.
   ============================================================ */

'use strict';

/* ---------- the manager's task model ---------- */
function hmTasks() {
  const H = S.hm;
  const introReady = S.intro.saved && S.intro.consent && S.intro.text.trim();
  const list = [
    // People Experience owns the blueprint this task confirms. When they
    // change it, the manager's confirmation is stale and the task reopens
    // (M-32). That is the point of one shared state across three parties.
    { id:'logistics', label:'Confirm the first-day details', disp:'keep', route:'#/hm/logistics',
      done: H.logistics.confirmed && !S.pexUpdate, icon:'calendar.svg', dueOff:-7, sys:'Workplace Services', srcDue:true,
      reopened: H.logistics.confirmed && S.pexUpdate, marker: S.pexUpdate ? 'M-32' : '',
      why: H.logistics.confirmed && S.pexUpdate
        ? `People Experience moved orientation to finish at ${S.pex.blueprint.until}. What you confirmed no longer matches.`
        : 'Only you know whether you’ll actually be there, and who covers if you’re not.',
      dispNote:'Kept, but narrowed. The location facts come from the orientation blueprint, not from you.' },
    // The new hire picks their own machine now (A-60), so this is no longer
    // an order. What is left is an awareness row, and the case for removing
    // it outright is the strongest on the list.
    { id:'computer', label:'Equipment for your new hire', disp:'remove', route:'#/hm/computer',
      done: S.equipment.submitted, icon:'laptop.svg', marker:'M-01', dueOff:-7, sys:'ServiceNow', srcDue:true,
      why:'Jordan chooses and orders this themselves. Nothing here waits on you.',
      dispNote:'Recommended for deletion. The order moved to the new hire, so all this does is tell you it happened, which the readiness view already does.' },
    { id:'software', label:'Confirm the application stack', disp:'reduce', route:'#/hm/software',
      done: H.software.confirmed, icon:'portal-window.svg', marker:'M-04', blocked:true,
      dueOff:-4, sys:'ServiceNow', srcDue:true,
      why:'Which applications Jordan gets on day one.',
      dispNote:'Blocked today. Without a resolved persona the stack renders empty and you fill it by hand.' },
    { id:'buddy', label:'Name who they should meet', disp:'keep', route:'#/hm/buddy',
      done: !!H.buddy.assigned && H.buddy.accepted, icon:'users-friends.svg', marker:'M-07', dueOff:-2, sys:'Onboarding portal', srcDue:true,
      why:'One buddy in their function, and anyone else worth meeting early.',
      dispNote:'Two screens merged into one, and the second named role was dropped. Your judgement, so it stays, but nothing is suggested for you.' },
    { id:'calendar', label:'Set up their first day', disp:'automate', route:'#/hm/calendar',
      done: H.calendar.confirmed, icon:'clock.svg', marker:'M-06', dueOff:-5, sys:'Outlook', marker2:'M-23',
      why:'The holds that make Day 1 work.',
      dispNote:'Your 1:1 is already placed automatically. The rest should be too, and then this becomes a glance rather than a task.' },
    { id:'welcome', label:'Send a welcome note', disp:'reduce', route:'#/hm/welcome',
      done: H.welcome.sent, icon:'email.svg', marker:'M-08', dueOff:-2, sys:'Email', srcDue:true,
      why:'The first thing Jordan hears from you rather than from a system.',
      dispNote:'Written for you. Reduced to adding a personal line and pressing send.' },
  ];
  list.splice(3, 0, { id:'card', label:'Will Jordan need a corporate card?', disp:'undecided', route:'#/hm/card',
    done: H.card.needed !== null, icon:'banking.svg', marker:'M-19', dueOff:-7, sys:'Accounts Payable', marker2:'M-23',
    why:'One question, and only if they will travel on behalf of Equinix.',
    dispNote:'Was undecided while the source row was truncated. Now specified, and it really is one tap.' });
  if (introReady || H.intro.forwarded) {
    list.push({ id:'intro', label:'Forward Jordan’s introduction to the team', disp:'keep', route:'#/hm/intro',
      done: H.intro.forwarded, icon:'comment-smile.svg', marker:'L-02', dueOff:-2, sys:'Teams', marker2:'M-23',
      why:'Jordan wrote it and agreed you can share it. It goes nowhere until you send it.',
      dispNote:'Arrived because Jordan completed their side. Nothing is posted automatically.' });
  }
  // Everything above is pre-Day 1. What a manager owes after the start date
  // has never been written down as tasks, so these are proposed rather than
  // sourced, and marked as such on screen (M-30).
  list.push(
    { id:'day1meet', label:'Meet Jordan and walk them in', disp:'automate', route:null, phase:1,
      done:false, icon:'users-friends.svg', marker:'M-30', dueOff:0, sys:'Outlook',
      why:'Straight after orientation ends. The hold is already in your calendar.',
      dispNote:'Already placed automatically. It is on this list to be visible, not to be done.' },
    { id:'plan', label:'Agree their 30, 60 and 90 day plan', disp:'keep', route:null, phase:2,
      done:false, icon:'list-tasks.svg', marker:'M-30', dueOff:4, sys:'Not decided',
      why:'What good looks like by each checkpoint, agreed with them rather than sent to them.',
      dispNote:'Nothing in any source says where this plan lives or whether the portal owns it.' },
    { id:'week1', label:'End of first week check-in', disp:'keep', route:null, phase:2,
      done:false, icon:'comment-lines.svg', marker:'M-30', dueOff:5, sys:'Outlook',
      why:'Half an hour to catch what is not working while it is still cheap to fix.',
      dispNote:'Proposed. A recurring hold would make this a habit rather than a task.' },
    { id:'month1', label:'First month review', disp:'keep', route:null, phase:3,
      done:false, icon:'flag.svg', marker:'M-30', dueOff:30, sys:'Outlook',
      why:'The first real read on whether the plan you agreed was the right one.',
      dispNote:'Proposed. Lines up with the day 30 survey, so the two should be designed together.' },
  );
  return list.map(t => Object.assign({ phase:0 }, t));
}

/* The manager's own timeline, mirroring the new hire's phase strip. Their
   work has always been drawn as one flat pre-Day 1 list, which is why the
   after-start half of the job was invisible. */
const HM_PHASES = ['Before Day 1', 'Day 1', 'First week', 'First month'];

/* The same device as the new hire's hero strip, so the two sides read as one
   product (M-30). */
function hmPhaseStrip() {
  const counts = hmPhaseCounts();
  const d = daysToStart();
  const current = d > 0 ? 0 : d === 0 ? 1 : 2;
  return `
  <div class="hm-strip" data-assume="M-30">
    ${HM_PHASES.map((p, i) => {
      const c = counts[i];
      const st = c.total && c.done === c.total ? 'done' : i === current ? 'now' : '';
      return `
      <div class="hms ${st}" data-goto-phase="${i}">
        <div class="hms-bar"></div>
        <div class="hms-dot">${st === 'done' ? ic('check.svg','sm') : st === 'now' ? '<i></i>' : ''}</div>
        <div class="hms-l">${p}</div>
        <div class="hms-n">${c.done} of ${c.total}</div>
      </div>`;
    }).join('')}
  </div>`;
}

function hmPhaseCounts() {
  const t = hmTasks();
  return HM_PHASES.map((_, i) => {
    const inPhase = t.filter(x => x.phase === i);
    return { done: inPhase.filter(x => x.done).length, total: inPhase.length };
  });
}

function hmDone() { return hmTasks().filter(t => t.done).length; }

/* Third-party tasks: PEX, EUT, CRE. Fixed states, not interactive. */
function thirdPartyTasks() {
  return [
    { label:'Background check', owner:'HR Operations', state: 'running', note:'In progress, no action from anyone' },
    // Badge print is deliberately absent: security has no integration and no
    // place to confirm completion, so any status shown here would be invented.
    { label:'Badge photo received', owner:'Workplace / CRE', state: S.photo.done || S.photo.confirmedExisting ? 'ready' : 'waiting',
      note: (S.photo.done || S.photo.confirmedExisting)
        ? 'Sent on to Workplace. Printing is not tracked here'
        : 'Waiting on Jordan’s badge photo' },
    { label:'Orientation blueprint assigned', owner:'People Experience', state:'ready', note:'Denver blueprint assigned' },
  ];
}

/* ---------- readiness score (M-02) ---------- */
/* Two numbers, not one. A single percentage cannot answer "am I done or are
   they done", which is the first thing a manager asks (M-02 revised).
   Other teams are reported as status, not as a bar: they will not be users
   in this system, and the manager does not need their progress to the task. */
function readiness() {
  const nhTotal = COUNTED.length, nhDone = tasksComplete();
  const hmList = hmTasks(), hmTotal = hmList.length, hmDoneN = hmList.filter(t => t.done).length;
  const tp = thirdPartyTasks();
  return {
    mine:  { label:'Your tasks',     done:hmDoneN, total:hmTotal, pct: Math.round((hmDoneN / hmTotal) * 100), cls:'hm' },
    theirs:{ label:'Jordan’s tasks', done:nhDone,  total:nhTotal, pct: Math.round((nhDone / nhTotal) * 100),  cls:'nh' },
    others: tp,
    pct: Math.round(((hmDoneN + nhDone) / (hmTotal + nhTotal)) * 100),
  };
}

/* Overdue is its own state, and it is loud. Managers roll up their sleeves
   and do their day job too, so anything at risk has to be unmissable (M-28). */
function overdueItems() {
  const out = [];
  COUNTED.forEach(k => { if (isOverdue(k)) out.push({ who:'Jordan', what:NH_TASK_LABELS[k], route:null }); });
  hmTasks().forEach(t => {
    if (t.done || t.dueOff == null) return;
    if (addDays(startDate(), t.dueOff) < simToday()) out.push({ who:'You', what:t.label, route:t.route });
  });
  return out;
}

/* ---------- blockers ---------- */
/* Only what the manager can actually act on. Equipment used to head this
   list; it is Jordan's own task now (A-60), so it moved to the waiting list
   below rather than sitting here looking like manager work. */
function hmBlockers() {
  const out = [];
  const days = daysToStart();
  if (S.hm.logistics.confirmed && S.pexUpdate) {
    out.push({ sev:'high', text:`People Experience moved orientation to finish at ${S.pex.blueprint.until}. The first-day details you confirmed no longer match, and Jordan is seeing the old version.`,
      action:'Re-confirm', route:'#/hm/logistics', marker:'M-32' });
  }
  if (!S.hm.buddy.assigned && days <= 21) {
    out.push({ sev:'med', text:'No buddy named yet. If you do not name one, a buddy is auto-assigned the day before Jordan starts.',
      action:'Name someone', route:'#/hm/buddy' });
  } else if (S.hm.buddy.assigned && !S.hm.buddy.accepted) {
    out.push({ sev:'med', text:'The buddy has been asked but has not accepted. Nothing can go in their calendar until they do.',
      action:'See status', route:'#/hm/buddy', marker:'M-27' });
  }
  if (S.hm.card.needed === null && days <= 21) {
    out.push({ sev:'low', text:'The corporate card question is unanswered. If Jordan will travel, they need the agreement ready to sign on their second day.',
      action:'Answer it', route:'#/hm/card' });
  }
  if (!S.hm.software.confirmed) {
    out.push({ sev:'low', text:'The application stack cannot be resolved, because Jordan’s persona is not mapped. That is a platform gap, not something you can fix here.',
      action:'See why', route:'#/hm/software' });
  }
  return out;
}

/* Waiting on the new hire. Shown separately and worded as information, not
   as a list of things the manager has failed to do: these are Jordan's
   tasks, and the manager's only move is to ask. */
function hmWaitingOnNewHire() {
  const out = [];
  const days = daysToStart();
  if (!S.equipment.submitted) {
    out.push({ text: S.equipment.deviceConfirmed
      ? 'Equipment is chosen but the order has not been submitted yet.'
      : 'Equipment has not been chosen yet. The lead time runs 5 to 7 business days.',
      marker:'M-24' });
  }
  if (!S.bgcheck.launched) out.push({ text:'The background check has not been started. It runs the longest of anything here.' });
  if (!S.details.submitted && days <= 21) out.push({ text:'Personal and contact details are not submitted, so payroll cannot be set up.' });
  return out;
}

const NH_TASK_LABELS = {
  startdate:'Confirm your start date', bgcheck:'Start your background check',
  equipment:'Choose your equipment', details:'Your personal and contact details',
  jd:'Review your job description', intro:'Introduce yourself and add your photo',
  policies:'Policies and privacy notices',
};

/* New hire progress as the manager may see it (M-03 / L-05).
   names and status only, never content, and sensitive items marked. */
function nhProgressRows() {
  return [
    { label:NH_TASK_LABELS.startdate, status:startdateStatus() },
    { label:NH_TASK_LABELS.bgcheck, status:bgcheckStatus(), sensitive:true,
      hidden:'You can see the check is running. What it contains is never shown to you.' },
    { label:NH_TASK_LABELS.equipment, status:equipmentStatus() },
    { label:NH_TASK_LABELS.details, status:detailsStatus(), sensitive:true,
      hidden:'Identity documents, emergency contacts and voluntary self-identification are not shown to you.' },
    { label:NH_TASK_LABELS.jd, status:jdStatus() },
    { label:NH_TASK_LABELS.intro, status:introStatus() },
    { label:NH_TASK_LABELS.policies, status:policiesStatus(), sensitive:true,
      hidden:'Which documents were acknowledged is recorded for audit, not shown to you.' },
  ];
}

/* ---------- Jordan's journey, as one figure (M-02) ----------
   Four mutually exclusive states over the new hire's task list. A donut
   rather than a stacked bar because the manager's question is "how far
   through are they", which is a single share, and the centre can carry it.
   Every slice is direct-labelled in the legend with its count, so identity
   never rests on colour. */
function nhStateCounts() {
  const rows = nhProgressRows();
  const out = { done:0, doing:0, late:0, none:0 };
  const keyFor = { startdate:'startdate', bgcheck:'bgcheck', equipment:'equipment',
    details:'details', jd:'jd', intro:'intro', policies:'policies' };
  const keys = Object.keys(keyFor);
  rows.forEach((r, i) => {
    if (r.status === 'done') return out.done++;
    if (isOverdue(keys[i])) return out.late++;
    if (r.status === 'inprogress' || r.status === 'review') return out.doing++;
    out.none++;
  });
  return out;
}

function nhProgressDonut() {
  const c = nhStateCounts();
  const total = c.done + c.doing + c.late + c.none;
  const pct = total ? Math.round((c.done / total) * 100) : 0;
  const segs = [
    { k:'done',  label:'Complete',    n:c.done,  cls:'done' },
    { k:'doing', label:'In progress', n:c.doing, cls:'doing' },
    { k:'late',  label:'Overdue',     n:c.late,  cls:'late' },
    { k:'none',  label:'Not started', n:c.none,  cls:'none' },
  ];
  const R = 52, C = 2 * Math.PI * R;
  let off = 0;
  const arcs = segs.filter(s => s.n > 0).map(s => {
    const len = (s.n / total) * C;
    // 2px surface gap between fills, per the mark spec
    const a = `<circle class="don-seg ${s.cls}" cx="60" cy="60" r="${R}" fill="none" stroke-width="15"
      stroke-dasharray="${Math.max(len - 2, 0.5)} ${C - Math.max(len - 2, 0.5)}"
      stroke-dashoffset="${-off}" transform="rotate(-90 60 60)"
      data-seg="${s.k}"><title>${s.label}: ${s.n} of ${total}</title></circle>`;
    off += len;
    return a;
  }).join('');

  return `
  <div class="nh-donut" data-assume="M-02">
    <div class="don-fig">
      <svg viewBox="0 0 120 120" role="img" aria-label="Jordan's tasks: ${segs.map(s => `${s.n} ${s.label.toLowerCase()}`).join(', ')}">
        <circle cx="60" cy="60" r="${R}" fill="none" stroke="var(--cloud)" stroke-width="15"/>
        ${arcs}
      </svg>
      <div class="don-mid"><b>${pct}<span>%</span></b><span class="don-cap">complete</span></div>
    </div>
    <ul class="don-key">
      ${segs.map(s => `
        <li class="${s.n ? '' : 'zero'}">
          <span class="dk-sw ${s.cls}"></span>
          <span class="dk-l">${s.label}</span>
          <b class="dk-n">${s.n}</b>
        </li>`).join('')}
    </ul>
  </div>`;
}

/* ---------- Everyone else, as one strip (M-02) ----------
   Not a pie: three third-party items are three equal thirds, and a pie of
   equal thirds says nothing except "there are three". Equal segments
   coloured by state, hover naming the owner, carries what was actually
   wanted: see at a glance whether anything outside the two portals is
   stuck, and who owns it. */
function othersStrip() {
  const rows = thirdPartyTasks();
  const cls = st => st === 'ready' ? 'done' : st === 'running' ? 'doing' : 'none';
  const word = st => st === 'ready' ? 'Done' : st === 'running' ? 'Running' : 'Waiting';
  return `
  <div class="others-strip" data-assume="M-02">
    <div class="os-h">
      <b>Everyone else</b>
      <span>Three teams, none of them users of this portal. ${am('M-02')}</span>
    </div>
    <div class="os-bar">
      ${rows.map(r => `
        <div class="os-seg ${cls(r.state)}" tabindex="0"
          aria-label="${r.label}, ${r.owner}, ${word(r.state)}">
          <span class="os-seg-l">${r.label}</span>
          <div class="os-tip">
            <b>${r.label}</b>
            <span class="os-tip-owner">${r.owner}</span>
            <span class="os-tip-state ${cls(r.state)}">${word(r.state)}</span>
            <span class="os-tip-note">${r.note}</span>
          </div>
        </div>`).join('')}
    </div>
    <ul class="os-key">
      <li><span class="dk-sw done"></span>Done</li>
      <li><span class="dk-sw doing"></span>Running</li>
      <li><span class="dk-sw none"></span>Waiting on someone</li>
    </ul>
  </div>`;
}

/* ============================================================
   H-00: readiness view (the manager's home)
   ============================================================ */
function renderHmHome() {
  const R = readiness();
  const blockers = hmBlockers();
  const tasks = hmTasks();
  const hire = HIRES[0];
  const H = S.hm;

  return `
  <div class="page">
    <div class="hm-hires" data-assume="M-13">
      ${HIRES.map((h,i) => `
        <button class="hire-tab ${i===0?'on':''} ${h.interactive?'':'flat'}" data-hire="${h.id}">
          <div class="avatar sm ${i===0?'':'peer'}">${h.initials}</div>
          <div class="ht-body">
            <div class="ht-name">${h.name}</div>
            <div class="ht-role">${h.role}, ${h.loc}</div>
          </div>
          <div class="ht-days">${h.interactive ? daysToStart() : h.startsIn} days</div>
        </button>`).join('')}
      <span class="hires-mark">${am('M-13')}</span>
    </div>

    ${/* The hero states the fact; the figures sit below it on the surface
          where they can carry labels and hover. Two white-on-gradient rings
          could not be labelled without fighting the background. */''}
    <div class="hm-hero hexfield" data-assume="M-02">
      <div class="hm-hero-body">
        <h1>${hire.name} starts in ${daysToStart()} days</h1>
        <p class="lede">${startDateText()}. ${hire.role}, ${hire.loc}, ${hire.arrangement}</p>
      </div>
      <div class="hm-hero-fig">
        <div class="hhf-num">${R.mine.pct}<span>%</span></div>
        <div class="hhf-cap">of your ${R.mine.total} tasks done</div>
      </div>
    </div>

    <div class="hm-figs">
      <div class="hm-fig-card">
        <div class="hfc-h"><b>Jordan\u2019s journey</b>
          <span class="pnote">A plain count of tasks done over tasks assigned. No agreed formula,
          no weighting, and no definition of what \u201cready\u201d means. ${am('M-02')}</span>
        </div>
        ${nhProgressDonut()}
      </div>
      ${othersStrip()}
    </div>

    ${(() => { const od = overdueItems(); return od.length ? `
    <div class="overdue-bar" data-assume="M-28">
      <div class="od-h">${ic('exclamation-triangle.svg','xl')}
        <div><b>${od.length} thing${od.length>1?'s are':' is'} overdue</b>
        <span>Past the date, still open, and Day 1 is in ${daysToStart()} days. ${am('M-28')}</span></div>
      </div>
      ${od.map(o => `
        <div class="od-row">
          <span class="od-who">${o.who}</span>
          <span class="od-what">${o.what}</span>
          ${o.route ? `<button class="btn sm od-btn" data-goto="${o.route}">Do it now</button>`
            : `<span class="od-none">Jordan's to finish. A nudge has gone out.</span>`}
        </div>`).join('')}
    </div>` : ''; })()}

    ${blockers.length ? `
    <div class="blockers" data-assume="M-16">
      <div class="bl-h">${ic('exclamation-circle.svg','lg')}<h2>${blockers.length} thing${blockers.length>1?'s':''} need${blockers.length>1?'':'s'} attention</h2>
        <button class="btn secondary sm" data-escalate="1">Ask for help</button></div>
      ${blockers.map(b => `
        <div class="bl-row ${b.sev}">
          <span class="bl-dot"></span>
          <span class="bl-text">${b.text}${b.marker ? ' '+am(b.marker) : ''}</span>
          ${b.route ? `<button class="btn quiet sm" data-goto="${b.route}">${b.action} →</button>` : ''}
        </div>`).join('')}
    </div>
    ${(() => { const w = hmWaitingOnNewHire(); return w.length ? `
    <div class="waiting-on" data-assume="M-03">
      <div class="wo-h">${ic('hourglass.svg','sm')}<b>Waiting on Jordan</b>
        <span>Their tasks, not yours. Listed so nothing is invisible.</span></div>
      ${w.map(x => `<div class="wo-row">${x.text}${x.marker ? ' '+am(x.marker) : ''}</div>`).join('')}
    </div>` : ''; })()}` : `
    <div class="blockers clear">
      ${ic('check-circle.svg','lg')}<span>Nothing is blocked. Jordan is on track for ${startDateText()}.</span>
    </div>`}

    ${readinessTracker('hm')}

    <div class="hm-grid">
      <div>
        <div class="section-h">
          <h2>Your tasks</h2>
          <span class="hint">${hmDone()} of ${tasks.length} done, in the order they come up</span>
          <span class="hint pnote">Each carries a verdict on whether it should exist at all ${am('M-09')}</span>
        </div>
        ${hmPhaseStrip()}
        ${/* Grouped by when, not by system. The list used to be flat and
              entirely pre-Day 1, which made the after-start half invisible. */''}
        ${HM_PHASES.map((ph, pi) => {
          const inPhase = tasks.filter(t => t.phase === pi);
          if (!inPhase.length) return '';
          const c = hmPhaseCounts()[pi];
          return `
          <div class="hm-phase" data-phase="${pi}">
            <div class="hp-h">
              <span class="hp-name">${ph}</span>
              <span class="hp-rule"></span>
              <span class="hp-count">${c.done} of ${c.total}</span>
            </div>
            <div class="tcards">
              ${inPhase.map((t, i) => hmTaskCard(t, pi === 0 ? i + 1 : null)).join('')}
            </div>
          </div>`;
        }).join('')}
        <div class="subtraction-link pnote" data-goto="#/hm/subtraction">
          ${ic('list-tasks.svg','lg')}
          <div>
            <b>The subtraction review</b>
            <p>Seven manager tasks are recommended for removal or automation, and five more are shown here only to be
            argued about. This is the screen for that conversation.</p>
          </div>
          ${ic('chevron-right.svg','lg')}
        </div>

        <div class="section-h" data-assume="M-16 L-04">
          <h2>Equipment</h2><span class="hint">The same table Jordan sees</span><span class="hint pnote">One source, both sides ${am('L-04')}</span>
        </div>
        ${equipmentTable(true)}

        <div class="section-h" data-assume="M-03 L-05">
          <h2>Jordan’s progress</h2><span class="hint">Status only, never what they entered ${am('M-03')}</span>
        </div>
        <div class="nh-progress">
          ${nhProgressRows().map(r => `
            <div class="np-row">
              <span class="np-label">${r.label}</span>
              ${r.sensitive ? `<span class="np-lock" title="${r.hidden}">${ic('lock.svg','sm')}Detail hidden</span>` : '<span></span>'}
              ${chip(r.status)}
            </div>`).join('')}
          <div class="np-note pnote">${ic('info-circle.svg','sm')}
            <span>You can see that Jordan has finished something, not what they put in it. Identity documents,
            emergency contacts, voluntary self-identification and which policies they acknowledged are all withheld.
            Whether that is the right line is an open question. Nobody has written the visibility matrix yet. ${am('L-05')}</span>
          </div>
        </div>

        ${/* The Everyone else strip at the top of this page already
              carries these three, with their owners on hover. Listing
              them again here was the same status twice. */''}
      </div>

      ${hmRail()}
    </div>
  </div>`;
}

function hmTaskCard(t, seq) {
  const d = DISPOSITIONS[t.disp];
  const due = t.dueOff != null ? addDays(startDate(), t.dueOff) : null;
  const late = due && due < simToday() && !t.done;
  return `
  <div class="tcard hm ${t.done?'done':''} ${t.blocked?'blocked':''} ${t.reopened?'reopened':''}"
    data-task="${t.route}" ${t.marker?`data-assume="${t.marker}"`:''}>
    <div class="tic">${ic(t.icon,'lg')}</div>
    <div class="t-main">
      ${seq ? `<div class="t-seq">Step ${seq}</div>` : ''}
      <div class="t-name">${t.label}${t.marker ? ' '+am(t.marker) : ''}
        ${t.reopened ? `<span class="chip reopened">${ic('exclamation-circle.svg','sm')}Reopened by People Experience</span>` : ''}</div>
      <div class="t-why">${t.why}</div>
      <div class="t-meta">
        ${due ? `<span class="m ${late?'overdue':''}">${ic('calendar.svg','sm')}Due ${dueText(due)}${t.srcDue ? '' : ' '+am('M-23')}</span>` : ''}
        ${t.sys ? `<span class="sys-tag sm">${t.sys}</span>` : ''}
      </div>
      <div class="disp-line pnote">
        <span class="disp ${d.cls}">${d.label}</span>
        <span class="disp-note">${t.dispNote}</span>
      </div>
    </div>
    <div class="t-side">
      ${t.blocked && !t.done ? `<span class="chip overdue">Blocked</span>` : chip(t.done ? 'done' : 'notstarted')}
      ${ic('chevron-right.svg','lg')}
    </div>
  </div>`;
}

function hmRail() {
  const H = S.hm;
  const buddy = H.buddy.assigned ? orgPerson(H.buddy.assigned) : null;
  return `
  <div class="rail">
    <div class="rail-card" data-assume="L-03">
      <h3>Your new hire</h3>
      <div class="contact">
        <div class="avatar">${HIRE.initials}</div>
        <div>
          <div class="c-name">${HIRE.legalFirst} ${HIRE.legalLast}</div>
          <div class="c-role">${HIRE.role}</div>
          <div class="c-links">
            <a data-contact="email">${ic('email.svg','sm')}Personal email</a>
          </div>
        </div>
      </div>
      <div class="rail-note warn-note">${ic('info-circle.svg','sm')}
        <span><b>Jordan already has your details.</b> Your name, Teams handle and email are on their portal from today,
        and they can contact you before Day 1. Nothing sets an expectation about how fast you reply. ${am('L-03')}</span>
      </div>
    </div>

    <div class="rail-card">
      <h3>Two quick confirmations ${am('M-18')}</h3>
      <div class="quick-row ${H.contactConfirmed?'done':''}">
        <div>
          <div class="q-label">Your contact details</div>
          <div class="q-val">${esc(H.workPhone)}, ${MANAGER.email}</div>
        </div>
        ${H.contactConfirmed
          ? `<span class="chip done">${ic('check.svg','sm')}Confirmed</span>`
          : `<button class="btn secondary sm" data-quickconfirm="contact">Still right</button>`}
      </div>
      <div class="quick-row ${H.channels.accepted?'done':''}">
        <div>
          <div class="q-label">Add Jordan to ${CHANNEL_SUGGESTIONS.length} team channels</div>
          <div class="q-val">${CHANNEL_SUGGESTIONS.slice(0,2).join(', ')} and ${CHANNEL_SUGGESTIONS.length-2} more</div>
        </div>
        ${H.channels.accepted
          ? `<span class="chip done">${ic('check.svg','sm')}Queued</span>`
          : `<button class="btn secondary sm" data-quickconfirm="channels">Add all</button>`}
      </div>
      <div class="rail-note">Both of these were separate tasks. They are one tap here because neither needs your judgement.</div>
    </div>

    <div class="rail-card">
      <h3>Support</h3>
      <div class="contact">
        <div class="avatar ${PEOPLE.pex.cls}">${PEOPLE.pex.initials}</div>
        <div>
          <div class="c-name">${PEOPLE.pex.name}</div>
          <div class="c-role">${PEOPLE.pex.role}</div>
          <div class="c-links">
            <a data-contact="teams">${ic('comment-lines.svg','sm')}Teams</a>
            <a data-contact="email">${ic('email.svg','sm')}Email</a>
          </div>
        </div>
      </div>
      <ul class="res-list mt8">
        <li><a data-ext="guide">${ic('file-alt.svg','sm')}Manager Onboarding Guide ${am('M-15')}</a></li>
        <li><a data-goto="#/handoffs">${ic('users-connected.svg','sm')}How the two portals connect</a></li>
      </ul>
      ${buddy ? `<div class="rail-note">Buddy assigned: <b>${buddy.name}</b>${S.hm.buddy.notified ? ', notified' : ''}.</div>` : ''}
    </div>
  </div>`;
}

/* ============================================================
   H-03: confirm the first-day details
   ============================================================ */
function renderHmLogistics() {
  const L = S.hm.logistics;
  const jp = S.country === 'JP';
  const blueprint = [
    ['Where to go', jp ? 'Otemachi Financial City Grand Cube, reception, 3rd floor' : '1225 17th Street, main reception, ground floor'],
    ['Parking', jp ? 'No on-site parking. Nearest station is Otemachi (C11)' : 'Visitor parking, level B2. Bring the QR code in your Day 1 email.'],
    // Read straight off the coordinator's blueprint (X-05), so the manager is
    // confirming against what People Experience actually published.
    ['What to expect', S.pexUpdate
      ? `Orientation ${S.pex.blueprint.from} to ${S.pex.blueprint.until}, then straight into your 1:1.`
      : 'Orientation until 12:00, then lunch with the other new starters.'],
    ['Dress code', 'Smart casual.'],
  ];
  return `
  <div class="page">
    ${hmCrumbs('Confirm the first-day details')}
    <div class="task-head">
      <h1>Confirm the first-day details</h1>
      <p class="why">Most of this is already known. What we need from you is the part only you can answer.</p>
      ${dispBanner('keep', 'Kept, but narrowed. The location facts come from the orientation blueprint for Denver, so you are confirming rather than authoring.')}
    </div>

    <div class="task-shell">
      <div class="wiz-body">
        <div class="form-sec" data-assume="M-05">
          <h3>From the orientation blueprint ${am('M-05')}</h3>
          <p class="sec-note">Maintained by People Experience for this location, and read-only here. If something is wrong,
          it should be fixed in the blueprint so every new starter in Denver gets the corrected version.</p>
          <div class="bp-card">
            ${blueprint.map(([k,v]) => `<div class="bp-row"><dt>${k}</dt><dd>${v}</dd></div>`).join('')}
          </div>
          <div class="callout pnote">
            ${ic('exclamation-triangle.svg')}
            <div><b>Can a manager override any of this?</b> The source asks the question and does not answer it.
            Read-only is the safe choice. If overrides are intended, this screen has to show which value wins. ${am('M-05')}</div>
          </div>
        </div>

        <div class="form-sec">
          <h3>What only you know</h3>
          <div class="field">
            <label>What time should Jordan arrive, and where should they come?</label>
            <input type="text" id="lgWhere" value="${esc(L.whereToBe)}" placeholder="e.g. 9:00, main reception. Ask for me at the desk">
            <div class="note">This goes into Jordan’s first-day details, which opens to them 3 days before they start. ${am('L-07')}</div>
          </div>

          <div class="field">
            <label>Are you available on Day 1?</label>
            <div class="radio-row">
              <label><input type="radio" name="avail" data-avail="yes" ${L.available?'checked':''}>Yes, I’ll be there</label>
              <label><input type="radio" name="avail" data-avail="no" ${!L.available?'checked':''}>No, someone else will cover</label>
            </div>
            <div class="note">Meeting your new hire on Day 1 is tracked as a programme measure, so this answer matters beyond this screen.</div>
          </div>

          ${!L.available ? `
          <div class="field" data-assume="M-14 M-20">
            <label>Who covers for you? ${am('M-14')} ${am('M-20')}</label>
            <select id="lgProxy">
              <option value="">Choose someone…</option>
              ${ORG_PEOPLE.filter(p => p.team).map(b => `<option ${L.proxy===b.name?'selected':''}>${b.name}</option>`).join('')}
            </select>
            <div class="note">Named here for Jordan's first day. The requirement is broader than that: a proxy should be able
            to <b>act on your behalf</b> and <b>see a new hire's status</b> as a standing arrangement, and People Experience
            need the same capability. What a proxy can actually see and do is still undefined. ${am('M-20')}</div>
          </div>` : ''}

          <div class="field" style="max-width:560px;">
            <label>Anything team-specific they should know <span class="opt">(optional)</span></label>
            <textarea rows="3" id="lgNote" placeholder="e.g. we do a team stand-up at 9:15, come along if you're in early">${esc(L.teamNote)}</textarea>
          </div>
        </div>
      </div>
      <div class="wiz-foot">
        <span class="saved-state">${ic('save.svg','sm')}Saves as you type</span>
        <span class="missing">${L.whereToBe.trim() ? (L.available || L.proxy ? 'Ready to confirm.' : 'Choose who covers for you.') : 'Add where and when Jordan should arrive.'}</span>
        <button class="btn primary" id="lgConfirm" ${L.whereToBe.trim() && (L.available || L.proxy) ? '' : 'disabled'}>
          ${L.confirmed ? 'Update' : 'Confirm the details'}</button>
      </div>
    </div>
  </div>`;
}

/* ============================================================
   H-04: order the computer  (M-01: an order, not a confirmation)
   ============================================================ */
function renderHmComputer() {
  const E = S.equipment;
  const dev = deviceById(E.device) || DEVICE_CATALOG[0];
  const ordered = E.submitted;

  return `
  <div class="page">
    ${hmCrumbs('Equipment for your new hire')}
    <div class="task-head" data-assume="M-01">
      <h1>Equipment for your new hire ${am('M-01')}</h1>
      <p class="why">Jordan picks their own machine and places the order. There is nothing here for you to do.</p>
      ${dispBanner('remove', 'This screen is the argument for deleting the task. The order moved to the new hire, so what is left tells you something happened that the readiness view already shows. Keeping it means a manager opens a task to read a status.', 'M-01')}
    </div>

    ${equipmentTable(true)}

    <div class="task-shell mt24">
      <div class="wiz-body">
        <div class="form-sec">
          <h3>What Jordan chose</h3>
          ${E.deviceConfirmed ? `
            <div class="dev-card fixed">
              <div class="dev-art ${dev.family}">${deviceArt(dev.family)}</div>
              <div class="dev-body">
                <div class="dev-h"><div>
                  <div class="dev-name">${dev.name}</div>
                  <div class="dev-sub">${dev.sub}</div>
                </div></div>
                <dl class="dev-specs">
                  ${dev.specs.map(([k,v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}
                </dl>
                <div class="dev-lead ${dev.leadOk ? '' : 'late'}">
                  ${ic(dev.leadOk ? 'check-circle.svg' : 'exclamation-triangle.svg','sm')}${dev.lead}
                </div>
              </div>
            </div>
            <p class="sec-note mt12">${ordered
              ? 'Ordered. It ships to the office address on their record.'
              : 'Chosen, not yet ordered. The order goes in when Jordan submits the task.'}</p>
          ` : `
            <div class="blocked-state">
              ${ic('hourglass.svg','xl')}
              <div>
                <b>Jordan has not chosen yet.</b>
                <p>Their equipment task is open and nothing is waiting on you. If it is still open close to
                the start date, the readiness view will raise it.</p>
              </div>
            </div>`}
        </div>

        <div class="form-sec pnote" data-assume="M-17">
          <h3>When a manager would step in ${am('M-17')}</h3>
          <p class="sec-note">Three cases were raised and none is specified: a role that needs a machine outside
          its mapped build, an order that would land after the start date, and a cost that needs approving.
          Until those are written, an exception path cannot be drawn, so this screen shows none.</p>
        </div>
      </div>
      <div class="wiz-foot">
        <span class="saved-state">${ic('info-circle.svg','sm')}Nothing on this screen is yours to action</span>
        <button class="btn secondary" data-goto="#/hm/">Back to your hires</button>
      </div>
    </div>
  </div>`;
}

/* ============================================================
   H-05: confirm the application stack (drawn blocked, M-04)
   ============================================================ */
function renderHmSoftware() {
  const S5 = S.hm.software;
  return `
  <div class="page">
    ${hmCrumbs('Confirm the application stack')}
    <div class="task-head" data-assume="M-04">
      <h1>Confirm the application stack ${am('M-04')}</h1>
      <p class="why">Which applications Jordan has on their first day.</p>
      ${dispBanner('reduce', 'Meant to be exception-only: a persona-based default stack you glance at and confirm. It cannot work that way today.', 'M-04')}
    </div>

    <div class="blocked-panel" data-assume="M-04">
      ${ic('exclamation-triangle.svg','xl')}
      <div>
        <h2>There is no default stack to show you</h2>
        <p>This screen is supposed to open with the applications Jordan’s role normally gets, so you can confirm them in
        one action. That needs a persona, and no full persona list exists in the platform yet. The fallback under
        discussion is deriving persona from job family, which is the approach the requirements analysis rejected as
        inaccurate for most roles.</p>
        <p><b>So here is what the task actually looks like today:</b> an empty list you fill in by hand, the opposite
        of what it is meant to be. Drawn honestly, not aspirationally. ${am('M-04')}</p>
      </div>
    </div>

    <div class="task-shell mt24">
      <div class="wiz-body">
        <div class="form-sec">
          <h3>Default stack for Jordan’s persona</h3>
          <div class="empty-stack">${ic('times.svg','lg')}<span>Empty, persona not mapped</span></div>
        </div>
        <div class="form-sec">
          <h3>Add applications by hand</h3>
          <p class="sec-note">Catalogue items only. Each one raises its own request and inherits that item’s existing
          approval flow and lead time.</p>
          <div class="acc-grid">
            ${SOFTWARE_CATALOG.map(a => `
              <label class="check acc">
                <input type="checkbox" data-sw="${esc(a)}" ${S5.added.includes(a)?'checked':''}>
                <span>${a}</span>
              </label>`).join('')}
          </div>
          <div class="callout pnote mt16">
            ${ic('question-circle.svg')}
            <div><b>Can a manager remove something from a default stack?</b> The requirements cover additions in detail
            and never mention removals. It matters: if the default is authoritative, removal should be blocked; if you
            are accountable for the cost, it should not. Unanswered.</div>
          </div>
        </div>
      </div>
      <div class="wiz-foot">
        <span class="saved-state">${ic('save.svg','sm')}${S5.added.length} selected</span>
        <span class="missing">Every application here was chosen by hand because the platform could not suggest any.</span>
        <button class="btn primary" id="swConfirm" ${S5.added.length?'':'disabled'}>${S5.confirmed?'Update':'Confirm the stack'}</button>
      </div>
    </div>
  </div>`;
}

/* ============================================================
   H-07: assign a buddy  (and the L-01 visibility conflict)
   ============================================================ */
/* ============================================================
   H-07: name who they should meet  (M-07 revised, M-26)

   One screen, one named role. No suggested people: the direction is a plain
   list of everyone in the org, because on first rollout anybody can be a
   buddy and the certified programme is years away. A name is not enough
   either. It has to be accepted before it counts.
   ============================================================ */
function renderHmMeet() {
  const B = S.hm.buddy, N = S.hm.network;
  const buddy = B.assigned ? orgPerson(B.assigned) : null;
  const others = Object.keys(N.named).filter(id => id !== B.assigned);
  const withWhy = others.filter(id => (N.named[id] || '').trim()).length;

  const picker = (role, current) => `
    <select data-pickperson="${role}">
      <option value="">Select from the org…</option>
      ${ORG_PEOPLE
        .filter(p => role !== 'buddy' || p.team || p.dept === 'Global FP&A')
        .map(p => `<option value="${p.id}" ${current === p.id ? 'selected' : ''}>${p.name}, ${p.role}, ${p.dept}</option>`).join('')}
    </select>`;

  const slot = (role, person, title, hint, marker) => `
    <div class="form-sec meet-sec" ${marker ? `data-assume="${marker}"` : ''}>
      <h3>${title} ${marker ? am(marker) : ''}</h3>
      <p class="sec-note">${hint}</p>
      ${person ? `
        <div class="meet-card">
          <div class="avatar lg ${role === 'buddy' ? 'buddy' : 'peer'}">${person.initials}</div>
          <div class="bd-body">
            <div class="bd-name">${person.name}${person.ecn ? ' <span class="chip info">Employee Connection Network</span>' : ''}</div>
            <div class="bd-role">${person.role}, ${person.dept}</div>
            <div class="meet-state ${S.hm[role].accepted ? 'ok' : ''}">
              ${ic(S.hm[role].accepted ? 'check-circle.svg' : 'clock.svg','sm')}
              ${S.hm[role].accepted
                ? 'Accepted. Their first month with Jordan can be booked.'
                : S.hm[role].notified
                  ? 'Invited. Waiting for them to accept.'
                  : 'Not invited yet.'}
            </div>
          </div>
          <div class="meet-actions">
            ${!S.hm[role].notified ? `<button class="btn primary sm" data-invite="${role}">Ask them</button>` : ''}
            ${S.hm[role].notified && !S.hm[role].accepted ? `<button class="btn secondary sm" data-accept="${role}">Simulate acceptance</button>` : ''}
            <button class="btn quiet sm" data-clearperson="${role}">Change</button>
          </div>
        </div>` : picker(role, '')}
    </div>`;

  return `
  <div class="page">
    ${hmCrumbs('Name who they should meet')}
    <div class="task-head">
      <h1>Name who they should meet</h1>
      <p class="why">One buddy, in Jordan’s function, and anyone else worth an early conversation.
      Both are your call, and a buddy has to say yes before anything is booked.</p>
      ${dispBanner('keep', 'Two screens became one, and the second named role went with them. The suggestion logic is gone too, because on first rollout anybody can be a buddy and there is nothing to suggest from yet.', 'M-07')}
    </div>

    <div class="conflict-banner" data-assume="L-01">
      ${ic('exclamation-triangle.svg','lg')}
      <div>
        <b>Unresolved: when does Jordan see these names? ${am('L-01')}</b>
        <p>The specification says the buddy’s contact card appears <b>72 hours before the start date</b>.
        The new hire prototype shows the buddy <b>as soon as you name one</b>, which right now is ${daysToStart()} days early.
        Both cannot be right, and you can change your mind up to 3 days before Jordan starts, which would remove a name
        they had already seen.</p>
        <div class="conflict-toggle">
          <span>Show Jordan the buddy:</span>
          <button class="pc-btn sm ${S.buddyRule==='assignment'?'on':''}" data-buddyrule="assignment">From assignment</button>
          <button class="pc-btn sm ${S.buddyRule==='72h'?'on':''}" data-buddyrule="72h">72 hours before start</button>
          <span class="ct-now">${buddyVisibleToNH() ? 'Visible to Jordan now' : 'Not visible to Jordan yet'}</span>
        </div>
      </div>
    </div>

    <div class="task-shell">
      <div class="wiz-body">
        ${slot('buddy', buddy, 'Buddy',
          'Someone on Jordan’s team or in their function, for culture and logistics and the questions they would rather not ask you. Any employee can do it today. There is no certified list to pick from yet.', 'M-07')}

        <div class="form-sec" data-assume="M-10 L-06">
          <h3>Anyone else they should meet ${am('M-10')}</h3>
          <p class="sec-note">Up to fifteen people. Write why each one matters, because Jordan sees the reason you write.</p>
          <div class="meet-others">
            ${ORG_PEOPLE.filter(p => p.id !== B.assigned).map(p => {
              const on = N.named[p.id] !== undefined;
              return `
              <div class="meet-row ${on ? 'on' : ''}">
                <label class="mr-top">
                  <input type="checkbox" data-meetperson="${p.id}" ${on ? 'checked' : ''}>
                  <div class="avatar sm peer">${p.initials}</div>
                  <div class="mr-body">
                    <div class="mr-name">${p.name}</div>
                    <div class="mr-role">${p.role}, ${p.dept}</div>
                  </div>
                </label>
                ${on ? `<textarea class="mr-why" rows="2" data-meetwhy="${p.id}"
                  placeholder="Why should Jordan meet them? They will read this.">${esc(N.named[p.id] || '')}</textarea>` : ''}
              </div>`;
            }).join('')}
          </div>
          <div class="meet-count">${others.length} named, ${withWhy} with a reason written${others.length > 15 ? '. That is over the fifteen this screen expects' : ''}</div>
        </div>

        <div class="callout soft" data-assume="M-21">
          ${ic('exclamation-triangle.svg')}
          <div><b>This may already exist.</b> The onboarding platform ships <b>“select people to meet”</b> and
          <b>“select helpful contacts”</b> as manager setup, surfaced on the new hire’s dashboard. If that is what it
          sounds like, this screen is not net-new manager work, it is switching something on. Settle it before this
          is costed. ${am('M-21')}</div>
        </div>

        <div class="form-sec">
          <h3>What happens after that</h3>
          <div class="happens">
            <div class="hp-row ${B.notified ? 'done' : ''}">${ic(B.notified ? 'check-circle.svg' : 'clock.svg','sm')}
              <span>Everyone named is asked, not told, and has to accept. ${am('L-09')}</span></div>
            <div class="hp-row ${B.accepted ? 'done' : ''}">${ic(B.accepted ? 'check-circle.svg' : 'clock.svg','sm')}
              <span>Once the buddy accepts, the system reads their calendar and books the first month.
              Nothing here does that yet. ${am('M-27')}</span></div>
            <div class="hp-row ${buddyVisibleToNH() ? 'done' : ''}">${ic(buddyVisibleToNH() ? 'check-circle.svg' : 'clock.svg','sm')}
              <span>${buddyVisibleToNH()
                ? 'Jordan can see the buddy contact card now.'
                : 'Jordan sees the contact card 72 hours before starting.'} ${am('L-01')}</span></div>
            <div class="hp-row">${ic('info-circle.svg','sm')}<span>You can change any of this until 3 days before Jordan starts.
              If you name nobody, a buddy is auto-assigned the day before.</span></div>
          </div>
        </div>

        <div class="mt24">
          <button class="btn primary" data-meetsubmit="1" ${buddy ? '' : 'disabled'}>
            ${N.submitted ? 'Update Jordan’s list' : 'Send to Jordan'}</button>
        </div>
      </div>
    </div>
  </div>`;
}

/* Whether the new hire currently sees the buddy. The L-01 rule in one place,
   read by both this screen and the new hire's landing rail. */
function buddyVisibleToNH() {
  if (!S.hm.buddy.assigned) return false;
  if (S.buddyRule === 'assignment') return true;
  return daysToStart() <= 3;
}

/* ============================================================
   H-08: Day 1 calendar holds
   ============================================================ */
function renderHmCalendar() {
  const C = S.hm.calendar;
  return `
  <div class="page">
    ${hmCrumbs('Set up their first day')}
    <div class="task-head" data-assume="M-06">
      <h1>Set up their first day ${am('M-06')}</h1>
      <p class="why">Most of this is already on the calendar. Check it, move anything that does not work, and you are done.</p>
      ${dispBanner('automate', 'Your 1:1 is placed automatically because meeting your new hire on Day 1 is a tracked measure. Whether the rest auto-create too is undecided, and that is the difference between a glance and a chore.', 'M-06')}
    </div>

    <div class="task-shell">
      <div class="wiz-body">
        <div class="cal-day">
          ${DAY1_HOLDS.map(h => {
            const on = h.auto || C.holds[h.id];
            return `
            <div class="cal-hold ${on?'on':''} ${h.blueprint?'blueprint':''} ${h.locked?'locked':''}">
              <div class="ch-time">${h.time}</div>
              <div class="ch-body">
                <div class="ch-label">${h.label}
                  ${h.locked ? `<span class="chip info">${ic('lock.svg','sm')}Cannot be deleted</span>` : ''}
                  ${h.blueprint ? `<span class="chip info">People Experience owns this</span>` : ''}
                  ${h.auto && !h.locked && !h.blueprint ? `<span class="chip done">Placed for you</span>` : ''}
                </div>
                ${h.note ? `<div class="ch-note">${h.note}</div>` : ''}
              </div>
              ${h.auto
                ? (h.locked ? `<button class="btn quiet sm" data-resched="1">Reschedule</button>` : '')
                : `<label class="check"><input type="checkbox" data-hold="${h.id}" ${C.holds[h.id]?'checked':''}><span>Add</span></label>`}
            </div>`;
          }).join('')}
        </div>
        <div class="after-day1">
          <div class="ad-h">${ic('arrow-right.svg','sm')}<b>Just after Day 1</b></div>
          ${AFTER_DAY1_HOLDS.map(h => `
            <div class="ad-row">
              <span class="ad-when">${h.when}</span>
              <div>
                <div class="ad-label">${h.label}</div>
                <div class="ch-note">${h.note}</div>
              </div>
              <label class="check"><input type="checkbox" data-hold="${h.id}" ${C.holds[h.id]?'checked':''}><span>Add</span></label>
            </div>`).join('')}
        </div>

        <div class="callout soft mt16">
          ${ic('info-circle.svg')}
          <div><b>No IT setup window.</b> IT is not committing to an hour on Day 1, so Jordan sets the machine up
          themselves and the help desk is open all day. That pointer sits in Jordan’s checklist, not your calendar. ${am('M-33')}</div>
        </div>

        <div class="callout pnote mt16">
          ${ic('question-circle.svg')}
          <div>The unticked holds are suggestions you have to accept one at a time. If they were created
          automatically like your 1:1, this screen would have nothing on it for you to do, which is the point of the
          disposition above. ${am('M-06')}</div>
        </div>
      </div>
      <div class="wiz-foot">
        <span class="saved-state">${ic('save.svg','sm')}Your 1:1 is already in the calendar</span>
        <span class="missing">${Object.values(C.holds).filter(Boolean).length} of 2 suggested holds added</span>
        <button class="btn primary" id="calConfirm">${C.confirmed?'Update':'Confirm the day'}</button>
      </div>
    </div>
  </div>`;
}

/* ============================================================
   H-10: welcome email
   ============================================================ */
function renderHmWelcome() {
  const W = S.hm.welcome;
  const firstWeek = [
    'Accessories order, so it ships in time',
    'Personal and contact details',
    'Job description confirmation',
    'Policies and privacy notices',
  ];
  if (W.sent) {
    return `
    <div class="page">
      ${hmCrumbs('Send a welcome note')}
      <div class="task-shell">
        <div class="confirm-panel">
          <div class="big-check">${ic('check.svg','xl')}</div>
          <h2>Welcome note sent to Jordan.</h2>
          <p>It went to their personal email, and it is now the first thing on their portal when they log in.</p>
          <button class="btn secondary" id="wcReopen">Edit and resend</button>
          <button class="btn primary" data-goto="#/hm/">Back to your hires</button>
        </div>
      </div>
    </div>`;
  }
  return `
  <div class="page">
    ${hmCrumbs('Send a welcome note')}
    <div class="task-head" data-assume="M-08">
      <h1>Send a welcome note ${am('M-08')}</h1>
      <p class="why">Already written. Add a line of your own if you want to, and send.</p>
      ${dispBanner('reduce', 'Today managers write this from scratch. Pre-filling it is most of the saving; the personal line is the only part that needs you.', 'M-08')}
    </div>

    <div class="two-sec">
      <div class="sec-card">
        <div class="sec-top"><h2>Your note</h2></div>
        <div class="field" style="max-width:none;">
          <label>To</label>
          <input type="text" value="${HIRE.email}" readonly>
          <div class="note">Jordan’s personal email. They do not have an Equinix account yet.</div>
        </div>
        <div class="tone-pick" data-assume="M-31">
          <label>Pick a tone ${am('M-31')}</label>
          <div class="tone-row">
            ${WELCOME_TEMPLATES.map(t => `
              <button class="tone-btn ${(W.tone || 'warm') === t.id ? 'on' : ''}" data-tone="${t.id}">
                <b>${t.label}</b><span>${t.hint}</span>
              </button>`).join('')}
          </div>
          <div class="note">Switching replaces the draft below. Anything you have typed into it is lost,
          so pick the tone first.</div>
        </div>
        <div class="field" style="max-width:none;">
          <label>Standard welcome <span class="opt">(editable)</span></label>
          <textarea rows="9" id="wcBody">${esc(W.body || WELCOME_BOILERPLATE)}</textarea>
        </div>
        <div class="field" style="max-width:none;">
          <label>Add something personal <span class="opt">(optional, but it is the bit that matters)</span></label>
          <textarea rows="3" id="wcPersonal" placeholder="Anything you'd say if you were writing this yourself.">${esc(W.personal)}</textarea>
        </div>
        <div class="sys-block" data-assume="M-08">
          <div class="sb-h">${ic('lock.svg','sm')}Added automatically. You cannot edit this</div>
          <b>What to expect in your first week</b>
          <ol>${firstWeek.map(f => `<li>${f}</li>`).join('')}</ol>
          <div class="sb-note">${WELCOME_SYSTEM_BLOCK_NOTE} ${am('M-08')}</div>
        </div>
        <div class="mt16" style="display:flex; gap:12px; align-items:center;">
          <button class="btn primary" id="wcSend">Send now</button>
          <span style="font-size:12.5px; color:var(--carbon);">Goes to Jordan’s personal email and their portal.</span>
        </div>
      </div>

      <div class="sec-card">
        <div class="sec-top"><h2>How Jordan sees it</h2></div>
        <div class="pv-msg">
          <div class="avatar sm mgr">${MANAGER.initials}</div>
          <div class="pv-body">
            <div class="pv-name">${MANAGER.name}</div>
            <div class="pv-sub">to jordan.reyes@gmail.com</div>
            <div class="pv-text" id="wcPreview">${esc(W.body || WELCOME_BOILERPLATE)}${W.personal ? '\n\n'+esc(W.personal) : ''}</div>
          </div>
        </div>
        <div class="share-model" data-assume="L-08">
          ${ic('info-circle.svg')}
          <span><b>Order matters here.</b> This should land before Jordan is asked to write their own introduction, so
          the request arrives in context. Nothing enforces that today, and three welcome messages compete for the same
          week. ${am('L-08')}</span>
        </div>
        <div class="callout pnote mt16" data-assume="M-21">
          ${ic('exclamation-triangle.svg')}
          <div><b>This may already exist.</b> The onboarding platform ships a “customise a welcome memo” capability and a
          “from my manager” block on the new hire's dashboard. The part that actually adds something here is the read-only
          first-week block, because it is generated from Jordan's real task list. ${am('M-21')}</div>
        </div>
      </div>
    </div>
  </div>`;
}


/* ============================================================
   Forward the introduction (L-02). Closes the loop on the
   new hire side's manager-forward sharing model
   ============================================================ */
function renderHmIntro() {
  const F = S.hm.intro.forwarded;
  const hasPhoto = S.intro.useBadge && S.photo.dataUrl;
  return `
  <div class="page">
    ${hmCrumbs('Forward Jordan’s introduction')}
    <div class="task-head" data-assume="L-02">
      <h1>Jordan wrote their introduction ${am('L-02')}</h1>
      <p class="why">They agreed you can share it with the team. It goes nowhere until you send it.</p>
      ${dispBanner('keep', 'This arrived because Jordan finished their side. You choose when the team sees it. Nothing is posted automatically.')}
    </div>

    <div class="two-sec">
      <div class="sec-card">
        <div class="sec-top"><h2>What Jordan wrote</h2>
          ${S.intro.consent ? `<span class="chip done">${ic('check.svg','sm')}Consented to sharing</span>` : `<span class="chip overdue">No consent yet</span>`}</div>
        <div class="pv-msg">
          ${hasPhoto
            ? `<img src="${S.photo.dataUrl}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex:none;">`
            : `<div class="avatar sm">${HIRE.initials}</div>`}
          <div class="pv-body">
            <div class="pv-name">${HIRE.legalFirst} ${HIRE.legalLast}</div>
            <div class="pv-sub">${HIRE.role}, starts ${dueText(startDate())}</div>
            <div class="pv-text">${S.intro.text ? esc(S.intro.text) : '<span class="pv-empty">Nothing written yet.</span>'}</div>
          </div>
        </div>
        <div class="share-model">
          ${ic('info-circle.svg')}
          <span>Jordan ticked the box that lets you share this. Without that tick it would still be saved, but you would
          not be able to forward it.</span>
        </div>
        <div class="mt16" style="display:flex; gap:12px; align-items:center;">
          ${F
            ? `<span class="verified">${ic('check.svg','sm')}Forwarded to the team</span>
               <button class="btn quiet sm" id="introUnsend">Undo</button>`
            : `<button class="btn primary" id="introForward" ${S.intro.consent && S.intro.text.trim() ? '' : 'disabled'}>Forward to the team</button>`}
        </div>
      </div>

      <div class="sec-card">
        <div class="sec-top"><h2>Where it goes</h2></div>
        <ol class="mech-list">
          <li>Posted to the <b>Global FP&A team channel</b> under your name.</li>
          <li>Jordan is told it has been shared, and when.</li>
          <li>The team sees it before Jordan arrives, so the first conversation is not an introduction.</li>
        </ol>
        <div class="callout pnote mt16">
          ${ic('question-circle.svg')}
          <div><b>No source describes this screen.</b> The new hire side is clear that a manager forwards the
          introduction instead of auto-posting it, but nothing says where it lands on your side, or what you can edit
          before sending. Built to close the loop, marked because it is invented. ${am('L-02')}</div>
        </div>
      </div>
    </div>
  </div>`;
}

/* ============================================================
   H-06: corporate card (PRD v1.4; M-19, L-10)
   ============================================================ */
function renderHmCard() {
  const C = S.hm.card;
  return `
  <div class="page">
    ${hmCrumbs('Corporate card')}
    <div class="task-head" data-assume="M-19">
      <h1>Will Jordan need a corporate card? ${am('M-19')}</h1>
      <p class="why">One question, answered before they start. Everything after it happens without you.</p>
      ${dispBanner('undecided','This was listed as undecided while the source row was truncated. It is now specified end to end, and it really is one tap.','M-19')}
    </div>

    <div class="task-shell">
      <div class="wiz-body">
        <div class="form-sec">
          <h3>${CARD_FLOW.managerQuestion}</h3>
          <p class="sec-note">The question is about travel, not seniority. If they will spend on behalf of Equinix, they need one.</p>
          <div class="radio-row col mt16">
            <label><input type="radio" name="cardq" data-card="yes" ${C.needed===true?'checked':''}>
              <b>Yes</b>, they'll travel on behalf of Equinix</label>
            <label><input type="radio" name="cardq" data-card="no" ${C.needed===false?'checked':''}>
              <b>No</b>, not needed for this role</label>
          </div>
        </div>

        ${C.needed === true ? `
        <div class="form-sec" data-assume="L-10">
          <h3>What your yes sets off</h3>
          <ol class="mech-list">
            ${CARD_FLOW.mechanics.map(m => `<li>${m}</li>`).join('')}
          </ol>
          <div class="callout soft">
            ${ic('info-circle.svg')}
            <div><b>Note the timing.</b> Jordan's half is <b>Day 2</b>, after they start rather than before. It has already
            appeared on their portal as something coming up, so they know it is handled. ${am('L-10')}</div>
          </div>
          <div class="callout pnote">
            ${ic('question-circle.svg')}
            <div>${CARD_FLOW.note} Two things the requirement leaves open: what the task is finally called in the portal,
            and whether a cost centre and approver are captured alongside your yes. ${am('M-19')}</div>
          </div>
        </div>` : ''}

        ${C.needed === false ? `
        <div class="callout soft" data-assume="L-10">
          ${ic('check-circle.svg')}
          <div>Nothing further happens. Jordan is not asked about a card and never sees the subject. The negative answer
          is a designed outcome, not an absence. ${am('L-10')}</div>
        </div>` : ''}
      </div>
      ${C.needed !== null ? `<div class="wiz-foot">
        <span class="saved-state">${ic('check-circle.svg','sm')}Answered. ${C.needed ? 'Jordan will sign the agreement on Day 2' : 'Nothing scheduled'}</span>
        <span class="missing"></span>
        <button class="btn secondary" data-goto="#/hm/">Back to your hires</button>
      </div>` : ''}
    </div>
  </div>`;
}

/* ============================================================
   The subtraction review, this side's argument screen
   ============================================================ */
const SUBTRACTION = [
  { group:'remove', title:'Remove: should not exist in the future state', rows:[
    { task:'Receive portal login credentials', today:'None. This is not in the current manager checklist',
      why:'A manager is an existing employee who already signs in to Equinix systems. The row records itself as inferred from workflow analysis rather than drawn from a source, and its open question reads as pre-hire logic applied to the wrong persona.',
      cond:'Confirm no platform role or licence provisioning is hiding behind the row.', marker:'M-11' },
    { task:'Order the computer', today:'Gone. The new hire chooses and orders their own machine',
      why:'This was the heaviest row on the list and the largest single saving: the manager used to place the order, and nothing moved until they did. Equipment selection is now a new hire task, so the manager step has no work left in it.',
      cond:'An exception path still has to be written: a role needing a machine outside its mapped build, an order landing after the start date, or a cost that needs approving. None of the three is specified.', marker:'M-01' },
    { task:'Provide the new hire’s username', today:'Manager obtains and passes on credentials, two checklist items',
      why:'Already superseded: the candidate receives their credential email directly and creates their own password.',
      cond:'Nothing further. But verify what the new hire’s own “Collect your Equinix credentials” task actually contains before this claim is used externally.' },
    { task:'Provide the new hire’s Equinix password', today:'As above. A manager handling someone else’s password is a security problem in its own right',
      why:'The identity flow includes a one-time passcode and identity verification, so no human intermediary is involved.',
      cond:'Nothing further.' },
  ]},
  { group:'automate', title:'Automate away: the outcome is needed, the manager action is not', rows:[
    { task:'Schedule Day 1 calendar holds', today:'Manual. Schedule and host a Day 1 meeting',
      why:'The Day 1 one-to-one is already specified as an automatic calendar placement. If blueprint-sourced slots are reliable, the rest can follow.',
      cond:'The automatic placement has to be built, and blueprint slots reliable enough to auto-populate.', marker:'M-06' },
    { task:'Add new hire to team channels and distributions', today:'Manual and vague: “notify relevant stakeholders”',
      why:'Team membership data can generate the list; the manager approves it in one action.',
      cond:'Membership data good enough to generate a suggestion worth accepting.', marker:'M-18' },
    { task:'Confirm your own contact details', today:'Manual. Verify your phone number in the worker record',
      why:'Pre-fill turns the default action into a confirmation instead of data entry.',
      cond:'Pre-fill from the worker record.', marker:'M-18' },
  ]},
  { group:'reduce', title:'Reduce to exception-only: visible, but most managers should never touch it', rows:[
    { task:'Confirm software and application stack', today:'Heavy. The manager requests access and software by hand',
      why:'Should be a persona default the manager glances at.',
      cond:'The persona blocker resolved. Today there is no full persona list, and the proposed job-family fallback is the approach the analysis rejects.', marker:'M-04' },
    { task:'Review and personalise the welcome email', today:'Manual. Written from scratch',
      why:'Pre-filled boilerplate plus a personal line is most of the saving.',
      cond:'Boilerplate authored and approved; the first-week block generated from the new hire’s real task list.', marker:'M-08' },
    { task:'Suggested team network and meet-and-greets', today:'Informal or skipped entirely',
      why:'Accepting a suggestion is cheap; a blank multi-select is worse than nothing.',
      cond:'Suggestion logic good enough to be worth accepting.', marker:'M-10' },
  ]},
  { group:'keep', title:'Keep: needs a manager’s judgement', rows:[
    { task:'Assign a buddy', today:'Manual. Select a buddy',
      why:'A judgement about people, with a suggestion to make agreement one tap.',
      cond:'Buddy policy defined: criteria, load limits, decline process, plus a privacy position on the performance signal.', marker:'M-07' },
    { task:'Delegation and proxy', today:'Informal. Cover is arranged by asking someone',
      why:'The requirement gives both managers and People Experience a standing proxy who can act on their behalf and see a new hire’s status. That is wider than the Day 1 cover this prototype captures.',
      cond:'A permission model. What a proxy can see and do is undefined.', marker:'M-20' },
    { task:'Confirm new hire start logistics', today:'Partially manual. Determine office seating if applicable',
      why:'Narrowed to what only the manager knows: their own availability, cover if they are away, and team-specific instruction.',
      cond:'Blueprint precedence settled, so the manager confirms location facts rather than entering them.', marker:'M-05' },
    { task:'New hire readiness view', today:'No equivalent. Managers have no single view',
      why:'This is the screen that earns the portal.',
      cond:'Readiness score composition defined, and the visibility matrix written so progress can show without exposing sensitive detail.', marker:'M-02' },
    { task:'Offer-accept notification and guide', today:'Fragmented. No single place explains the manager’s role',
      why:'The other screen that earns the portal.',
      cond:'Guide content authored per persona, and its relationship to the existing companion guide resolved.', marker:'M-15' },
  ]},
  { group:'undecided', title:'Undecided: cannot be dispositioned yet', rows:[
    { task:'Confirm corporate card requirement, NOW SPECIFIED', today:'Was not established; the source row was truncated with seven attributes blank',
      why:'Resolved. It is a manager yes/no, but framed around travel rather than entitlement, and the new hire’s half is an e-signature on Day 2. Built, and it belongs under Keep now.',
      cond:'Nothing blocking. Two details still open: the task’s final name in the portal, and whether cost centre and approver are captured with the yes.', marker:'M-19' },
    { task:'Secure office location and seating', today:'Manual. Determine office seating if applicable',
      why:'The design walkthrough calls this a placeholder and suggests it could probably be taken off the manager’s plate.',
      cond:'Workplace follow-up on work arrangements, parking and badge access level.' },
    { task:'Schedule the pre-start connect', today:'Manual. Connect with your new hire before they start',
      why:'“Day −30” is ambiguous and may precede the manager having portal access for that hire at all.',
      cond:'Clarify what Day −30 anchors to.' },
    { task:'Recruitment process survey', today:'None',
      why:'The portal only needs to know whether to provide a delivery slot.',
      cond:'Question set and cadence owned by the survey workstream.' },
  ]},
  { group:'add', title:'Adds work: the exception to everything above', rows:[
    { task:'Name the new hire’s team network', today:'Does not exist. This is net-new manager work.',
      why:'The only item here that adds load. The case for it rests on a named new-hire failure, not knowing who to talk to, and on the fact that accepting a suggestion can be close to one tap. The case against is a new task, notifications to third parties, and a downstream scheduling flow.',
      cond:'An explicit decision that it is worth the cost.', marker:'M-10' },
  ]},
];

function renderHmSubtraction() {
  const counts = SUBTRACTION.reduce((a,g) => (a[g.group] = g.rows.length, a), {});
  const removed = (counts.remove||0) + (counts.automate||0);
  return `
  <div class="page">
    ${hmCrumbs('The subtraction review')}
    <h1>What should stop existing</h1>
    <p class="flow-sub">The goal on this side is to reduce what a manager is asked to do, not to organise it better.
    Every manager task carries a verdict and the condition that has to hold for it. <b>${removed} tasks are recommended
    for removal or automation outright</b>; four more should shrink to exception-only. Showing all of them as equal
    peers would misrepresent the intent. ${am('M-09')}</p>

    <div class="disp-legend">
      ${Object.entries(DISPOSITIONS).map(([k,d]) => `
        <span class="dl-item"><span class="disp ${d.cls}">${d.label}</span>${d.hint}</span>`).join('')}
    </div>

    ${SUBTRACTION.map(g => `
      <div class="sub-group">
        <div class="sg-h ${g.group}"><span class="disp ${DISPOSITIONS[g.group].cls}">${DISPOSITIONS[g.group].label}</span>
          <h2>${g.title}</h2><span class="sg-count">${g.rows.length}</span></div>
        <div class="sub-rows">
          ${g.rows.map(r => `
            <div class="sub-row ${g.group==='remove'?'struck':''}">
              <div class="sr-task">${r.task}${r.marker ? ' '+am(r.marker) : ''}</div>
              <div class="sr-body">
                <div class="sr-line"><b>Today:</b> ${r.today}</div>
                <div class="sr-line"><b>Why:</b> ${r.why}</div>
                <div class="sr-line cond"><b>Only if:</b> ${r.cond}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>`).join('')}
  </div>`;
}

/* ============================================================
   Handoffs: the wiring between the two portals
   ============================================================ */
function handoffRows() {
  const H = S.hm;
  const buddy = H.buddy.assigned ? orgPerson(H.buddy.assigned) : null;
  const namedCount = Object.keys(H.network.named || {}).filter(k => (H.network.named[k]||'').trim()).length;
  return [
    // Direction reversed with A-60: the equipment handoff now runs new hire
    // to manager, where it used to run manager to new hire.
    // A third party in a two-portal picture: People Experience own the
    // blueprint the manager confirms, so their edit reopens a closed task.
    { dir:'hm', from:'People Experience blueprint', to:'Confirm the first-day details', marker:'M-32',
      done: !S.pexUpdate,
      state: S.pexUpdate
        ? 'Blueprint changed. The manager’s confirmation is stale and the task has reopened'
        : 'Blueprint stable. The manager is confirming current facts',
      hmRoute:'#/hm/logistics', nhRoute:'#/' },
    { dir:'nh', from:'Choose your equipment', to:'Equipment status table', marker:'L-04',
      done: S.equipment.deviceConfirmed,
      state: S.equipment.deviceConfirmed
        ? `Computer chosen by Jordan, and Priya’s table names it`
        : 'NOT CHOSEN YET, and Priya sees it sitting with Jordan',
      hmRoute:'#/hm/computer', nhRoute:'#/equipment' },
    { dir:'nh', from:'Equipment order submitted', to:'Readiness view + equipment table', marker:'L-04',
      done: S.equipment.submitted,
      state: S.equipment.submitted ? 'Ordered, visible to Priya' : 'Not ordered, and Priya sees it waiting on Jordan',
      hmRoute:'#/hm/', nhRoute:'#/equipment' },
    { dir:'hm', from:'Assign a buddy', to:'Jordan’s people rail', marker:'L-01', conflict:true,
      done: !!buddy,
      state: !buddy ? 'No buddy assigned, and Jordan’s rail says one is coming'
        : buddyVisibleToNH() ? `${buddy.name} assigned and visible to Jordan now`
        : `${buddy.name} assigned, hidden from Jordan until 72h before start`,
      hmRoute:'#/hm/buddy', nhRoute:'#/' },
    { dir:'hm', from:'Name the team network', to:'Jordan’s suggested network', marker:'L-06',
      done: H.network.submitted,
      state: H.network.submitted ? `${namedCount} people with reasons, so Jordan can book 1:1s`
        : 'Not named, so Jordan’s network screen is waiting on Priya',
      hmRoute:'#/hm/network', nhRoute:'#/network' },
    { dir:'nh', from:'Introduction + consent', to:'Forward to the team', marker:'L-02',
      done: H.intro.forwarded,
      state: !(S.intro.saved && S.intro.consent) ? 'Not written or not consented, so nothing reaches Priya'
        : H.intro.forwarded ? 'Forwarded to the team by Priya'
        : 'With Priya, waiting to be forwarded. Never auto-posted',
      hmRoute:'#/hm/intro', nhRoute:'#/intro' },
    { dir:'hm', from:'Welcome note', to:'Jordan’s landing screen', marker:'L-08',
      done: H.welcome.sent,
      state: H.welcome.sent ? 'Sent, and it appears at the top of Jordan’s portal' : 'Not sent',
      hmRoute:'#/hm/welcome', nhRoute:'#/' },
    { dir:'hm', from:'First-day details', to:'“Your first day details” card', marker:'L-07',
      done: H.logistics.confirmed,
      state: H.logistics.confirmed ? 'Confirmed, and it feeds the card that opens at Day −3' : 'Not confirmed, so the card would open with blueprint values only',
      hmRoute:'#/hm/logistics', nhRoute:'#/' },
    { dir:'hm', from:'Manager contact details', to:'Jordan’s manager contact card', marker:'L-03',
      done: H.contactConfirmed,
      state: H.contactConfirmed ? 'Confirmed, and the number is shown to Jordan' : 'Unconfirmed, so Jordan sees the record value, which may be stale',
      hmRoute:'#/hm/', nhRoute:'#/' },
    { dir:'hm', from:'Corporate card answer', to:'Day 2 card agreement', marker:'L-10',
      done: H.card.needed !== null,
      state: H.card.needed === null ? 'Unanswered, so Jordan sees nothing about a card'
        : H.card.needed ? 'Yes, and the agreement is on Jordan’s list for Day 2'
        : 'No, so nothing is created and Jordan never sees the subject',
      hmRoute:'#/hm/card', nhRoute:'#/' },
    { dir:'nh', from:'Start date confirmation', to:'Readiness view + every due date', marker:'L-11',
      done: S.startdate.confirmed || S.startdate.changeRequested,
      state: S.startdate.changeRequested ? 'Change requested. Priya and PEX can see it, and dates hold until it is agreed'
        : S.startdate.confirmed ? 'Confirmed, and every other due date is anchored to it'
        : 'Not confirmed, so the whole schedule is provisional',
      hmRoute:'#/hm/', nhRoute:'#/startdate' },
    { dir:'nh', from:'Task progress', to:'Readiness view', marker:'L-05',
      done: tasksComplete() > 0,
      state: `${tasksComplete()} of ${COUNTED.length} done. Priya sees status only, never content`,
      hmRoute:'#/hm/', nhRoute:'#/' },
  ];
}

function renderHandoffs() {
  const rows = handoffRows();
  const wired = rows.filter(r => r.done).length;
  return `
  <div class="page flow-page">
    <div class="crumbs"><button class="back" data-goto="${S.view==='hm'?'#/hm/':'#/'}">${ic('chevron-left.svg','sm')}Back</button>
      <span>/</span><span>How the two portals connect</span></div>
    <h1>Where the two sides meet</h1>
    <p class="flow-sub">Eleven handoffs between the hiring manager’s portal and the new hire’s. Both sides read and write
    the same underlying facts in this prototype, so what you change on one shows up on the other. Use the switch at the
    top to check. <b>${wired} of ${rows.length} are currently live.</b> Every one of them rests on an assumption; the
    marker on each row opens it.</p>

    <div class="ho-table">
      <div class="ho-head">
        <span>Hiring manager</span><span></span><span>New hire</span><span>State right now</span>
      </div>
      ${rows.map(r => `
        <div class="ho-row ${r.done?'live':''} ${r.conflict?'conflict':''}">
          <button class="ho-side hm" data-goto="${r.hmRoute}">
            ${ic('user-circle.svg','sm')}${r.dir==='hm' ? r.from : r.to}
          </button>
          <span class="ho-arrow ${r.dir}">${r.dir==='hm' ? '→' : '←'}</span>
          <button class="ho-side nh" data-goto="${r.nhRoute}">
            ${ic('user.svg','sm')}${r.dir==='hm' ? r.to : r.from}
          </button>
          <span class="ho-state">
            <span class="ho-dot ${r.done?'on':''}"></span>${r.state} ${am(r.marker)}
            ${r.conflict ? '<span class="chip overdue">Conflict</span>' : ''}
          </span>
        </div>`).join('')}
    </div>

    <div class="ho-note">
      ${ic('exclamation-triangle.svg','lg')}
      <div>
        <b>One of these is a live disagreement.</b> The buddy row is marked as a conflict because the two specifications
        contradict each other: the manager’s side says the new hire sees their buddy 72 hours before starting, and the
        new hire prototype shows them from the moment of assignment. The prototype implements both so the difference is
        arguable. Switch the rule on the buddy screen. ${am('L-01')}
      </div>
    </div>
  </div>`;
}

/* ---------- shared bits ---------- */
function hmCrumbs(here) {
  return `<div class="crumbs"><button class="back" data-goto="#/hm/">${ic('chevron-left.svg','sm')}Your hires</button>
  <span>/</span><span>${here}</span></div>`;
}
function dispBanner(disp, text, marker) {
  const d = DISPOSITIONS[disp];
  return `<div class="disp-banner pnote ${d.cls}">
    <span class="disp ${d.cls}">${d.label}</span>
    <span>${text} ${marker ? am(marker) : am('M-09')}</span>
  </div>`;
}

const HM_ROUTES = {
  '#/hm/': renderHmHome,
  '#/hm/logistics': renderHmLogistics,
  '#/hm/computer': renderHmComputer,
  '#/hm/software': renderHmSoftware,
  '#/hm/buddy': renderHmMeet,
  '#/hm/calendar': renderHmCalendar,
  '#/hm/welcome': renderHmWelcome,
  '#/hm/network': renderHmMeet,
  '#/hm/intro': renderHmIntro,
  '#/hm/card': renderHmCard,
  '#/hm/subtraction': renderHmSubtraction,
  '#/handoffs': renderHandoffs,
};

/* ---------- manager-side event bindings ---------- */
function bindHm(route) {
  const H = S.hm;

  if (route === '#/hm/logistics') {
    const w = $('#lgWhere');
    if (w) w.addEventListener('input', () => { H.logistics.whereToBe = w.value; save(); updateLgChrome(); });
    const n = $('#lgNote');
    if (n) n.addEventListener('input', () => { H.logistics.teamNote = n.value; save(); });
    $$('[data-avail]').forEach(r => r.addEventListener('change', () => {
      H.logistics.available = r.dataset.avail === 'yes';
      if (H.logistics.available) H.logistics.proxy = '';
      save(); rerender();
    }));
    const p = $('#lgProxy');
    if (p) p.addEventListener('change', () => { H.logistics.proxy = p.value; save(); updateLgChrome(); });
    const c = $('#lgConfirm');
    if (c) c.addEventListener('click', () => {
      H.logistics.confirmed = true; save(); rerender();
      toast('First-day details confirmed. They feed Jordan’s first-day card.', 'check-circle.svg');
    });
  }

  // #/hm/computer has no bindings any more: the order moved to the new hire
  // (A-60), so the manager's screen is read-only.

  if (route === '#/hm/software') {
    $$('[data-sw]').forEach(cb => cb.addEventListener('change', () => {
      const a = cb.dataset.sw;
      H.software.added = cb.checked ? [...H.software.added, a] : H.software.added.filter(x => x !== a);
      save();
      const b = $('#swConfirm'); if (b) b.disabled = !H.software.added.length;
      const s = $('.wiz-foot .saved-state');
      if (s) s.innerHTML = `${ic('save.svg','sm')}${H.software.added.length} selected`;
    }));
    const c = $('#swConfirm');
    if (c) c.addEventListener('click', () => {
      H.software.confirmed = true; save(); rerender();
      toast('Stack confirmed. Every item chosen by hand, because nothing could be suggested.');
    });
  }

  if (route === '#/hm/buddy' || route === '#/hm/network') {
    $$('[data-pickperson]').forEach(sel => sel.addEventListener('change', () => {
      const role = sel.dataset.pickperson;
      if (!sel.value) return;
      H[role] = { assigned: sel.value, notified: false, accepted: false };
      save(); rerender();
      toast(`${orgPerson(sel.value).name} chosen. They have not been asked yet.`);
    }));
    $$('[data-invite]').forEach(b => b.addEventListener('click', () => {
      const role = b.dataset.invite;
      H[role].notified = true; save(); rerender();
      const who = orgPerson(H[role].assigned);
      toast(`${who.name} has been asked, with the start date and who is hiring. Nothing is booked until they accept.`, 'check-circle.svg');
    }));
    $$('[data-accept]').forEach(b => b.addEventListener('click', () => {
      const role = b.dataset.accept;
      H[role].accepted = true; save(); rerender();
      toast(`${orgPerson(H[role].assigned).name} accepted. A prototype control, so you can see the state that follows.`, 'check-circle.svg');
    }));
    $$('[data-clearperson]').forEach(b => b.addEventListener('click', () => {
      const role = b.dataset.clearperson;
      H[role] = { assigned:null, notified:false, accepted:false }; save(); rerender();
    }));
    $$('[data-meetperson]').forEach(cb => cb.addEventListener('change', () => {
      const id = cb.dataset.meetperson;
      if (cb.checked) H.network.named[id] = H.network.named[id] || '';
      else delete H.network.named[id];
      save(); rerender();
    }));
    $$('[data-meetwhy]').forEach(ta => ta.addEventListener('input', () => {
      H.network.named[ta.dataset.meetwhy] = ta.value; save();
    }));
    const ms = $('[data-meetsubmit]');
    if (ms) ms.addEventListener('click', () => {
      H.network.submitted = true; save(); rerender();
      toast('Sent to Jordan, and everyone you named has been asked.', 'check-circle.svg');
    });
    $$('[data-buddyrule]').forEach(b => b.addEventListener('click', () => {
      S.buddyRule = b.dataset.buddyrule; save(); rerender();
      toast(S.buddyRule === 'assignment'
        ? 'Rule: the new hire sees their buddy from assignment, which is what the new hire prototype does today.'
        : 'Rule: the new hire sees their buddy 72 hours before starting, which is what the specification says.');
    }));
  }

  if (route === '#/hm/calendar') {
    $$('[data-hold]').forEach(cb => cb.addEventListener('change', () => {
      H.calendar.holds[cb.dataset.hold] = cb.checked; save(); rerender();
    }));
    const c = $('#calConfirm');
    if (c) c.addEventListener('click', () => {
      H.calendar.confirmed = true; save(); rerender();
      toast('Day 1 confirmed.', 'check-circle.svg');
    });
    const r = $('[data-resched]');
    if (r) r.addEventListener('click', () => toast('Rescheduling opens your calendar. The hold cannot be removed, because meeting your new hire on Day 1 is a tracked measure.'));
  }

  if (route === '#/hm/welcome') {
    const body = $('#wcBody'), pers = $('#wcPersonal');
    const sync = () => {
      H.welcome.body = body.value; H.welcome.personal = pers.value; save();
      $('#wcPreview').textContent = body.value + (pers.value ? '\n\n' + pers.value : '');
    };
    if (body) body.addEventListener('input', sync);
    if (pers) pers.addEventListener('input', sync);
    // Switching tone replaces the draft. The personal line is the manager's
    // own words, so it survives.
    $$('[data-tone]').forEach(b => b.addEventListener('click', () => {
      const t = WELCOME_TEMPLATES.find(x => x.id === b.dataset.tone);
      if (!t) return;
      H.welcome.tone = t.id; H.welcome.body = t.body; save(); rerender();
    }));
    const s = $('#wcSend');
    if (s) s.addEventListener('click', () => {
      H.welcome.sent = true; save(); rerender();
      toast('Sent. It is now the first thing Jordan sees on their portal.', 'check-circle.svg');
    });
    const re = $('#wcReopen');
    if (re) re.addEventListener('click', () => { H.welcome.sent = false; save(); rerender(); });
  }

  if (route === '#/hm/card') {
    $$('[data-card]').forEach(r => r.addEventListener('change', () => {
      S.hm.card.needed = r.dataset.card === 'yes';
      save(); rerender();
      toast(S.hm.card.needed
        ? 'Recorded. The agreement is now on Jordan’s list for Day 2.'
        : 'Recorded. Jordan is not asked about a card at all.', 'check-circle.svg');
    }));
  }

  if (route === '#/hm/intro') {
    const f = $('#introForward');
    if (f) f.addEventListener('click', () => {
      H.intro.forwarded = true; save(); rerender();
      toast('Forwarded to the team channel. Jordan has been told it was shared.', 'check-circle.svg');
    });
    const u = $('#introUnsend');
    if (u) u.addEventListener('click', () => { H.intro.forwarded = false; save(); rerender(); });
  }
}

function updateLgChrome() {
  const L = S.hm.logistics;
  const ok = L.whereToBe.trim() && (L.available || L.proxy);
  const b = $('#lgConfirm'); if (b) b.disabled = !ok;
  const m = $('.wiz-foot .missing');
  if (m) m.textContent = L.whereToBe.trim()
    ? (L.available || L.proxy ? 'Ready to confirm.' : 'Choose who covers for you.')
    : 'Add where and when Jordan should arrive.';
}

/* Delegated manager actions that can fire from any screen */
function hmGlobalClick(t) {
  const q = t.closest('[data-quickconfirm]');
  if (q) {
    if (q.dataset.quickconfirm === 'contact') {
      S.hm.contactConfirmed = true; save(); rerender();
      toast('Confirmed. Jordan’s contact card now shows this number.', 'check-circle.svg');
    } else {
      S.hm.channels.accepted = true; save(); rerender();
      toast('All four queued to be added on Jordan’s first day.', 'check-circle.svg');
    }
    return true;
  }
  const hire = t.closest('[data-hire]');
  if (hire) {
    if (hire.dataset.hire !== 'jordan') toast('Only Jordan is interactive in this prototype. The second hire is here to show the multi-hire view.');
    return true;
  }
  if (t.closest('[data-escalate]')) {
    toast('This raises a case with People Experience, tagged with Jordan’s onboarding context.');
    return true;
  }
  return false;
}
