/* ============================================================
   Data — content, copy, and the assumption register.  v2
   Everything here is prototype content. Placeholder text is
   marked with an assumption ID and listed in the register.

   v2 provenance tags on every register entry:
     UAT     — seen working in the live ServiceNow UAT portal
     1:1     — stated by the platform owner, sourced but not seen
     PRIOR   — from the earlier change request, already agreed
     ASSUMED — still a judgement call
   ============================================================ */

const SIM = {
  // The prototype runs against a fixed "today" so dates are stable.
  today: new Date(2026, 7, 4),          // 4 August 2026
  start2wk: new Date(2026, 7, 18),      // 18 August 2026 — the short runway
  start3mo: new Date(2026, 10, 3),      // 3 November 2026 — the long runway (A-45)
};

/* Due dates as offsets from the start date, so both runways work (A-45). */
const DUE_OFFSETS = {
  equipment: -12,   // earliest of all — build and ship lead time (A-33)
  photo: -10,       // badge print lead
  jd: -7,
  intro: -7,
  details: -4,
  policies: -4,
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
  email: 'jordan.reyes@gmail.com',
  mobile: '(303) 555-0117',
  countryUS: 'United States',
  countryJP: 'Japan',
  officeAddress: '1225 17th Street #1690, Denver, Colorado 80202, US',
  officeAddressJP: 'Otemachi Financial City Grand Cube, 1-9-2 Otemachi, Chiyoda-ku, Tokyo 100-0004, JP',
};

const PEOPLE = {
  pex: { name: 'Maya Chen', role: 'People Experience coordinator', initials: 'MC', cls: 'pex' },
  recruiter: { name: 'Daniel Okafor', role: 'Recruiter', initials: 'DO', cls: 'rec' },
  manager: { name: 'Priya Anand', role: 'Director, FP&A · your manager', initials: 'PA', cls: 'mgr' },
  buddy: {
    name: 'Nina Kowalski', role: 'Senior Financial Analyst · your onboarding buddy',
    initials: 'NK', cls: 'buddy', tz: 'Chicago (CT) — an hour ahead of you',
    assignedBy: 'Chosen by Priya Anand when your start date was confirmed.',
  },
  peers: [
    { name: 'Marcus Webb', role: 'Senior Financial Analyst', initials: 'MW' },
    { name: 'Dana Kim', role: 'Financial Analyst II', initials: 'DK' },
    { name: 'Tomás Rivera', role: 'Senior Financial Analyst', initials: 'TR' },
  ],
};

/* ---------- Five-phase timeline, named from the live portal (A-44) ---------- */
const PHASES = [
  'Get ready for Day 1',
  'Final preparations for Day 1',
  'Your first day at Equinix',
  'Your first week at Equinix',
  'Your first month at Equinix',
];

/* ============================================================
   Assumption register — 47 entries.
   A-01…A-28 carried from v1 unchanged in numbering.
   A-29…A-46 and A-48 are new in v2 (A-47 deliberately unused,
   reserved for the IBX badge question if it needs its own entry).
   A-09 is RETIRED — observation answered it.
   ============================================================ */
