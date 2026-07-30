/* ============================================================
   New Hire Pre-Day 1 Portal — interactive prototype
   Stages 1–6 of the staged build prompt, against the Equinix
   design system (Nexa Text, brand palette, brand icons).
   ============================================================ */

'use strict';

/* ---------------- helpers ---------------- */
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => [...el.querySelectorAll(sel)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// In the standalone single-file build, ICON_DATA maps icon filenames to data: URIs.
const iconUrl = name => (typeof ICON_DATA !== 'undefined' && ICON_DATA[name]) ? ICON_DATA[name] : 'assets/icons/' + name;
const ic = (name, cls='') => `<span class="ic ${cls}" style="-webkit-mask-image:url('${iconUrl(name)}');mask-image:url('${iconUrl(name)}')"></span>`;
const am = id => `<span class="am" data-am="${id}" title="Assumption ${id} — click for details">${id}</span>`;

function toast(msg, icon='info-circle.svg') {
  const t = $('#toast');
  t.innerHTML = `${ic(icon)}<span>${msg}</span>`;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 3200);
}

function fmtDate(d) {
  return d.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' });
}

/* ---------------- state ---------------- */
const DEFAULT_STATE = () => ({
  persona: 'external',           // external | conversion
  country: 'US',                 // US | JP
  scenario: 'default',           // default | inprogress | review | overdue | complete
  details: { tab:0, submitted:false, queryRaised:false, data:{} },
  jd: { state:'notstarted', scrolled:false, acked:false, dissent:false, dissentText:'' },
  intro: { text:'', consent:false, useBadge:false, saved:false, dismissed:[], done:false },
  photo: { uploaded:false, dataUrl:null, consent:false, done:false, confirmedExisting:false, replacing:false },
  policies: { open:{}, read:{}, acked:{}, cobcVisited:false, submitted:false },
});

let S = load();
function load() {
  try {
    const raw = localStorage.getItem('onbd-proto');
    if (raw) return Object.assign(DEFAULT_STATE(), JSON.parse(raw));
  } catch (e) {}
  return seedDetails(DEFAULT_STATE());
}
function save() { localStorage.setItem('onbd-proto', JSON.stringify(S)); }

