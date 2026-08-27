/* ============================================================
   Data: content, copy, and the assumption register.  v3
   Everything here is prototype content. Placeholder text is
   marked with an assumption ID and listed in the register.

   v2 provenance tags on every register entry:
     UAT      seen working in the live ServiceNow UAT portal
     1:1      stated by the platform owner, sourced but not seen
     PRIOR    from the earlier change request, already agreed
     ASSUMED  still a judgement call
   ============================================================ */

const SIM = {
  // The prototype runs against a fixed "today" so dates are stable.
  today: new Date(2026, 7, 4),          // 4 August 2026
  start2wk: new Date(2026, 7, 18),      // 18 August 2026, the short runway
  start3mo: new Date(2026, 10, 3),      // 3 November 2026, the long runway (A-45)
};

/* Due dates as offsets from the start date, so both runways work (A-45). */
const DUE_OFFSETS = {
  startdate: -14,   // triggered at offer acceptance (A-49)
  bgcheck: -13,     // launched from the portal, runs externally (A-50)
  equipment: -12,   // earliest of the provisioning tasks, build and ship lead (A-33)
  photo: -10,       // badge print lead
  jd: -7,
  intro: -7,
  details: -4,
  policies: -4,
};

const HIRE = {
  legalFirst: 'Jordan', legalLast: 'Reyes', preferred: 'Jordan',
  initials: 'JR',
  username: 'jreyes',            // the live case names people as "Name (username)" (A-54)
  role: 'Senior Financial Analyst',
  dept: 'Finance, Global FP&A',
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
  manager: { name: 'Priya Anand', role: 'Your manager, Director of FP&A', initials: 'PA', cls: 'mgr' },
  buddy: {
    name: 'Nina Kowalski', role: 'Your onboarding buddy, Senior Financial Analyst',
    initials: 'NK', cls: 'buddy', tz: 'Chicago (CT), an hour ahead of you',
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
   Assumption register. 91 entries across both portals.
   A-01…A-28 carried from v1 unchanged in numbering.
   A-29…A-46 and A-48 are new in v2 (A-47 left unused on purpose,
   reserved for the IBX badge question if it needs its own entry).
   A-09 is retired. Observation answered it.
   ============================================================ */
const ASSUMPTIONS = [
  /* ---------- Blocks build ---------- */
  { id:'A-01', group:'blocks', prov:'ASSUMED', screen:'Personal details', route:'#/details',
    assumed:'Pre-filled fields are legal name, personal email, mobile and country of hire. Everything else arrives blank.',
    resolve:'Confirm the candidate-attested field list with DIO and HR Ops. It accounts for most of the visual difference on Tab 1.', oi:'OI-20' },
  { id:'A-02', group:'blocks', prov:'ASSUMED', screen:'Personal details', route:'#/details',
    assumed:'Tab 3 holds preferred language, contact preferences, workplace adjustments and voluntary self-identification.',
    resolve:'The PRD names only two of the three tabs. Tab 3 contents need a decision from the onboarding PM with HR Ops.', oi:'OI-02' },
  { id:'A-10', group:'blocks', prov:'ASSUMED', screen:'Personal details', route:'#/details',
    assumed:'The portal renders the full personal-details form, with banking as a locked boundary card.',
    resolve:'Confirm whether this form belongs to this workstream or the payroll team. If ownership lands elsewhere, this becomes an interface spec.', oi:'OI-01' },
  { id:'A-12', group:'blocks', prov:'ASSUMED', screen:'Job description', route:'#/jd',
    assumed:'No compensation figures are shown anywhere in the portal.',
    resolve:'Confirm the manager-visibility ruling on sensitive data. Omitting salary is the safe default. The figure is already in the signed offer.', oi:'OI-10' },
  { id:'A-14', group:'blocks', prov:'ASSUMED', screen:'Introduction', route:'#/intro',
    assumed:'The manager forwards the introduction to the team. It is never auto-posted.',
    resolve:'Confirm the sharing model with Janine. Auto-posting would need much stronger consent design.', oi:'OI-11' },
  { id:'A-29', group:'blocks', prov:'PRIOR', screen:'Personal details', route:'#/details',
    assumed:'Identity and right-to-work documents are captured here, on Tab 1, alongside country of hire.',
    resolve:'This overlaps the separate Right to Work task. Capturing once is a proposal, not an agreed design. The PEX document-sequencing work may already settle which documents come early and which come late.', oi:'' },
  { id:'A-34', group:'blocks', prov:'ASSUMED', screen:'Equipment', route:'#/equipment',
    assumed:'This equipment screen is a scoped stand-in for a catalogue owned elsewhere.',
    resolve:'The real catalogue, its options and its regional variants belong to the EUT team. Confirm what this workstream owns before anyone builds from this screen.', oi:'' },
  { id:'A-41', group:'blocks', prov:'UAT', screen:'Equipment', route:'#/equipment',
    assumed:'The hiring manager orders the computer today; the new hire orders accessories only.',
    resolve:'The target design reverses this: new hire selects, manager confirms. That changes what a manager does, and the laptop-and-accessory MVP may have settled it already. Decide who leads before either screen is built.', oi:'' },
  { id:'A-42', group:'blocks', prov:'UAT', screen:'Equipment', route:'#/equipment',
    assumed:'The accessories order creates an incident to Global Helpdesk Tier 2, with the whole order attached as Accessories Details.csv at around 782 bytes, and an open comment thread. It is not a request item.',
    resolve:'The earlier spec assumed RITMs throughout. Amendment by comment is what people actually do, and UAT shows it: “can you please add a webcam” typed into the ticket for an item that was left unticked on the form minutes earlier. Either support it with a proper “change my order” path, or route amendments somewhere better. Nothing reads the CSV back, so today a person at the other end has to reconcile the two.', oi:'' },
  { id:'A-43', group:'blocks', prov:'1:1', screen:'Suggested network', route:'#/network',
    assumed:'The manager names at least five people outside the reporting line, writes why each matters, each is notified, and the new hire gets the list plus suggested 1:1 times.',
    resolve:'Does not exist today. It needs a new manager task, a notification and a booking integration, and it may belong at Day 1 instead of pre-Day 1. It is neither the org chart nor the buddy, so keep all three separate.', oi:'' },
  { id:'A-48', group:'blocks', prov:'UAT', screen:'All screens', route:'#/',
    assumed:'The prototype is a single page. The live platform is two levels: a MyHR hub (carousel, videos, countdown, culture links) and a separate task portal you click into.',
    resolve:'Declared, not silently diverged. Decide whether to adopt the split, because it changes navigation, the progress model and where the culture content lives.', oi:'' },

  /* ---------- Content needed ---------- */
  { id:'A-03', group:'content', prov:'PRD', screen:'Personal details / Compliance pack', route:'#/policies',
    assumed:'REVISED. Document language is derived from country of hire, not chosen by the new hire. The preference field on Tab 3 now covers communications only, and says so.',
    resolve:'The requirement is explicit: the privacy notice “must be auto displayed in the employee’s local language for countries where a translated version is required”, English otherwise. Twenty approved translations exist. The earlier version of this assumption had the model backwards. Still to confirm: whether a new hire may override the served language.', oi:'OI-16' },
  { id:'A-05', group:'content', prov:'ASSUMED', screen:'Personal details', route:'#/details',
    assumed:'Contact preferences = preferred channel (email / text / either) plus an opt-in for non-essential updates.',
    resolve:'The field is named in the source with no definition. Someone needs to define the real options.', oi:'OI-18' },
  { id:'A-07', group:'content', prov:'ASSUMED', screen:'Personal details', route:'#/details',
    assumed:'Self-identification is collapsed by default, voluntary, with “prefer not to say” on every question, paired with its privacy notice.',
    resolve:'The interaction pattern is standard; the categories are country-specific and regulatory. PEX and Privacy need to supply the real country list and categories.', oi:'OI-22' },
  { id:'A-13', group:'content', prov:'ASSUMED', screen:'Job description', route:'#/jd',
    assumed:'The job description text and the three-level team view are plausible placeholders.',
    resolve:'Real job description content and the org-chart delivery mechanism are needed before build.', oi:'' },
  { id:'A-17', group:'content', prov:'ASSUMED', screen:'Badge photo', route:'#/intro',
    assumed:'JPG/PNG, under 5MB, at least 600 by 600 px, plus four guideline lines. All conventional values.',
    resolve:'Replace with the real badge specification from the workplace team before build. Printing to the wrong spec is a Day 1 failure.', oi:'OI-13' },
  { id:'A-19', group:'content', prov:'ASSUMED', screen:'Compliance pack', route:'#/policies',
    assumed:'The Securities Trading Policy requires an acknowledgement.',
    resolve:'Its acknowledgement cell is blank in the commonality workbook. Legal needs to confirm. A missing acknowledgement is a compliance gap.', oi:'OI-06' },
  { id:'A-20', group:'content', prov:'ASSUMED', screen:'Compliance pack', route:'#/policies',
    assumed:'Japan is shown as the country-addendum example on the Acceptable Use Policy.',
    resolve:'Candidate addendum countries are Japan, Korea and France, all pending legal review. The mechanism is the point here, not the content.', oi:'OI-08' },
  { id:'A-22', group:'content', prov:'ASSUMED', screen:'Task list', route:'#/',
    assumed:'The job description confirmation and the introduction are due at Day −7.',
    resolve:'Neither has a due date in any source. Day −7 puts them before the manager needs the introduction for a team announcement.', oi:'' },
  { id:'A-23', group:'content', prov:'ASSUMED', screen:'Task list', route:'#/',
    assumed:'Estimated completion times of 2 to 6 minutes per task.',
    resolve:'Invented, to test whether time estimates help or intimidate. Measure it before build.', oi:'' },
  { id:'A-30', group:'content', prov:'PRIOR', screen:'Personal details', route:'#/details',
    assumed:'The per-country identity document lists (United States and Japan) are illustrative.',
    resolve:'Neither list has been checked against the legal requirement for that country. Legal and the Right to Work owner need to supply the real lists before build.', oi:'' },
  { id:'A-37', group:'content', prov:'UAT', screen:'Equipment', route:'#/equipment',
    assumed:'Accessories are for the at-home workspace. The in-office workspace already has monitors, keyboard and mouse.',
    resolve:'Wording mirrors the live form. Confirm it holds in every region, and for hybrid hires with no assigned desk.', oi:'' },
  { id:'A-39', group:'content', prov:'UAT', screen:'Equipment', route:'#/equipment',
    assumed:'The headset is automatic. Everyone gets the standard Zoom-optimised headset, and there is nothing to select.',
    resolve:'Mirrors the live form. Confirm whether someone who does not want one has any route to decline.', oi:'' },
  { id:'A-46', group:'content', prov:'1:1', screen:'Task list', route:'#/',
    assumed:'A medical check appears for countries that require one. Japan is the example shown here.',
    resolve:'Same family as right to work. Which countries require it, and what the new hire actually has to do, are both unconfirmed.', oi:'' },

  /* ---------- Design choice ---------- */
  { id:'A-04', group:'design', prov:'ASSUMED', screen:'Personal details', route:'#/details',
    assumed:'Pronouns are included, optional, beside preferred name.',
    resolve:'Not mentioned in any source. Needs a worker-record target field if kept.', oi:'OI-17' },
  { id:'A-06', group:'design', prov:'ASSUMED', screen:'Personal details', route:'#/details',
    assumed:'Workplace adjustments are always visible and optional, with a “discuss privately” route that avoids storing detail.',
    resolve:'The live accessories form raises adjustments at the point of choosing equipment, so the prototype mirrors the link there and leaves this section where it is. Confirm which placement people actually use.', oi:'OI-23' },
  { id:'A-08', group:'design', prov:'ASSUMED', screen:'Personal details', route:'#/details',
    assumed:'One emergency contact is required; a second is optional.',
    resolve:'No source specifies how many. One required is the common minimum.', oi:'OI-19' },
  { id:'A-11', group:'design', prov:'ASSUMED', screen:'Task list', route:'#/',
    assumed:'The banking card carries no date. It says only “Payroll will be in touch.”',
    resolve:'Three sources place direct deposit at three different times, and legal review is outstanding in two countries. Showing no date is more honest than picking one. The exclusion is confirmed as intended.', oi:'OI-03' },
  { id:'A-15', group:'design', prov:'ASSUMED', screen:'Introduction', route:'#/intro',
    assumed:'A 500-character limit and three optional prompt chips.',
    resolve:'No limit is specified anywhere; one is needed because the text becomes a team post. The prompts address blank-page hesitation.', oi:'OI-12' },
  { id:'A-16', group:'design', prov:'ASSUMED', screen:'Introduction + photo', route:'#/intro',
    assumed:'One card, two independently completable sections.',
    resolve:'Merge call from the spec, following the pattern the PRD sets for equipment and software: display together, track separately.', oi:'' },
  { id:'A-18', group:'design', prov:'ASSUMED', screen:'Badge photo', route:'#/intro',
    assumed:'One consent naming the badge, the internal directory and the Teams profile.',
    resolve:'The photo is intended to serve other profile surfaces, which is broader than a badge. No consent wording exists in any source, so Privacy needs to draft it.', oi:'OI-14' },
  { id:'A-21', group:'design', prov:'ASSUMED', screen:'Task list', route:'#/',
    assumed:'Information governance appears under “Coming up” as a first-week item.',
    resolve:'It is the one compliance document placed at Week 1, with no rationale recorded. Shown but not actionable, so the placement is visible and arguable.', oi:'OI-05' },
  { id:'A-24', group:'design', prov:'ASSUMED', screen:'Multiple screens', route:'#/policies',
    assumed:'Acknowledgement checkboxes are disabled until the document has been read to the end.',
    resolve:'The PRD sets this pattern for the offer letter but does not extend it. Applying it consistently is the defensible reading.', oi:'' },
  { id:'A-25', group:'design', prov:'ASSUMED', screen:'Task list', route:'#/',
    assumed:'Progress = tasks complete out of tasks assigned, plus a phase strip. The invented four milestones are gone, replaced by the live portal’s five phases. See A-44.',
    resolve:'The requirement is for a progress tracker; no source defines its model. Two levels show immediate progress and overall position.', oi:'' },
  { id:'A-26', group:'design', prov:'ASSUMED', screen:'All screens (platform)', route:null,
    assumed:'The ServiceNow object structure is not represented in this prototype.',
    resolve:'Whether these are catalog items, record producers or lifecycle-event activities changes the build, not the design.', oi:'OI-21', nolink:true },
  { id:'A-27', group:'design', prov:'ASSUMED', screen:'Job description', route:'#/jd',
    assumed:'The dissent path mirrors the offer-letter “report an issue” pattern and puts the task into an Under review state.',
    resolve:'The PRD defines this pattern for a wrong offer letter, not the job description. Reusing it is consistent; the routing target needs confirming.', oi:'' },
  { id:'A-28', group:'design', prov:'ASSUMED', screen:'All screens', route:'#/',
    assumed:'Built for laptop only. No mobile layouts.',
    resolve:'Revisit this before build for the IBX technician persona, who may be more phone-reliant than a desk hire. Analytics from the current portal would settle it.', oi:'' },
  { id:'A-31', group:'design', prov:'PRIOR', screen:'People rail', route:'#/',
    assumed:'The onboarding buddy is visible from the moment they are assigned, with role, timezone and who chose them.',
    resolve:'An earlier proposal surfaced the buddy 72 hours before the start date. Showing them from assignment gives the new hire someone to talk to during the quiet weeks. Confirm what the buddy programme intends.', oi:'' },
  { id:'A-32', group:'design', prov:'PRIOR', screen:'People rail', route:'#/',
    assumed:'The hiring manager is contactable from the portal before Day 1, by Teams and email.',
    resolve:'Confirm the manager expects to be reachable this early, and that Teams reaches them before the new hire has an Equinix account.', oi:'' },
  { id:'A-33', group:'design', prov:'1:1', screen:'Task list', route:'#/',
    assumed:'Equipment opens immediately and is the earliest of the provisioning tasks. Confirming the start date and launching the background check now sit ahead of it, because both are triggered at offer acceptance.',
    resolve:'Nothing gates equipment today. The “when your role and location are confirmed” gate does not exist, because nobody performs that confirmation. Confirm the earliest date an accessories order can usefully be placed.', oi:'' },
  { id:'A-35', group:'design', prov:'UAT', screen:'Good to know', route:'#/',
    assumed:'ANSWERED, and now filled with the real thing. Six chapters from the live Inside Equinix site, with their real titles, headlines and content. Chapter 03 is “What we do”, not the “Our business” this prototype previously guessed at. No tasks, nothing tracked.',
    resolve:'The requirement settles the three-way question: it is both the carousel and the rail link, and it is not a task. The same content also appears in orientation and in the manager’s weekly list, so the remaining question is whether that is reinforcement or repetition. The chapter content is no longer placeholder, but the videos are named rather than embedded.', oi:'' },
  { id:'A-36', group:'design', prov:'UAT', screen:'Good to know', route:'#/',
    assumed:'The first-90-days checklists are parked as reference only, not as tick-off items.',
    resolve:'The parking decision stands, but the original worry is answered: the platform has a Required/Optional filter natively and already ships optional items as “No due date, optional”. Revisit whether tick-off is now cheap.', oi:'' },
  { id:'A-38', group:'design', prov:'UAT', screen:'Equipment', route:'#/equipment',
    assumed:'Shipping defaults to the office address, derived from role and location, with an explicit option to ship home instead. A shipping phone number is required.',
    resolve:'Replaces the retired A-09, and UAT confirms the form verbatim: the office address block, the “Ship to the office address?” radio with “Yes, ship to the address above” and “No, ship to me directly”, and the required phone number with country code. Still open: whether the office-address lookup exists for every location, and what happens for fully remote hires with no office.', oi:'' },
  { id:'A-40', group:'design', prov:'1:1', screen:'Task list', route:'#/',
    assumed:'The mobile phone is a Day 1 optional to-do, not a pre-Day 1 task.',
    resolve:'Matches the live portal’s placement. Confirm nothing in the pre-Day 1 flow depends on the phone existing.', oi:'' },
  { id:'A-44', group:'design', prov:'UAT', screen:'Task list', route:'#/',
    assumed:'The five phase names are taken verbatim from the live portal: Get ready for Day 1, Final preparations for Day 1, Your first day, Your first week, Your first month.',
    resolve:'Adopted, not invented, so the prototype does not compete with a mental model new hires already meet. Confirm the names are stable.', oi:'' },
  { id:'A-45', group:'design', prov:'1:1', screen:'All screens', route:'#/',
    assumed:'Start dates are bimodal. Many hires get about two weeks, some start three months out. Both are viewable from the prototype controls.',
    resolve:'The distribution is on the onboarding dashboard, so pull it instead of guessing. A list that works at fourteen days can feel empty and confusing at ninety.', oi:'' },

  { id:'A-49', group:'blocks', prov:'PRD', screen:'Confirm your start date', route:'#/startdate',
    assumed:'Confirming the start date is its own required task, and requesting a change moves every other due date with it.',
    resolve:'The future-state workflow carries this as a separate required task that “updates dependent due dates and tasks”. It was missing from the earlier prototype. What nobody has defined: who approves a change, how far it can move, and what happens to work already in flight, such as equipment on order or a badge queued for print.', oi:'' },
  { id:'A-50', group:'design', prov:'PRD', screen:'Background check', route:'#/bgcheck',
    assumed:'The background check is launched by the new hire from the portal, with status shown here afterwards.',
    resolve:'The source has this as a required task with an action, not the passive status card the earlier prototype showed. Country treatments and the status integration are both unconfirmed.', oi:'' },
  { id:'A-51', group:'content', prov:'CURRENT', screen:'Compliance pack', route:'#/policies',
    assumed:'The reference pack the live process sends today is shown alongside the acknowledgement pack, with its real size.',
    resolve:'A US hire currently receives 28 documents in one bundle whichever state they work in: the handbook, 25 state addenda, the benefits booklet and a compliance service. Across all countries the process serves 416 document instances. Which of those survive pre-Day 1, which move later and which retire is the single largest open decision in this workstream.', oi:'' },

  { id:'A-52', group:'blocks', prov:'PRIOR', screen:'Readiness tracker', route:'#/',
    assumed:'Readiness is shown as two trackers, one inside the other. The outer stepper covers every owner. Opening a step shows that item’s own fulfilment stages, and where it is stuck.',
    resolve:'The outer level is adopted from the hiring manager mockup v6.1, which tracks the whole readiness checklist rather than only manager tasks. The inner stages are only partly evidenced: the ServiceNow request, the routing to IT Procurement, the 5 to 7 day lead time and the automatic loaner are all stated there, and the rest is proposed. Whoever owns each fulfilment queue has to confirm the real stages and whether their status can be read at all.', oi:'' },
  { id:'A-53', group:'blocks', prov:'PRIOR', screen:'Equipment', route:'#/equipment',
    assumed:'CONFLICT, unresolved. This prototype has the new hire choosing accessories before Day 1. The manager mockup has peripherals and accessories ordered by the new hire on Day 1, through IT self-service.',
    resolve:'Both cannot be right, and the difference is a fortnight of shipping time. Pre-Day 1 means the desk is complete on the first morning. Day 1 self-service means it is not. Decide which, because the accessories task is the earliest thing on the new hire’s list today.', oi:'' },

  { id:'A-54', group:'design', prov:'UAT', screen:'Equipment', route:'#/equipment',
    assumed:'The equipment screens follow the live HR case: both people named as “Name (username)” with the employment start date and the manager’s email above the table, status written as a full sentence quoting the task that unblocks it, and the incident shown with its Activity, Attachments and Summary tabs.',
    resolve:'Taken from the UAT screens rather than invented, so the future state does not quietly drop wording people already recognise. Two things to settle: the live status line for the phone reads “To place an order for a mobile phone new hire, Alp Basol (abasol), must complete” and is missing an article, and the case shows a photo for the manager but initials for the new hire. Both are small, and both are easier to fix before the push to production than after.', oi:'' },
  { id:'A-55', group:'blocks', prov:'UAT', screen:'Equipment', route:'#/equipment',
    assumed:'The accessories order is raised as an incident at Urgency 3 - Low, and its Summary tab shows the stored record rather than a written summary: checkbox values render as true and false, the HR task SysID is on display, and the accessories choice is stored as the sentence “Headset and other accessories”.',
    resolve:'Two separate problems. Urgency: nothing ships until this incident is worked, and the desk is incomplete on Day 1 if it is not, so Low is the wrong default for an order with a hard date behind it. Confirm whether urgency is derived from the start date at all. Summary: it is readable by someone who knows the form and confusing to a new hire checking their own order, which is exactly who has the tab open. Neither needs a redesign, both need a decision before this reaches production.', oi:'' },

  /* ---------- Retired: observation answered the question ---------- */
  { id:'A-09', group:'retired', prov:'UAT', screen:'Personal details / Equipment', route:'#/equipment',
    assumed:'Was: home address is captured once on Tab 1 and reused for equipment delivery, with the equipment task holding the editable copy.',
    resolve:'Retired. The direction was wrong. Shipping defaults to the office address, derived from role and location, so the equipment task never waits on personal details. The Tab 1 “ship here” checkbox is gone. Replaced by A-38; workbook item OI-28 closes.', oi:'OI-09 closed' },
];

const GROUP_LABELS = {
  blocks: { label: 'Blocks build', hint: 'Must be answered before development' },
  content: { label: 'Content needed', hint: 'Mechanism is right. Someone has to supply the real text or values' },
  design: { label: 'Design choice', hint: 'Defensible, could reasonably go the other way' },
  retired: { label: 'Retired, answered by observation', hint: 'Was a guess; watching the live portal settled it. Marker removed from the screen.' },
};

const PROV_LABELS = {
  UAT: 'Seen in the live UAT portal',
  PRD: 'Specified in the requirements (v1.4)',
  CURRENT: 'Measured from the live Workday process',
  '1:1': 'Stated by the platform owner',
  PRIOR: 'Agreed in the earlier change request',
  ASSUMED: 'Still a judgement call',
};

/* ---------- Open before build (§10) ---------- */
const OPEN_BEFORE_BUILD = [
  'Is the manager’s “Order equipment for new hire” task the one being redesigned for the laptop-and-accessory MVP? If so, the confirm-versus-order question is being answered elsewhere, and this screen should follow that decision, not lead it.',
  'The PEX document-sequencing work reportedly already specifies which documents come early and which come late. That would settle most of A-29 and A-30 without guessing.',
  'Start-date distribution from the onboarding dashboard: the real spread behind A-45.',
  'What is actually inside “Collect your Equinix credentials”? It is a new-hire to-do due one day before start, which complicates the story that managers currently hand over usernames and passwords.',
  'IBX badge request: covered by the badge photo task or not? Until that is settled, the photo task is neither merged nor split. (A-47 is reserved if it needs its own entry.)',
];

/* ---------- Job description placeholder (A-13) ---------- */
const JD_TEXT = `
<h4>Purpose of the role</h4>
<p>You'll help the Global FP&amp;A team understand how the business is performing and where it's heading. That means building the monthly forecast, explaining the variances that matter, and giving leaders numbers they can act on, clearly and on time.</p>
<h4>What you'll do</h4>
<ul>
<li>Own the monthly forecast and variance analysis for your business areas, including commentary that explains why, not only what.</li>
<li>Build and maintain planning models for revenue, operating expense and headcount.</li>
<li>Partner with Accounting during close to make sure actuals land where the forecast expected them to.</li>
<li>Prepare the monthly review pack for Finance leadership, and present your areas when asked.</li>
<li>Support the annual planning cycle: targets, submissions, consolidation and the inevitable late changes.</li>
<li>Improve how the team works: better models, fewer manual steps, clearer outputs.</li>
</ul>
<h4>Who you'll work with</h4>
<p>You'll report to Priya Anand and sit within Global FP&amp;A. Day to day you'll work with business partners across the region, the Accounting close team, and the other analysts covering neighbouring portfolios. Expect a mix of scheduled rhythm (close, forecast, planning) and ad-hoc questions from leadership.</p>
<h4>What you'll bring</h4>
<ul>
<li>Solid experience in FP&amp;A, corporate finance or a similar analytical role.</li>
<li>Comfort building and defending a forecast, and explaining it to people who don't live in spreadsheets.</li>
<li>Fluency in Excel; familiarity with a planning tool (Anaplan, Adaptive or similar) helps.</li>
<li>A habit of making things clearer, not only more detailed.</li>
</ul>
<p><em>This is placeholder content for layout and reading-length testing. The real job description comes from the official record.</em></p>
`;

/* ---------- Compliance documents ---------- */
const FILLER = [
  'This is placeholder policy text, shown so the reading and acknowledgement flow can be tested at a realistic length. The real document is owned by Legal and served with version control.',
  'It stands in for several paragraphs of real policy content: definitions of the terms the policy uses, the scope it applies to, the obligations that fall on you as an employee, and the situations where those obligations change.',
  'A real policy would carry the substance here: what is required, what is prohibited, what needs approval, and who grants it. It would also name the owner of the policy and how often it is reviewed.',
  'Nothing in this text is a real Equinix policy statement. Invented compliance language would be worse than an obvious gap, so this text stays generic on purpose.',
  'It would close with where to go with questions: the policy owner, your manager once you have one, or the People Experience team during pre-boarding.',
  'When the real content is loaded, this section will carry the approved wording, its version number and the language served, all recorded against your acknowledgement.',
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
  <p style="font-size:12.5px; font-weight:350; margin-bottom:6px;">Additional provisions on copyright, workplace monitoring and personal devices apply in Japan. They sit here inside the global policy instead of arriving as a separate document, so you acknowledge once and cover both.</p>
  <p style="font-size:12px; color:var(--carbon); font-weight:350;"><em>Illustrative content. The real addendum is pending legal review.</em></p>
`;

/* ---------- Identity / right-to-work documents (A-29, A-30) ---------- */
const ID_DOCS = {
  US: [
    { v:'US passport', shoot:'Photograph the photo page, the one with your picture and the machine-readable strip at the bottom.' },
    { v:'Driver’s licence and Social Security card', shoot:'Photograph both sides of your licence, and the front of your Social Security card.' },
    { v:'Permanent resident card', shoot:'Photograph both sides of the card.' },
  ],
  JP: [
    { v:'My Number card (個人番号カード)', shoot:'Photograph the front only, the side with your photo. Not the back.' },
    { v:'Residence card (在留カード)', shoot:'Photograph both sides. The front carries your photo, the back your status.' },
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
   In v3 this is the pool the MANAGER picks from on H-11. The reason text
   is a suggested draft the manager edits. The disposition for this task is
   "reduce to accepting a suggestion". Slot times are derived from the start
   date in app.js, so they stay plausible on both runways (A-45). */
const NETWORK_POOL = [
  { name:'Aisha Bello', initials:'AB', role:'Manager, Corporate Accounting', dept:'Controllership',
    suggested:true, why:'Your forecast lands against her actuals every close. Better to meet her before your first month-end than during it.' },
  { name:'Ravi Menon', initials:'RM', role:'Director, Revenue Operations', dept:'Go-to-market',
    suggested:true, why:'He owns the bookings data your revenue forecast starts from. If a number looks wrong, he usually knows why first.' },
  { name:'Elena Duarte', initials:'ED', role:'Senior Manager, IBX Finance', dept:'Operations Finance',
    suggested:true, why:'Your portfolios overlap on the Americas cost base. She’ll save you a fortnight of working out who owns what.' },
  { name:'Tom Byrne', initials:'TB', role:'Business Partner, Sales Finance', dept:'Commercial Finance',
    suggested:true, why:'He brings the commercial context behind the numbers you’ll be asked to explain in the monthly review.' },
  { name:'Grace Lim', initials:'GL', role:'Manager, FP&A Systems', dept:'Finance Systems',
    suggested:true, why:'She runs the planning tool you’ll live in. Thirty minutes with her early saves a lot of guessing later.' },
];

/* ---------- Inside Equinix (A-35) ----------
   PRD v1.4 asks for a carousel at the top of the portal rotating chapters
   01-06, plus a link in the right-hand rail. No tasks, nothing tracked.
   Chapter titles are real; the one-line summaries are placeholder. */
/* The rail link lists the same six chapters as the showcase, so there is one
   source for the titles. */
function insideModules() { return INSIDE_CHAPTERS.map(c => `${c.n} ${c.title}`); }
/* ---------- Inside Equinix showcase art (A-35) ----------
   Built to the brand illustration system: isometric and flat shapes,
   linear gradients only, adjacent hues, thin light wireframes, and
   nothing on the canvas that is not carrying the idea. */
const CHAPTER_ART = [
  { g:['#411980','#086AE3'], art:`
    <g stroke="rgba(255,255,255,.85)" stroke-width="1.6" fill="none">
      <path d="M200 46 L268 86 L268 166 L200 206 L132 166 L132 86 Z"/>
      <path d="M200 46 L200 206 M132 86 L268 166 M268 86 L132 166"/>
    </g>
    <g opacity=".95">
      <path d="M200 86 L234 106 L234 146 L200 166 L166 146 L166 106 Z" fill="url(#f1)"/>
      <path d="M200 86 L234 106 L200 126 L166 106 Z" fill="rgba(255,255,255,.55)"/>
    </g>
    <circle cx="200" cy="126" r="7" fill="#85F0F8"/>` },

  { g:['#00408C','#00737A'], art:`
    <g fill="url(#f1)" opacity=".95">
      <path d="M96 150 L156 118 L216 150 L156 182 Z"/>
      <path d="M184 106 L244 74 L304 106 L244 138 Z" opacity=".8"/>
      <path d="M150 196 L210 164 L270 196 L210 228 Z" opacity=".65"/>
    </g>
    <g stroke="rgba(255,255,255,.9)" stroke-width="1.5" fill="none">
      <path d="M156 150 L244 106 M156 150 L210 196 M244 106 L210 196"/>
      <circle cx="156" cy="150" r="6"/><circle cx="244" cy="106" r="6"/><circle cx="210" cy="196" r="6"/>
    </g>` },

  { g:['#00737A','#2A8346'], art:`
    <g>
      <path d="M104 190 L134 174 L164 190 L134 206 Z" fill="rgba(255,255,255,.5)"/>
      <path d="M104 190 L104 206 L134 222 L134 206 Z" fill="url(#f1)"/>
      <path d="M164 190 L164 206 L134 222 L134 206 Z" fill="rgba(255,255,255,.28)"/>

      <path d="M156 166 L194 144 L232 166 L194 188 Z" fill="rgba(255,255,255,.55)"/>
      <path d="M156 166 L156 194 L194 216 L194 188 Z" fill="url(#f1)"/>
      <path d="M232 166 L232 194 L194 216 L194 188 Z" fill="rgba(255,255,255,.3)"/>

      <path d="M218 132 L264 106 L310 132 L264 158 Z" fill="rgba(255,255,255,.6)"/>
      <path d="M218 132 L218 174 L264 200 L264 158 Z" fill="url(#f1)"/>
      <path d="M310 132 L310 174 L264 200 L264 158 Z" fill="rgba(255,255,255,.32)"/>
    </g>
    <path d="M104 174 L264 84" stroke="#85F0F8" stroke-width="2" fill="none" stroke-dasharray="7 7"/>` },

  { g:['#A20238','#F55200'], art:`
    <g fill="none" stroke="rgba(255,255,255,.85)" stroke-width="1.6">
      <circle cx="200" cy="126" r="86"/><circle cx="200" cy="126" r="62"/>
    </g>
    <g>
      <path d="M200 126 L200 40 A86 86 0 0 1 274 84 Z" fill="url(#f1)" opacity=".9"/>
      <path d="M200 126 L274 168 A86 86 0 0 1 126 168 Z" fill="rgba(255,255,255,.55)"/>
      <path d="M200 126 L126 84 A86 86 0 0 1 200 40 Z" fill="rgba(255,255,255,.28)"/>
    </g>
    <circle cx="200" cy="126" r="20" fill="#FEDC86"/>` },

  { g:['#200430','#7739D9'], art:`
    <path d="M40 214 L200 128 L360 214" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1.6"/>
    <path d="M40 214 L200 128 L360 214 L200 236 Z" fill="url(#f1)" opacity=".55"/>
    <g fill="#85F0F8">
      <path d="M110 176 L124 168 L138 176 L138 190 L124 198 L110 190 Z" opacity=".9"/>
      <path d="M186 134 L202 125 L218 134 L218 152 L202 161 L186 152 Z"/>
      <path d="M268 176 L282 168 L296 176 L296 190 L282 198 L268 190 Z" opacity=".7"/>
    </g>
    <path d="M124 176 L202 142 L282 176" fill="none" stroke="rgba(255,255,255,.9)" stroke-width="1.6"/>` },

  { g:['#00408C','#411980'], art:`
    <g stroke="rgba(255,255,255,.42)" stroke-width="1.3" fill="none">
      <path d="M96 132 L132 112 L168 132 L132 152 Z M168 132 L204 112 L240 132 L204 152 Z M240 132 L276 112 L312 132 L276 152 Z"/>
      <path d="M132 172 L168 152 L204 172 L168 192 Z M204 172 L240 152 L276 172 L240 192 Z"/>
      <path d="M132 92 L168 72 L204 92 L168 112 Z M204 92 L240 72 L276 92 L240 112 Z"/>
    </g>
    <g>
      <path d="M168 132 L204 112 L240 132 L204 152 Z" fill="rgba(255,255,255,.6)"/>
      <path d="M168 132 L168 162 L204 182 L204 152 Z" fill="url(#f1)"/>
      <path d="M240 132 L240 162 L204 182 L204 152 Z" fill="rgba(255,255,255,.3)"/>
    </g>
    <circle cx="204" cy="132" r="6" fill="#85F0F8"/>` },
];

/* Chapter titles, headlines and content come from the live Inside Equinix
   site. Chapter 03 is "What we do", not the "Our business" an earlier version
   of this prototype guessed at. Every chapter there closes with a reflection
   prompt pointing at the manager or buddy conversation, which is the part
   that reaches back into this portal (L-12). */
const INSIDE_CHAPTERS = [
  { n:'01', title:'Who we are',
    head:'You’ve joined a team that connects much more than technology.',
    line:'We connect people with opportunity, and businesses with the digital infrastructure they need to grow. It started with a belief that the internet should be neutral, open and reliable for everyone, and that belief still shapes how we build.',
    facts:[['1998','Founded'],['13,600+','Employees'],['10,000+','Customers'],['36','Countries'],['76','Markets']],
    watch:'Welcome to Equinix, with Adaire Fox-Martin, CEO and President',
    reflect:['What part of our story speaks to you most?','How do you see yourself contributing to what’s next?'] },

  { n:'02', title:'How we work',
    head:'Our Values guide how we show up in our work and with each other.',
    line:'Our strength is being able to care deeply and pursue excellence at the same time. Five values, each with a short film from someone who lives it.',
    list:['Foster belonging','Create clarity always','Keep customers at the center','Take accountability','Adapt with speed'],
    watch:'How we live our values, with Brandi Galvin Morandi, Chief People Officer',
    reflect:['Which value feels most natural to you?','Which one do you want to grow into?'] },

  { n:'03', title:'What we do',
    head:'You might be wondering: so what exactly do we do?',
    line:'A short film on how our work makes everyday experiences possible, and helps businesses everywhere move faster, safer and smarter.',
    watch:'Equinix 101, four minutes',
    reflect:['How would you explain what Equinix does to a friend?','What part of the business story helped you get it?'] },

  { n:'04', title:'What we enable',
    head:'Around the world, every day, people rely on Equinix, though they may not know it.',
    line:'Freeze a single minute anywhere on the globe and connections are being made, businesses are growing, lives are changing. Six of those stories, plus how to get involved through the Equinix Foundation.',
    list:['Globalizing school curricula, São Bernardo do Campo','Making the job market more fluid, Lagos','Powering carbon neutral communities, Helsinki','Traveling to see loved ones, Mumbai','Increasing crop yield, Bandung','Getting a faster diagnosis, Sydney'],
    watch:'One Minute In, impact stories',
    reflect:['Which story of our impact made you proud or surprised?','What kind of impact do you want your work to have?'] },

  { n:'05', title:'Our road ahead',
    head:'Equinix is built for this moment.',
    line:'By 2030 we intend to be the leading technology infrastructure company of the 21st century. The strategy is where that ambition meets action, and it runs on five moves.',
    list:['Serve better','Solve smarter','Build bolder','Run simpler','Grow together'],
    reflect:['What is one thing you’re most excited to help make possible here?','What is one strength you bring that can help others succeed?'] },

  { n:'06', title:'Your role',
    head:'You are the catalyst for what’s next.',
    line:'Equinix is built on connection, and now you’re part of shaping where it goes from here. Bring your curiosity, your care and your ideas.',
    watch:'Your role in shaping what comes next, with Adaire Fox-Martin',
    reflect:['What sparked a question you want to bring to your first week?'] },
];

/* Verbatim from the site, and the reason the reflection prompts matter here:
   they are written to be picked up in a conversation, not stored in a form. */
const REFLECT_NOTE =
  'Capture your thoughts, including any questions or areas where you want to learn more. ' +
  'You will revisit these in your upcoming conversation with your manager or onboarding buddy.';

/* ---------- Readiness tracker, two levels (A-52 / M-22) ----------
   The hiring manager mockup v6.1 tracks the whole hiring readiness checklist,
   not only the manager's own tasks: their tasks plus PEX, IT fulfilment and
   badge or workspace items, each carrying its own status. That is two
   trackers, one inside the other, so it is built as two.

   Outer steps are adopted from that mockup. The inner fulfilment stages are
   the part that is only partly evidenced: the ServiceNow request, the routing
   to IT Procurement, the 5 to 7 day lead time and the automatic loaner are
   all stated there. Everything else in the stage lists is proposed. */
const READINESS = [
  { id:'equipment', label:'Equipment', icon:'laptop.svg', sys:'ServiceNow',
    owners:'The manager, the new hire and End User Technology',
    stages:[
      { label:'Order placed',        note:'The computer is the manager’s order. Accessories are the new hire’s.' },
      { label:'With IT Procurement', note:'A request is raised and routed. Lead time runs 5 to 7 business days.' },
      { label:'Built and imaged',    note:'Standard build for the role, then the image is applied.' },
      { label:'Shipped',             note:'To the office address, unless the new hire asked for it at home.' },
      { label:'Waiting on the desk', note:'If this would miss Day 1, a loaner is issued automatically.' },
    ] },
  { id:'apps', label:'Applications', icon:'portal-window.svg', sys:'ServiceNow',
    owners:'The manager and IT',
    stages:[
      { label:'Persona resolved',   note:'The role decides the default stack. No persona means no default.' },
      { label:'Stack confirmed',    note:'The manager confirms the defaults and adds anything role-specific.' },
      { label:'Licences requested', note:'Each application raises its own request and carries its own status.' },
      { label:'Active on Day 1',    note:'Access switches on with the start date, not before.' },
    ] },
  { id:'workspace', label:'Badge and workspace', icon:'id-card.svg', sys:'Workplace Services',
    owners:'The new hire, the manager and Workplace Services',
    stages:[
      { label:'Photo submitted',  note:'The new hire uploads it. Badge print needs the lead time.' },
      { label:'Site confirmed',   note:'The manager confirms the location, access level and parking.' },
      { label:'Badge queued',     note:'Access zones are set from the confirmed site.' },
      { label:'Ready at reception', note:'Collected on the first morning.' },
    ] },
  { id:'people', label:'People', icon:'users-friends.svg', sys:'Onboarding portal',
    owners:'The manager',
    stages:[
      { label:'Buddy chosen',     note:'From the team, and changeable up to three days before the start date.' },
      { label:'Buddy told',       note:'They are notified, including what being a buddy involves.' },
      { label:'Network named',    note:'The people outside the reporting line, with a reason for each.' },
      { label:'Introduction out', note:'The manager forwards it. Nothing is posted automatically.' },
    ] },
  { id:'paperwork', label:'Paperwork', icon:'file-alt.svg', sys:'Workday and HR Operations',
    owners:'The new hire, HR Operations and the background check provider',
    stages:[
      { label:'Start date confirmed', note:'Every other due date is anchored to it.' },
      { label:'Background check',     note:'Launched from the portal, then it runs elsewhere.' },
      { label:'Details submitted',    note:'Personal record, emergency contact and preferences.' },
      { label:'Policies acknowledged', note:'The pack the new hire has to read and sign off.' },
    ] },
];

/* ---------- What the live Workday process actually sends today (A-51) ----------
   Counts are from the current-state business process document list, not invented.
   The mockup's acknowledgement pack is the intended future core; this is the
   reference material that arrives alongside it today. */
const CURRENT_PACK = {
  US: { handbook:'US Employee Handbook (November 2024)',
        addenda:25, addendaNote:'state handbook addenda. Every US hire receives all of them, whichever state they work in',
        extras:['2026 Equinix U.S. Benefits Booklet','GovDocs'],
        total:28 },
  JP: { handbook:'就業規則, Japanese employment regulations (April 2025)',
        addenda:0, addendaNote:'',
        extras:['Japan-specific employment documents'],
        total:19 },
};

/* ---------- Corporate card (PRD v1.4) ---------- */
const CARD_FLOW = {
  managerQuestion: 'Will Jordan travel on behalf of Equinix and need a corporate card?',
  newHireTask: 'Equinix Corporate Card Request',
  timing: 'Day 2, after they start rather than before',
  mechanics: [
    'You answer yes or no before Jordan starts.',
    'If yes, a task appears for Jordan on Day 2: review the user agreement and sign it electronically.',
    'Completed agreements are extracted weekly to Accounts Payable.',
    'Accounts Payable submit the file to Citi, who send Jordan an application link directly.',
  ],
  note: 'Citi cannot host the agreement, so it lives in an Equinix system. Contingent workers are out of scope.',
};

/* ---------- Coming up ---------- */
const COMING_UP = [
  { name:'Benefits enrolment', opens:'30 days before you start',
    note:'Shows what you’ll qualify for and when coverage begins', icon:'shield-check.svg',
    expl:'Benefits enrolment opens 30 days before your start date. It will show what you qualify for and when coverage begins, so there’s nothing to prepare now.' },
  { name:'Equipment setup instructions', opens:'3 days before you start', note:'', icon:'portal-window.svg',
    expl:'Once your equipment ships, setup instructions land here 3 days before you start, so they’re fresh when the box is.' },
  { name:'Your first day details', opens:'3 days before you start',
    note:'Where to go, who to ask for, what to bring', icon:'calendar.svg',
    expl:'Where to go, who to ask for, what to bring. It arrives 3 days before your start so the details are final, not provisional.' },
  { name:'Collect your Equinix credentials', opens:'1 day before you start',
    note:'', icon:'lock.svg',
    expl:'A to-do in the live portal, due the day before you start. Nobody has documented what is in it, which is worth pinning down: it sits awkwardly beside the current practice of managers handing over sign-in details.' },
  { name:'Order a phone', opens:'Day 1, optional', note:'If your role needs one', icon:'mobile.svg', marker:'A-40',
    expl:'A mobile phone is ordered on or after Day 1, and only if your role needs one. Keeping it out of pre-boarding is a choice, not an oversight.' },
  { name:'Complete your at-home workspace setup', opens:'No due date, optional', note:'', icon:'desktop.svg',
    expl:'An optional to-do with no due date, exactly as the live portal ships it. It is here so you can see how optional items behave. Nothing is waiting on you.' },
  { name:'Information governance', opens:'Your first week', note:'', icon:'file-alt.svg', marker:'A-21',
    expl:'This one happens in your first week, once you have your Equinix account. It covers how we handle information while you work here.' },
];

/* ============================================================
   v3: the hiring manager side
   Sourced from HM_Pre_Day_1_Portal_UI_Spec.xlsx. The design problem
   on this side is subtraction: several screens exist in order to be
   argued out of existence, so every manager task carries a disposition.
   ============================================================ */

/* Two more people the manager can pick for the network (so H-11 is a real choice) */
NETWORK_POOL.push(
  { name:'Yusuf Demir', initials:'YD', role:'Manager, Treasury', dept:'Corporate Finance',
    suggested:false, why:'' },
  { name:'Priyanka Rao', initials:'PR', role:'Senior Analyst, Investor Relations', dept:'Finance',
    suggested:false, why:'' },
);

const MANAGER = {
  name: 'Priya Anand', initials: 'PA', role: 'Director, FP&A',
  username: 'panand',
  workPhone: '+1 303 555 0188', email: 'priya.anand@equinix.com',
};

/* M-13: more than one concurrent hire. The second is read-only,
   only Jordan has a new-hire side in this prototype. */
const HIRES = [
  { id:'jordan', name:'Jordan Reyes', initials:'JR', role:'Senior Financial Analyst',
    loc:'Denver, Colorado', arrangement:'Hybrid', interactive:true },
  { id:'sofia', name:'Sofia Marchetti', initials:'SM', role:'IBX Technician',
    loc:'Amsterdam (AM4)', arrangement:'On-site', interactive:false,
    startsIn:28, note:'Shown so the multi-hire view is visible. Not interactive in this prototype.' },
];

/* Task dispositions: the subtraction review, verbatim in intent from the workbook */
const DISPOSITIONS = {
  keep:      { label:'Keep',            cls:'keep',      hint:'Genuinely requires manager judgement' },
  reduce:    { label:'Exception-only',  cls:'reduce',    hint:'Visible, but most managers should never touch it' },
  automate:  { label:'Automate away',   cls:'automate',  hint:'The outcome is still needed, the manager action is not' },
  remove:    { label:'Remove',          cls:'remove',    hint:'This task should not exist in the future state' },
  undecided: { label:'Undecided',       cls:'undecided', hint:'Cannot be dispositioned yet' },
  add:       { label:'Adds work',       cls:'add',       hint:'The only proposal that increases manager load' },
};

/* Buddy pool for H-07. Load counts make the capacity warning demonstrable (M-07). */
const BUDDY_POOL = [
  { id:'nina', name:'Nina Kowalski', initials:'NK', role:'Senior Financial Analyst',
    tz:'Chicago (CT)', load:1, suggested:true },
  { id:'marcus', name:'Marcus Webb', initials:'MW', role:'Senior Financial Analyst',
    tz:'Denver (MT)', load:3, suggested:false },
  { id:'dana', name:'Dana Kim', initials:'DK', role:'Financial Analyst II',
    tz:'Denver (MT)', load:0, suggested:false },
  { id:'tomas', name:'Tomás Rivera', initials:'TR', role:'Senior Financial Analyst',
    tz:'Denver (MT)', load:2, suggested:false },
];
const BUDDY_LOAD_LIMIT = 3;   // policy P-05 is undefined, so this number is invented (M-07)

/* Computer options for H-04. Catalogue is owned elsewhere (M-01 / OI-24). */
const COMPUTER_OPTIONS = [
  { id:'win-std', label:'Standard Windows laptop', lead:'In stock, 3 days', ok:true },
  { id:'mac', label:'MacBook Pro', lead:'Backordered, 18 days', ok:false },
  { id:'win-hp', label:'High-performance Windows laptop', lead:'In stock, 5 days', ok:true },
];

/* Default software stack for H-05. Cannot resolve without a persona (M-04 / OI-04) */
const SOFTWARE_CATALOG = [
  'Anaplan', 'Tableau', 'Power BI', 'Alteryx', 'Workday Adaptive Planning',
  'Bloomberg Terminal', 'Salesforce', 'Coupa',
];

/* Day 1 calendar holds for H-08 (M-06) */
const DAY1_HOLDS = [
  { id:'oneToOne', label:'Pick up your new hire, 1:1', time:'12:00 to 13:00',
    auto:true, locked:true, note:'Automatically placed, one hour, immediately after the cohort lunch. You can reschedule it, but not delete it.' },
  { id:'nho', label:'New Hire Orientation', time:'09:00 to 12:00',
    auto:true, blueprint:true, note:'From the orientation blueprint for your location. PEX owns it, so you cannot move it.' },
  { id:'teamIntro', label:'Team introduction', time:'14:00 to 14:30', auto:false },
  { id:'buddy', label:'Buddy check-in', time:'15:00 to 15:30', auto:false },
  { id:'itSetup', label:'IT setup window', time:'15:30 to 16:30', auto:false },
];

/* Teams channels and distribution lists for H-12 */
const CHANNEL_SUGGESTIONS = [
  'Global FP&A, team channel', 'Finance All-Hands, distribution list',
  'FP&A Analysts, Teams channel', 'Denver Office, distribution list',
];

/* Welcome email boilerplate for H-10 (M-08) */
const WELCOME_BOILERPLATE =
`Hi Jordan,

Welcome to Equinix. I'm glad you're joining us.

Before your first day you'll get access to an onboarding portal with a short list of things to work through. Nothing there should take long, and it will tell you what's needed and by when.

If anything is unclear before you start, reply to this email and I'll pick it up.`;

/* The read-only block the system inserts, generated from the new hire's own task list (M-08) */
const WELCOME_SYSTEM_BLOCK_NOTE =
  'Generated from Jordan’s actual task list. You did not write it and you cannot edit it.';

/* ============================================================
   Manager-side (M) and connection (L) assumptions.
   Appended to the same register as the new hire's A-series so one
   panel covers both sides. `side` drives the panel filter.
   ============================================================ */
ASSUMPTIONS.forEach(a => { a.side = 'nh'; });

const HM_ASSUMPTIONS = [
  /* ---------- Blocks build ---------- */
  { id:'M-01', side:'hm', group:'blocks', prov:'UAT', screen:'Order the computer', route:'#/hm/computer',
    assumed:'The manager ORDERS the computer today. This is not a confirmation step, and nothing moves until they do it.',
    resolve:'Corrects the workbook’s own baseline, which described confirm-only per PRD S2-US14 AC2. That is the target state, not today’s. Confirm whether this task is already being redesigned inside the laptop-and-accessory MVP. If it is, this screen should follow that work.', oi:'OI-24' },
  { id:'M-02', side:'hm', group:'blocks', prov:'ASSUMED', screen:'Readiness view', route:'#/hm/',
    assumed:'The readiness score is shown as a plain completion ratio across all owners, with no weighting and no threshold.',
    resolve:'Composition, weighting and what counts as a good score are all undefined. A weighted number here would be invented, so the prototype shows only what it can actually compute and says so.', oi:'OI-02' },
  { id:'M-03', side:'hm', group:'blocks', prov:'ASSUMED', screen:'Readiness view', route:'#/hm/',
    assumed:'The manager sees the new hire’s task names and status, but never task content. Sensitive tasks report status only.',
    resolve:'The walkthrough’s cross-persona visibility principle and the Decision Log’s caution point in different directions, and the persona-by-section visibility matrix is unwritten. This is the conservative reading. Argue it before build.', oi:'OI-03' },
  { id:'M-04', side:'hm', group:'blocks', prov:'1:1', screen:'Software stack', route:'#/hm/software',
    assumed:'H-05 is drawn in its blocked state. The persona cannot be resolved, so the default stack is empty.',
    resolve:'No full personas list exists in ServiceNow; the job-family fallback under discussion is the approach the PRD analysis rejects as inaccurate. The screen is drawn the way it behaves today, not the way it should.', oi:'OI-04' },
  { id:'M-10', side:'hm', group:'blocks', prov:'1:1', screen:'Team network', route:'#/hm/network',
    assumed:'Naming the new hire’s network is net-new manager work, the only proposal here that adds load instead of removing it.',
    resolve:'Everything else on the disposition review subtracts. The case for it rests on a named new-hire failure, not knowing who to talk to, and on the fact that accepting a suggested list can be close to one tap. It needs an explicit decision.', oi:'OI-26' },
  { id:'M-11', side:'hm', group:'blocks', prov:'ASSUMED', screen:'Portal entry', route:'#/hm/subtraction',
    assumed:'There is no manager credential task. The manager enters by notification using the SSO they already hold, and the mockup names the channel: a Teams message from the onboarding assistant once the offer is accepted in Workday.',
    resolve:'The source row records itself as inferred from workflow analysis rather than drawn from a source, and its open question reads as pre-hire SSO logic applied to the wrong persona. Shown struck through so the removal is arguable instead of silent. Confirm no ServiceNow role or licence provisioning is hiding behind it.', oi:'OI-01' },

  /* ---------- Content needed ---------- */
  { id:'M-12', side:'hm', group:'retired', prov:'PRD', screen:'Corporate card', route:'#/hm/card',
    assumed:'Was: the corporate card is undecided and not built, because the source row was truncated.',
    resolve:'Superseded. The requirement now specifies the whole flow: a manager yes or no framed around travel, an e-signature task for the new hire on Day 2, a weekly extract to Accounts Payable, and an application link issued by the card provider. It is a manager decision after all, though not a universal entitlement, and the new hire’s half sits after they start. Built.', oi:'OI-06 closed' },
  { id:'M-19', side:'hm', group:'content', prov:'PRD', screen:'Corporate card', route:'#/hm/card',
    assumed:'The manager question is framed around travel, will this person travel on behalf of Equinix, instead of as a generic entitlement.',
    resolve:'That is the wording the requirement uses, and it is narrower than “does everyone get a card”. Two things the requirement itself leaves open: what the task is called in the portal, and whether cost centre and approver are captured alongside the yes.', oi:'OI-06' },
  { id:'M-20', side:'hm', group:'design', prov:'PRD', screen:'Start logistics', route:'#/hm/logistics',
    assumed:'Delegation is a standing capability, not a Day 1 field. A proxy can act on the manager’s behalf and see the new hire’s status, and People Experience need the same.',
    resolve:'Broader than the earlier version of this screen, which treated the proxy as cover for Day 1 only. What a proxy can actually see and do is still undefined, and the requirement gives the same capability to People Experience, who have no screens here at all.', oi:'OI-12' },
  { id:'M-21', side:'hm', group:'blocks', prov:'PRD', screen:'Team network / welcome note', route:'#/hm/network',
    assumed:'Both of these are drawn as new work, but the underlying platform may already provide them.',
    resolve:'The platform’s own onboarding module ships “select people to meet”, “select helpful contacts” and “customise a welcome memo”, surfaced on the new hire’s dashboard. Decide whether to use what exists or build alongside it before either screen is costed. It materially changes the argument that the network task adds manager work.', oi:'' },
  { id:'M-15', side:'hm', group:'content', prov:'ASSUMED', screen:'Manager guide', route:'#/hm/',
    assumed:'The Manager Onboarding Guide is one artifact with persona variants, persisting as a link in the rail.',
    resolve:'Unresolved whether this is the existing Manager Companion Guide, a superset of it, or something new. The two are scoped differently and there is no settled terminology.', oi:'OI-07' },
  { id:'M-17', side:'hm', group:'content', prov:'ASSUMED', screen:'Order the computer', route:'#/hm/computer',
    assumed:'Three laptop options with invented lead times, one of them backordered so the late-delivery warning is visible.',
    resolve:'The real catalogue, its options, its regional variants and its actual lead times belong to the EUT team. These values are illustrative.', oi:'' },

  /* ---------- Design choice ---------- */
  { id:'M-05', side:'hm', group:'design', prov:'ASSUMED', screen:'Start logistics', route:'#/hm/logistics',
    assumed:'The orientation blueprint is authoritative. Location facts are read-only; the manager only supplies what the blueprint cannot know.',
    resolve:'The workflow file asks when manager-provided details should override the blueprint. Read-only is the conservative default. If override is intended, the UI has to make precedence visible, or the two sources will quietly disagree.', oi:'OI-05' },
  { id:'M-06', side:'hm', group:'design', prov:'UAT', screen:'Day 1 calendar', route:'#/hm/calendar',
    assumed:'The Day 1 one-to-one is auto-created and can be rescheduled but not deleted. The other holds are suggestions the manager accepts.',
    resolve:'Automatic placement is specified for the one-to-one only. Whether the remaining holds auto-create is undecided, and it is the single biggest lever on how much work this screen represents.', oi:'OI-13' },
  { id:'M-07', side:'hm', group:'design', prov:'ASSUMED', screen:'Assign a buddy', route:'#/hm/buddy',
    assumed:'A suggested buddy with a capacity warning at 3 concurrent hires. The performance signal in the suggestion criteria is held back from the manager on purpose.',
    resolve:'Buddy policy is undefined, including criteria, load limits and the decline process, so the limit shown here is invented. A performance-derived suggestion is a manager-visible inference about another employee and needs a privacy position before it surfaces at all.', oi:'OI-10' },
  { id:'M-08', side:'hm', group:'design', prov:'ASSUMED', screen:'Welcome email', route:'#/hm/welcome',
    assumed:'Pre-filled boilerplate, an editable personal message, and a read-only first-week block generated from the new hire’s actual task list.',
    resolve:'A superset screen, not in the approved workflow file. The generated first-week block is what makes this cheap instead of a blank page. Confirm the content can actually be generated.', oi:'' },
  { id:'M-09', side:'hm', group:'design', prov:'ASSUMED', screen:'All manager screens', route:'#/hm/',
    assumed:'Every manager task carries its disposition on screen: keep, exception-only, automate, remove or undecided.',
    resolve:'The spec’s central instruction is that rendering all screens as equal peers would misrepresent the design intent. Making the disposition visible is a presentation decision the spec asks for but does not specify.', oi:'' },
  { id:'M-13', side:'hm', group:'design', prov:'ASSUMED', screen:'Readiness view', route:'#/hm/',
    assumed:'A manager can have several concurrent hires; the prototype shows two, with only one interactive.',
    resolve:'Filterable views are required and nudges are framed per-person, which implies more than one. No source states the expected volume or how the view should behave at ten.', oi:'' },
  { id:'M-14', side:'hm', group:'design', prov:'ASSUMED', screen:'Start logistics', route:'#/hm/logistics',
    assumed:'The Day 1 proxy is captured with the other logistics and applies to this hire only, not permanently.',
    resolve:'Delegation mechanics are unwritten, so what a proxy can actually see and do is undefined. The field can be drawn; its consequence cannot.', oi:'OI-12' },
  { id:'M-16', side:'hm', group:'design', prov:'UAT', screen:'Readiness view', route:'#/hm/',
    assumed:'Equipment status uses the live portal’s wording, NOT ORDERED YET, plus who it is waiting on and which task unblocks it.',
    resolve:'Adopted, not invented. It is the pattern the live product already uses, and the documented reason equipment sits front and centre.', oi:'' },
  { id:'M-22', side:'hm', group:'design', prov:'PRIOR', screen:'Readiness tracker', route:'#/hm/',
    assumed:'The readiness tracker covers the whole checklist, not only manager tasks: their tasks plus People Experience, IT fulfilment and the badge and workspace items, each carrying its own status.',
    resolve:'Taken from the manager mockup v6.1, which states exactly this. It changes what the manager’s home screen is for: less a to-do list, more a single place to see whether Day 1 will work. Confirm the manager is meant to see other teams’ fulfilment status at all, because M-03 says they cannot see the new hire’s task content.', oi:'' },
  { id:'M-23', side:'hm', group:'content', prov:'ASSUMED', screen:'Manager tasks', route:'#/hm/',
    assumed:'Manager tasks carry due dates and a recommended order. Four are taken from the mockup, at Day −7 for equipment and location, Day −4 for the application stack and Day −2 for the welcome note and the buddy. The rest are proposed.',
    resolve:'The mockup dates only five tasks. The corporate card, the Day 1 calendar, the team network and forwarding the introduction have no date in any source, so those four are marked. Someone has to set them, because a task with no date is a task with no nudge.', oi:'' },
  { id:'M-24', side:'hm', group:'blocks', prov:'PRIOR', screen:'Order the computer', route:'#/hm/computer',
    assumed:'CONFLICT, unresolved. The mockup dates the equipment order at Day −7 and states a lead time of 5 to 7 business days.',
    resolve:'Seven business days from Day −7 lands after the start date. Either the due date is wrong, the lead time is wrong, or the automatic loaner is not an edge case but the normal outcome. The prototype raises it as a blocker on the manager’s home screen so the collision is visible rather than discovered on somebody’s first morning.', oi:'' },
  { id:'M-25', side:'hm', group:'blocks', prov:'PRIOR', screen:'Software stack', route:'#/hm/software',
    assumed:'CONFLICT, unresolved. This prototype draws the application stack blocked, because no persona resolves. The mockup shows eight applications auto-assigned from the job family in Workday, with the manager reviewing rather than building the list.',
    resolve:'The platform owner said no full persona list exists and that the job-family fallback is the approach the requirements analysis rejects as inaccurate. The mockup shows that fallback working. One of the two is out of date. This is the single biggest difference between the two manager screens, and it decides whether this task is a review or a data-entry job.', oi:'OI-04' },
  { id:'M-18', side:'hm', group:'design', prov:'ASSUMED', screen:'Readiness view', route:'#/hm/',
    assumed:'The manager’s own contact details and the Teams channel list are one-click confirmations in the rail, not screens.',
    resolve:'Both have an “automate the prompt, one-click confirm” disposition. Folding them into the home screen removes two items from the task list, which is the outcome the design intent favours.', oi:'' },
];

const LINK_ASSUMPTIONS = [
  { id:'L-01', side:'link', group:'blocks', prov:'PRIOR', screen:'Buddy → new hire', route:'#/hm/buddy',
    assumed:'CONFLICT, unresolved. The manager assigns the buddy here; the new hire prototype shows that buddy from the moment of assignment; the spec says the contact card appears 72 hours before the start date. Both cannot be right.',
    resolve:'Use the prototype control to switch between the two rules and see the difference on the new hire’s landing screen. Also unresolved: whether the buddy has accepted before their name is shown, which matters because the manager can reassign up to Day −3, and a reassignment would remove a name the new hire has already seen.', oi:'OI-22' },
  { id:'L-02', side:'link', group:'blocks', prov:'ASSUMED', screen:'Introduction → manager', route:'#/hm/intro',
    assumed:'The new hire’s introduction arrives in the manager’s portal with an explicit Forward action. Nothing is posted automatically.',
    resolve:'Closes the loop on the new hire side’s manager-forward model, but no source specifies a manager-side receive-and-forward screen. The merge analysis keeps the welcome email and the introduction separate without saying where the introduction lands.', oi:'' },
  { id:'L-05', side:'link', group:'blocks', prov:'ASSUMED', screen:'New hire progress → manager', route:'#/hm/',
    assumed:'Sensitive new hire tasks report status only, never content. The manager sees that identity documents are done, not what was uploaded.',
    resolve:'The same unresolved visibility question as M-03, seen from the join. The prototype makes one specific choice so it can be argued now instead of discovered during build.', oi:'OI-03' },
  { id:'L-10', side:'link', group:'design', prov:'PRD', screen:'Corporate card → new hire', route:'#/hm/card',
    assumed:'The manager’s yes creates a Day 2 task for the new hire. A no creates nothing, and the new hire never sees the subject at all.',
    resolve:'Matches the requirement, and it is the only handoff here whose negative answer is also a designed outcome. Confirm the new hire is told nothing at all, instead of being told “not applicable”.', oi:'' },
  { id:'L-11', side:'link', group:'blocks', prov:'PRD', screen:'Start date → both portals', route:'#/startdate',
    assumed:'Changing the start date moves every dependent due date on both sides, and the manager sees the request.',
    resolve:'The requirement says the portal updates dependent due dates and tasks. It does not say who approves the change, how late it can be requested, or what happens to work already in flight: an order placed, a badge queued for print, a calendar hold booked.', oi:'' },
  { id:'L-03', side:'link', group:'design', prov:'ASSUMED', screen:'Manager contact → new hire', route:'#/hm/',
    assumed:'The manager’s confirmed contact details feed the card the new hire sees, and the manager is explicitly told the new hire can reach them before Day 1.',
    resolve:'Pre-hire contact scope is not settled in any source, and nothing on the manager’s side tells them the new hire has their details, or sets any expectation about responding.', oi:'OI-23' },
  { id:'L-04', side:'link', group:'design', prov:'UAT', screen:'Equipment → both sides', route:'#/hm/computer',
    assumed:'Both sides read one equipment table. The manager’s computer order and the new hire’s accessories order update the same three rows.',
    resolve:'Confirmed in the live product. The value of the join is that “where is my equipment?” is answered identically on both screens, naming the same person and the same unblocking task.', oi:'' },
  { id:'L-06', side:'link', group:'design', prov:'ASSUMED', screen:'Team network → new hire', route:'#/hm/network',
    assumed:'The people the manager names, and the reasons they write, are shown to the new hire verbatim.',
    resolve:'No source says whether the reason is shown to the new hire or kept manager-private. Showing it is what makes the task worth doing at all. It also means the manager is writing for an audience, which changes what they write.', oi:'' },
  { id:'L-07', side:'link', group:'design', prov:'ASSUMED', screen:'Logistics → first day details', route:'#/hm/logistics',
    assumed:'What the manager confirms here becomes the new hire’s “Your first day details”, which opens 3 days before the start date.',
    resolve:'Sequencing assumption drawn from the Day 1 information email at T−3 business days. If the manager has not confirmed by then, the card has to open with blueprint values only.', oi:'' },
  { id:'L-08', side:'link', group:'design', prov:'ASSUMED', screen:'Welcome email → sequencing', route:'#/hm/welcome',
    assumed:'The manager’s welcome email should land before the new hire is asked to write their introduction. The prototype shows the intended order but does not enforce it.',
    resolve:'The merge analysis says sequence, not merge, but nothing enforces the order, and three welcome communications compete for the same week before Day 1.', oi:'' },
  { id:'L-12', side:'link', group:'design', prov:'PRIOR', screen:'Inside Equinix → manager and buddy', route:'#/',
    assumed:'Every Inside Equinix chapter closes with a reflection prompt that says the new hire will revisit their notes in a conversation with their manager or onboarding buddy. Nothing is stored, and nothing is tracked.',
    resolve:'That is verbatim from the live site, and it is a promise this portal currently does not keep: neither the manager nor the buddy is told the prompts exist, or given the questions. Either wire it, by putting the same questions in front of the manager before the first 1:1, or change the wording. A prompt that points at a conversation nobody has scheduled is worse than no prompt.', oi:'' },
  { id:'L-09', side:'link', group:'content', prov:'ASSUMED', screen:'Notifications', route:'#/hm/network',
    assumed:'Named people and the assigned buddy are notified; the prototype shows that a notification was sent but never its content.',
    resolve:'Notification and reminder design is out of scope for both specs and deserves its own pass. Being named in someone’s network is a message to a third party who did not ask for it.', oi:'' },
];

HM_ASSUMPTIONS.forEach(a => ASSUMPTIONS.push(a));
LINK_ASSUMPTIONS.forEach(a => ASSUMPTIONS.push(a));

const SIDE_LABELS = {
  nh:   { label:'New hire',   short:'NH' },
  hm:   { label:'Manager',    short:'HM' },
  link: { label:'Connection', short:'↔'  },
};

/* Manager-side open questions, shown alongside the new hire's */
const HM_OPEN_BEFORE_BUILD = [
  'Is the manager’s “Order equipment for new hire” task the one being redesigned for the laptop-and-accessory MVP? It decides whether this screen is ours to design at all.',
  'What goes into the readiness score: composition, weighting, and what counts as ready? It is the most prominent element on the manager’s home screen.',
  'What new hire task detail can a manager see? The visibility matrix is unwritten and several new hire tasks are plainly sensitive.',
  'How is persona resolved for provisioning? Until it is, the software stack renders empty and the manager fills it by hand, which is the opposite of the intended design.',
  'When does the buddy become visible to the new hire: from assignment, or 72 hours before start? The two prototypes currently disagree.',
  'Should the team network task exist, given it is the only proposal that adds manager work?',
  'Does the manager override blueprint logistics, and if so how is precedence shown?',
  'Are the remaining Day 1 calendar holds auto-created or manager-driven? It is the biggest lever on that screen’s weight.',
  'Master Seq no longer reconciles across tabs from 34 onward, and a manager row is missing from the master inventory. If Master Seq is used as a build key, tasks will be mismatched.',
];
