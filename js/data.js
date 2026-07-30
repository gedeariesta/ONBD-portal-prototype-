/* ============================================================
   Data — content, copy, and the assumption register.
   Everything here is prototype content. Placeholder text is
   marked with an assumption ID and listed in the register.
   ============================================================ */

const SIM = {
  // The prototype runs against a fixed "today" so dates are stable.
  today: new Date(2026, 7, 4),        // 4 August 2026
  todayOverdue: new Date(2026, 7, 15),// used by the Overdue scenario
  startDate: new Date(2026, 7, 18),   // 18 August 2026
};

const HIRE = {
  legalFirst: 'Jordan', legalLast: 'Reyes', preferred: 'Jordan',
  initials: 'JR',
  role: 'Senior Financial Analyst',
  dept: 'Finance — Global FP&A',
  manager: 'Priya Anand',
  managerInitials: 'PA',
  location: 'Denver, Colorado',
  arrangement: 'Hybrid',
  employmentType: 'Full-time, regular',
  startDateText: 'Monday 18 August 2026',
  email: 'jordan.reyes@gmail.com',
  mobile: '(303) 555-0117',
  countryUS: 'United States',
  countryJP: 'Japan',
};

const PEOPLE = {
  pex: { name: 'Maya Chen', role: 'People Experience coordinator', initials: 'MC', cls: 'pex' },
  recruiter: { name: 'Daniel Okafor', role: 'Recruiter', initials: 'DO', cls: 'rec' },
  peers: [
    { name: 'Marcus Webb', role: 'Senior Financial Analyst', initials: 'MW' },
    { name: 'Dana Kim', role: 'Financial Analyst II', initials: 'DK' },
    { name: 'Tomás Rivera', role: 'Senior Financial Analyst', initials: 'TR' },
  ],
};

