/* ============================================================
   People Experience coordinator portal  (v3, third lens)
   Built from PEX_Coordinator_Portal_UI_Spec.xlsx plus the sample
   portals Janine circulated (MangoApps Onboarding Hub, Freshservice
   onboarding request queue, an HR analytics template).

   THE DESIGN PROBLEM IS DIFFERENT AGAIN, and the spec says so:

     New hire portal   organises tasks.   One person, one list.
     Manager portal    removes tasks.     One person, a few hires.
     PEX portal        manages a caseload. One person, MANY hires,
                       all in flight, each at a different point.

   So the home screen is not "here are your tasks". It is "here are
   the hires that need you today, and here is why". Everything else
   is drill-down. Designing this as a third task list would produce a
   screen nobody can work from once they have thirty hires running.

   Roughly two thirds of this is inference. The spec is explicit that
   it was written before the PEX team were asked what they need, and
   that being told which parts are wrong is the point. Every screen
   and queue below carries its provenance, visible under design notes.
   ============================================================ */

'use strict';

/* ---------- the caseload ----------
   The spec's OI-01 — how many hires does one coordinator carry — is
   unanswered and "decides the entire shape". Janine's Freshservice
   sample shows 257 open requests across 300 pages, which is the
   closest thing to an answer we have: many, not five. 24 is modelled
   here: enough that triage is obviously necessary, small enough to
   render honestly. The number is a prototype control, because the
   real one changes the design (X-01 scale row, OI-01). */

const PEX_LOCATIONS = [
  { loc:'Denver, CO',    country:'United States', region:'Americas', tz:'MT',  blueprint:'denver' },
  { loc:'Dallas, TX',    country:'United States', region:'Americas', tz:'CT',  blueprint:'dallas' },
  { loc:'Toronto, ON',   country:'Canada',        region:'Americas', tz:'ET',  blueprint:'toronto' },
  { loc:'São Paulo',     country:'Brazil',        region:'Americas', tz:'BRT', blueprint:'saopaulo' },
  { loc:'Amsterdam',     country:'Netherlands',   region:'EMEA',     tz:'CET', blueprint:'amsterdam' },
  { loc:'Frankfurt',     country:'Germany',       region:'EMEA',     tz:'CET', blueprint:'frankfurt' },
  { loc:'London',        country:'United Kingdom',region:'EMEA',     tz:'GMT', blueprint:'london' },
  { loc:'Dublin',        country:'Ireland',       region:'EMEA',     tz:'GMT', blueprint:'dublin' },
  { loc:'Singapore',     country:'Singapore',     region:'APAC',     tz:'SGT', blueprint:'singapore' },
  { loc:'Tokyo',         country:'Japan',         region:'APAC',     tz:'JST', blueprint:'tokyo' },
  { loc:'Sydney',        country:'Australia',     region:'APAC',     tz:'AEDT',blueprint:'sydney' },
  { loc:'Mumbai',        country:'India',         region:'APAC',     tz:'IST', blueprint:'mumbai' },
];

/* Countries where a pre-employment medical check applies. The spec's
   OI-10: named as a PEX duty, no country list exists anywhere. These
   three are placeholders so the queue can be seen working. */
const PEX_MEDICAL_COUNTRIES = ['Japan', 'Singapore', 'Brazil'];

const PEX_NAMES = [
  ['Amara','Okonkwo'],['Sofia','Marchetti'],['Wei','Zhang'],['Tomas','Novak'],
  ['Priya','Iyer'],['Daniel','Mwangi'],['Elena','Vasquez'],['Hiroshi','Tanaka'],
  ['Fatima','Al-Rashid'],['Lucas','Bergman'],['Nadia','Petrova'],['Samuel','Adeyemi'],
  ['Mei','Lin'],['Rafael','Santos'],['Anika','Sharma'],['Owen','Fitzgerald'],
  ['Chiara','Rossi'],['Jae-won','Park'],['Isabelle','Dubois'],['Marcus','Holt'],
  ['Zara','Hussain'],['Nils','Andersen'],['Grace','Mutinda'],
];

const PEX_ROLES = [
  ['Senior Financial Analyst','Global FP&A'], ['IBX Technician','Operations'],
  ['Network Engineer','Network Services'], ['Solutions Architect','Go-to-market'],
  ['Data Centre Technician','Operations'], ['Programme Manager','Corporate Affairs'],
  ['Account Executive','Sales'], ['Site Reliability Engineer','Digital Services'],
  ['Analyst, Revenue Operations','Go-to-market'], ['Facilities Coordinator','Workplace'],
  ['Manager, Corporate Accounting','Controllership'], ['Product Designer','Digital Services'],
];

const PEX_MANAGERS = [
  'Priya Anand','Ravi Menon','Elena Duarte','Tom Byrne','Grace Lim',
  'Yusuf Demir','Aisha Bello','Marcus Webb','Dana Kim',
];

/* A tiny deterministic generator, so the caseload is identical on every
   load and a reviewer can point at "the Tokyo hire" and be understood. */
function pexRand(seed) {
  let s = seed;
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
}

let PEX_CASELOAD_CACHE = null;
/* Reminder state lives in S, not on the generated record, so a nudge sent
   from any screen shows as sent on every other one. */
function pexAttachNudges(list) {
  return list.map(h => Object.assign({}, h, { nudged: (S.pex.nudged || {})[h.id] || {} }));
}