const ASSUMPTIONS = [
  /* ---------- Blocks build ---------- */
  { id:'A-01', group:'blocks', prov:'ASSUMED', screen:'Personal details', route:'#/details',
    assumed:'Pre-filled fields are legal name, personal email, mobile and country of hire. Everything else arrives blank.',
    resolve:'Confirm the candidate-attested field list with DIO and HR Ops — it is most of the visual difference on Tab 1.', oi:'OI-20' },
  { id:'A-02', group:'blocks', prov:'ASSUMED', screen:'Personal details', route:'#/details',
    assumed:'Tab 3 holds preferred language, contact preferences, workplace adjustments and voluntary self-identification.',
    resolve:'The PRD names only two of the three tabs. Tab 3 contents need a decision from the onboarding PM with HR Ops.', oi:'OI-02' },
  { id:'A-10', group:'blocks', prov:'ASSUMED', screen:'Personal details', route:'#/details',
    assumed:'The portal renders the full personal-details form, with banking as a locked boundary card.',
    resolve:'Confirm whether this form belongs to this workstream or the payroll team. If ownership lands elsewhere, this becomes an interface spec.', oi:'OI-01' },
  { id:'A-12', group:'blocks', prov:'ASSUMED', screen:'Job description', route:'#/jd',
    assumed:'No compensation figures are shown anywhere in the portal.',
    resolve:'Confirm the manager-visibility ruling on sensitive data. Omitting salary is the conservative default — it is already in the signed offer.', oi:'OI-10' },
  { id:'A-14', group:'blocks', prov:'ASSUMED', screen:'Introduction', route:'#/intro',
    assumed:'The manager forwards the introduction to the team. It is never auto-posted.',
    resolve:'Confirm the sharing model with Janine. Auto-posting would need much stronger consent design.', oi:'OI-11' },
  { id:'A-29', group:'blocks', prov:'PRIOR', screen:'Personal details', route:'#/details',
    assumed:'Identity and right-to-work documents are captured here, on Tab 1, alongside country of hire.',
    resolve:'This overlaps the separate Right to Work task. Capturing once is a proposal, not an agreed design — the PEX document-sequencing work may already settle which documents come early and which come late.', oi:'—' },
  { id:'A-34', group:'blocks', prov:'ASSUMED', screen:'Equipment', route:'#/equipment',
    assumed:'This equipment screen is a scoped stand-in for a catalogue owned elsewhere.',
    resolve:'The real catalogue, its options and its regional variants belong to the EUT team. Confirm what this workstream owns before anyone builds from this screen.', oi:'—' },
  { id:'A-41', group:'blocks', prov:'UAT', screen:'Equipment', route:'#/equipment',
    assumed:'The hiring manager orders the computer today; the new hire orders accessories only.',
    resolve:'The target design reverses this — new hire selects, manager confirms. That is a change to what a manager does, and it may already be settled inside the laptop-and-accessory MVP. Decide who leads before either screen is built.', oi:'—' },
  { id:'A-42', group:'blocks', prov:'UAT', screen:'Equipment', route:'#/equipment',
    assumed:'The accessories order creates an incident to Global Helpdesk Tier 2, with a CSV attached and an open comment thread — not a request item.',
    resolve:'The earlier spec assumed RITMs throughout. Amendment-by-comment is observed real behaviour: either support it with an explicit “change my order” path or route amendments somewhere better.', oi:'—' },
  { id:'A-43', group:'blocks', prov:'1:1', screen:'Suggested network', route:'#/network',
    assumed:'The manager names at least five people outside the reporting line, writes why each matters, each is notified, and the new hire gets the list plus suggested 1:1 times.',
    resolve:'Does not exist today. Needs a new manager task, a notification, and a booking integration — and it may belong at Day 1 rather than pre-Day 1. It is not the org chart and not the buddy; keep all three separate.', oi:'—' },
  { id:'A-48', group:'blocks', prov:'UAT', screen:'All screens', route:'#/',
    assumed:'The prototype is a single page. The live platform is two levels — a MyHR hub (carousel, videos, countdown, culture links) and a separate task portal you click into.',
    resolve:'Declared rather than silently diverged. Decide whether to adopt the split: it changes navigation, the progress model, and where the culture content lives.', oi:'—' },

  /* ---------- Content needed ---------- */
  { id:'A-03', group:'content', prov:'ASSUMED', screen:'Personal details', route:'#/details',
    assumed:'Preferred language sits on Tab 3, defaulted from country of hire.',
    resolve:'Confirm whether language preference comes from the worker record or is captured here. Five policy documents are served by it.', oi:'OI-16' },
  { id:'A-05', group:'content', prov:'ASSUMED', screen:'Personal details', route:'#/details',
    assumed:'Contact preferences = preferred channel (email / text / either) plus an opt-in for non-essential updates.',
    resolve:'The field is named in the source with no definition. Someone needs to define the real options.', oi:'OI-18' },
  { id:'A-07', group:'content', prov:'ASSUMED', screen:'Personal details', route:'#/details',
    assumed:'Self-identification is collapsed by default, voluntary, with “prefer not to say” on every question, paired with its privacy notice.',
    resolve:'The interaction pattern is standard; the categories are country-specific and regulatory. PEX and Privacy need to supply the real country list and categories.', oi:'OI-22' },
  { id:'A-13', group:'content', prov:'ASSUMED', screen:'Job description', route:'#/jd',
    assumed:'The job description text and the three-level team view are plausible placeholders.',
    resolve:'Real job description content and the org-chart delivery mechanism are needed before build.', oi:'—' },
  { id:'A-17', group:'content', prov:'ASSUMED', screen:'Badge photo', route:'#/intro',
    assumed:'JPG/PNG, under 5MB, at least 600×600 px, plus four guideline lines — all conventional values.',
    resolve:'Replace with the real badge specification from the workplace team before build. Printing to the wrong spec is a Day 1 failure.', oi:'OI-13' },
  { id:'A-19', group:'content', prov:'ASSUMED', screen:'Compliance pack', route:'#/policies',
    assumed:'The Securities Trading Policy requires an acknowledgement.',
    resolve:'Its acknowledgement cell is blank in the commonality workbook. Legal needs to confirm — a missing acknowledgement is a compliance gap.', oi:'OI-06' },
  { id:'A-20', group:'content', prov:'ASSUMED', screen:'Compliance pack', route:'#/policies',
    assumed:'Japan is shown as the country-addendum example on the Acceptable Use Policy.',
    resolve:'Candidate addendum countries are Japan, Korea and France — all pending legal review. The mechanism is the point, not the content.', oi:'OI-08' },
  { id:'A-22', group:'content', prov:'ASSUMED', screen:'Task list', route:'#/',
    assumed:'The job description confirmation and the introduction are due at Day −7.',
    resolve:'Neither has a due date in any source. Day −7 puts them before the manager needs the introduction for a team announcement.', oi:'—' },
  { id:'A-23', group:'content', prov:'ASSUMED', screen:'Task list', route:'#/',
    assumed:'Estimated completion times of 2–6 minutes per task.',
    resolve:'Invented, to test whether time estimates help or intimidate. Worth measuring rather than guessing.', oi:'—' },
  { id:'A-30', group:'content', prov:'PRIOR', screen:'Personal details', route:'#/details',
    assumed:'The per-country identity document lists (United States and Japan) are illustrative.',
    resolve:'Neither list has been checked against the legal requirement for that country. Legal and the Right to Work owner need to supply the real lists before build.', oi:'—' },
  { id:'A-37', group:'content', prov:'UAT', screen:'Equipment', route:'#/equipment',
    assumed:'Accessories are for the at-home workspace — the in-office workspace already has monitors, keyboard and mouse.',
    resolve:'Wording mirrors the live form. Confirm it holds in every region, and for hybrid hires with no assigned desk.', oi:'—' },
  { id:'A-39', group:'content', prov:'UAT', screen:'Equipment', route:'#/equipment',
    assumed:'The headset is automatic — everyone receives the standard Zoom-optimised headset. It is not selectable.',
    resolve:'Mirrors the live form. Confirm whether someone who does not want one has any route to decline.', oi:'—' },
  { id:'A-46', group:'content', prov:'1:1', screen:'Task list', route:'#/',
    assumed:'A medical check appears for countries that require one — shown here for Japan only.',
    resolve:'Same family as right to work. Which countries require it, and what the new hire actually has to do, are both unconfirmed.', oi:'—' },

  /* ---------- Design choice ---------- */
  { id:'A-04', group:'design', prov:'ASSUMED', screen:'Personal details', route:'#/details',
    assumed:'Pronouns are included, optional, beside preferred name.',
    resolve:'Not mentioned in any source. Needs a worker-record target field if kept.', oi:'OI-17' },
  { id:'A-06', group:'design', prov:'ASSUMED', screen:'Personal details', route:'#/details',
    assumed:'Workplace adjustments are always visible and optional, with a “discuss privately” route that avoids storing detail.',
    resolve:'The live accessories form raises adjustments at the point of choosing equipment. v2 mirrors the link there rather than relocating this section — confirm which placement people actually use.', oi:'OI-23' },
  { id:'A-08', group:'design', prov:'ASSUMED', screen:'Personal details', route:'#/details',
    assumed:'One emergency contact is required; a second is optional.',
    resolve:'No source specifies how many. One required is the common minimum.', oi:'OI-19' },
  { id:'A-11', group:'design', prov:'ASSUMED', screen:'Task list', route:'#/',
    assumed:'The banking card carries no date — only “Payroll will be in touch.”',
    resolve:'Three sources place direct deposit at three different times, and legal review is outstanding in two countries. Showing no date is more honest than picking one. The exclusion itself is now confirmed deliberate.', oi:'OI-03' },
  { id:'A-15', group:'design', prov:'ASSUMED', screen:'Introduction', route:'#/intro',
    assumed:'A 500-character limit and three optional prompt chips.',
    resolve:'No limit is specified anywhere; one is needed because the text becomes a team post. The prompts address blank-page hesitation.', oi:'OI-12' },
  { id:'A-16', group:'design', prov:'ASSUMED', screen:'Introduction + photo', route:'#/intro',
    assumed:'One card, two independently completable sections.',
    resolve:'Merge call from the spec, following the pattern the PRD sets for equipment and software: display together, track separately.', oi:'—' },
  { id:'A-18', group:'design', prov:'ASSUMED', screen:'Badge photo', route:'#/intro',
    assumed:'One consent naming the badge, the internal directory and the Teams profile.',
    resolve:'The photo is intended to serve other profile surfaces, which is broader than a badge. No consent wording exists in any source — Privacy needs to draft it.', oi:'OI-14' },
  { id:'A-21', group:'design', prov:'ASSUMED', screen:'Task list', route:'#/',
    assumed:'Information governance appears under “Coming up” as a first-week item.',
    resolve:'It is the one compliance document placed at Week 1, with no rationale recorded. Shown but not actionable, so the placement is visible and arguable.', oi:'OI-05' },
  { id:'A-24', group:'design', prov:'ASSUMED', screen:'Multiple screens', route:'#/policies',
    assumed:'Acknowledgement checkboxes are disabled until the document has been read to the end.',
    resolve:'The PRD sets this pattern for the offer letter but does not extend it. Applying it consistently is the defensible reading.', oi:'—' },
  { id:'A-25', group:'design', prov:'ASSUMED', screen:'Task list', route:'#/',
    assumed:'Progress = tasks complete out of tasks assigned, plus a phase strip. v2 replaces the invented four milestones with the live portal’s five phases — see A-44.',
    resolve:'The requirement is for a progress tracker; no source defines its model. Two levels show immediate progress and overall position.', oi:'—' },
  { id:'A-26', group:'design', prov:'ASSUMED', screen:'All screens (platform)', route:null,
    assumed:'The ServiceNow object structure is not represented in this prototype.',
    resolve:'Whether these are catalog items, record producers or lifecycle-event activities changes the build, not the design.', oi:'OI-21', nolink:true },
  { id:'A-27', group:'design', prov:'ASSUMED', screen:'Job description', route:'#/jd',
    assumed:'The dissent path mirrors the offer-letter “report an issue” pattern and puts the task into an Under review state.',
    resolve:'The PRD defines this pattern for a wrong offer letter, not the job description. Reusing it is consistent; the routing target needs confirming.', oi:'—' },
  { id:'A-28', group:'design', prov:'ASSUMED', screen:'All screens', route:'#/',
    assumed:'Built for laptop only — no mobile layouts.',
    resolve:'Worth revisiting before build for the IBX technician persona, who may be more phone-reliant than a desk hire. Analytics from the current portal would settle it.', oi:'—' },
  { id:'A-31', group:'design', prov:'PRIOR', screen:'People rail', route:'#/',
    assumed:'The onboarding buddy is visible from the moment they are assigned, with role, timezone and who chose them.',
    resolve:'An earlier proposal surfaced the buddy 72 hours before the start date. Showing them from assignment gives the new hire someone to talk to during the quiet weeks — confirm what the buddy programme intends.', oi:'—' },
  { id:'A-32', group:'design', prov:'PRIOR', screen:'People rail', route:'#/',
    assumed:'The hiring manager is contactable from the portal before Day 1, by Teams and email.',
    resolve:'Confirm the manager expects to be reachable this early, and that Teams reaches them before the new hire has an Equinix account.', oi:'—' },
  { id:'A-33', group:'design', prov:'1:1', screen:'Task list', route:'#/',
    assumed:'Equipment opens immediately and sits first in the list, with the earliest due date.',
    resolve:'Nothing gates it today — the “when your role and location are confirmed” gate does not exist, because nobody performs that confirmation. Confirm the earliest date an accessories order can usefully be placed.', oi:'—' },
  { id:'A-35', group:'design', prov:'UAT', screen:'Good to know', route:'#/',
    assumed:'Inside Equinix is parked here as pre-Day 1 reference reading, with nothing required or tracked.',
    resolve:'Three positions exist: today it is a Day 1 to-do in the live portal; here it is pre-Day 1 side reference; the stated intent is a carousel above the progress tracker, releasing modules as the start date approaches. Moving it out of Day 1 is a relocation, not a presentation upgrade — pick one of the three.', oi:'—' },
  { id:'A-36', group:'design', prov:'UAT', screen:'Good to know', route:'#/',
    assumed:'The first-90-days checklists are parked as reference only, not as tick-off items.',
    resolve:'The parking decision stands, but the original worry is answered: the platform has a Required/Optional filter natively and already ships optional items as “No due date • Optional”. Revisit whether tick-off is now cheap.', oi:'—' },
  { id:'A-38', group:'design', prov:'UAT', screen:'Equipment', route:'#/equipment',
    assumed:'Shipping defaults to the office address, derived from role and location, with an explicit option to ship home instead. A shipping phone number is required.',
    resolve:'Replaces the retired A-09. Confirm the office-address lookup exists for every location, and what happens for fully remote hires with no office.', oi:'—' },
  { id:'A-40', group:'design', prov:'1:1', screen:'Task list', route:'#/',
    assumed:'The mobile phone is a Day 1 optional to-do, not a pre-Day 1 task.',
    resolve:'Matches the live portal’s placement. Confirm nothing in the pre-Day 1 flow depends on the phone existing.', oi:'—' },
  { id:'A-44', group:'design', prov:'UAT', screen:'Task list', route:'#/',
    assumed:'The five phase names are taken verbatim from the live portal: Get ready for Day 1 · Final preparations for Day 1 · Your first day · Your first week · Your first month.',
    resolve:'Adopted rather than invented, so the prototype does not compete with a mental model new hires already meet. Confirm the names are stable.', oi:'—' },
  { id:'A-45', group:'design', prov:'1:1', screen:'All screens', route:'#/',
    assumed:'Start dates are bimodal — many hires have about two weeks, but some start three months out. Both are viewable from the prototype controls.',
    resolve:'The distribution is on the onboarding dashboard — pull it rather than guess. A list that works at fourteen days can feel empty and confusing at ninety.', oi:'—' },

  /* ---------- Retired — observation answered the question ---------- */
  { id:'A-09', group:'retired', prov:'UAT', screen:'Personal details / Equipment', route:'#/equipment',
    assumed:'Was: home address is captured once on Tab 1 and reused for equipment delivery, with the equipment task holding the editable copy.',
    resolve:'Retired — the direction was wrong. Shipping defaults to the office address, derived from role and location, so the equipment task never waits on personal details. The Tab 1 “ship here” checkbox is gone. Replaced by A-38; workbook item OI-28 closes.', oi:'OI-09 → closed' },
];