/* ---------- Assumption register (Appendix A — all 28) ---------- */
const ASSUMPTIONS = [
  // Blocks build
  { id:'A-01', group:'blocks', screen:'Personal details', route:'#/details',
    assumed:'Pre-filled fields are legal name, personal email, mobile and country of hire. Everything else arrives blank.',
    resolve:'Confirm the candidate-attested field list with DIO and HR Ops — it is most of the visual difference on Tab 1.', oi:'OI-20' },
  { id:'A-02', group:'blocks', screen:'Personal details', route:'#/details',
    assumed:'Tab 3 holds preferred language, contact preferences, workplace adjustments and voluntary self-identification.',
    resolve:'The PRD names only two of the three tabs. Tab 3 contents need a decision from the onboarding PM with HR Ops.', oi:'OI-02' },
  { id:'A-09', group:'blocks', screen:'Personal details', route:'#/details',
    assumed:'Home address is captured once, with a checkbox to reuse it for equipment delivery. The equipment task holds the editable copy.',
    resolve:'Settle which shipping address is authoritative and whether it writes back to Workday.', oi:'OI-09' },
  { id:'A-10', group:'blocks', screen:'Personal details', route:'#/details',
    assumed:'The portal renders the full personal-details form, with banking shown as a locked boundary card.',
    resolve:'Confirm whether this form belongs to this workstream or the payroll team. If ownership lands elsewhere, this becomes an interface spec.', oi:'OI-01' },
  { id:'A-12', group:'blocks', screen:'Job description', route:'#/jd',
    assumed:'No compensation figures are shown anywhere in the portal.',
    resolve:'Confirm the manager-visibility ruling on sensitive data. Omitting salary is the conservative default — it is already in the signed offer.', oi:'OI-10' },
  { id:'A-14', group:'blocks', screen:'Introduction', route:'#/intro',
    assumed:'The manager forwards the introduction to the team. It is never auto-posted.',
    resolve:'Confirm the sharing model with Janine. Auto-posting would need much stronger consent design.', oi:'OI-11' },
  // Content needed
  { id:'A-03', group:'content', screen:'Personal details', route:'#/details',
    assumed:'Preferred language sits on Tab 3, defaulted from country of hire.',
    resolve:'Confirm whether language preference comes from the worker record or is captured here. Five policy documents are served by it.', oi:'OI-16' },
  { id:'A-05', group:'content', screen:'Personal details', route:'#/details',
    assumed:'Contact preferences = preferred channel (email / text / either) plus an opt-in for non-essential updates.',
    resolve:'The field is named in the source with no definition. Someone needs to define the real options.', oi:'OI-18' },
  { id:'A-07', group:'content', screen:'Personal details', route:'#/details',
    assumed:'Self-identification is collapsed by default, voluntary, with “prefer not to say” on every question, paired with its privacy notice.',
    resolve:'The interaction pattern is standard; the categories are country-specific and regulatory. PEX and Privacy need to supply the real country list and categories.', oi:'OI-22' },
  { id:'A-13', group:'content', screen:'Job description', route:'#/jd',
    assumed:'The job description text and the three-level team view are plausible placeholders.',
    resolve:'Real job description content and the org-chart delivery mechanism are needed before build.', oi:'—' },
  { id:'A-17', group:'content', screen:'Badge photo', route:'#/intro',
    assumed:'JPG/PNG, under 5MB, at least 600×600 px, plus four guideline lines — all conventional values.',
    resolve:'Replace with the real badge specification from the workplace team before build. Printing to the wrong spec is a Day 1 failure.', oi:'OI-13' },
  { id:'A-19', group:'content', screen:'Compliance pack', route:'#/policies',
    assumed:'The Securities Trading Policy requires an acknowledgement.',
    resolve:'Its acknowledgement cell is blank in the commonality workbook. Legal needs to confirm — a missing acknowledgement is a compliance gap.', oi:'OI-06' },
  { id:'A-20', group:'content', screen:'Compliance pack', route:'#/policies',
    assumed:'Japan is shown as the country-addendum example on the Acceptable Use Policy.',
    resolve:'Candidate addendum countries are Japan, Korea and France — all pending legal review. The mechanism is the point, not the content.', oi:'OI-08' },
  { id:'A-22', group:'content', screen:'Task list', route:'#/',
    assumed:'The job description confirmation and the introduction are due at Day −7.',
    resolve:'Neither has a due date in any source. Day −7 puts them before the manager needs the introduction for a team announcement.', oi:'—' },
  { id:'A-23', group:'content', screen:'Task list', route:'#/',
    assumed:'Estimated completion times of 2–6 minutes per task.',
    resolve:'Invented, to test whether time estimates help or intimidate. Worth measuring rather than guessing.', oi:'—' },
  // Design choice
  { id:'A-04', group:'design', screen:'Personal details', route:'#/details',
    assumed:'Pronouns are included, optional, beside preferred name.',
    resolve:'Not mentioned in any source. Needs a worker-record target field if kept.', oi:'OI-17' },
  { id:'A-06', group:'design', screen:'Personal details', route:'#/details',
    assumed:'Workplace adjustments are always visible and optional, with a “discuss privately” route that avoids storing detail.',
    resolve:'The requirements ask for accommodation capture but never place it. Confirm the location and the private-discussion route.', oi:'OI-23' },
  { id:'A-08', group:'design', screen:'Personal details', route:'#/details',
    assumed:'One emergency contact is required; a second is optional.',
    resolve:'No source specifies how many. One required is the common minimum.', oi:'OI-19' },
  { id:'A-11', group:'design', screen:'Task list', route:'#/',
    assumed:'The banking card carries no date — only “Payroll will be in touch.”',
    resolve:'Three sources place direct deposit at three different times, and legal review is outstanding in two countries. Showing no date is more honest than picking one.', oi:'OI-03' },
  { id:'A-15', group:'design', screen:'Introduction', route:'#/intro',
    assumed:'A 500-character limit and three optional prompt chips.',
    resolve:'No limit is specified anywhere; one is needed because the text becomes a team post. The prompts address blank-page hesitation.', oi:'OI-12' },
  { id:'A-16', group:'design', screen:'Introduction + photo', route:'#/intro',
    assumed:'One card, two independently completable sections.',
    resolve:'Merge call from the spec, following the pattern the PRD sets for equipment and software: display together, track separately.', oi:'—' },
  { id:'A-18', group:'design', screen:'Badge photo', route:'#/intro',
    assumed:'One consent naming the badge, the internal directory and the Teams profile.',
    resolve:'The photo is intended to serve other profile surfaces, which is broader than a badge. No consent wording exists in any source — Privacy needs to draft it.', oi:'OI-14' },
  { id:'A-21', group:'design', screen:'Task list', route:'#/',
    assumed:'Information governance appears under “Coming up” as a first-week item.',
    resolve:'It is the one compliance document placed at Week 1, with no rationale recorded. Shown but not actionable, so the placement is visible and arguable.', oi:'OI-05' },
  { id:'A-24', group:'design', screen:'Multiple screens', route:'#/policies',
    assumed:'Acknowledgement checkboxes are disabled until the document has been read to the end.',
    resolve:'The PRD sets this pattern for the offer letter but does not extend it. Applying it consistently is the defensible reading.', oi:'—' },
  { id:'A-25', group:'design', screen:'Task list', route:'#/',
    assumed:'Progress = tasks complete out of tasks assigned, plus a four-milestone strip.',
    resolve:'The requirement is for a progress tracker; no source defines its model. Two levels show immediate progress and overall position.', oi:'—' },
  { id:'A-26', group:'design', screen:'All screens (platform)', route:null,
    assumed:'The ServiceNow object structure is not represented in this prototype.',
    resolve:'Whether these are catalog items, record producers or lifecycle-event activities changes the build, not the design.', oi:'OI-21', nolink:true },
  { id:'A-28', group:'design', screen:'All screens', route:'#/',
    assumed:'Built for laptop only — no mobile layouts.',
    resolve:'Worth revisiting before build for the IBX technician persona, who may be more phone-reliant than a desk hire. Analytics from the current portal would settle it.', oi:'—' },
  { id:'A-27', group:'design', screen:'Job description', route:'#/jd',
    assumed:'The dissent path mirrors the offer-letter “report an issue” pattern and puts the task into an Under review state.',
    resolve:'The PRD defines this pattern for a wrong offer letter, not the job description. Reusing it is consistent; the routing target needs confirming.', oi:'—' },
];