function seedDetails(st) {
  // Pre-filled from the offer (A-01): legal name, personal email, mobile, country of hire.
  st.details.data = Object.assign({
    legalFirst: HIRE.legalFirst, legalMiddle:'', legalLast: HIRE.legalLast,
    preferred:'', pronouns:'', country: st.country === 'JP' ? HIRE.countryJP : HIRE.countryUS,
    addr1:'', addr2:'', city:'', state:'', zip:'',
    shipHere:true, email: HIRE.email, ccode: st.country==='JP' ? '+81' : '+1', mobile: HIRE.mobile,
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

function simToday() { return S.scenario === 'overdue' ? SIM.todayOverdue : SIM.today; }
function daysToStart() { return Math.round((SIM.startDate - simToday()) / 86400000); }

/* due dates */
const DUE = {
  details: new Date(2026,7,14), jd: new Date(2026,7,11),
  intro: new Date(2026,7,11), photo: new Date(2026,7,8),
  policies: new Date(2026,7,14),
};
const dueText = d => d.toLocaleDateString('en-GB', { day:'numeric', month:'long' });
const isOverdue = key => simToday() > DUE[key] && !taskDone(key);

/* ---------------- task status model (A-25) ---------------- */
function detailsProgress() {
  const d = S.details.data;
  const req = requiredFields();
  const done = req.filter(f => validField(f)).length;
  return { done, total: req.length };
}
function detailsStatus() {
  if (S.details.submitted) return 'done';
  const d = S.details.data;
  const touched = ['addr1','city','zip','ec1name','preferred','channel'].some(f => d[f]) || S.details.data._touched;
  return touched ? 'inprogress' : 'notstarted';
}
function jdStatus() { return S.jd.state; } // notstarted | inprogress | done | review
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
  const n = Object.values(S.policies.acked).filter(Boolean).length;
  return n > 0 ? 'inprogress' : 'notstarted';
}
function taskDone(key) {
  return { details: detailsStatus()==='done', jd: jdStatus()==='done',
           intro: introStatus()==='done', policies: policiesStatus()==='done' }[key];
}
function tasksComplete() { return ['details','jd','intro','policies'].filter(taskDone).length; }
function allComplete() { return tasksComplete() === 4; }

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
  const icn = status==='done' ? ic('check.svg','sm') : '';
  return `<span class="chip ${cls}">${icn}${label}</span>`;
}

/* ============================================================
   STAGE 1 — Landing / task list
   ============================================================ */
function renderLanding() {
  const done = tasksComplete();
  const all = allComplete();
  const days = daysToStart();
  const conv = S.persona === 'conversion';

  const milestones = [
    { lbl:'Offer accepted', st:'done' },
    { lbl:'Identity verified', st:'done' },
    { lbl:'Pre-boarding tasks', st: all ? 'done' : 'now' },
    { lbl:'Ready for Day 1', st: all ? 'done' : '' },
  ];

  const tasks = [
    { key:'details', route:'#/details', icon:'user-circle.svg',
      name:'Your personal and contact details',
      why:'So we can set up your record, reach you, and know who to call in an emergency',
      due:DUE.details, est:'5 min', estMark:'', status:detailsStatus(),
      prog: detailsStatus()==='inprogress' ? detailsProgress() : null },
    { key:'jd', route:'#/jd', icon:'file-alt.svg',
      name:'Review your job description',
      why:'Confirm the role you’re joining is the one you agreed to',
      due:DUE.jd, est:'3 min', estMark:'A-22', status:jdStatus() },
    { key:'intro', route:'#/intro', icon:'comment-smile.svg',
      name:'Introduce yourself and add your photo',
      why:'Help your team meet you, and get your badge ready before you arrive',
      due:DUE.intro, est:'5 min', estMark:'A-22', status:introStatus() },
    { key:'policies', route:'#/policies', icon:'shield-check.svg',
      name:'Policies and privacy notices',
      why:'The documents we need you to read and acknowledge before you start',
      due:DUE.policies, est:'10 min', estMark:'A-23', status:policiesStatus(),
      prog: policiesStatus()==='inprogress'
        ? { done:Object.values(S.policies.acked).filter(Boolean).length, total:DOCS.length } : null },
  ];

  return `
  <div class="page">
    ${all ? `
    <div class="ready-banner" data-assume="A-25">
      ${ic('check-circle.svg','xl')}
      <div>
        <h2>You’re ready for Day 1, ${esc(HIRE.preferred)}.</h2>
        <p>Everything we needed before your start date is done. Between now and ${HIRE.startDateText}, two things happen without you:
        your equipment ships to the address you gave us, and your badge gets printed. Three days before you start,
        your first-day details and setup instructions will appear here. Until then — there’s genuinely nothing else to do.</p>
      </div>
    </div>` : ''}

    <div class="hero">
      <svg class="hex-decor" viewBox="0 0 340 300" fill="none" aria-hidden="true">
        <g stroke="#ffffff" stroke-width="2.5" opacity=".85" transform="rotate(20 170 150)">
          <path d="M120 40 l50 -28 50 28 v56 l-50 28 -50 -28z"/>
          <path d="M225 100 l50 -28 50 28 v56 l-50 28 -50 -28z" opacity=".6"/>
          <path d="M120 160 l50 -28 50 28 v56 l-50 28 -50 -28z" opacity=".4"/>
        </g>
      </svg>
      <h1>Welcome, ${esc(HIRE.preferred)}!</h1>
      <p class="lede">You start as ${esc(HIRE.role)} on <b>${HIRE.startDateText}</b> — ${days} days from now.
      A few things need doing before then. Work through them in any order; your progress saves as you go.</p>
      <div class="prog-row" data-assume="A-25">
        <div class="prog-count">
          <div class="nums"><span>${done} of ${tasks.length} tasks complete</span>${am('A-25')}</div>
          <div class="prog-bar"><i style="width:${(done/tasks.length)*100}%"></i></div>
        </div>
        <div class="miles">
          ${milestones.map(m => `
            <div class="mile ${m.st}">
              <div class="bar"></div>
              <div class="dot">${m.st==='done' ? ic('check.svg','sm') : m.st==='now' ? '<i></i>' : ''}</div>
              <div class="lbl">${m.lbl}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>

    ${conv ? `
    <div class="panel-note" style="max-width:820px;">${ic('info-circle.svg')} Because you’re converting from a contract role,
      some tasks are shorter — we already hold your details from your time here, so you’ll mostly be confirming rather than entering.</div>` : ''}

    <div class="landing-grid">
      <div>
        <div class="section-h"><h2>Do these now</h2><span class="hint">Open for action</span></div>
        <div class="tcards">
          ${tasks.map(t => taskCard(t)).join('')}
        </div>

        <div class="section-h"><h2>Coming up</h2><span class="hint">Visible so you can see the list has an end — nothing to do yet</span></div>
        <div class="ucards">
          ${COMING_UP.map((u,i) => `
            <div class="ucard" data-ucard="${i}">
              <div class="u-row">
                ${ic(u.icon)}
                <span class="u-name">${u.name}${u.marker ? am(u.marker) : ''}</span>
                <span class="u-open">${ic('clock.svg','sm')}${u.opens}</span>
              </div>
              ${u.note ? `<div class="u-note">${u.note}</div>` : ''}
              <div class="u-expl">${u.expl}</div>
            </div>`).join('')}
        </div>

        <div class="section-h"><h2>Handled by other teams</h2><span class="hint">Not your tasks here — shown so you know nothing’s been forgotten</span></div>
        <div class="ocards">
          <div class="ocard" data-assume="A-10 A-11">
            <div class="tic">${ic('banking.svg')}</div>
            <div>
              <div class="o-name">Banking and direct deposit ${am('A-11')}</div>
              <div class="o-note">Payroll will be in touch about this separately. Bank details are collected by Payroll in their own
              secure form — they’re handled differently from the rest of your profile, so they never pass through this portal. ${am('A-10')}</div>
            </div>
          </div>
          <div class="ocard">
            <div class="tic">${ic('shield-check.svg')}</div>
            <div>
              <div class="o-name">Background check <span class="chip info">In progress</span></div>
              <div class="o-note">No action needed from you. We’ll only get in touch if something is missing.</div>
            </div>
          </div>
        </div>
      </div>

      <div class="rail">
        <div class="rail-card">
          <h3>Your people</h3>
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
          <div class="contact">
            <div class="avatar ${PEOPLE.recruiter.cls}">${PEOPLE.recruiter.initials}</div>
            <div>
              <div class="c-name">${PEOPLE.recruiter.name}</div>
              <div class="c-role">${PEOPLE.recruiter.role}</div>
              <div class="c-links">
                <a data-contact="teams">${ic('comment-lines.svg','sm')}Teams</a>
                <a data-contact="email">${ic('email.svg','sm')}Email</a>
              </div>
            </div>
          </div>
          <div class="rail-note">Daniel hands over to Maya a week after your offer was signed — after that, Maya is your first contact.</div>
        </div>
        <div class="rail-card">
          <h3>Good to know</h3>
          <ul class="res-list">
            <li><a data-res="expect">${ic('chevron-right.svg','sm')}What to expect before Day 1</a>
              <div class="u-expl" data-resbody="expect">Roughly: finish these tasks, choose your equipment when that opens,
              then it goes quiet until 3 days before you start, when first-day details arrive. Quiet is normal — it means nothing is stuck.</div></li>
            <li><a data-res="who">${ic('chevron-right.svg','sm')}Who to contact for what</a>
              <div class="u-expl" data-resbody="who">Questions about your offer or role — Daniel. Anything about these tasks,
              your start date or logistics — Maya. Anything technical with this portal — the assistant, bottom right.</div></li>
          </ul>
        </div>
      </div>
    </div>
  </div>`;
}

function taskCard(t) {
  const od = isOverdue(t.key);
  const doneCls = t.status === 'done' ? 'done' : '';
  return `
  <div class="tcard ${doneCls}" data-task="${t.route}">
    <div class="tic">${ic(t.icon,'lg')}</div>
    <div class="t-main">
      <div class="t-name">${t.name}</div>
      <div class="t-why">${t.why}</div>
      <div class="t-meta">
        <span class="m ${od?'overdue':''}">${ic('calendar.svg','sm')}Due ${dueText(t.due)}</span>
        <span class="m">${ic('clock.svg','sm')}About ${t.est} ${t.estMark ? am(t.estMark) : ''}</span>
        ${t.prog ? `<span class="mini-prog"><span class="bar"><i style="width:${(t.prog.done/t.prog.total)*100}%"></i></span>${t.prog.done} of ${t.prog.total}</span>` : ''}
      </div>
      ${od ? `<div class="overdue-note">${ic('exclamation-circle.svg','sm')}<span>This was due ${dueText(t.due)} — it’s still open, and it matters for your first day.
        <b>Stuck on something?</b> <span class="help-link" data-openchat="1">Message Maya</span> — that’s what she’s there for.</span></div>` : ''}
    </div>
    <div class="t-side">
      ${chip(t.status, od)}
      ${ic('chevron-right.svg','lg')}
    </div>
  </div>`;
}

/* ============================================================
   STAGE 2 — Personal & contact details wizard
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
  const invalid = S.details.data['_err_'+f];
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
  const d = S.details.data;
  const counts = tabCounts();
  const tab = S.details.tab;
  const jp = S.country === 'JP';
  const tabs = ['Details','Emergency contact','Preferences'];
  const req = requiredFields();
  const missing = req.filter(f => !validField(f));

  return `
  <div class="page">
    ${crumbs('Your personal and contact details')}
    <div class="task-head" data-assume="A-10">
      <h1>Your personal and contact details ${am('A-10')}</h1>
      <p class="why">So we can set up your record, reach you, and know who to call in an emergency.
      Fields marked <span class="prefill-tag">${ic('check.svg','sm')}From your offer</span> came from what you gave us earlier ${am('A-01')} — check them, change them if they’re wrong. The rest is yours to add.</p>
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
          ? `<span class="saved-state">${ic('check-circle.svg','sm')}Submitted — shown read-only. If something changes, tell ${PEOPLE.pex.name}.</span>
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
  return `
    <div class="form-sec">
      <h3>Legal name</h3>
      <p class="sec-note">This must match your official documents — it’s what goes on your record.</p>
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
        <div class="note">From your offer — it drives what we ask you for. <a data-countryquery="1">This isn’t right</a>
        ${S.details.queryRaised ? `<b style="color:var(--eq-dark-green)"> — thanks, we’re checking this with you. Keep going in the meantime.</b>` : ''}</div>
      </div>
    </div>

    <div class="form-sec" data-assume="A-09">
      <h3>Home address</h3>
      ${jp ? `<p class="sec-note">Address format for Japan.</p>` : ''}
      ${jp ? inp('zip','Postal code',{ph:'e.g. 150-0002', cls:'', err:'Please add your postal code.'}) : ''}
      ${inp('addr1','Address line 1')}
      ${inp('addr2','Address line 2')}
      <div class="field-row">
        ${inp('city', jp ? 'City / ward' : 'City')}
        ${inp('state', jp ? 'Prefecture' : 'State', {cls:'narrow'})}
        ${jp ? '' : inp('zip','ZIP code',{cls:'narrow'})}
      </div>
      ${addrDone ? `<span class="verified">${ic('check-circle.svg','sm')}Address verified</span>` : ''}
      <label class="check mt16">
        <input type="checkbox" data-input="shipHere" data-kind="check" ${d.shipHere?'checked':''}>
        <span>Ship my equipment to this address ${am('A-09')}<br><small>You can change the delivery address later, when you choose your equipment.</small></span>
      </label>
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
        <div class="field ${S.details.data['_err_'+prefix+'rel']?'invalid':''}">
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
      <p class="sec-note">Only used in an emergency — never shared with your team. One contact is required; add a second if you’d like a backup.</p>
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
      <p class="sec-note">The first two are practical. The last two are optional and personal — they’re invitations, not requirements.</p>

      <div class="gcard" data-assume="A-03">
        <h4>Preferred language ${am('A-03')}</h4>
        <div class="gbody">
          <div class="field">
            <label>Language</label>
            <select data-input="language">
              ${['English (US)','English (UK)','Japanese','Spanish','French','German','Portuguese (BR)'].map(l =>
                `<option ${d.language===l?'selected':''}>${l}</option>`).join('')}
            </select>
            <div class="note">Defaulted from your country of hire. This sets the language of the policy documents you’ll be asked to read.</div>
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
            <span>Also send me non-essential updates — team news, tips for Day 1, that sort of thing.</span>
          </label>
        </div>
      </div>

      <div class="gcard" data-assume="A-06">
        <h4>Workplace adjustments ${am('A-06')}</h4>
        <div class="gbody">
          <p class="sec-note" style="margin-bottom:10px;">If there’s anything that would help you do your best work — equipment, setup, how we run your first weeks — we’d genuinely like to know. Entirely optional.</p>
          <div class="field" style="max-width:none;">
            <textarea rows="3" data-input="adjustText" ${d.adjustPrivate?'disabled':''} placeholder="Tell us what would help…">${esc(d.adjustText)}</textarea>
          </div>
          <label class="check">
            <input type="checkbox" data-input="adjustPrivate" data-kind="check" ${d.adjustPrivate?'checked':''}>
            <span><b>I’d rather discuss this privately.</b> We’ll ask ${PEOPLE.pex.name} to get in touch instead — nothing is stored in this form.</span>
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
          <p class="note"><em>Categories shown are placeholders — the real sets are country-specific and regulatory.</em></p>
        </div>` : `<p class="sec-note" style="margin:6px 0 0;">Collapsed — expand if you’d like to share. Entirely voluntary.</p>`}
      </div>

      <div class="boundary" data-assume="A-10 A-11">
        ${ic('lock.svg','lg')}
        <div>
          <h4>Banking and direct deposit ${am('A-10')} ${am('A-11')}</h4>
          <p>Bank details are collected separately by Payroll, in their own secure form — bank data is handled differently
          from the rest of this profile. Payroll will be in touch; there’s nothing to prepare.</p>
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
        <h2>Details submitted — thank you.</h2>
        <p>Your record is set up with what you gave us. If anything changes before you start — a move, a new number —
        come back here and update it.</p>
        <button class="btn secondary" data-reopen="details">Review what I submitted</button>
        <button class="btn primary" data-goto="#/">Back to your tasks</button>
      </div>
    </div>
  </div>`;
}

/* ============================================================
   STAGE 3 — Job description
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
      <p class="why">Confirm the role you’re joining is the one you agreed to. If anything looks different from your conversations, say so — that’s what this step is for.</p>
    </div>

    ${review ? `
    <div class="review-banner" data-assume="A-27">
      ${ic('info-circle.svg','lg')}
      <div><b>Under review ${am('A-27')}</b>
      <p>You told us something doesn’t match. Recruiting has your note and someone will be in touch within 2 working days.
      This task stays open — nothing else for you to do on it right now.</p></div>
    </div>` : ''}
    ${done ? `
    <div class="review-banner" style="background:var(--ok-bg); color:var(--ok);">
      ${ic('check-circle.svg','lg')}
      <div><b style="color:var(--ok)">Confirmed</b>
      <p style="color:var(--ok)">You confirmed this reflects the role you accepted. It stays here for reference.</p></div>
    </div>` : ''}

    <div class="jd-grid">
      <div>
        <div class="rail-card role-card" style="margin-bottom:18px;" data-assume="A-12">
          <h3 style="display:flex; align-items:center; gap:10px;">Role summary <span class="src-tag">${ic('portal-window.svg','sm')}From the official record</span></h3>
          <dl class="kv">
            <dt>Job title</dt><dd>${HIRE.role}</dd>
            <dt>Department</dt><dd>${HIRE.dept}</dd>
            <dt>Reports to</dt><dd>${HIRE.manager}</dd>
            <dt>Location &amp; arrangement</dt><dd>${HIRE.location} · ${HIRE.arrangement}</dd>
            <dt>Employment type</dt><dd>${HIRE.employmentType}</dd>
            <dt>Start date</dt><dd>${HIRE.startDateText}</dd>
          </dl>
          <div class="comp-line">${ic('lock.svg','sm')}Your compensation details are in your signed offer letter. ${am('A-12')}</div>
        </div>

        <div class="rail-card" style="margin-bottom:18px;" data-assume="A-13 A-24">
          <h3 style="display:flex; align-items:center; gap:10px;">The job description ${am('A-13')}</h3>
          <p style="font-size:12.5px; margin:4px 0 12px;">Placeholder content, marked as such — the real text comes from the official record.</p>
          <div class="jd-doc" id="jdDoc">${JD_TEXT}</div>
          <div class="scroll-hint ${jd.scrolled?'ok':''}" id="scrollHint">
            ${jd.scrolled ? ic('check.svg','sm')+'Read to the end — you can confirm below.' : ic('chevron-down.svg','sm')+'Scroll to the end to unlock the confirmation. '+am('A-24')}
          </div>
          <div class="mt16">
            <span class="internal-link" data-ext="workday">${ic('portal-window.svg')}View in Workday <small>· another Equinix system, same sign-in</small></span>
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
              <div class="note">This goes to Recruiting with your name on it — they’ll come back to you directly.</div>
            </div>
            <div style="display:flex; gap:12px;">
              <button class="btn primary" id="dissentSend" disabled>Send to recruiting</button>
              <button class="btn quiet" id="dissentCancel">Never mind — back to confirming</button>
            </div>
          </div>
        </div>` : ''}
      </div>

      <div class="rail">
        <div class="rail-card" data-assume="A-13">
          <h3>Your team ${am('A-13')}</h3>
          <div class="team-view">
            <div class="tnode"><div class="avatar sm mgr">${HIRE.managerInitials}</div>
              <div><div class="tn-name">${HIRE.manager}</div><div class="tn-role">Director, FP&amp;A · your manager</div></div></div>
            <div class="tline"></div>
            <div class="tnode you"><div class="avatar sm">${HIRE.initials}</div>
              <div><div class="tn-name">${HIRE.legalFirst} ${HIRE.legalLast} — you</div><div class="tn-role">${HIRE.role}</div></div></div>
            <div class="tline"></div>
            <div class="peer-row">
              ${PEOPLE.peers.map(p => `
                <div class="tnode"><div class="avatar sm peer">${p.initials}</div>
                <div><div class="tn-name">${p.name}</div><div class="tn-role">${p.role}</div></div></div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

/* ============================================================
   STAGE 4 — Introduce yourself & badge photo
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
      <p class="why">Two things in one place — they both help your team meet you before you arrive, but they go to different
      places and have different deadlines, so each completes on its own.</p>
    </div>
    <div class="two-sec">

      <!-- Section A: introduction -->
      <div class="sec-card" data-assume="A-14 A-15">
        <div class="sec-top">
          <h2>Introduce yourself</h2>
          ${introDone ? chip('done') : (S.intro.text ? chip('inprogress') : chip('notstarted'))}
        </div>
        <div class="due-line">${ic('calendar.svg','sm')}Due <b>${dueText(DUE.intro)}</b> ${am('A-22')}</div>
        <p style="font-size:13.5px; font-weight:350; margin-bottom:12px;">${HIRE.manager} will share this with the team before you start —
        so nobody has to write a “please welcome…” post from scratch, and you get to describe yourself in your own words.</p>

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
              <div class="pv-sub">${HIRE.role} · starts ${dueText(SIM.startDate)}</div>
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
          ${S.intro.saved && !S.intro.consent ? `<span style="font-size:12.5px; color:var(--carbon);">Saved — it won’t be shared until you tick the consent box.</span>` : ''}
        </div>
      </div>

      <!-- Section B: badge photo -->
      <div class="sec-card" data-assume="A-17 A-18">
        <div class="sec-top">
          <h2>Photo for your badge</h2>
          ${photoDone ? chip('done') : (S.photo.uploaded ? chip('inprogress') : chip('notstarted'))}
        </div>
        <div class="due-line">${ic('calendar.svg','sm')}Due <b>${dueText(DUE.photo)}</b> — earlier than your introduction, because your badge needs print time before Day 1</div>
        <p style="font-size:13.5px; font-weight:350; margin-bottom:14px;">Send it now and your badge is printed and waiting for you on Day 1.</p>

        ${conv && !S.photo.replacing ? convPhotoBlock() : uploadBlock()}

        <div class="divider"></div>
        <div class="req-list" data-assume="A-17">
          <b>Requirements</b> ${am('A-17')} — JPG or PNG · under 5MB · at least 600×600 pixels<br>
          <b>Guidelines</b> ${am('A-17')} — plain light background · face the camera with both eyes visible · no hats or sunglasses · taken within the last six months<br>
          <em style="color:var(--ink-faint)">Placeholder values — the real badge specification comes from the workplace team.</em>
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
        <p style="font-size:13px; font-weight:350; margin-bottom:4px;">The circle shows the badge crop — your face should fill it.</p>
        ${S.photo.done ? `<span class="verified">${ic('check.svg','sm')}Submitted — your badge will be ready on Day 1</span>` : ''}
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
        If it still looks like you, you’re done — one click.</p>
        ${S.photo.confirmedExisting
          ? `<span class="verified">${ic('check.svg','sm')}Confirmed — same photo, same badge</span>`
          : `<div style="display:flex; gap:10px;">
              <button class="btn primary sm" id="confirmExisting">Confirm — still me</button>
              <button class="btn secondary sm" id="replacePhoto">Replace this photo</button>
            </div>`}
      </div>
    </div>`;
}

/* ============================================================
   STAGE 5 — Policies & privacy notices
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
          <h2>All ${total} acknowledged — this task is closed.</h2>
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
      <p class="why">The documents we need you to read and acknowledge before you start. About 10 minutes ${am('A-23')} — and you can stop
      anytime; what you’ve acknowledged stays acknowledged.</p>
    </div>
    <div class="pol-head">
      <div class="prog-count">
        <div class="nums" style="color:var(--eq-dark-blue)"><span>${acked} of ${total} acknowledged</span></div>
        <div class="prog-bar" style="background:var(--cloud)"><i style="width:${(acked/total)*100}%"></i></div>
      </div>
      ${jp ? `<span class="chip info">${ic('flag.svg','sm')}Country of hire: Japan — your list includes a Japan addendum</span>` : ''}
    </div>

    <div class="doc-list">
      ${DOCS.map(d => docCard(d, jp)).join('')}
    </div>

    <div class="read-group">
      <div class="section-h"><h2>Also here for you — nothing to sign</h2><span class="hint">Reading material, not tasks</span></div>
      <div class="read-cards">
        <div class="read-card">
          <div class="tic">${ic('file-alt.svg')}</div>
          <div><div class="o-name">Company factsheet</div>
          <div class="o-note">Who we are, what we do, and the numbers that matter. English only.</div></div>
        </div>
        <div class="read-card">
          <div class="tic">${ic('file-alt.svg')}</div>
          <div><div class="o-name">Employee handbook — ${jp ? 'Japan' : 'United States'}</div>
          <div class="o-note">The reference document for your country. No acknowledgement — it’s here whenever you need it.</div></div>
        </div>
      </div>
    </div>

    ${ro
      ? `<div class="mt24 review-banner" style="background:var(--ok-bg); color:var(--ok); max-width:720px;">${ic('check-circle.svg','lg')}
          <div><b style="color:var(--ok)">Task closed</b><p style="color:var(--ok)">Everything is acknowledged and recorded. The documents stay readable here.</p></div></div>`
      : `<div class="mt24" style="display:flex; align-items:center; gap:16px;">
          <button class="btn primary" id="submitPolicies" ${acked===total?'':'disabled'}>Submit all acknowledgements</button>
          <span style="font-size:12.5px; color:var(--carbon);">${acked===total ? 'Everything is acknowledged — one click finishes the task.' : `${total-acked} still to acknowledge before you can submit.`}</span>
        </div>`}
  </div>`;
}

function docCard(d, jp) {
  const P = S.policies;
  const open = !!P.open[d.id];
  const read = !!P.read[d.id];
  const acked = !!P.acked[d.id];
  const lang = S.details.data.language || 'English (US)';

  let body = '';
  if (open) {
    if (d.external) {
      body = `
      <div class="doc-body">
        ${P.cobcVisited
          ? `<div class="return-banner">${ic('check-circle.svg')}Welcome back — you opened the Code site, so you can acknowledge below.</div>`
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
          ${d.hasAddendum && jp ? `<p>${FILLER[0]}</p><div class="addendum" data-assume="A-20">${JP_ADDENDUM}${am('A-20')}</div>${FILLER.slice(1).map(p=>`<p>${p}</p>`).join('')}` : d.body}
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

function ackRow(d, canAck, acked, lang) {
  if (acked) {
    return `<div class="ack-done">${ic('check-circle.svg')}Acknowledged
      <span class="rec-note">· Version 3.2 · ${esc(lang)} · recorded</span></div>`;
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
   STAGE 6 — Flow overview
   ============================================================ */
function renderFlow() {
  const axis = [
    { x:2, lbl:'Offer accepted', sub:'and signed', major:true },
    { x:10, lbl:'Identity verified', sub:'account created' },
    { x:19, lbl:'Portal opens', sub:'you are here', major:true },
    { x:40, lbl:'Day −10', sub:'8 Aug' },
    { x:48, lbl:'Day −7', sub:'11 Aug' },
    { x:63, lbl:'Day −4', sub:'14 Aug' },
    { x:78, lbl:'Day −2', sub:'16 Aug' },
    { x:95, lbl:'Day 1', sub:'18 Aug', major:true },
  ];
  const you = [
    { x:40, r:22, cls:'you', lbl:'Badge photo', sub:'due Day −10 · print lead' },
    { x:48, r:72, cls:'you', lbl:'Job description', sub:'confirm · due Day −7' },
    { x:56, r:22, cls:'you', lbl:'Introduce yourself', sub:'due Day −7' },
    { x:63, r:72, cls:'you', lbl:'Personal details', sub:'3-tab wizard · due Day −4' },
    { x:71, r:22, cls:'you', lbl:'Policies pack', sub:'6 documents · due Day −4' },
    { x:95, r:50, cls:'day1', lbl:'Day 1', sub:'badge waiting, equipment set' },
  ];
  const later = [
    { x:24, r:30, cls:'later', lbl:'Choose equipment', sub:'when role + location confirm' },
    { x:40, r:70, cls:'later', lbl:'Benefits enrolment', sub:'opens Day −30 by country' },
    { x:63, r:30, cls:'later', lbl:'Right to work', sub:'country-specific' },
    { x:80, r:70, cls:'later', lbl:'Setup instructions', sub:'Day −3' },
    { x:87, r:30, cls:'later', lbl:'First day details', sub:'Day −3' },
    { x:97, r:70, cls:'later', lbl:'Info governance', sub:'Week 1' },
  ];
  const other = [
    { x:26, r:50, cls:'other', lbl:'Background check', sub:'running · no action from you' },
    { x:52, r:50, cls:'other', lbl:'Banking — Payroll', sub:'their own secure form · no date yet' },
    { x:82, r:50, cls:'other', lbl:'Badge printed', sub:'24h lead after your photo' },
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
    <p class="flow-sub">Everything between accepting the offer and walking in on Day 1 — what ${HIRE.preferred} does, what opens later,
    and what other teams handle. This is the review screen: argue with the shape here, not in the individual pages.</p>
    <div class="flow-wrap">
      <div class="flow-axis">
        <div class="axis-line"></div>
        ${axis.map(a => `<div class="axis-pt ${a.major?'major':''}" style="left:${a.x}%"><div class="apt-dot"></div>
          <div class="apt-lbl">${a.lbl}</div><div class="apt-sub">${a.sub}</div></div>`).join('')}
      </div>
      ${lane(`What ${HIRE.preferred} does in this portal — “Do these now”`, 'user-circle.svg', you)}
      ${lane('Opens later — visible from day one so the list has an end', 'clock.svg', later)}
      ${lane('Handled by other teams — visible, never actioned here', 'users-friends.svg', other, 'other', 100)}
      <div class="flow-legend">
        <span class="lg-item"><span class="lg-swatch you"></span>Your tasks, in this portal</span>
        <span class="lg-item"><span class="lg-swatch later"></span>Not yet open — shows when and why</span>
        <span class="lg-item"><span class="lg-swatch other"></span>Other teams — status only</span>
        <span class="lg-item">${am('A-22')} ${am('A-11')} due dates and the banking timing are assumptions</span>
      </div>
    </div>
  </div>`;
}

/* ============================================================
   Shell: header, ribbon, panels
   ============================================================ */
function crumbs(here) {
  return `<div class="crumbs"><button class="back" data-goto="#/">${ic('chevron-left.svg','sm')}All tasks</button>
  <span>/</span><span>${here}</span></div>`;
}

function renderShell() {
  $('#hdrYou').innerHTML = `
    <div>
      <div class="who">${esc(HIRE.preferred)} ${esc(HIRE.legalLast)}</div>
      <div class="when">Starts <b>${HIRE.startDateText}</b> · ${daysToStart()} days to go</div>
    </div>
    <div class="avatar">${HIRE.initials}</div>`;
}

/* ---------- assumptions panel ---------- */
let panelFilter = null;
function renderAssumptions(highlightId) {
  const groups = ['blocks','content','design'];
  $('#assumeBody').innerHTML = `
    <div class="panel-note">Where this prototype rests on an assumption rather than a confirmed requirement, the element carries a small
    marker like ${am('A-04')}. All 28 are listed here with what it would take to resolve each. Every one is reversible.</div>
    ${groups.map(g => {
      const list = ASSUMPTIONS.filter(a => a.group===g);
      return `
      <div class="ag-h">${GROUP_LABELS[g].label} <span class="cnt">· ${list.length} — ${GROUP_LABELS[g].hint}</span></div>
      ${list.map(a => `
        <div class="a-entry ${a.id===highlightId?'hl':''}" data-aentry="${a.id}" id="ae-${a.id}">
          <div class="a-top"><span class="a-id">${a.id}</span><span class="a-screen">${a.screen}</span>
          <span class="a-oi">${a.oi !== '—' ? 'Open item '+a.oi : ''}</span></div>
          <div class="a-text">${a.assumed}</div>
          <div class="a-resolve"><b>To resolve:</b> ${a.resolve}</div>
          ${a.nolink ? '<div class="nolink">Global assumption — nothing on screen to highlight.</div>' : ''}
        </div>`).join('')}`;
    }).join('')}`;
  if (highlightId) {
    const el = $('#ae-'+highlightId);
    if (el) setTimeout(() => el.scrollIntoView({ block:'center', behavior:'smooth' }), 60);
  }
}
function openAssumptions(id) {
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
  'When does my equipment arrive?': 'Your equipment ships after you choose it — that task opens once your role and location are confirmed. Setup instructions follow 3 days before you start.',
  'What if I can’t finish a task in time?': 'Nothing breaks — the task stays open and Maya gets a heads-up so she can help. If a date is genuinely a problem, message her directly and it gets sorted.',
  'Who sees my emergency contact?': 'Only the people who would need it in an emergency. It’s never shared with your team or your manager.',
  'When do I hear about pay and banking?': 'Payroll runs that separately, in their own secure form — they’ll contact you directly. It never goes through this portal.',
};
function renderChat() {
  $('#chatBody').innerHTML = `
    <div class="chat-msgs" id="chatMsgs">
      <div class="msg bot">Hi ${esc(HIRE.preferred)} — I’m the onboarding assistant. I can answer questions about your tasks,
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
    msgs.insertAdjacentHTML('beforeend', `<div class="msg bot">${CHAT_ANSWERS[q] || 'That one needs a human — I’ve flagged it to Maya Chen, who’ll come back to you by email. (Prototype: canned response.)'}</div>`);
    msgs.parentElement.scrollTop = msgs.parentElement.scrollHeight;
  }, 350);
}