function pexCaseload() {
  const cap = (S.pex && S.pex.size ? S.pex.size : 24) - 1;   // Jordan takes one slot
  if (PEX_CASELOAD_CACHE) return pexWithLiveJordan(pexAttachNudges(PEX_CASELOAD_CACHE.slice(0, cap)));
  const rnd = pexRand(20260818);
  const out = [];
  for (let i = 0; i < PEX_NAMES.length; i++) {
    const [first, last] = PEX_NAMES[i];
    const place = PEX_LOCATIONS[Math.floor(rnd() * PEX_LOCATIONS.length)];
    const [role, dept] = PEX_ROLES[Math.floor(rnd() * PEX_ROLES.length)];
    const startOff = 2 + Math.floor(rnd() * 74);          // pre-Day 1 only
    const remote = rnd() < 0.42;
    const r = () => rnd();
    // Problems get likelier as the start date approaches, which is what
    // makes the triage screen worth having rather than a flat list.
    const near = startOff <= 14;
    out.push({
      id: (first[0] + last).toLowerCase().replace(/[^a-z]/g, ''),
      first, last, preferred: first,
      role, dept,
      mgr: PEX_MANAGERS[Math.floor(r() * PEX_MANAGERS.length)],
      region: place.region, country: place.country, loc: place.loc,
      tz: place.tz, blueprint: place.blueprint,
      remote,
      mgrColo: remote ? r() < 0.3 : r() < 0.75,
      startOff,
      persona:      r() < (near ? 0.82 : 0.9),
      buddy:        r() < (near ? 0.72 : 0.45),
      proxy:        r() < 0.55,
      photo:        r() < (near ? 0.74 : 0.35),
      rtw:          r() < (near ? 0.8 : 0.5),
      medicalNeeded: PEX_MEDICAL_COUNTRIES.includes(place.country),
      medicalDone:  r() < 0.5,
      bgcheck:      r() < (near ? 0.88 : 0.6),
      compliance:   Math.min(6, Math.floor(r() * (near ? 8 : 5))),
      eqChosen:     r() < (near ? 0.85 : 0.5),
      eqOrdered:    r() < (near ? 0.72 : 0.3),
      eqEta:        4 + Math.floor(r() * 18),
      blockedBy:    ['End User Technology','Workplace / CRE','IT Procurement'][Math.floor(r() * 3)],
      blocked:      r() < 0.22,
      escalations:  r() < 0.16 ? 1 + Math.floor(r() * 2) : 0,
      dataVerified: r() < 0.78,
      dateMoved:    r() < 0.1,
      nudged:       {},
    });
  }
  PEX_CASELOAD_CACHE = out;
  return pexWithLiveJordan(pexAttachNudges(out.slice(0, cap)));
}

/* Jordan is a real record, not a generated one. Their row reads the
   shared state the other two portals write, so drilling in from the
   caseload lands in the thing that actually exists. This is the whole
   argument for PEX as a third lens rather than a separate mock-up. */
function pexWithLiveJordan(list) {
  const H = S.hm;
  const jordan = {
    id: HIRE.username, first: HIRE.legalFirst, last: HIRE.legalLast, preferred: HIRE.preferred,
    role: HIRE.role, dept: 'Global FP&A', mgr: HIRE.manager,
    region:'Americas', country: S.country === 'JP' ? 'Japan' : 'United States',
    loc: S.country === 'JP' ? 'Tokyo' : 'Denver, CO',
    tz: S.country === 'JP' ? 'JST' : 'MT',
    blueprint: S.country === 'JP' ? 'tokyo' : 'denver',
    remote: false, mgrColo: H.logistics.available !== false,
    startOff: daysToStart(),
    persona: false,                                   // M-04: never resolves, by design
    buddy: !!H.buddy.assigned,
    proxy: !!(H.logistics.proxy && H.logistics.proxy.trim()),
    photo: S.photo.done || S.photo.confirmedExisting,
    rtw: false,
    medicalNeeded: S.country === 'JP', medicalDone: false,
    bgcheck: S.bgcheck.launched,
    compliance: Object.values(S.policies.acked).filter(Boolean).length,
    eqChosen: S.equipment.deviceConfirmed,
    eqOrdered: S.equipment.submitted,
    eqEta: (deviceById(S.equipment.device) || DEVICE_CATALOG[0]).leadOk ? 5 : 18,
    blockedBy: 'End User Technology',
    blocked: !S.equipment.submitted && daysToStart() <= 10,
    escalations: 0,
    dataVerified: true,
    dateMoved: S.startdate.changeRequested,
    live: true,
    nudged: S.pex ? (S.pex.nudged[HIRE.username] || {}) : {},
  };
  return [jordan, ...list];
}

const pexHire = id => pexCaseload().find(h => h.id === id) || null;
const pexStart = h => addDays(simToday(), h.startOff);

/* ---------- the twelve working queues ----------
   Straight from the spec's Queues and Filters tab, which is the most
   sourced thing in the workbook: each carries a PRD citation. The
   presentation is inferred; the triggers are not. */