const GROUP_LABELS = {
  blocks: { label: 'Blocks build', hint: 'Must be answered before development' },
  content: { label: 'Content needed', hint: 'Mechanism right — someone needs to supply real text or values' },
  design: { label: 'Design choice', hint: 'Defensible, could reasonably go the other way' },
  retired: { label: 'Retired — answered by observation', hint: 'Was a guess; watching the live portal settled it. Marker removed from the screen.' },
};

const PROV_LABELS = {
  UAT: 'Seen in the live UAT portal',
  '1:1': 'Stated by the platform owner',
  PRIOR: 'Agreed in the earlier change request',
  ASSUMED: 'Still a judgement call',
};

/* ---------- Open before build (§10) ---------- */
const OPEN_BEFORE_BUILD = [
  'Is the manager’s “Order equipment for new hire” task the one being redesigned for the laptop-and-accessory MVP? If so, the confirm-versus-order question is being answered elsewhere and this screen should follow rather than lead.',
  'The PEX document-sequencing work reportedly already specifies which documents come early and which come late. That would settle most of A-29 and A-30 without guessing.',
  'Start-date distribution from the onboarding dashboard — the real spread behind A-45.',
  'What is actually inside “Collect your Equinix credentials”? It is a new-hire to-do due one day before start, which complicates the story that managers currently hand over usernames and passwords.',
  'IBX badge request — covered by the badge photo task or not? Until that is settled, the photo task is neither merged nor split. (A-47 is reserved if it needs its own entry.)',
];

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
const FILLER = [
  'This is placeholder policy text, shown so the reading and acknowledgement flow can be tested at a realistic length. The real document is owned by Legal and served with version control.',
  'It stands in for several paragraphs of real policy content: definitions of the terms the policy uses, the scope it applies to, the obligations that fall on you as an employee, and the situations where those obligations change.',
  'A real policy would continue here with the substance — what is required, what is prohibited, what needs approval, and who grants it. It would also name the owner of the policy and how often it is reviewed.',
  'Nothing in this text is a real Equinix policy statement. Substituting invented compliance language for the real thing would be worse than an obvious gap — so this is deliberately generic.',
  'It would close with where to go with questions: the policy owner, your manager once you have one, or the People Experience team during pre-boarding.',
  'When the real content is loaded, this section will carry the approved wording, its version number, and the language served — all recorded against your acknowledgement.',
  'You have reached the end of this document.',
];
function docBody(paras) { return paras.map(p => `<p>${p}</p>`).join(''); }