/* ---------- prototype controls ---------- */
function renderProtoDrawer() {
  $('#protoDrawer').innerHTML = `
    <h3>${ic('exclamation-triangle.svg','sm')}Prototype controls</h3>
    <div class="warn-line">A prototype device — none of this exists in the real product. Clock is fixed at ${fmtDate(simToday())}.</div>
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
    <div class="pc-h">Task-state scenario</div>
    <div class="pc-row">
      <button class="pc-btn ${S.scenario==='default'?'on':''}" data-pc="scenario:default">First visit</button>
      <button class="pc-btn ${S.scenario==='inprogress'?'on':''}" data-pc="scenario:inprogress">In progress</button>
      <button class="pc-btn ${S.scenario==='review'?'on':''}" data-pc="scenario:review">Under review</button>
      <button class="pc-btn ${S.scenario==='overdue'?'on':''}" data-pc="scenario:overdue">Overdue</button>
      <button class="pc-btn ${S.scenario==='complete'?'on':''}" data-pc="scenario:complete">All complete</button>
    </div>
    <div class="pc-h">Review screens</div>
    <div class="pc-links">
      <a data-goto="#/flow">${ic('rocket.svg','sm')} Flow overview — the whole journey on one screen</a>
      <a data-openassume="1">${ic('list-tasks.svg','sm')} Assumptions &amp; gaps — all 28 entries</a>
    </div>`;
}