const PEX_QUEUES = [
  { id:'late', label:'Late or overdue', icon:'exclamation-circle.svg', sev:'high',
    blurb:'A task on any hire, past its due date',
    why:'Every downstream date is anchored to the start date, which does not move. A late task compresses everything after it.',
    src:'PRD 3.6 requires SLA measurement by timestamps between activities.',
    batch:'Partly. Nudging is batchable, resolving is not.',
    test: h => h.startOff <= 10 && (!h.bgcheck || h.compliance < 4),
    reason: h => !h.bgcheck ? 'Background check not started' : 'Compliance pack incomplete',
    waiting: () => 'new hire', action:'Nudge' },

  { id:'blocked', label:'Blocked on another team', icon:'hourglass.svg', sev:'high',
    blurb:'Equipment, software, badge or access stuck with a fulfilment team',
    why:'The coordinator is the only person watching every queue. The manager sees one hire; the fulfilment teams see one item type.',
    src:'PRD S2-US13 AC2: each request carries its own status tracker visible to NH, HM and PEX.',
    batch:'Yes. Chase by owning team.',
    test: h => h.blocked,
    reason: h => `Waiting on ${h.blockedBy}`,
    waiting: h => h.blockedBy, action:'Chase' },

  { id:'buddy', label:'No buddy named', icon:'users-friends.svg', sev:'med',
    blurb:'Any hire at Day −3 without a buddy',
    why:'The system auto-assigns from a pool at Day −1, so this queue is the window in which a considered choice is still possible.',
    src:'PRD S2-US18 AC3. Manager may change up to Day −3; auto-assign from pool at Day −1.',
    batch:'Yes.',
    test: h => !h.buddy && h.startOff <= 21,
    reason: h => h.startOff <= 3 ? 'Auto-assign fires at Day −1' : 'Manager has not named one',
    waiting: () => 'hiring manager', action:'Nudge' },

  { id:'proxy', label:'No Day 1 host', icon:'user-circle.svg', sev:'high',
    blurb:'Manager not co-located and no proxy named',
    why:'Somebody has to physically meet the new hire. If the manager cannot, and nobody is named, Day 1 has no host.',
    src:'PRD 3.6 makes manager co-location and Day 1 proxy assignment filters. The pairing exists to find this gap.',
    batch:'Yes.',
    test: h => !h.mgrColo && !h.proxy && h.startOff <= 30,
    reason: () => 'Manager is not on site and no proxy is named',
    waiting: () => 'hiring manager', action:'Assign' },

  { id:'persona', label:'Persona not mapped', icon:'portal-window.svg', sev:'med',
    blurb:'Role does not resolve to a provisioning persona',
    why:'Sourced and explicit: the coordinator is alerted, and until it is resolved the manager gets an empty software stack.',
    src:'PRD S2-US16 edge case 1. Persona not mapped, empty stack, manager selects from catalogue, coordinator alerted.',
    batch:'Partly.',
    test: h => !h.persona,
    reason: () => 'Manager is filling the software stack by hand',
    waiting: () => 'platform', action:'Map' },

  { id:'compliance', label:'Compliance pack incomplete', icon:'shield-check.svg', sev:'high',
    blurb:'Unacknowledged required documents approaching Day −2',
    why:'Auditable records must exist before Day 1. This is the queue with legal consequence rather than experience consequence.',
    src:'PRD S2-US19. Due Day −4, escalation Day −2, completion visible to the PEX dashboard.',
    batch:'Yes. Nudge in batch.',
    test: h => h.compliance < 6 && h.startOff <= 6,
    reason: h => `${6 - h.compliance} of 6 documents outstanding`,
    waiting: () => 'new hire', action:'Nudge' },

  { id:'rtw', label:'Right to work outstanding', icon:'id-card.svg', sev:'high',
    blurb:'Country-conditional checks not started or incomplete',
    why:'Section 2 is validated in person at orientation. If Section 1 is not done beforehand, Day 1 stalls.',
    src:'PRD S2-US03; technical requirements give PEX I-9 Section 2 compliance management.',
    batch:'Partly.',
    test: h => !h.rtw && h.startOff <= 12,
    reason: () => 'Section 1 not complete. Section 2 is validated in person on Day 1.',
    waiting: () => 'new hire', action:'Nudge' },

  { id:'badge', label:'No badge photo', icon:'photo.svg', sev:'high',
    blurb:'No photo submitted approaching the print lead',
    why:'24-hour print lead and the badge must be ready at 9am on Day 1. Miss it and the new hire cannot get into the building.',
    src:'PRD S2-US08. Due Day −2, 24-hour print lead, ready 9am Day 1.',
    batch:'Yes.',
    test: h => !h.photo && !h.remote && h.startOff <= 7,
    reason: h => `Print lead is 24 hours. ${h.startOff} days to go.`,
    waiting: () => 'new hire', action:'Nudge' },

  { id:'eta', label:'Equipment will miss Day 1', icon:'laptop.svg', sev:'high',
    blurb:'Estimated delivery falls after the start date',
    why:'Triggers either an escalation to the fulfilment team or the loaner process. Both need a human decision.',
    src:'PRD S2-US07 AC4. Auto-escalate or route to loaner where delivery lands after the start date.',
    batch:'No. Case by case.',
    test: h => h.eqOrdered ? h.eqEta > h.startOff : (h.startOff <= 9 && !h.eqChosen),
    reason: h => h.eqOrdered
      ? `${h.eqEta} day lead against ${h.startOff} days to go`
      : 'Not chosen yet, and the lead time no longer fits',
    waiting: h => h.eqOrdered ? 'End User Technology' : 'new hire', action:'Issue loaner' },

  { id:'escalated', label:'Escalated cases', icon:'comment-lines.svg', sev:'high',
    blurb:'Raised from any portal by any persona',
    why:'The coordinator is the human handoff point for tier 1 and above.',
    src:'PRD 3.4 onboarding-context tagging on all cases; 3.7 human handoff for tier 1+.',
    batch:'No.',
    test: h => h.escalations > 0,
    reason: h => `${h.escalations} open case${h.escalations > 1 ? 's' : ''}`,
    waiting: () => 'you', action:'Open' },

  { id:'dataver', label:'Recruitment data unverified', icon:'clipboard.svg', sev:'low',
    blurb:'Data copied from recruiting has not been checked across',
    why:'Named as current coordinator work, but with no stated trigger, no SLA and no completion definition.',
    src:'Lucid Fulfiller lane. See Open Items OI-11 — this is real work with no documented shape.',
    batch:'Unknown.',
    test: h => !h.dataVerified,
    reason: () => 'No trigger, SLA or completion defined for this duty',
    waiting: () => 'you', action:'Verify' },

  { id:'datemoved', label:'Start date moved', icon:'calendar.svg', sev:'med',
    blurb:'Every SLA, nudge and deadline recalculates',
    why:'Somebody has to check nothing was silently missed in the shift.',
    src:'PRD 3.2 start date change handling; S2-US20 recalculates sends. Neither addresses the coordinator. See OI-12.',
    batch:'No.',
    test: h => h.dateMoved,
    reason: () => 'Dates recalculated. Nothing confirms what was re-checked.',
    waiting: () => 'you', action:'Review' },
];

function pexQueue(q) {
  return pexCaseload().filter(q.test).sort((a, b) => a.startOff - b.startOff);
}
function pexAllExceptions() {
  const seen = new Set();
  PEX_QUEUES.forEach(q => pexQueue(q).forEach(h => seen.add(h.id)));
  return seen;
}

/* ============================================================
   X-00  Today — what needs you
   The largest single inference in the spec (OI-04). The persona table
   says only "PEX dashboard with all new hires, filterable"; everything
   about exception-first triage is derived from caseload logic. It is
   built rather than argued because being told it is wrong is faster
   than a blank page, and because the samples back it: MangoApps leads
   with "Needs Your Attention" above the full list.

   Empty state is the goal, not a failure.
   ============================================================ */