const DOCS = [
  { id:'aup', title:'Acceptable Use Policy',
    desc:'How to use Equinix systems, devices and networks', ack:true,
    body: docBody(FILLER), hasAddendum:true },
  { id:'cobc', title:'Code of Business Conduct',
    desc:'The standards we hold each other to', ack:true, external:true },
  { id:'wpp', title:'Whistleblower Protection Policy',
    desc:'How to raise a concern, and how you’re protected when you do', ack:true,
    body: docBody(FILLER) },
  { id:'stp', title:'Securities Trading Policy',
    desc:'Rules on trading Equinix shares', ack:true, marker:'A-19',
    body: docBody(FILLER) },
  { id:'edpn', title:'Employee Data Privacy Notice',
    desc:'What personal data we hold about you and why', ack:true,
    body: docBody(FILLER) },
  { id:'sidpn', title:'Self-Identification Privacy Notice',
    desc:'How the voluntary information you shared earlier is used', ack:true,
    body: docBody(FILLER) },
];

const JP_ADDENDUM_TEXT = `
  <p style="font-size:12.5px; font-weight:350; margin-bottom:6px;">Additional provisions on copyright, workplace monitoring and personal devices apply in Japan. They appear here, inside the global policy, rather than as a separate document — you acknowledge once, covering both.</p>
  <p style="font-size:12px; color:var(--carbon); font-weight:350;"><em>Illustrative content — the real addendum is pending legal review.</em></p>
`;