const GROUP_LABELS = {
  blocks: { label: 'Blocks build', hint: 'Must be answered before development' },
  content: { label: 'Content needed', hint: 'Mechanism right — someone needs to supply real text or values' },
  design: { label: 'Design choice', hint: 'Defensible, could reasonably go the other way' },
};

/* ---------- Job description placeholder (A-13) ---------- */
const JD_TEXT = `
<h4>Purpose of the role</h4>
<p>You'll help the Global FP&amp;A team understand how the business is performing and where it's heading. That means building the monthly forecast, explaining the variances that matter, and giving leaders numbers they can act on — clearly, and on time.</p>
<h4>What you'll do</h4>
<ul>
<li>Own the monthly forecast and variance analysis for your business areas, including commentary that explains the "why", not just the "what".</li>
<li>Build and maintain planning models for revenue, operating expense and headcount.</li>
<li>Partner with Accounting during close to make sure actuals land where the forecast expected them to.</li>
<li>Prepare the monthly review pack for Finance leadership, and present your areas when asked.</li>
<li>Support the annual planning cycle: targets, submissions, consolidation and the inevitable late changes.</li>
<li>Improve how the team works — better models, fewer manual steps, clearer outputs.</li>
</ul>
<h4>Who you'll work with</h4>
<p>You'll report to Priya Anand and sit within Global FP&amp;A. Day to day you'll work with business partners across the region, the Accounting close team, and the other analysts covering neighbouring portfolios. Expect a mix of scheduled rhythm (close, forecast, planning) and ad-hoc questions from leadership.</p>
<h4>What you'll bring</h4>
<ul>
<li>Solid experience in FP&amp;A, corporate finance or a similar analytical role.</li>
<li>Comfort building and defending a forecast — and explaining it to people who don't live in spreadsheets.</li>
<li>Fluency in Excel; familiarity with a planning tool (Anaplan, Adaptive or similar) helps.</li>
<li>A habit of making things clearer, not just more detailed.</li>
</ul>
<p><em>This is placeholder content for layout and reading-length testing. The real job description comes from the official record.</em></p>
`;