function renderPexToday() {
  const all = pexCaseload();
  const groups = PEX_QUEUES.map(q => ({ q, hires: pexQueue(q) })).filter(g => g.hires.length);
  const needing = pexAllExceptions().size;
  const next = all.slice().sort((a, b) => a.startOff - b.startOff)[0];
  const thisWeek = all.filter(h => h.startOff <= 7).length;

  return `
  <div class="page pex">
    ${pexHeader('today')}

    <div class="px-summary" data-assume="X-00">
      <div class="px-sum-main">
        <h1>${needing} of your ${all.length} hires need you today</h1>
        <p class="lede">${thisWeek} start within a week. The next is ${esc(next.preferred)} ${esc(next.last)},
        ${next.startOff} day${next.startOff === 1 ? '' : 's'} out in ${esc(next.loc)}.</p>
      </div>
      <div class="px-sum-stats">
        ${[['In flight', all.length], ['Need you', needing], ['Start this week', thisWeek]]
          .map(([l, n]) => `<div class="px-stat"><b>${n}</b><span>${l}</span></div>`).join('')}
      </div>
    </div>

    ${!groups.length ? `
      <div class="px-clear">
        ${ic('check-circle.svg','xl')}
        <div><b>Nothing needs you right now.</b>
        <p>Every hire in flight is on track. This screen is meant to be empty.</p></div>
      </div>` : groups.map(g => pexQueueBlock(g.q, g.hires)).join('')}

    <div class="callout pnote mt16" data-assume="X-00">
      ${ic('question-circle.svg')}
      <div><b>This screen is the biggest guess in the spec.</b> Nothing in any source describes it. It is
      inferred from the persona line “PEX dashboard with all new hires, filterable” plus escalation ownership,
      on the judgement that with a real caseload a coordinator needs exceptions surfaced rather than to go
      looking for them. If the PEX team say a plain list is what they want, this screen collapses into the
      caseload list. ${am('X-00')}</div>
    </div>
  </div>`;
}

function pexQueueBlock(q, hires) {
  return `
  <section class="px-queue ${q.sev}" data-assume="${'X-Q-' + q.id}">
    <div class="pxq-h">
      <span class="pxq-ic">${ic(q.icon,'lg')}</span>
      <div class="pxq-t">
        <h2>${q.label}<span class="pxq-n">${hires.length}</span></h2>
        <span class="pxq-blurb">${q.blurb}</span>
      </div>
      ${(() => {
        const sendable = hires.filter(h => q.waiting(h) !== 'you').length;
        return sendable
          ? `<button class="btn secondary sm" data-pexbatch="${q.id}">Remind all ${sendable}</button>`
          : `<span class="pxq-mine">${ic('user.svg','sm')}Yours to work</span>`;
      })()}
    </div>
    <div class="pxq-why pnote">
      <b>Why it matters:</b> ${q.why}
      <span class="pxq-src">${q.src} Batchable: ${q.batch}</span>
    </div>
    <div class="pxq-rows">
      ${hires.slice(0, 6).map(h => pexQueueRow(q, h)).join('')}
      ${hires.length > 6 ? `
        <button class="pxq-more" data-goto="#/pex/caseload" data-pexfilter="${q.id}">
          ${hires.length - 6} more in this queue ${ic('chevron-right.svg','sm')}
        </button>` : ''}
    </div>
  </section>`;
}

function pexQueueRow(q, h) {
  const waiting = q.waiting(h);
  const sent = (h.nudged || {})[q.id];
  return `
  <div class="pxq-row">
    <div class="avatar sm ${h.live ? 'mgr' : 'peer'}">${h.first[0]}${h.last[0]}</div>
    <div class="pxr-who">
      <a data-goto="#/pex/hire/${h.id}">${esc(h.preferred)} ${esc(h.last)}</a>
      ${h.live ? '<span class="chip info">Live record</span>' : ''}
      <span class="pxr-sub">${esc(h.role)} · ${esc(h.loc)}</span>
    </div>
    <div class="pxr-when">
      <b>Day −${h.startOff}</b>
      <span>${dueText(pexStart(h))}</span>
    </div>
    <div class="pxr-reason">${q.reason(h)}</div>
    <div class="pxr-wait">
      <span class="px-waiting ${waiting === 'you' ? 'self' : ''}">${ic('hourglass.svg','sm')}${waiting}</span>
    </div>
    <div class="pxr-act">
      ${sent
        ? `<span class="chip done">${ic('check.svg','sm')}Reminder sent</span>`
        : `<button class="btn primary sm" data-pexnudge="${h.id}:${q.id}">${q.action}</button>`}
    </div>
  </div>`;
}

/* ============================================================
   X-01  Caseload list
   The one screen in the workbook with an unambiguous source: the
   persona table's "PEX dashboard with all new hires, filterable",
   and PRD 3.6 for the filter set and saved public/private views.
   Filters below are that set verbatim.

   The "waiting on" column is the argument worth having: it turns a
   status list into a work list. The Freshservice sample implements
   exactly that, down to per-party reminder state.
   ============================================================ */

const PEX_FILTERS = [
  { id:'startWindow', label:'Start date', opts:[['','Any'],['7','Within 7 days'],['14','Within 14 days'],['30','Within 30 days']] },
  { id:'region',   label:'Region',   opts:() => ['', ...new Set(pexCaseload().map(h => h.region))] },
  { id:'country',  label:'Country',  opts:() => ['', ...new Set(pexCaseload().map(h => h.country))] },
  { id:'loc',      label:'Work location', opts:() => ['', ...new Set(pexCaseload().map(h => h.loc))] },
  { id:'tz',       label:'Time zone', opts:() => ['', ...new Set(pexCaseload().map(h => h.tz))] },
  { id:'remote',   label:'Remote or on-site', opts:[['','Any'],['remote','Remote'],['onsite','On site']] },
  { id:'mgrColo',  label:'Manager co-location', opts:[['','Any'],['yes','Co-located'],['no','Not co-located']] },
  { id:'proxy',    label:'Day 1 proxy', opts:[['','Any'],['yes','Named'],['no','Not named']] },
];