function applyScenario(name) {
  const persona = S.persona, country = S.country;
  S = seedDetails(DEFAULT_STATE());
  S.persona = persona; S.country = country; S.scenario = name;
  S.details.data.country = country==='JP' ? HIRE.countryJP : HIRE.countryUS;
  S.details.data.language = country==='JP' ? 'Japanese' : 'English (US)';
  S.details.data.ccode = country==='JP' ? '+81' : '+1';

  const fillDetails = () => {
    Object.assign(S.details.data, {
      preferred:'Jordan', addr1:'2180 Curtis Street, Apt 14', city:'Denver', state:'CO', zip:'80205',
      ec1name:'Sam Reyes', ec1rel:'Spouse or partner', ec1phone:'(303) 555-0142',
      language: country==='JP' ? 'Japanese' : 'English (US)', channel:'Email',
    });
  };

  if (name === 'inprogress') {
    fillDetails();
    S.details.data.ec1name=''; S.details.data.ec1rel=''; S.details.data.ec1phone='';
    S.details.data._touched = true;
    S.policies.acked = { aup:true, edpn:true };
    S.policies.read = { aup:true, edpn:true };
    S.intro.text = 'I’m Jordan — joining the FP&A team from a fintech in Denver. Outside work you’ll usually find me on a trail or attempting sourdough.';
  }
  if (name === 'review') {
    fillDetails(); S.details.submitted = true;
    S.jd.state = 'review'; S.jd.dissent = true;
    S.jd.dissentText = 'The role we discussed was hybrid, two days in office — the summary says something different.';
  }
  if (name === 'complete') {
    fillDetails(); S.details.submitted = true;
    S.jd.state = 'done'; S.jd.scrolled = true; S.jd.acked = true;
    S.intro.text = 'I’m Jordan — joining the FP&A team from a fintech in Denver. I’ll be picking up the forecast for the Americas portfolios. Outside work you’ll usually find me on a trail or attempting sourdough.';
    S.intro.consent = true; S.intro.saved = true; S.intro.done = true;
    if (persona === 'conversion') { S.photo.confirmedExisting = true; }
    else { S.photo.uploaded = true; S.photo.consent = true; S.photo.done = true;
           S.photo.dataUrl = PLACEHOLDER_PHOTO; }
    S.policies.acked = Object.fromEntries(DOCS.map(d => [d.id, true]));
    S.policies.read = Object.fromEntries(DOCS.map(d => [d.id, true]));
    S.policies.cobcVisited = true; S.policies.submitted = true;
  }
  save();
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
const ROUTES = {
  '#/': renderLanding,
  '#/details': renderDetails,
  '#/jd': renderJD,
  '#/intro': renderIntro,
  '#/policies': renderPolicies,
  '#/flow': renderFlow,
};

function render() {
  const route = location.hash || '#/';
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

/* per-screen bindings that can't be pure delegation */
function bindScreen(route) {
  if (route === '#/details') bindDetails();
  if (route === '#/jd') bindJD();
  if (route === '#/intro') bindIntro();
  if (route === '#/policies') bindPolicies();
}

/* ---------- details bindings ---------- */
function bindDetails() {
  if (S.details.submitted && S.details._viewing) {
    $$('#app input, #app select, #app textarea, #app .btn.secondary.sm').forEach(el => {
      if (!el.closest('[data-goto]')) el.disabled = true;
    });
    return;
  }
  $$('[data-input]').forEach(el => {
    const f = el.dataset.input;
    const kind = el.dataset.kind;
    const evt = (el.tagName === 'SELECT' || kind === 'check' || kind === 'radio') ? 'change' : 'input';
    el.addEventListener(evt, () => {
      if (kind === 'check') S.details.data[f] = el.checked;
      else S.details.data[f] = el.value;
      S.details.data._touched = true;
      if (f === 'adjustPrivate') { if (el.checked) S.details.data.adjustText=''; rerender(); return; }
      if (f.endsWith('rel')) { rerender(); return; }
      touchSave();
      updateWizardChrome();
      if (['addr1','city','state','zip'].includes(f) && ['addr1','city','state','zip'].every(validField)) rerender();
    });
    if (evt === 'input') el.addEventListener('blur', () => {
      const req = requiredFields();
      S.details.data['_err_'+f] = req.includes(f) && !validField(f);
      const wrap = el.closest('.field');
      if (wrap) wrap.classList.toggle('invalid', !!S.details.data['_err_'+f]);
      updateWizardChrome();
    });
  });
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
  const counts = tabCounts();
  counts.forEach((c,i) => {
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
    toast('Role confirmed — task complete.', 'check-circle.svg');
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
    toast('Sent to Recruiting — they’ll be in touch within 2 working days.');
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
      const pv = $('#pvText');
      pv.innerHTML = ta.value ? esc(ta.value) : '<span class="pv-empty">Your introduction appears here as you write it.</span>';
      $('#saveIntro').disabled = !ta.value.trim();
    });
  }
  $$('[data-chip]').forEach(b => b.addEventListener('click', e => {
    if (e.target.dataset.chipx) return; // dismiss handled below
    const c = CHIP_SCAFFOLDS.find(c => c.id === b.dataset.chip);
    const cur = $('#introText').value;
    const next = cur ? (cur.replace(/\s+$/,'') + '\n' + c.text) : c.text; // never overwrite
    if (next.length <= 500) {
      $('#introText').value = next; S.intro.text = next; save();
      $('#introText').dispatchEvent(new Event('input'));
      $('#introText').focus();
    } else toast('Not enough room left for that prompt — 500 characters max.');
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
    toast(S.intro.consent ? 'Introduction saved — Priya can share it when she’s ready.' : 'Saved. It won’t be shared until you tick the consent box.', 'check-circle.svg');
  });

  // photo section
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
    S.photo.uploaded = false; S.photo.dataUrl = null; S.photo.consent = false; S.photo.done = false;
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
    toast('Photo submitted — your badge will be printed and waiting on Day 1.', 'check-circle.svg');
  });
  const ce = $('#confirmExisting');
  if (ce) ce.addEventListener('click', () => {
    S.photo.confirmedExisting = true; save(); rerender();
    toast('Confirmed — same photo, same badge.', 'check-circle.svg');
  });
  const rp = $('#replacePhoto');
  if (rp) rp.addEventListener('click', () => { S.photo.replacing = true; save(); rerender(); });
}
function loadPhoto(file) {
  if (!/^image\/(jpeg|png)$/.test(file.type)) { toast('JPG or PNG only, please.'); return; }
  if (file.size > 5 * 1024 * 1024) { toast('That file is over 5MB — a smaller one, please.'); return; }
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
      if (box.scrollTop + box.clientHeight >= box.scrollHeight - 16) {
        S.policies.read[id] = true; save(); rerender();
      }
    };
    box.addEventListener('scroll', check);
    if (!S.policies.read[id] && box.scrollHeight <= box.clientHeight + 4) {
      S.policies.read[id] = true; save(); autoRead = true;
    }
  });
  if (autoRead) { rerender(); return; }
  $$('[data-ack]').forEach(cb => cb.addEventListener('change', () => {
    if (cb.checked) {
      S.policies.acked[cb.dataset.ack] = true; save(); rerender();
    }
  }));
  const cobc = $('[data-cobc]');
  if (cobc) cobc.addEventListener('click', () => {
    toast('Opening codeofbusinessconduct.equinix.com in a new tab (simulated — you’d sign in with your Equinix account).', 'external-link.svg');
    setTimeout(() => { S.policies.cobcVisited = true; save(); rerender(); }, 1400);
  });
  const sub = $('#submitPolicies');
  if (sub) sub.addEventListener('click', () => {
    S.policies.submitted = true; save(); rerender();
    toast('All acknowledgements recorded — task complete.', 'check-circle.svg');
  });
}