/* ---------- Identity / right-to-work documents (A-29, A-30) ---------- */
const ID_DOCS = {
  US: [
    { v:'US passport', shoot:'Photograph the photo page — the one with your picture and the machine-readable strip at the bottom.' },
    { v:'Driver’s licence and Social Security card', shoot:'Photograph both sides of your licence, and the front of your Social Security card.' },
    { v:'Permanent resident card', shoot:'Photograph both sides of the card.' },
  ],
  JP: [
    { v:'My Number card (個人番号カード)', shoot:'Photograph the front only — the side with your photo. Not the back.' },
    { v:'Residence card (在留カード)', shoot:'Photograph both sides — the front with your photo, the back with your status.' },
    { v:'Passport', shoot:'Photograph the photo page.' },
  ],
};

/* ---------- Equipment (A-34 … A-42) ---------- */
const ACCESSORY_OPTIONS = [
  { id:'monitor', label:'Monitor (and cables)' },
  { id:'keyboard', label:'Keyboard' },
  { id:'mouse', label:'Mouse' },
  { id:'webcam', label:'Webcam' },
  { id:'speakerphone', label:'Speakerphone' },
];

/* ---------- Suggested team network (A-43) ----------
   Slot times are derived from the start date in app.js, so they stay
   plausible on both the two-week and three-month runways (A-45). */