/* Two of these — manager co-location and Day 1 proxy — exist specifically
   to surface a gap rather than to slice data. The spec calls that pairing
   a design hint, and it is: combined they are the "no Day 1 host" queue. */

const PEX_SAVED_VIEWS = [
  { id:'all',     name:'Everyone in flight', shared:true,  f:{} },
  { id:'week',    name:'Starting this week', shared:true,  f:{ startWindow:'7' } },
  { id:'nohost',  name:'No Day 1 host',      shared:true,  f:{ mgrColo:'no', proxy:'no' } },
  { id:'apac',    name:'APAC caseload',      shared:false, f:{ region:'APAC' } },
];

function pexFiltered() {
  const f = S.pex.filters;
  return pexCaseload().filter(h => {
    if (f.startWindow && h.startOff > +f.startWindow) return false;
    if (f.region  && h.region  !== f.region)  return false;
    if (f.country && h.country !== f.country) return false;
    if (f.loc     && h.loc     !== f.loc)     return false;
    if (f.tz      && h.tz      !== f.tz)      return false;
    if (f.remote  && (f.remote === 'remote') !== h.remote) return false;
    if (f.mgrColo && (f.mgrColo === 'yes')   !== h.mgrColo) return false;
    if (f.proxy   && (f.proxy === 'yes')     !== h.proxy)   return false;
    if (f.queue) { const q = PEX_QUEUES.find(x => x.id === f.queue); if (q && !q.test(h)) return false; }
    return true;
  }).sort((a, b) => a.startOff - b.startOff);
}

/* What this hire is waiting on, and who holds it. The column the spec
   says is worth arguing for. */
function pexWaitingOn(h) {
  const out = [];
  PEX_QUEUES.forEach(q => { if (q.test(h)) out.push({ q, who: q.waiting(h) }); });
  return out;
}

/* The inline three-step stepper the HR sample uses per row. Phase is
   derived, not stored: there is no agreed readiness formula (OI-06),
   so this counts what is done rather than scoring it. */
function pexPhase(h) {
  const done = [h.bgcheck, h.eqOrdered, h.compliance >= 6, h.photo || h.remote, h.rtw].filter(Boolean).length;
  const pct = Math.round((done / 5) * 100);
  return { done, total:5, pct, at: pct >= 100 ? 2 : pct >= 40 ? 1 : 0 };
}