/* ---------- Compliance documents ---------- */
function docBody(title, paras) {
  return paras.map(p => `<p>${p}</p>`).join('');
}
const FILLER = [
  'This is placeholder policy text, shown so the reading and acknowledgement flow can be tested at a realistic length. The real document is owned by Legal and served with version control.',
  'It stands in for several paragraphs of real policy content: definitions of the terms the policy uses, the scope it applies to, the obligations that fall on you as an employee, and the situations where those obligations change.',
  'A real policy would continue here with the substance — what is required, what is prohibited, what needs approval, and who grants it. It would also name the owner of the policy and how often it is reviewed.',
  'Nothing in this text is a real Equinix policy statement. Substituting invented compliance language for the real thing would be worse than an obvious gap — so this is deliberately generic.',
  'It would close with where to go with questions: the policy owner, your manager once you have one, or the People Experience team during pre-boarding.',
  'When the real content is loaded, this section will carry the approved wording, its version number, and the language served — all recorded against your acknowledgement.',
  'You have reached the end of this document.',
];

const DOCS = [
  { id:'aup', title:'Acceptable Use Policy',
    desc:'How to use Equinix systems, devices and networks', ack:true,
    body: docBody('aup', FILLER), hasAddendum:true },
  { id:'cobc', title:'Code of Business Conduct',
    desc:'The standards we hold each other to', ack:true, external:true },
  { id:'wpp', title:'Whistleblower Protection Policy',
    desc:'How to raise a concern, and how you’re protected when you do', ack:true,
    body: docBody('wpp', FILLER) },
  { id:'stp', title:'Securities Trading Policy',
    desc:'Rules on trading Equinix shares', ack:true, marker:'A-19',
    body: docBody('stp', FILLER) },
  { id:'edpn', title:'Employee Data Privacy Notice',
    desc:'What personal data we hold about you and why', ack:true,
    body: docBody('edpn', FILLER) },
  { id:'sidpn', title:'Self-Identification Privacy Notice',
    desc:'How the voluntary information you shared earlier is used', ack:true,
    body: docBody('sidpn', FILLER) },
];

const JP_ADDENDUM = `
  <div class="add-h"><span class="ic" style="-webkit-mask-image:url('assets/icons/flag.svg');mask-image:url('assets/icons/flag.svg')"></span>Japan addendum — applies because your country of hire is Japan</div>
  <p style="font-size:12.5px; font-weight:350; margin-bottom:6px;">Additional provisions on copyright, workplace monitoring and personal devices apply in Japan. They appear here, inside the global policy, rather than as a separate document — you acknowledge once, covering both.</p>
  <p style="font-size:12px; color:var(--carbon); font-weight:350;"><em>Illustrative content — the real addendum is pending legal review.</em></p>
`;

/* ---------- Coming up list ---------- */
const COMING_UP = [
  { name:'Choose your equipment', opens:'When your role and location are confirmed',
    note:'You’ll pick your laptop and accessories', icon:'laptop.svg',
    expl:'Equipment choices depend on your confirmed role and work location. Once both are set, this opens and you’ll choose from the options for your role.' },
  { name:'Right to work documents', opens:'Country-specific, opens closer to your start date', note:'', icon:'id-card.svg',
    expl:'What we need depends on your country of hire. The task opens closer to your start date with exactly the documents that apply to you — nothing generic.' },
  { name:'Benefits enrolment', opens:'30 days before you start',
    note:'Shows what you’ll qualify for and when coverage begins', icon:'shield-check.svg',
    expl:'Benefits enrolment opens 30 days before your start date. It will show what you qualify for and when coverage begins, so there’s nothing to prepare now.' },
  { name:'Equipment setup instructions', opens:'3 days before you start', note:'', icon:'portal-window.svg',
    expl:'Once your equipment ships, setup instructions arrive here 3 days before you start — so they’re fresh when the box is.' },
  { name:'Your first day details', opens:'3 days before you start',
    note:'Where to go, who to ask for, what to bring', icon:'calendar.svg',
    expl:'Where to go, who to ask for, what to bring. It arrives 3 days before your start so the details are final, not provisional.' },
  { name:'Information governance', opens:'Your first week', note:'', icon:'file-alt.svg', marker:'A-21',
    expl:'This one happens in your first week, after you have your Equinix account — it covers how we handle information once you’re working here.' },
];