const NETWORK = [
  { name:'Aisha Bello', initials:'AB', role:'Manager, Corporate Accounting', dept:'Controllership',
    why:'Your forecast lands against her actuals every close. Worth meeting before your first month-end rather than during it.' },
  { name:'Ravi Menon', initials:'RM', role:'Director, Revenue Operations', dept:'Go-to-market',
    why:'He owns the bookings data your revenue forecast starts from. If a number looks wrong, he usually knows why first.' },
  { name:'Elena Duarte', initials:'ED', role:'Senior Manager, IBX Finance', dept:'Operations Finance',
    why:'Your portfolios overlap on the Americas cost base. She’ll save you a fortnight of working out who owns what.' },
  { name:'Tom Byrne', initials:'TB', role:'Business Partner, Sales Finance', dept:'Commercial Finance',
    why:'He brings the commercial context behind the numbers you’ll be asked to explain in the monthly review.' },
  { name:'Grace Lim', initials:'GL', role:'Manager, FP&A Systems', dept:'Finance Systems',
    why:'She runs the planning tool you’ll live in. Thirty minutes with her early saves a lot of guessing later.' },
];

/* ---------- Inside Equinix modules (A-35) ---------- */
const INSIDE_MODULES = [
  'Who we are', 'How we work', 'Our business',
  'What we enable', 'Our road ahead', 'Your role',
];