function renderPexCaseload() {
  const rows = pexFiltered();
  const all = pexCaseload();
  const f = S.pex.filters;
  const active = Object.entries(f).filter(([, v]) => v);

  return `
  <div class="page pex">
    ${pexHeader('caseload')}

    <div class="px-listhead" data-assume="X-01">
      <div>
        <h1>All new hires</h1>
        <p class="lede">${rows.length} of ${all.length} in flight${active.length ? ', filtered' : ''}.
        Every hire you own, whatever state they are in.</p>
      </div>
      <div class="px-views">
        ${PEX_SAVED_VIEWS.map(v => `
          <button class="px-view ${S.pex.savedView === v.id ? 'on' : ''}" data-pexview="${v.id}">
            ${esc(v.name)}${v.shared ? ic('users-three.svg','sm') : ''}
          </button>`).join('')}
        <button class="px-view save" data-pexsaveview="1">${ic('plus.svg','sm')}Save this view</button>
      </div>
    </div>

    <div class="px-filters" data-assume="X-01">
      ${PEX_FILTERS.map(flt => {
        const opts = typeof flt.opts === 'function'
          ? flt.opts().map(o => [o, o || 'Any']) : flt.opts;
        return `
        <label class="px-filter">
          <span>${flt.label}</span>
          <select data-pexfilterfield="${flt.id}">
            ${opts.map(([v, l]) => `<option value="${esc(v)}" ${f[flt.id] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}
          </select>
        </label>`;
      }).join('')}
      ${active.length ? `<button class="btn quiet sm" data-pexclear="1">Clear ${active.length} filter${active.length>1?'s':''}</button>` : ''}
    </div>

    <div class="px-table-wrap">
      <table class="px-table">
        <thead>
          <tr>
            <th class="px-c-who">New hire</th>
            <th>Starts</th>
            <th>Location</th>
            <th>Hiring manager</th>
            <th class="px-c-prog">Onboarding</th>
            <th class="px-c-wait">Waiting on</th>
            <th class="px-c-act"></th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(pexRow).join('')}
        </tbody>
      </table>
      ${!rows.length ? `<div class="px-empty">${ic('question-circle.svg','lg')}
        <div><b>No hires match these filters.</b><p>Clear one and try again.</p></div></div>` : ''}
    </div>

    <p class="pnote mt12" data-assume="X-01">
      ${ic('info-circle.svg','sm')} The eight filters are PRD 3.6 verbatim, and saved public or private views
      are sourced from the same section. Column choice is not specified anywhere and is proposed here.
      Behaviour at real caseload size is the open question that decides this screen: at a handful of hires this
      is the home page, at fifty it is unusable without triage in front of it. ${am('X-01')} ${am('OI-01')}
    </p>
  </div>`;
}

function pexRow(h) {
  const waiting = pexWaitingOn(h);
  const ph = pexPhase(h);
  const soon = h.startOff <= 7;
  return `
  <tr class="${h.live ? 'live' : ''}">
    <td class="px-c-who">
      <div class="px-person">
        <div class="avatar sm ${h.live ? 'mgr' : 'peer'}">${h.first[0]}${h.last[0]}</div>
        <div>
          <a data-goto="#/pex/hire/${h.id}">${esc(h.preferred)} ${esc(h.last)}</a>
          ${h.live ? '<span class="chip info">Live</span>' : ''}
          <span class="px-role">${esc(h.role)}</span>
        </div>
      </div>
    </td>
    <td class="px-c-when">
      <b class="${soon ? 'soon' : ''}">Day −${h.startOff}</b>
      <span>${dueText(pexStart(h))}</span>
    </td>
    <td><span class="px-loc">${esc(h.loc)}</span><span class="px-sub">${esc(h.region)} · ${h.remote ? 'Remote' : 'On site'}</span></td>
    <td><span class="px-mgr">${esc(h.mgr)}</span>${!h.mgrColo ? `<span class="px-sub">Not co-located</span>` : ''}</td>
    <td class="px-c-prog">${pexStepper(ph)}</td>
    <td class="px-c-wait">
      ${waiting.length
        ? `<button class="px-wait-btn" data-pexwait="${h.id}">
             <b>${waiting.length}</b> item${waiting.length > 1 ? 's' : ''}
             <span>${[...new Set(waiting.map(w => w.who))].join(', ')}</span>
           </button>
           ${pexWaitPopover(h, waiting)}`
        : `<span class="px-ontrack">${ic('check-circle.svg','sm')}On track</span>`}
    </td>
    <td class="px-c-act"><button class="btn secondary sm" data-goto="#/pex/hire/${h.id}">Open</button></td>
  </tr>`;
}

/* The Freshservice pattern: hovering the waiting-on cell names each party
   and offers a reminder per party, with sent state held per party. */
function pexWaitPopover(h, waiting) {
  const byWho = {};
  waiting.forEach(w => { (byWho[w.who] = byWho[w.who] || []).push(w.q); });
  return `
  <div class="px-wait-pop">
    <b>Waiting on</b>
    ${Object.entries(byWho).map(([who, qs]) => {
      const key = qs[0].id;
      const sent = (h.nudged || {})[key];
      return `
      <div class="px-wait-row">
        <div>
          <span class="pw-who">${who}</span>
          <span class="pw-what">${qs.map(q => q.label.toLowerCase()).join(', ')}</span>
        </div>
        ${who === 'you'
          ? `<span class="pw-self">Yours</span>`
          : sent
            ? `<span class="chip done">${ic('check.svg','sm')}Sent</span>`
            : `<button class="btn primary sm" data-pexnudge="${h.id}:${key}">${ic('email.svg','sm')}Remind</button>`}
      </div>`;
    }).join('')}
  </div>`;
}

function pexStepper(ph) {
  const labels = ['Pre-boarding', 'In progress', 'Ready'];
  return `
  <div class="px-step" title="${ph.done} of ${ph.total} complete">
    ${labels.map((l, i) => `
      <div class="pxs ${i < ph.at ? 'done' : i === ph.at ? 'now' : ''}">
        <span class="pxs-bar"></span><span class="pxs-dot"></span>
      </div>`).join('')}
    <span class="pxs-n">${ph.done} of ${ph.total}</span>
  </div>`;
}

/* ============================================================
   X-02  Individual new hire record
   Modelled on the live HR case (HRC0943697), which already carries
   the new hire, hiring manager, start date and an equipment table
   with per-item blockers. What it does NOT carry today, and what
   this screen adds, is consolidated status across all five owning
   teams side by side. That is the glue.

   For Jordan this reads the live shared state, so the new hire's
   own portal and the manager's portal are both visible at once.
   ============================================================ */
function renderPexHire() {
  const id = (location.hash.split('/')[3] || '').trim();
  const h = pexHire(id);
  if (!h) return `<div class="page pex">${pexHeader('caseload')}
    <div class="px-empty">${ic('question-circle.svg','lg')}<div><b>No such hire.</b>
    <p>That record is not in this caseload.</p></div></div></div>`;

  const waiting = pexWaitingOn(h);
  const ph = pexPhase(h);

  return `
  <div class="page pex">
    ${pexHeader('caseload')}
    <div class="crumbs"><button class="back" data-goto="#/pex/caseload">${ic('chevron-left.svg','sm')}Caseload</button>
      <span>/</span><span>${esc(h.preferred)} ${esc(h.last)}</span></div>

    <div class="px-rec-head" data-assume="X-02">
      <div class="avatar lg ${h.live ? 'mgr' : 'peer'}">${h.first[0]}${h.last[0]}</div>
      <div class="px-rec-id">
        <h1>${esc(h.first)} ${esc(h.last)}</h1>
        <p class="lede">${esc(h.role)} · ${esc(h.dept)} · reporting to ${esc(h.mgr)}</p>
        <div class="px-rec-facts">
          <span>${ic('calendar.svg','sm')}Starts ${fmtDate(pexStart(h))} <b>(Day −${h.startOff})</b></span>
          <span>${ic('globe.svg','sm')}${esc(h.loc)}, ${esc(h.country)} · ${h.tz}</span>
          <span>${ic('user.svg','sm')}${h.remote ? 'Remote' : 'On site'} · manager ${h.mgrColo ? 'co-located' : 'not co-located'}</span>
        </div>
      </div>
      <div class="px-rec-side">
        ${h.live ? '<span class="chip info">Live record, shared with both portals</span>' : '<span class="chip waiting">Modelled</span>'}
        <div class="px-rec-ready"><b>${ph.done} of ${ph.total}</b><span>ready</span></div>
      </div>
    </div>

    ${waiting.length ? `
    <section class="px-needs">
      <div class="pxn-h">${ic('exclamation-circle.svg','lg')}<h2>${waiting.length} thing${waiting.length>1?'s':''} need${waiting.length>1?'':'s'} attention</h2></div>
      ${waiting.map(w => `
        <div class="pxn-row">
          <span class="pxn-q">${w.q.label}</span>
          <span class="pxn-r">${w.q.reason(h)}</span>
          <span class="px-waiting ${w.who === 'you' ? 'self' : ''}">${ic('hourglass.svg','sm')}${w.who}</span>
          ${(h.nudged || {})[w.q.id]
            ? `<span class="chip done">${ic('check.svg','sm')}Sent</span>`
            : `<button class="btn primary sm" data-pexnudge="${h.id}:${w.q.id}">${w.q.action}</button>`}
        </div>`).join('')}
    </section>` : `
    <section class="px-clear"><div>${ic('check-circle.svg','xl')}</div>
      <div><b>Nothing outstanding.</b><p>Every owner is on track for ${fmtDate(pexStart(h))}.</p></div></section>`}

    <div class="px-three" data-assume="X-02 OI-07">
      ${pexOwnerColumn('New hire', 'nh', h)}
      ${pexOwnerColumn('Hiring manager', 'hm', h)}
      ${pexOwnerColumn('Other teams', 'other', h)}
    </div>

    <div class="callout pnote" data-assume="OI-07">
      ${ic('lock.svg')}
      <div><b>Visibility here is a decision nobody has made.</b> The coordinator's role plausibly justifies
      more than the manager's, but “plausibly” is not an access model. This screen takes the middle reading:
      the coordinator sees <b>that</b> a sensitive item was provided and when, never its content. The other two
      readings are that they see everything the new hire sees, or that they see exactly what the manager sees.
      The persona and content visibility matrix is unwritten for every persona, not just this one. ${am('OI-07')}</div>
    </div>

    ${pexActivity(h)}
  </div>`;
}

/* Three owners side by side. The live HR case shows the new hire's tasks
   and the equipment table, but never the manager's own list beside them. */
function pexOwnerColumn(title, who, h) {
  const rows = pexOwnerRows(who, h);
  const done = rows.filter(r => r.state === 'done').length;
  return `
  <section class="px-col">
    <div class="pxc-h"><h3>${title}</h3><span>${done} of ${rows.length}</span></div>
    ${rows.map(r => `
      <div class="pxc-row ${r.state}">
        <span class="pxc-dot ${r.state}">${r.state === 'done' ? ic('check.svg','sm') : ''}</span>
        <div class="pxc-body">
          <span class="pxc-label">${r.label}</span>
          ${r.note ? `<span class="pxc-note">${r.note}</span>` : ''}
          ${r.sensitive ? `<span class="pxc-lock">${ic('lock.svg','sm')}Content withheld</span>` : ''}
        </div>
        ${r.owner ? `<span class="pxc-owner">${r.owner}</span>` : ''}
      </div>`).join('')}
  </section>`;
}

function pexOwnerRows(who, h) {
  const st = (ok, wait) => ok ? 'done' : wait ? 'wait' : 'open';
  if (who === 'nh') return [
    { label:'Background check started', state: st(h.bgcheck), sensitive:true,
      note: h.bgcheck ? 'Running with the provider' : 'Not started' },
    { label:'Start date confirmed', state: h.dateMoved ? 'wait' : 'done',
      note: h.dateMoved ? 'Change requested, sitting with you' : '' },
    { label:'Equipment chosen and ordered', state: st(h.eqOrdered, h.eqChosen),
      note: h.eqOrdered ? `Ships in ${h.eqEta} days` : h.eqChosen ? 'Chosen, order not submitted' : 'Not chosen' },
    { label:'Personal and contact details', state: st(h.dataVerified), sensitive:true,
      note: 'Identity documents, emergency contact and banking' },
    { label:'Right to work, Section 1', state: st(h.rtw), sensitive:true,
      note: h.rtw ? 'Complete. Section 2 in person on Day 1.' : 'Outstanding' },
    { label:'Badge photo', state: h.remote ? 'done' : st(h.photo),
      note: h.remote ? 'Remote hire, no badge required' : h.photo ? 'Sent to Workplace' : 'Not submitted' },
    { label:'Compliance pack', state: h.compliance >= 6 ? 'done' : 'open', sensitive:true,
      note:`${h.compliance} of 6 acknowledged` },
  ];
  if (who === 'hm') return [
    { label:'First-day details confirmed', state: st(h.mgrColo || h.proxy), owner:h.mgr,
      note: h.mgrColo ? 'Manager is on site' : h.proxy ? 'Proxy named' : 'No host for Day 1' },
    { label:'Buddy named', state: st(h.buddy), owner:h.mgr,
      note: h.buddy ? 'Accepted' : `Auto-assign at Day −1` },
    { label:'Application stack', state: h.persona ? 'done' : 'open', owner:h.mgr,
      note: h.persona ? 'Confirmed' : 'Blocked, persona not mapped' },
    { label:'Welcome note', state: st(h.startOff < 40), owner:h.mgr },
    { label:'Day 1 calendar', state: st(h.startOff < 30), owner:h.mgr },
  ];
  return [
    { label:'Background check clearance', state: st(h.bgcheck), owner:'HR Operations' },
    { label:'Equipment fulfilment', state: st(h.eqOrdered && !h.blocked, h.eqOrdered), owner:'End User Technology',
      note: h.blocked ? `Blocked with ${h.blockedBy}` : '' },
    { label:'Badge production', state: h.remote ? 'done' : st(h.photo), owner:'Workplace / CRE',
      note:'Printing is not tracked here' },
    { label:'Orientation blueprint', state:'done', owner:'People Experience',
      note:`${h.loc} blueprint assigned` },
    ...(h.medicalNeeded ? [{ label:'Medical check', state: st(h.medicalDone), owner:'People Experience',
      note:`Required in ${h.country}. No country list exists yet.` }] : []),
  ];
}

/* Activity, in the shape of the HR-sample timeline. Cross-portal by
   design: this is the only place all three actors' moves appear in
   one stream. */
function pexActivity(h) {
  const d = n => dueText(addDays(simToday(), -n));
  const ev = [];
  if (h.dateMoved) ev.push([0, 'Start date', `${h.preferred} requested a new start date. Sitting with you.`]);
  if (h.escalations) ev.push([0, 'Escalation', `${h.escalations} case${h.escalations>1?'s':''} raised from the manager's portal.`]);
  if (h.eqOrdered) ev.push([1, 'Equipment', `Order submitted by ${h.preferred}. Lead time ${h.eqEta} days.`]);
  if (h.buddy) ev.push([2, 'People', `${h.mgr} named a buddy and they accepted.`]);
  if (h.bgcheck) ev.push([3, 'Background check', `Launched by ${h.preferred}. Running with the provider.`]);
  if (!h.persona) ev.push([4, 'Provisioning', 'Persona lookup returned empty. You were alerted.']);
  ev.push([6, 'Blueprint', `${h.loc} orientation blueprint assigned by People Experience.`]);
  ev.push([9, 'Record', `Case created. Recruitment data ${h.dataVerified ? 'verified' : 'not yet verified'}.`]);

  return `
  <section class="px-activity" data-assume="X-02">
    <div class="section-h"><h2>Activity</h2><span class="hint">Every actor, one stream</span></div>
    <div class="pxa-list">
      ${ev.map(([n, kind, text]) => `
        <div class="pxa-row">
          <span class="pxa-date">${d(n)}</span>
          <span class="pxa-kind">${kind}</span>
          <span class="pxa-text">${text}</span>
        </div>`).join('')}
    </div>
  </section>`;
}