/* ---------- global delegation ---------- */
document.addEventListener('click', e => {
  const t = e.target;

  // assumption markers
  const amEl = t.closest('.am');
  if (amEl) { e.stopPropagation(); openAssumptions(amEl.dataset.am); return; }

  // assumption entries → navigate & flash
  const ae = t.closest('[data-aentry]');
  if (ae) {
    const a = ASSUMPTIONS.find(x => x.id === ae.dataset.aentry);
    if (!a || !a.route) return;
    closePanels();
    const go = () => {
      setTimeout(() => {
        $$(`[data-assume]`).forEach(el => {
          if (el.dataset.assume.split(' ').includes(a.id)) {
            el.classList.add('assume-flash');
            el.scrollIntoView({ block:'center', behavior:'smooth' });
            setTimeout(() => el.classList.remove('assume-flash'), 2400);
          }
        });
      }, 120);
    };
    if (location.hash !== a.route) { location.hash = a.route; setTimeout(go, 150); }
    else go();
    return;
  }

  // navigation
  const nav = t.closest('[data-goto]');
  if (nav) { closePanels(); $('#protoDrawer').classList.remove('show');
    if (location.hash === nav.dataset.goto) rerender(); else location.hash = nav.dataset.goto; return; }
  const tc = t.closest('[data-task]');
  if (tc && !t.closest('[data-openchat]')) { location.hash = tc.dataset.task; return; }

  // landing interactions
  const uc = t.closest('[data-ucard]');
  if (uc) { uc.classList.toggle('open'); return; }
  const res = t.closest('[data-res]');
  if (res) { const b = $(`[data-resbody="${res.dataset.res}"]`); if (b) b.style.display = b.style.display==='block'?'none':'block'; return; }
  if (t.closest('[data-openchat]')) { openChat(); return; }
  const contact = t.closest('[data-contact]');
  if (contact) { toast(contact.dataset.contact==='teams' ? 'This would open a Teams chat (prototype).' : 'This would open your email app (prototype).'); return; }
  const ext = t.closest('[data-ext]');
  if (ext) { toast('This opens another Equinix system — not part of this prototype.', 'external-link.svg'); return; }

  // details extras
  if (t.closest('[data-countryquery]')) {
    e.preventDefault();
    S.details.queryRaised = true; save(); rerender();
    toast('Query raised with Maya — the field stays as it is until we’ve checked.', 'check-circle.svg');
    return;
  }
  if (t.closest('[data-addec2]')) { S.details.data.ec2on = true; save(); rerender(); return; }
  if (t.closest('[data-removeec2]')) {
    const d = S.details.data;
    d.ec2on = false; d.ec2name=''; d.ec2rel=''; d.ec2relOther=''; d.ec2phone=''; d.ec2alt=''; d.ec2email='';
    save(); rerender(); return;
  }
  if (t.closest('[data-togglesid]')) { S.details.data.sidOpen = !S.details.data.sidOpen; save(); rerender(); return; }
  const reopen = t.closest('[data-reopen]');
  if (reopen) {
    if (reopen.dataset.reopen === 'details') S.details._viewing = true;
    if (reopen.dataset.reopen === 'policies') S.policies._viewing = true;
    save(); rerender(); return;
  }

  // wizard tabs & submit
  const wt = t.closest('[data-tab]');
  if (wt) { S.details.tab = +wt.dataset.tab; save(); rerender(); return; }
  if (t.closest('#submitDetails')) {
    const missing = requiredFields().filter(f => !validField(f));
    if (!missing.length) {
      S.details.submitted = true; save(); rerender();
      toast('Details submitted — your record is set up.', 'check-circle.svg');
    }
    return;
  }

  // panels
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
      // keep country-derived fields in step when country flips
      if (k === 'country') {
        S.details.data.country = v==='JP' ? HIRE.countryJP : HIRE.countryUS;
        if (!S.details.data._touched) {
          S.details.data.language = v==='JP' ? 'Japanese' : 'English (US)';
          S.details.data.ccode = v==='JP' ? '+81' : '+1';
        }
      }
      if (k === 'persona' && v === 'external') { S.photo.confirmedExisting = false; S.photo.replacing = false; }
      save();
    }
    rerender();
    $('#protoDrawer').classList.add('show');
    return;
  }
  const q = t.closest('[data-q]');
  if (q) { chatAsk(q.dataset.q); return; }

  // proto ribbon links
  if (t.closest('#rbAssume')) { openAssumptions(); return; }
  if (t.closest('#rbFlow')) { location.hash = '#/flow'; return; }

  // close drawer when clicking elsewhere
  if (!t.closest('#protoDrawer') && !t.closest('#protoFab')) $('#protoDrawer').classList.remove('show');
});

function openChat() {
  renderChat();
  $('#chatPanel').classList.add('show');
  $('#overlay').classList.add('show');
}
$('#chatSend')?.addEventListener('click', sendChat);
function sendChat() {
  const inp = $('#chatInput');
  if (inp && inp.value.trim()) { chatAsk(inp.value.trim()); inp.value=''; }
}

window.addEventListener('hashchange', render);
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closePanels(); $('#protoDrawer').classList.remove('show'); } });

/* chat input binding (static element) */
document.addEventListener('DOMContentLoaded', () => {
  $('#chatSendBtn').addEventListener('click', sendChat);
  $('#chatInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });
  render();
});