/* ---------- Coming up ---------- */
const COMING_UP = [
  { name:'Benefits enrolment', opens:'30 days before you start',
    note:'Shows what you’ll qualify for and when coverage begins', icon:'shield-check.svg',
    expl:'Benefits enrolment opens 30 days before your start date. It will show what you qualify for and when coverage begins, so there’s nothing to prepare now.' },
  { name:'Equipment setup instructions', opens:'3 days before you start', note:'', icon:'portal-window.svg',
    expl:'Once your equipment ships, setup instructions arrive here 3 days before you start — so they’re fresh when the box is.' },
  { name:'Your first day details', opens:'3 days before you start',
    note:'Where to go, who to ask for, what to bring', icon:'calendar.svg',
    expl:'Where to go, who to ask for, what to bring. It arrives 3 days before your start so the details are final, not provisional.' },
  { name:'Collect your Equinix credentials', opens:'1 day before you start',
    note:'', icon:'lock.svg',
    expl:'A to-do in the live portal, due the day before you start. What it contains is not yet documented — worth pinning down, because it sits awkwardly beside the current practice of managers handing over sign-in details.' },
  { name:'Order a phone', opens:'Day 1 — optional', note:'If your role needs one', icon:'mobile.svg', marker:'A-40',
    expl:'A mobile phone is ordered on or after Day 1, and only if your role needs one. It is deliberately not a pre-boarding task.' },
  { name:'Complete your at-home workspace setup', opens:'No due date • Optional', note:'', icon:'desktop.svg',
    expl:'An optional to-do with no due date, exactly as the live portal ships it. It is here so the optional-item pattern is visible, not because anything is waiting on you.' },
  { name:'Information governance', opens:'Your first week', note:'', icon:'file-alt.svg', marker:'A-21',
    expl:'This one happens in your first week, after you have your Equinix account — it covers how we handle information once you’re working here.' },
];