/* ============================================================
   X-05  Orientation blueprints
   PRD S3-US06: prebuilt per location, editable only by PEX, and the
   source of the Day 1 agenda, schedule, location and lunch. The
   capability is sourced; no source describes the editing interface.

   This is the screen that makes the three-way connection literal.
   The new hire's first-day details are read-only against a blueprint,
   and the manager confirms against it — so an edit here reopens the
   manager's confirmed task and changes what the new hire is told.
   That dependency is the reason this screen is worth building.
   ============================================================ */
function renderPexBlueprints() {
  const B = S.pex.blueprint;
  const locs = [...new Set(pexCaseload().map(h => h.loc))].sort();
  const hiresHere = pexCaseload().filter(h => h.loc === B.loc);

  return `
  <div class="page pex">
    ${pexHeader('blueprints')}
    <div class="px-listhead" data-assume="X-05">
      <div>
        <h1>Orientation blueprints</h1>
        <p class="lede">Prebuilt per location. You are the only editor, and everything downstream reads this.</p>
      </div>
    </div>

    <div class="px-bp">
      <div class="px-bp-list">
        ${locs.map(l => {
          const n = pexCaseload().filter(h => h.loc === l).length;
          return `<button class="px-bp-loc ${B.loc === l ? 'on' : ''}" data-pexbploc="${esc(l)}">
            <b>${esc(l)}</b><span>${n} hire${n === 1 ? '' : 's'}</span></button>`;
        }).join('')}
      </div>

      <div class="px-bp-edit">
        <div class="pxbp-h">
          <h2>${esc(B.loc)}</h2>
          <span class="px-sub">Feeds ${hiresHere.length} hire${hiresHere.length === 1 ? '' : 's'} at this location</span>
        </div>

        <div class="callout ${B.dirty ? '' : 'soft'}">
          ${ic(B.dirty ? 'exclamation-triangle.svg' : 'info-circle.svg')}
          <div>${B.dirty
            ? `<b>Unsaved change.</b> Publishing this moves orientation for every hire at ${esc(B.loc)}.
               Managers who already confirmed their first-day details will have that task reopened.`
            : `<b>An error here surfaces on every hire at this location.</b> The new hire's first-day details
               screen is read-only against this, and the manager confirms against it rather than authoring it.`}</div>
        </div>

        <div class="field mt16" style="max-width:none;">
          <label>Orientation runs</label>
          <div class="field-row">
            <div class="field"><label>From</label>
              <select data-pexbp="from">
                ${['08:00','09:00','10:00'].map(t => `<option ${B.from===t?'selected':''}>${t}</option>`).join('')}
              </select></div>
            <div class="field"><label>Until</label>
              <select data-pexbp="until">
                ${['12:00','13:00','14:00'].map(t => `<option ${B.until===t?'selected':''}>${t}</option>`).join('')}
              </select></div>
          </div>
          <div class="note">The manager's Day 1 one-to-one is placed automatically straight after this ends.</div>
        </div>

        <div class="field" style="max-width:none;">
          <label>Where to go</label>
          <input type="text" data-pexbp="where" value="${esc(B.where)}">
        </div>
        <div class="field" style="max-width:none;">
          <label>What to expect</label>
          <textarea rows="2" data-pexbp="expect">${esc(B.expect)}</textarea>
        </div>
        <div class="field" style="max-width:none;">
          <label>Who to ask for</label>
          <input type="text" data-pexbp="host" value="${esc(B.host)}">
        </div>

        <div class="pxbp-foot">
          <span class="saved-state">${ic('info-circle.svg','sm')}${B.dirty ? 'Not published' : 'Published and live'}</span>
          <button class="btn primary" data-pexbppublish="1" ${B.dirty ? '' : 'disabled'}>Publish to ${esc(B.loc)}</button>
        </div>
      </div>
    </div>

    <p class="pnote mt12" data-assume="M-32">
      ${ic('info-circle.svg','sm')} Publishing sets the same flag the prototype control does: the manager's
      confirmed first-day task reopens and says who reopened it. Nothing specifies what should actually happen
      here — whether the task reopens, whether the manager is told, or what the new hire sees in the gap.
      This is the strict reading. ${am('M-32')}
    </p>
  </div>`;
}

/* ---------- shell ---------- */
function pexHeader(active) {
  const tabs = [
    ['today',      'Today',      '#/pex/'],
    ['caseload',   'Caseload',   '#/pex/caseload'],
    ['blueprints', 'Blueprints', '#/pex/blueprints'],
  ];
  const needing = pexAllExceptions().size;
  return `
  <div class="px-nav">
    ${tabs.map(([id, label, route]) => `
      <button class="px-tab ${active === id ? 'on' : ''}" data-goto="${route}">
        ${label}${id === 'today' && needing ? `<span class="px-tab-n">${needing}</span>` : ''}
      </button>`).join('')}
    <span class="px-nav-note pnote">Coordinator view. Pre-Day 1 only, matching the other two portals.</span>
  </div>`;
}

const PEX_ROUTES = {
  '#/pex/':           renderPexToday,
  '#/pex/caseload':   renderPexCaseload,
  '#/pex/blueprints': renderPexBlueprints,
};

/* ---------- bindings ---------- */
function bindPex() {
  $$('[data-pexfilterfield]').forEach(sel => sel.addEventListener('change', () => {
    S.pex.filters[sel.dataset.pexfilterfield] = sel.value;
    S.pex.savedView = null; save(); rerender();
  }));
  $$('[data-pexbp]').forEach(el => el.addEventListener('input', () => {
    S.pex.blueprint[el.dataset.pexbp] = el.value;
    S.pex.blueprint.dirty = true; save(); rerender();
  }));
}
