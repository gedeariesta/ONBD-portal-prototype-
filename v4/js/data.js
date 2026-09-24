/* ============================================================
   Data: content, copy, and the assumption register.  v4, AI-forward
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
  // The address on the offer. Equipment ships here if the new hire asks, so
  // the portal never has to collect one before Day 1 (A-65).
  homeAddress: '2180 Curtis Street, Apt 14, Denver, Colorado 80205, US',
  homeAddressJP: '3-12-8 Nishi-Azabu, Minato-ku, Tokyo 106-0031, JP',
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

/* ---------- Phase timeline, named from the live portal (A-44) ----------
   The live portal's five phases stop at the first month. The onboarding
   experience runs to 90 days, so the tracker carries a sixth phase the live
   build does not have yet. */
const PHASES = [
  'Get ready for Day 1',
  'Final preparations for Day 1',
  'Your first day at Equinix',
  'Your first week at Equinix',
  'Your first month at Equinix',
  'Your first 90 days',
];

/* ============================================================
   Assumption register, across all three views. The count is derived at
   render time, so no number is written down here to go stale.
   A-01…A-28 carried from v1 unchanged in numbering.
   A-29…A-46 and A-48 are new in v2 (A-47 left unused on purpose,
   reserved for the IBX badge question if it needs its own entry).
   A-09 is retired. Observation answered it.
   ============================================================ */
const ASSUMPTIONS = [
  /* ---------- Blocks build ---------- */
  { id:'A-01', group:'retired', prov:'ASSUMED', screen:'Personal details', route:'#/details',
    assumed:'Pre-filled fields are legal name, personal email, mobile and country of hire. Everything else arrives blank.',
    resolve:'Confirm the candidate-attested field list with DIO and HR Ops. It accounts for most of the visual difference on Tab 1. Retired in v4: the portal no longer collects personal details at all, so there is nothing to pre-fill. They are entered once in Workday on Day 1 (A-65).', oi:'OI-20' },
  { id:'A-02', group:'blocks', prov:'ASSUMED', screen:'Personal details', route:'#/details',
    assumed:'Tab 3 holds preferred language, contact preferences, workplace adjustments and voluntary self-identification.',
    resolve:'The PRD names only two of the three tabs. Tab 3 contents need a decision from the onboarding PM with HR Ops.', oi:'OI-02' },
  { id:'A-10', group:'retired', prov:'ASSUMED', screen:'Personal details', route:'#/details',
    assumed:'The portal renders the full personal-details form, with banking as a locked boundary card. Bank data is handled differently from the rest of the profile, so it never passes through this portal.',
    resolve:'Reversed. Banking and direct deposit are captured in the portal now, on their own tab inside the mandatory personal-information task, because payroll cannot pay without them and a second form is a second place to abandon (A-61). The privacy handling the card described survives as a property of the fields rather than a reason to exclude them: encrypted, withheld from the manager, and outside what they can see of progress.', oi:'OI-01' },
  { id:'A-12', group:'blocks', prov:'ASSUMED', screen:'Job description', route:'#/jd',
    assumed:'No compensation figures are shown anywhere in the portal.',
    resolve:'Confirm the manager-visibility ruling on sensitive data. Omitting salary is the safe default. The figure is already in the signed offer.', oi:'OI-10' },
  { id:'A-14', group:'blocks', prov:'ASSUMED', screen:'Introduction', route:'#/intro',
    assumed:'The manager forwards the introduction to the team. It is never auto-posted.',
    resolve:'Confirm the sharing model with Janine. Auto-posting would need much stronger consent design.', oi:'OI-11' },
  { id:'A-29', group:'retired', prov:'PRIOR', screen:'Personal details', route:'#/details',
    assumed:'Identity and right-to-work documents are captured here, on Tab 1, alongside country of hire.',
    resolve:'This overlaps the separate Right to Work task. Capturing once is a proposal, not an agreed design. The PEX document-sequencing work may already settle which documents come early and which come late. Retired in v4: identity documents are not captured in the portal. They stay with Workday and the Right to Work system (A-65).', oi:'' },
  { id:'A-34', group:'blocks', prov:'ASSUMED', screen:'Equipment', route:'#/equipment',
    assumed:'This equipment screen is a scoped stand-in for a catalogue owned elsewhere.',
    resolve:'The real catalogue, its options and its regional variants belong to the EUT team. Confirm what this workstream owns before anyone builds from this screen.', oi:'' },
  { id:'A-41', group:'retired', prov:'UAT', screen:'Equipment', route:'#/equipment',
    assumed:'The hiring manager orders the computer today; the new hire orders accessories only.',
    resolve:'Reversed, and the prototype now draws the target state: the new hire selects and orders both the computer and the accessories, and the manager confirms nothing (A-60). What is still unbuilt is the exception path the reversal implies, for the cases where a manager does have to step in.', oi:'' },
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
  { id:'A-22', group:'retired', prov:'ASSUMED', screen:'Task list', route:'#/',
    assumed:'The job description confirmation and the introduction are due at Day −7.',
    resolve:'Neither has a due date in any source. Day −7 puts them before the manager needs the introduction for a team announcement. Retired in v4: the job description moved to Day 1 (A-67) and the introduction became optional with no due date (A-68).', oi:'' },
  { id:'A-23', group:'content', prov:'ASSUMED', screen:'Task list', route:'#/',
    assumed:'Estimated completion times of 2 to 6 minutes per task.',
    resolve:'Invented, to test whether time estimates help or intimidate. Measure it before build.', oi:'' },
  { id:'A-30', group:'retired', prov:'PRIOR', screen:'Personal details', route:'#/details',
    assumed:'The per-country identity document lists (United States and Japan) are illustrative.',
    resolve:'Neither list has been checked against the legal requirement for that country. Legal and the Right to Work owner need to supply the real lists before build. Retired in v4 with A-29: no identity document list is shown in the portal any more.', oi:'' },
  { id:'A-37', group:'content', prov:'UAT', screen:'Equipment', route:'#/equipment',
    assumed:'Accessories are for the at-home workspace. The in-office workspace already has monitors, keyboard and mouse.',
    resolve:'Wording mirrors the live form. Confirm it holds in every region, and for hybrid hires with no assigned desk.', oi:'' },
  { id:'A-39', group:'content', prov:'UAT', screen:'Equipment', route:'#/equipment',
    assumed:'The headset is automatic. Everyone gets the standard Zoom-optimized headset, and the choice field offers only “Headset only” or “Headset and other accessories”.',
    resolve:'UAT answers the question this entry was asking, and the answer is no. The required choice field has two options and neither is a refusal, so a hire who already owns a headset either accepts a second one or leaves a required field empty. An earlier version of this prototype invented an “I don’t need anything” option, which has been removed because it does not exist. Whether that matters is a decision for the equipment owner, not a defect.', oi:'' },
  { id:'A-46', group:'content', prov:'1:1', screen:'Task list', route:'#/',
    assumed:'A medical check appears for countries that require one. Japan is the example shown here.',
    resolve:'Same family as right to work. Which countries require it, and what the new hire actually has to do, are both unconfirmed.', oi:'' },

  /* ---------- Design choice ---------- */
  { id:'A-04', group:'design', prov:'ASSUMED', screen:'Personal details', route:'#/details',
    assumed:'Pronouns are included, optional, beside preferred name.',
    resolve:'Not mentioned in any source. Needs a worker-record target field if kept.', oi:'OI-17' },
  { id:'A-06', group:'retired', prov:'ASSUMED', screen:'Personal details', route:'#/details',
    assumed:'Workplace adjustments are always visible and optional, with a “discuss privately” route that avoids storing detail.',
    resolve:'The live accessories form raises adjustments at the point of choosing equipment, so the prototype mirrors the link there and leaves this section where it is. Confirm which placement people actually use. Retired in v4 with the form it lived in. The equipment screen now points to a private conversation with Maya instead of a section on a form (A-65).', oi:'OI-23' },
  { id:'A-08', group:'design', prov:'ASSUMED', screen:'Personal details', route:'#/details',
    assumed:'One emergency contact is required; a second is optional.',
    resolve:'No source specifies how many. One required is the common minimum.', oi:'OI-19' },
  { id:'A-11', group:'blocks', prov:'ASSUMED', screen:'Task list', route:'#/',
    assumed:'Banking used to sit under "handled by other teams" with no date, saying only "Payroll will be in touch". It is now a tab inside the details task and inherits that task’s due date.',
    resolve:'The three sources that placed direct deposit at three different times still disagree, and legal review is outstanding in two countries. Inheriting the details due date picks one of those times by accident, which is the thing A-11 originally avoided. Somebody has to say when banking is actually due, because it now carries a date whether or not anyone chose it.', oi:'OI-03' },

  { id:'A-61', group:'retired', prov:'1:1', screen:'Personal details, pay and banking', route:'#/details',
    assumed:'Banking and direct deposit are captured in the portal, editable, on a pay and banking tab inside the mandatory personal-information task. Bank name, name on the account, routing number, account number and account type, all required.',
    resolve:'Reverses A-10 and A-11, which had these collected by Payroll in their own secure form and never passing through this portal. Three things are open: whether this form is owned by this workstream or by Payroll, and if Payroll, this becomes an interface spec rather than a screen; whether splitting pay across several accounts has to be supported, which the live Payroll form allows and this screen does not; and what the encryption, retention and access requirements actually are, since they were the original argument for keeping the data out. Reversed again in v4, after the September meetings: Workday stays the system of record for anything personal, and banking is entered once there on Day 1 (A-65).', oi:'OI-01' },

  { id:'A-62', group:'retired', prov:'1:1', screen:'Personal details, pay and banking', route:'#/details',
    assumed:'Tax withholding is partially in scope: the number of allowances and an exempt flag, not the tax forms themselves, which stay with Payroll on their own timetable.',
    resolve:'Linda Sommer has not confirmed whether these two fields belong in the mandatory set or stay with Payroll. They are drawn so the question can be answered against something. If they stay, the country-conditional variants need specifying, because allowances are a US construct and this form is shown in every country. Retired in v4: tax details go into Workday with the other personal details on Day 1 (A-65). The tax forms themselves still stay with Payroll.', oi:'' },
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
  { id:'A-25', group:'retired', prov:'ASSUMED', screen:'Task list', route:'#/',
    assumed:'Progress = tasks complete out of tasks assigned, plus a phase strip. The invented four milestones are gone, replaced by the live portal’s five phases. See A-44.',
    resolve:'The requirement is for a progress tracker; no source defines its model. Two levels show immediate progress and overall position. Retired in v4: progress counts three things, not seven, and the phase strip left the hero (A-64). The phase names still stand, on the current system’s view (A-44).', oi:'' },
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
    resolve:'The requirement settles the three-way question: it is both the carousel and the rail link, and it is not a task. The same content also appears in orientation and in the manager’s weekly list, so the remaining question is whether that is reinforcement or repetition. The chapter content is no longer placeholder, but the videos are named rather than embedded. UAT settles the placement question: Inside Equinix is a to-do inside “Your first day at Equinix”, not a pre-Day 1 item, so putting it in front of a new hire before they start is a move, not a reuse.', oi:'' },
  { id:'A-36', group:'design', prov:'UAT', screen:'Good to know', route:'#/',
    assumed:'The first-90-days checklists are parked as reference only, not as tick-off items.',
    resolve:'The parking decision stands, but the original worry is answered: the platform has a Required/Optional filter natively and already ships optional items as “No due date, optional”. Revisit whether tick-off is now cheap.', oi:'' },
  { id:'A-38', group:'design', prov:'UAT', screen:'Equipment', route:'#/equipment',
    assumed:'Shipping defaults to the office address, derived from role and location, with an explicit option to ship home instead. A shipping phone number is required.',
    resolve:'Replaces the retired A-09, and UAT confirms the form verbatim: the office address block, the “Ship to the office address?” radio with “Yes, ship to the address above” and “No, ship to me directly”, and the required phone number with country code. The open problem is not the form, it is the second option. Letting somebody who has not started yet redirect a laptop to an address of their choosing is the shape of a fraud, and the same question applies to a hybrid hire with a real claim to home delivery. Whether the answer is a restriction, a verification step or an approval, it belongs in the requirements even if it never appears on a screen. Also still open: whether the office-address lookup exists for every location, and what happens for a fully remote hire with no office.', oi:'' },
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

  { id:'A-54', group:'retired', prov:'UAT', screen:'Equipment', route:'#/equipment',
    assumed:'The equipment screens follow the live HR case: both people named as “Name (username)” with the employment start date and the manager’s email above the table, status written as a full sentence quoting the task that unblocks it, and the incident shown with its Activity, Attachments and Summary tabs.',
    resolve:'Taken from the UAT screens rather than invented, so the future state does not quietly drop wording people already recognise. Two things to settle: the live status line for the phone reads “To place an order for a mobile phone new hire, Alp Basol (abasol), must complete” and is missing an article, and the case shows a photo for the manager but initials for the new hire. Both are small, and both are easier to fix before the push to production than after. Retired in the plain-English pass: the layout of the case stays, the wording does not (A-63).', oi:'' },
  { id:'A-63', group:'design', prov:'ASSUMED', screen:'Equipment', route:'#/equipment',
    assumed:'The equipment table keeps the live case’s shape (case number, both people, one row per item) but its status lines are written in plain English and addressed to whoever is reading: “Choose your computer above to order it” for the new hire, “Jordan hasn’t chosen yet” for the manager. The case state reads Open rather than the live Ready, and the start date is written out rather than as 2026-08-18.',
    resolve:'Reverses A-54, which copied the live strings word for word so that nothing people already recognise was dropped. Read by the new hire, those strings describe them in the third person (“the new hire, Jordan Reyes (jreyes), must first complete…”) and a case marked Ready with nothing ordered reads as a contradiction. The cost is that the prototype no longer matches the ServiceNow build line for line, so if the live wording cannot change, this is a request to the ServiceNow team rather than a design that can ship as drawn.', oi:'' },
  { id:'A-55', group:'blocks', prov:'UAT', screen:'Equipment', route:'#/equipment',
    assumed:'The accessories order is raised as an incident at Urgency 3 - Low, and its Summary tab shows the stored record rather than a written summary: checkbox values render as true and false, the HR task SysID is on display, and the accessories choice is stored as the sentence “Headset and other accessories”.',
    resolve:'Two separate problems. Urgency: nothing ships until this incident is worked, and the desk is incomplete on Day 1 if it is not, so Low is the wrong default for an order with a hard date behind it. Confirm whether urgency is derived from the start date at all. Summary: it is readable by someone who knows the form and confusing to a new hire checking their own order, which is exactly who has the tab open. Neither needs a redesign, both need a decision before this reaches production.', oi:'' },

  { id:'A-56', group:'blocks', prov:'UAT', screen:'All to-dos', route:'#/todos',
    assumed:'The platform already ships a to-do view: a phase rail, one phase open at a time, a count for that phase only, and filters for Assigned to, Type and Sort by. The prototype now carries both that view and its own task list, so the two can be compared.',
    resolve:'The counting model is the decision. The platform counts within a phase, so a new hire in Get Ready for Day 1 sees a small number and no sense of what is still coming. This prototype counts the whole pre-Day 1 list instead. Which is less alarming has never been tested, and the answer changes the home screen. Also worth noting: the filters exist and cost nothing, so any argument for a simpler list has to say why they are being given up. Two Day 1 to-dos were on screen that no source of ours names, Welcome to MyHR and Complete your enterprise training, and two more in that phase were below the fold.', oi:'' },

  { id:'A-60', group:'blocks', prov:'1:1', screen:'Choose your equipment', route:'#/equipment',
    assumed:'The new hire picks the computer, not the hiring manager. Most roles resolve from role and location to a single build, which the new hire confirms rather than chooses; some roles carry a genuine choice and get the catalogue with specifications. Both states are drawn, switchable from the prototype controls.',
    resolve:'This reverses the earlier model, where the manager placed the order and nothing moved until they did. Three things are still open. The approved device catalogue sits with End User Technology and has not been supplied, so the models and specifications on screen are illustrative stand-ins. Nobody has defined which roles resolve to one build and which carry a choice, or who maintains that mapping. And monitor and accessory entitlements per role are undefined, so the accessories form below still offers the same two options to everyone.', oi:'' },

  { id:'A-57', group:'design', prov:'1:1', screen:'All screens', route:'#/',
    assumed:'Match the live feature set, not the mechanism behind it. Where this prototype mirrors today’s wording or flow, that is a starting point to argue from, not a decision to inherit.',
    resolve:'Stated directly: the trap in this kind of project is “but we do it this way”, and the answer is to open up what is possible rather than design inside the existing box. So the working rule is to list what the live portal does, make sure nothing is quietly dropped, and then decide the how separately. Where this prototype does follow today’s mechanism, such as the accessories incident and its comment thread, that is recorded as observed behaviour with a documented reason, not as a preference.', oi:'' },
  { id:'A-58', group:'blocks', prov:'1:1', screen:'Equipment', route:'#/equipment',
    assumed:'PROPOSED. If the start date is more than 14 days out, the new hire gets a window to change the equipment selection. Inside 14 days, the default ships and there is no window.',
    resolve:'A rule offered in conversation, not written down anywhere, and it would settle A-41 and M-01: the manager places a default order, the new hire adjusts it while there is still time, and nobody has to decide who owns the choice in the abstract. Needs the real build and ship lead time behind it, because 14 days and a 5 to 7 business day lead do not obviously fit together (M-24).', oi:'' },
  { id:'A-59', group:'blocks', prov:'1:1', screen:'Compliance pack', route:'#/policies',
    assumed:'The privacy notice pack has gaps that the country list hides. Germany is not covered by the shared EU addendum. There is a Canadian French version but no French French one, which leaves the francophone African countries without a usable translation. Equinix employs people in 38 countries, not the 36 usually quoted, and about three have no usable version.',
    resolve:'Counted from the hire data in Workday against the IBX and office lists, so the number is checkable. The direction is consolidation: one global core plus addenda should cover most countries, with a handful of genuinely bespoke ones, and the target is roughly five templates rather than fifty. Language is a separate axis: internal English is enough for tier one material, while anything where comprehension is legally load-bearing needs real translation. The privacy notice team owns the files. This workstream owns telling them what is missing.', oi:'' },

  /* ---------- Retired: observation answered the question ---------- */
  { id:'A-09', group:'retired', prov:'UAT', screen:'Personal details / Equipment', route:'#/equipment',
    assumed:'Was: home address is captured once on Tab 1 and reused for equipment delivery, with the equipment task holding the editable copy.',
    resolve:'Retired. The direction was wrong. Shipping defaults to the office address, derived from role and location, so the equipment task never waits on personal details. The Tab 1 “ship here” checkbox is gone. Replaced by A-38; workbook item OI-28 closes.', oi:'OI-09 closed' },
  /* ---------- v4, the AI-forward prototype ----------
     From the September 2026 workstream meetings (Sidekick, and the
     Artifacts kick-off), where AI-first became the scope. Each entry names
     what was said and what is still open, so the proposal can be argued
     with rather than taken as agreed. */
  { id:'A-64', group:'blocks', prov:'MTG', screen:'Task list', route:'#/',
    assumed:'Only three things before Day 1: confirm the start date, start the background check, choose equipment. Everything else is optional before Day 1, or moves to Day 1 or the first week, and only the three are counted.',
    resolve:'Said in the Artifacts meeting: the pre-hire experience stays limited to these three, with about three tasks on Day 1 and benefits, compliance and the rest from Day 2 through the first week. The five-or-fewer target is the ceiling, not the plan. Open: whether the limit is strict enough to rule out the optional badge photo and introduction (A-68), and where right to work, which finishes in another system, is counted.', oi:'' },
  { id:'A-65', group:'blocks', prov:'MTG', screen:'Personal details, in Workday', route:'#/details',
    assumed:'Personal details are one Workday task on Day 1: legal and preferred name, address, emergency contacts, bank, tax and voluntary self-identification. The portal links to it and learns only that it is done. Equipment that ships to a home uses the address on the offer.',
    resolve:'Workday stays the system of record for anything personal, for privacy, architecture and retention reasons, and the payroll-required fields are entered once rather than reviewed again downstream (both said in the Artifacts meeting). Open: whether bank details entered on Day 1 reach the first payroll run; if not, this becomes a Workday task before the start date and a fourth thing before Day 1.', oi:'' },
  { id:'A-66', group:'blocks', prov:'MTG', screen:'Policies and notices', route:'#/policies',
    assumed:'Policies and notices open in the first week. Labour notices are acknowledged in ServiceNow, each with its date and time kept for audit. The handbooks are one link to the SharePoint site and one acknowledgment, not a pack of documents. The notices can be read ahead before the start date; nothing can be signed.',
    resolve:'Handbook access starts after the start date, the roughly 35 handbooks need one task rather than one each, and labour notices sit in ServiceNow for the timestamp (all said in the Artifacts meeting). Open: Netherlands and Canada contracts refer to the handbook, which a new hire cannot see before they start; whether acknowledging is mandatory before the next task opens; and which code of conduct and whistleblower acknowledgments can go, since compliance learning already asks for some of them.', oi:'' },
  { id:'A-67', group:'design', prov:'ASSUMED', screen:'Job description', route:'#/jd',
    assumed:'The job description is confirmed on Day 1. It can be read now, and a mismatch can be raised now, rather than waiting for the start date.',
    resolve:'Nothing in the meetings places it. The other reading is to drop it: the offer already describes the role, and a mismatch found on Day 1 is late. Raising a mismatch early is kept because it is the one part of the task that is worth more before the start date than after it.', oi:'' },
  { id:'A-68', group:'design', prov:'ASSUMED', screen:'Badge photo and introduction', route:'#/intro',
    assumed:'The badge photo and the introduction are optional before Day 1, with no due date. A photo sent by eight days before the start gets the badge printed in time; without one, the photo is taken at reception.',
    resolve:'The badge needs print time before Day 1, but the photo is not one of the three things. Two readings are open: keep it optional, as drawn, or make it a Day 1 step and accept that nobody arrives with a printed badge. The introduction loses most of its value after Day 1, which is the case for keeping it optional rather than moving it.', oi:'' },
  { id:'A-69', group:'content', prov:'MTG', screen:'Benefits enrolment', route:'#/',
    assumed:'Benefits enrolment is a first-week task that links straight to the enrolment site for the country: Benefacts countries, and PlanSource in the US, with the same experience either way.',
    resolve:'Q4 scope, per the Sidekick meeting: Benefacts countries whose links are ready by the end of October, and PlanSource for the US once its links are supplied. Darwin countries follow from Q1, quarter by quarter, as they move into Darwin. For now benefits stays a ServiceNow task with a page widget linking to enrolment.', oi:'' },
  { id:'A-70', group:'design', prov:'ASSUMED', screen:'Sidekick', route:'#/',
    assumed:'Sidekick talks, the system decides. Anything with a deadline, a signature or personal data is read from the task list and drawn by the system, in a card Sidekick cannot word. Sidekick explains it and points at it.',
    resolve:'The rule is the prototype’s, not the meetings’. It is how a wrong answer stays cheap: Stephanie found Sidekick sending a direct deposit question to ADP, and with this rule the card under the wrong sentence still opens the right Workday task. It needs agreeing before anything is costed, because it decides what the AI layer is allowed to do.', oi:'' },
  { id:'A-71', group:'blocks', prov:'MTG', screen:'Sidekick', route:'#/',
    assumed:'New hires get a guided, “training wheels” Sidekick: the same knowledge articles as the employee version, a different way in. Every answer names the article it came from and asks whether it was right. The panel is a prototype: answers are written in advance and matched on keywords.',
    resolve:'Brian and Stephanie described it this way in the Sidekick meeting, with Brian’s hypothesis being a dedicated onboarding version rather than Sidekick unchanged. Open: whether a pre-hire’s Sidekick can see the same articles as an employee’s, since security trimming would thin the answers; how often it finds the right article first time (Stephanie needed two or three wordings); and whether the foundation is built in ServiceNow journeys or Sidekick, which is waiting on Harmin. Kamakshi asked for it to be backed by testing with real new hires, which is why the answers are scripted rather than live.', oi:'' },
  { id:'A-72', group:'design', prov:'MTG', screen:'Sidekick', route:'#/',
    assumed:'Talk to a person is always one tap away. It passes the question, with the conversation, to the People Operations team, and lands in the coordinator’s Help requests queue.',
    resolve:'The red button from the Artifacts meeting: unanswered or complex questions escalate to tier-one human support, potentially the Manila team, then further tiers. Open: who owns the queue once the Global People Operations model settles, and how quickly a reply is expected, which the prototype deliberately does not promise.', oi:'' },
  { id:'A-73', group:'design', prov:'MTG', screen:'Manager home and reminders', route:'#/hm/',
    assumed:'Reminders go where each person already is: new hires by email before Day 1, because they have no Equinix account yet, and managers in Teams, through Sidekick, with the action in the message. The manager’s home carries a one-paragraph summary from Sidekick, built only from the rules already on the page.',
    resolve:'Janine described nudging pre-hires by email and employees through a Teams chat in Sidekick, and a Teams interaction layer beside a web experience. Open: whether managers want reminders in Teams at all, and how many before they become noise.', oi:'' },
  { id:'A-74', group:'design', prov:'MTG', screen:'Coordinator Today', route:'#/pex/',
    assumed:'The coordinator’s Today screen opens with Sidekick’s two-sentence read of the queues, and Sidekick turns a question into a caseload filter. What needs the coordinator is still decided by the queue rules; Sidekick only puts the counts in order.',
    resolve:'Janine described a dedicated view of who starts on a given day, who has not finished, and red and orange risk, with filters by region and start date. Summarising structured data is where AI is most reliable, so this is where the AI layer does the most. Open: whether a written summary helps a coordinator who reads the queues anyway.', oi:'' },
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
  MTG: 'Said in the September 2026 workstream meetings',
  PRIOR: 'Agreed in the earlier change request',
  ASSUMED: 'Still a judgement call',
};

/* ---------- Decide first (my read, not an agreed order) ----------
   Asked for directly: given all of this, what are the priorities, and what
   needs thinking about this week. So this is an ordered shortlist rather
   than another flat register. The ordering is a judgement call and is meant
   to be argued with. Everything here already has an entry of its own. */
const DECIDE_FIRST = [
  // v4: the two decisions the AI-forward proposal rests on come first. The
  // computer question that used to head this list is settled (A-60).
  { ids:['A-64','A-68'], head:'How strict “three things before Day 1” is',
    why:'It decides whether the badge photo and the introduction stay as optional extras, move to Day 1, or go. It is the first thing a new hire sees, and the most visible change from today.',
    when:'Next conversation with Janine.' },
  { ids:['A-70','A-71'], head:'What Sidekick is allowed to do, and what it can see',
    why:'The rule that the task list decides and Sidekick only explains is what keeps a wrong answer cheap. What a pre-hire’s Sidekick can see decides how many questions it can answer at all.',
    when:'Before any AI work is costed.' },
  { ids:['A-55','M-24'], head:'The equipment dates do not add up',
    why:'The order is raised at low urgency, dated Day −7, against a 5 to 7 business day lead with no stock integration behind it. On those numbers a laptop can arrive after the start date, and the automatic loaner stops being an edge case.',
    when:'This week. It is checkable against real lead times without waiting for anyone.' },
  { ids:['M-03','L-05','M-29'], head:'Who can see what',
    why:'The visibility matrix is unwritten, several new hire tasks are plainly sensitive, and a third portal for People Experience is now on the list. Three personas cannot be designed without it.',
    when:'Before either portal is costed.' },
  { ids:['A-51','A-59'], head:'The document pack, and the gaps inside it',
    why:'416 document instances today, a US bundle of 28 where 24 addenda do not apply, Germany uncovered by the shared EU addendum, and no French French version for the francophone countries. Consolidation is the goal and the privacy notice team owns the files.',
    when:'Start now, because it depends on another team’s calendar.' },
  { ids:['M-04'], head:'Whether software provisioning is in phase one at all',
    why:'The persona cannot be resolved, an application rationalisation is running, and nobody has confirmed whether access attaches to the person or to the machine. If phase one carries no software, this screen is premature rather than blocked.',
    when:'Before the manager task list is fixed.' },
  { ids:['M-27','M-10'], head:'What makes a name count',
    why:'Naming somebody is a request, not an assignment, and the calendar booking behind acceptance is unscoped.',
    when:'Alongside the buddy programme, which is being written now.' },
  { ids:['A-38'], head:'Shipping to an address a new hire chooses',
    why:'A person who has not started yet can redirect a laptop. Whether the answer is a restriction, a verification or an approval, it belongs in the requirements.',
    when:'Before the equipment flow is built.' },
  { ids:['L-01'], head:'When the new hire sees their buddy',
    why:'The two prototypes disagree, and the manager can change their mind up to three days before a start, which would remove a name the new hire had already seen.',
    when:'Cheap to settle. Both behaviours are already built, so pick one.' },
];

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
  <p style="font-size:var(--t-meta); font-weight:var(--fw-book); margin-bottom:6px;">Additional provisions on copyright, workplace monitoring and personal devices apply in Japan. They sit here inside the global policy instead of arriving as a separate document, so you acknowledge once and cover both.</p>
  <p style="font-size:var(--t-meta); color:var(--carbon); font-weight:var(--fw-book);"><em>Illustrative content. The real addendum is pending legal review.</em></p>
`;

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

/* ---------- The live to-do timeline (A-56) ----------
   UAT shows the platform's own to-do UI: a phase rail on the left, one phase
   open at a time, a per-phase count, and a filter bar of Assigned to, Type
   and Sort by. To-dos carry a state line rather than a due date, and the
   phase header counts only that phase.

   Phases 2 and 3 are what the screens actually showed, including the counts.
   Phase 1 is this prototype's own task list, and phases 4 and 5 were not
   captured, so they say so. */
const PHASE_TODOS = {
  1: { seen:true, total:2, items:[
    { name:'Complete your at-home workspace setup', state:'No due date, optional' },
    { name:'Collect your Equinix credentials',      state:'Due in 1 day' },
  ] },
  2: { seen:true, total:6, items:[
    { name:'Inside Equinix',                   state:'Upcoming to-do', marker:'A-35' },
    { name:'Order a phone',                    state:'Upcoming to-do, optional', marker:'A-40' },
    { name:'Welcome to MyHR',                  state:'Upcoming to-do' },
    { name:'Complete your enterprise training', state:'Upcoming to-do' },
  ], note:'Four of the six were on screen. The other two were below the fold.' },
  3: { seen:false, total:null, items:[
    { name:'Information governance', state:'Upcoming to-do', marker:'A-21' },
  ], note:'Not captured in UAT. This one item comes from the compliance workbook, not from the platform.' },
  4: { seen:false, total:null, items:[], note:'Not captured in UAT, and nothing in the sources names what sits here.' },
};

/* The live filter bar. None of it is wired in the prototype, and the labels
   are copied so the team can see what the platform already offers (A-56). */
const TODO_FILTERS = [
  { label:'Assigned to', value:'Assigned to me' },
  { label:'Type',        value:'Required, optional' },
  { label:'Sort by',     value:'Recommended' },
];

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
  /* Promoted out of Paperwork to the top level: it is the longest-running
     thing in pre-boarding and the one people most want a status on. */
  { id:'bgcheck', label:'Background check', icon:'shield-check.svg', sys:'Background check provider',
    owners:'The new hire, HR Operations and the check provider',
    stages:[
      { label:'Launched',        note:'Started from the portal, then it runs in the provider’s system.' },
      { label:'Details given',   note:'The new hire completes the provider’s own form, not this one.' },
      { label:'Checks running',  note:'Lead time varies by country and by what the role requires.' },
      { label:'Cleared',         note:'The result comes back to HR Operations, not to this portal.' },
    ] },
  { id:'equipment', label:'Equipment', icon:'laptop.svg', sys:'ServiceNow',
    owners:'The manager, the new hire and End User Technology',
    stages:[
      { label:'Order placed',        note:'The new hire picks the computer and the accessories, and one task orders both.' },
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
  /* Badge completion is deliberately not a stage. Security has no integration
     and no place to confirm a badge was printed or collected, so a status here
     would be invented. The portal tracks what it can actually see. */
  { id:'workspace', label:'Workspace', icon:'id-card.svg', sys:'Workplace Services',
    owners:'The new hire, the manager and Workplace Services',
    stages:[
      { label:'Photo submitted',  note:'The new hire uploads it. Badge print needs the lead time.' },
      { label:'Site confirmed',   note:'The manager confirms the location, access level and parking.' },
      { label:'Desk and access set', note:'Access zones follow the confirmed site. Badge collection is not tracked here.' },
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
    owners:'The new hire and HR Operations',
    stages:[
      { label:'Start date confirmed', note:'Every other due date is anchored to it.' },
      { label:'Details submitted',    note:'Personal record, banking, emergency contact and preferences.' },
      { label:'Policies acknowledged', note:'The pack the new hire has to read and sign off.' },
    ] },
];

/* ---------- What the live Workday process actually sends today (A-51) ----------
   Counts are from the current-state business process document list, not invented.
   The mockup's acknowledgement pack is the intended future core; this is the
   reference material that arrives alongside it today. */
const CURRENT_PACK = {
  US: { handbook:'US Employee Handbook (November 2024)',
        addenda:25, addendaNote:'state supplements. Every US hire gets all of them, whichever state they work in',
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
/* v4: everything that is not one of the three, placed on the journey where
   the September meetings put it. `when` is the section it renders in:
   before Day 1 (opens on its own, nothing to do yet), Day 1, or the first
   week. Pre-hire is limited to the three tasks (A-64); nothing here is due
   before the start date. */
const COMING_UP = [
  { id:'setup', when:'pre', name:'Equipment setup instructions', opens:'3 days before you start',
    note:'You set up your own laptop, and the IT help desk is open all day', icon:'portal-window.svg',
    expl:'Setup instructions land here once your equipment ships, so they arrive as fresh as the box does. There is no booked slot with IT on your first day: you work through it at your own pace, and the help desk is there all day if you get stuck.',
    dnote:'IT would not commit to a designated setup window, so the hour that used to sit in the manager’s Day 1 calendar is gone and this points at the help desk instead.' },
  { id:'firstday', when:'pre', name:'Your first day details', opens:'3 days before you start',
    note:'Where to go, who to ask for, what to bring', icon:'calendar.svg',
    expl:'Held back until 3 days before you start, so what you see is final.' },
  { id:'signin', when:'pre', name:'Get your Equinix sign-in details', opens:'1 day before you start',
    note:'Your username and how to set your password', icon:'lock.svg',
    expl:'Your sign-in details, ready the day before you start.',
    dnote:'A to-do in the live portal that nobody has documented the contents of. Worth pinning down: it sits awkwardly beside the current practice of managers handing over sign-in details.' },
  { id:'phone', when:'day1', name:'Order a phone', opens:'Day 1, optional', note:'If your role needs one', icon:'mobile.svg', marker:'A-40',
    expl:'Ordered on or after Day 1, and only if your role needs one.',
    dnote:'Keeping it out of pre-boarding is a choice, not an oversight.' },
  { id:'benefits', when:'week1', name:'Benefits enrolment', opens:'Your first week', marker:'A-69',
    note:'One link, straight to the right enrolment site for your country', icon:'shield-check.svg',
    expl:'Opens in your first week. The task links you straight to the enrolment site for your country, so there is nothing to look up and nothing to prepare before then.',
    dnote:'Q4 scope, per the September meetings: Benefacts countries with links ready by the end of October, and PlanSource for the US. Darwin countries follow from Q1, quarter by quarter.' },
  { id:'infogov', when:'week1', name:'Information governance', opens:'Your first week', note:'Short training on how Equinix handles information', icon:'file-alt.svg', marker:'A-21',
    expl:'Runs in your first week, once you have your Equinix account. It covers how we handle information here.' },
  { id:'workspace', when:'week1', name:'Complete your at-home workspace setup', opens:'No due date, optional', note:'', icon:'desktop.svg',
    expl:'Optional, with no due date. Nothing is waiting on you.',
    dnote:'Shipped exactly as the live portal has it, so optional behaviour is visible here.' },
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
  remove:    { label:'Remove',          cls:'remove',    hint:'This task should go' },
  undecided: { label:'Undecided',       cls:'undecided', hint:'Not enough is known to decide' },
  add:       { label:'Adds work',       cls:'add',       hint:'The only proposal that increases manager load' },
};

/* ---------- Who a manager can name (M-07 revised, M-26) ----------
   The direction is a plain list of people in the org, with no suggestion
   logic at all: "anybody can be a buddy" on first rollout, and the certified
   buddy programme is years out. One named role, plus everyone else.

     Buddy       within the team or function. Culture and logistics, and the
                 questions someone would rather not ask their manager.

   The cross-functional second role ("ambassador") was cut: one function-based
   buddy, and everyone else is simply someone to meet. The name never settled,
   it collided with the Employee Connection Networks, and carrying two named
   roles asked more of a manager than the programme can support on rollout. */
const PEOPLE_ROLES = {
  buddy:      { label:'Buddy', hint:'On their team or in their function' },
  other:      { label:'Someone to meet', hint:'Anyone else worth an early conversation' },
};

/* `tz` is required: the new hire's rail shows a buddy's working hours, and
   before this every one of these rendered "undefined" there. */
const ORG_PEOPLE = [
  { id:'nina',   name:'Nina Kowalski',  initials:'NK', role:'Senior Financial Analyst',   dept:'Global FP&A',        team:true, tz:'Chicago (CT), an hour ahead of you' },
  { id:'marcus', name:'Marcus Webb',    initials:'MW', role:'Senior Financial Analyst',   dept:'Global FP&A',        team:true, tz:'Denver (MT), your hours' },
  { id:'dana',   name:'Dana Kim',       initials:'DK', role:'Financial Analyst II',       dept:'Global FP&A',        team:true, tz:'Denver (MT), your hours' },
  { id:'tomas',  name:'Tomás Rivera',   initials:'TR', role:'Senior Financial Analyst',   dept:'Global FP&A',        team:true, tz:'Denver (MT), your hours' },
  { id:'aisha',  name:'Aisha Bello',    initials:'AB', role:'Manager, Corporate Accounting', dept:'Controllership',  tz:'Dallas (CT), an hour ahead of you' },
  { id:'ravi',   name:'Ravi Menon',     initials:'RM', role:'Director, Revenue Operations', dept:'Go-to-market',     tz:'Denver (MT), your hours' },
  { id:'elena',  name:'Elena Duarte',   initials:'ED', role:'Senior Manager, IBX Finance', dept:'Operations Finance', tz:'Miami (ET), two hours ahead of you' },
  { id:'tom',    name:'Tom Byrne',      initials:'TB', role:'Business Partner, Sales Finance', dept:'Commercial Finance', tz:'Denver (MT), your hours' },
  { id:'grace',  name:'Grace Lim',      initials:'GL', role:'Manager, FP&A Systems',      dept:'Finance Systems',    tz:'Singapore (SGT), 14 hours ahead of you' },
  { id:'yusuf',  name:'Yusuf Demir',    initials:'YD', role:'Manager, Treasury',          dept:'Corporate Finance',  tz:'Amsterdam (CET), eight hours ahead of you' },
  { id:'priyanka', name:'Priyanka Rao', initials:'PR', role:'Senior Analyst, Investor Relations', dept:'Finance',    tz:'Denver (MT), your hours' },
  { id:'lena',   name:'Lena Fischer',   initials:'LF', role:'Program Manager, Sustainability', dept:'Corporate Affairs', ecn:true, tz:'Frankfurt (CET), eight hours ahead of you' },
  { id:'sam',    name:'Samuel Adeyemi', initials:'SA', role:'Lead Engineer, Platform',    dept:'Digital Services',   ecn:true, tz:'London (GMT), seven hours ahead of you' },
];
const orgPerson = id => ORG_PEOPLE.find(p => p.id === id);

/* ---------- The machines a new hire can be issued (A-60) ----------
   The new hire picks, not the manager. Most roles map to exactly one build
   from role and location, and that new hire confirms rather than chooses;
   some roles, engineering and design among them, carry a real choice.

   Model names and specifications here are ILLUSTRATIVE. The approved
   catalogue lives with End User Technology and has not been supplied, so
   these are plausible stand-ins that let the screen be reviewed, not a
   statement of what Equinix issues. */
const DEVICE_CATALOG = [
  { id:'win-std', name:'Standard Windows laptop', sub:'14-inch business ultrabook', family:'win',
    lead:'In stock, ships in 3 days', leadOk:true,
    fits:'The default build. Email, the finance stack, browser work and calls.',
    specs:[['Processor','Intel Core Ultra 5'],['Memory','16 GB'],['Storage','512 GB SSD'],
           ['Display','14-inch, 1920 × 1200'],['Weight','1.4 kg'],['Ports','2 × Thunderbolt 4, HDMI, USB-A']] },
  { id:'win-hp', name:'High-performance Windows laptop', sub:'15-inch mobile workstation', family:'win',
    lead:'In stock, ships in 5 days', leadOk:true,
    fits:'Large models, heavy data work, anything that has to run locally.',
    specs:[['Processor','Intel Core i7'],['Memory','32 GB'],['Storage','1 TB SSD'],
           ['Graphics','Discrete workstation GPU'],['Display','15.6-inch, 1920 × 1200'],['Weight','1.8 kg']] },
  { id:'mac', name:'MacBook Pro 14', sub:'Apple silicon, mid tier', family:'mac',
    lead:'Backordered, 18 days', leadOk:false,
    fits:'Design, and engineering teams building for Apple platforms.',
    specs:[['Chip','Apple silicon, 12-core'],['Memory','24 GB unified'],['Storage','512 GB SSD'],
           ['Display','14-inch Liquid Retina XDR'],['Weight','1.6 kg'],['Ports','3 × Thunderbolt, HDMI, SDXC']] },
  { id:'mac-hp', name:'MacBook Pro 16', sub:'Apple silicon, top tier', family:'mac',
    lead:'Built to order, 12 days', leadOk:true,
    fits:'Sustained heavy workloads. Carries a justification on the order.',
    specs:[['Chip','Apple silicon, 16-core'],['Memory','48 GB unified'],['Storage','1 TB SSD'],
           ['Display','16-inch Liquid Retina XDR'],['Weight','2.1 kg'],['Ports','3 × Thunderbolt, HDMI, SDXC']] },
];
const deviceById = id => DEVICE_CATALOG.find(d => d.id === id) || null;

/* One drawing, tinted per family. Brand illustration system: flat shapes,
   a single linear gradient, thin light wireframes, nothing decorative. */
function deviceArt(family) {
  const g = family === 'mac' ? ['#00408C','#00737A'] : ['#00305F','#086AE3'];
  const uid = 'dev' + family;
  return `
  <svg viewBox="0 0 200 128" aria-hidden="true" class="dev-svg">
    <defs>
      <linearGradient id="${uid}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${g[0]}"/><stop offset="100%" stop-color="${g[1]}"/>
      </linearGradient>
    </defs>
    <rect x="40" y="10" width="120" height="82" rx="6" fill="url(#${uid})"/>
    <rect x="46" y="16" width="108" height="70" rx="3" fill="rgba(255,255,255,.10)"/>
    <g stroke="rgba(255,255,255,.5)" stroke-width="1.2" fill="none" stroke-linecap="round">
      <path d="M56 34 H116 M56 46 H134 M56 58 H100 M56 70 H124"/>
    </g>
    <circle cx="140" cy="27" r="4.5" fill="#85F0F8" opacity=".9"/>
    <path d="M34 92 H166 L180 108 H20 Z" fill="var(--nickel)"/>
    <path d="M34 92 H166 L168 95 H32 Z" fill="var(--chrome)"/>
    <rect x="88" y="99" width="24" height="3" rx="1.5" fill="rgba(0,0,0,.20)"/>
  </svg>`;
}

/* Default software stack for H-05. Cannot resolve without a persona (M-04 / OI-04) */
const SOFTWARE_CATALOG = [
  'Anaplan', 'Tableau', 'Power BI', 'Alteryx', 'Workday Adaptive Planning',
  'Bloomberg Terminal', 'Salesforce', 'Coupa',
];

/* Day 1 calendar holds for H-08 (M-06) */
const DAY1_HOLDS = [
  { id:'nho', label:'New Hire Orientation', time:'09:00 to 13:00',
    auto:true, blueprint:true, note:'Set by People Experience for your office, so you can’t move it.' },
  { id:'oneToOne', label:'Pick up your new hire, 1:1', time:'13:00 to 14:00',
    auto:true, locked:true, note:'Automatically placed, one hour, immediately after orientation ends. You can reschedule it, but not delete it.' },
  { id:'teamIntro', label:'Team introduction', time:'14:30 to 15:00', auto:false },
];

/* Two holds came off Day 1.

   IT setup: there is no designated setup window, because IT is not
   committing to one. The new hire sets the machine up themselves and the
   help desk is available all day, so the pointer belongs in their checklist
   rather than as an hour in the manager's calendar.

   Buddy check-in: moved to the days after Day 1. Day 1 is already full, and
   a buddy conversation lands better once there is something to ask about. */
const AFTER_DAY1_HOLDS = [
  { id:'buddy', label:'Buddy check-in', when:'Day 2 or 3',
    note:'Booked once the buddy accepts. Day 1 is full enough, and it works better once they have questions.' },
];

/* Teams channels and distribution lists for H-12 */
const CHANNEL_SUGGESTIONS = [
  'Global FP&A, team channel', 'Finance All-Hands, distribution list',
  'FP&A Analysts, Teams channel', 'Denver Office, distribution list',
];

/* Welcome email boilerplate for H-10 (M-08) */
/* Three tones for the same note (M-31). The point of pre-filling this is to
   save the manager writing it; the point of offering tones is that a
   pre-filled note which does not sound like the sender is worse than none.
   Same facts in each, different register. */
const WELCOME_TEMPLATES = [
  { id:'warm', label:'Warm', hint:'Friendly and personal. Most managers, most hires.',
    body:`Hi Jordan,

Welcome to Equinix. I'm really glad you're joining us, and the team is looking forward to meeting you.

Before your first day you'll get access to an onboarding portal with a short list of things to work through. None of it should take long, and it tells you what's needed and by when.

If anything is unclear before you start, just reply to this and I'll pick it up.` },

  { id:'brief', label:'Brief', hint:'Short and practical. Says what happens next and stops.',
    body:`Hi Jordan,

Welcome to Equinix.

You'll get access to an onboarding portal before your first day. It has a short list of things to complete, with due dates.

Reply here if anything is unclear.` },

  { id:'formal', label:'Formal', hint:'More measured. Senior hires, or where it is the house style.',
    body:`Dear Jordan,

Welcome to Equinix. We are pleased that you have chosen to join us.

Ahead of your start date you will be given access to an onboarding portal containing a short set of tasks to complete. Each one indicates what is required and the date by which it is needed.

Should anything require clarification before you start, please reply to this message and I will address it.` },
];
const WELCOME_BOILERPLATE = WELCOME_TEMPLATES[0].body;

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
  { id:'M-01', side:'hm', group:'retired', prov:'UAT', screen:'Equipment for your new hire', route:'#/hm/computer',
    assumed:'The manager ORDERS the computer today. This is not a confirmation step, and nothing moves until they do it.',
    resolve:'Decided: equipment selection moved to the new hire (A-60), so the manager no longer orders anything. This was the heaviest row on the manager’s list and its removal is the single largest saving in the subtraction review. What replaces it is an awareness screen recommended for deletion, because the readiness view already carries the status. Still to write: the exception path, for a role needing a machine outside its mapped build, an order landing after the start date, or a cost needing approval.', oi:'OI-24' },
  { id:'M-02', side:'hm', group:'blocks', prov:'ASSUMED', screen:'Readiness view', route:'#/hm/',
    assumed:'REVISED. Two numbers, not one: your tasks as a figure in the hero, their tasks as a segmented ring below it, each captioned with whose work it counts. Other teams report status only, with no progress bar.',
    resolve:'One combined percentage could not answer the first question a manager asks, which is whether the number is about them or about the new hire. Other teams came out of the count because they will not be users in this system, so there is nothing to count and the manager does not need their progress task by task. Still undefined: weighting, and what a good score even is.', oi:'OI-02' },
  { id:'M-03', side:'hm', group:'blocks', prov:'ASSUMED', screen:'Readiness view', route:'#/hm/',
    assumed:'The manager sees the new hire’s task names and status, but never task content. Sensitive tasks report status only.',
    resolve:'The walkthrough’s cross-persona visibility principle and the Decision Log’s caution point in different directions, and the persona-by-section visibility matrix is unwritten. This is the conservative reading. Argue it before build.', oi:'OI-03' },
  { id:'M-04', side:'hm', group:'blocks', prov:'1:1', screen:'Software stack', route:'#/hm/software',
    assumed:'H-05 is drawn in its blocked state. The persona cannot be resolved, so the default stack is empty.',
    resolve:'No full personas list exists in ServiceNow, and the job-family fallback under discussion is the approach the requirements analysis rejects as inaccurate. Two things have since changed the question. Phase one may carry no software provisioning at all, which would make this screen premature rather than blocked. And an application rationalisation is running, so the list of applications to provision is itself moving. Also unanswered: how access is actually granted, whether that is tied to the person through the identity layer or to the machine, because it decides whether this belongs beside the hardware order at all.', oi:'OI-04' },
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
    resolve:'The real catalogue, its options, its regional variants and its actual lead times belong to the End User Technology team, and these values are illustrative. The harder point is that there is no integration behind them: nothing in the portal knows whether a model is in stock or how long the supplier will take, so a lead time shown here is a promise nobody can keep yet. Either wire it or stop showing a number.', oi:'' },

  /* ---------- Design choice ---------- */
  { id:'M-05', side:'hm', group:'design', prov:'ASSUMED', screen:'Start logistics', route:'#/hm/logistics',
    assumed:'The orientation blueprint is authoritative. Location facts are read-only; the manager only supplies what the blueprint cannot know.',
    resolve:'The workflow file asks when manager-provided details should override the blueprint. Read-only is the conservative default. If override is intended, the UI has to make precedence visible, or the two sources will quietly disagree.', oi:'OI-05' },
  { id:'M-06', side:'hm', group:'design', prov:'UAT', screen:'Day 1 calendar', route:'#/hm/calendar',
    assumed:'The Day 1 one-to-one is auto-created and can be rescheduled but not deleted. The other holds are suggestions the manager accepts.',
    resolve:'Automatic placement is specified for the one-to-one only. Whether the remaining holds auto-create is undecided, and it is the single biggest lever on how much work this screen represents.', oi:'OI-13' },
  { id:'M-07', side:'hm', group:'design', prov:'ASSUMED', screen:'Assign a buddy', route:'#/hm/buddy',
    assumed:'REVISED. No suggestions at all. A plain list of people in the org, because on first rollout anybody can be a buddy. The capacity warning and the withheld performance signal are both gone with it.',
    resolve:'The earlier design suggested a buddy and hid why. The direction is simpler and it removes the privacy problem entirely: pick from everyone in the function, and revisit suggestion logic when a certified buddy programme exists, which is years out rather than months. What is still undefined is the decline process, which now matters more because acceptance is a real step (M-27).', oi:'OI-10' },
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
  { id:'M-24', side:'hm', group:'blocks', prov:'PRIOR', screen:'Equipment', route:'#/equipment',
    assumed:'CONFLICT, unresolved. The mockup dates the equipment order at Day −7 and states a lead time of 5 to 7 business days.',
    resolve:'Seven business days from Day −7 lands after the start date. Either the due date is wrong, the lead time is wrong, or the automatic loaner is not an edge case but the normal outcome. Moving the order to the new hire (A-60) does not fix this, it moves it: the same collision now sits on a task owned by someone with no way to escalate it. It appears on the manager’s "waiting on Jordan" list rather than their blockers, because they cannot act on it either.', oi:'' },
  { id:'M-25', side:'hm', group:'blocks', prov:'PRIOR', screen:'Software stack', route:'#/hm/software',
    assumed:'CONFLICT, unresolved. This prototype draws the application stack blocked, because no persona resolves. The mockup shows eight applications auto-assigned from the job family in Workday, with the manager reviewing rather than building the list.',
    resolve:'The platform owner said no full persona list exists and that the job-family fallback is the approach the requirements analysis rejects as inaccurate. The mockup shows that fallback working. One of the two is out of date. This is the single biggest difference between the two manager screens, and it decides whether this task is a review or a data-entry job.', oi:'OI-04' },
  { id:'M-26', side:'hm', group:'retired', prov:'1:1', screen:'Name who they should meet', route:'#/hm/buddy',
    assumed:'Two named roles, not one. A buddy on the team or in the function, and a second cross-functional person who helps the new hire navigate and connect. Expected for executive hires, optional for everyone else, and one screen covers both plus anyone else worth meeting.',
    resolve:'Decided: one function-based buddy, and the cross-functional role is removed. It never got an agreed name, “ambassador” collided with the Employee Connection Networks, and two named roles asked more of a manager than the buddy programme can carry on first rollout. Anyone who would have been an ambassador is now simply someone to meet. The role may return once the programme is written.', oi:'' },
  { id:'M-27', side:'hm', group:'blocks', prov:'1:1', screen:'Name who they should meet', route:'#/hm/buddy',
    assumed:'Naming someone is a request, not an assignment. They are asked, they accept, and only then is anything booked. Once accepted, the system reads their calendar and books the first month.',
    resolve:'“Assigned and approved and committed” is the bar, and this prototype only draws the first half. The booking side needs a calendar integration nobody has scoped, and the acceptance step needs a decision on what happens when someone says no three days before a start date.', oi:'' },
  { id:'M-28', side:'hm', group:'design', prov:'1:1', screen:'Readiness view', route:'#/hm/',
    assumed:'Overdue is its own state and it is loud. Anything past its date and still open appears in red above everything else, with a route straight to the task.',
    resolve:'The earlier version of this screen folded overdue items into a general attention list, on the assumption that a manager has enough control to work it out. That is too much credit. Managers are doing their own job alongside this, so a risk to Day 1 has to be unmissable. The open question is the other half of the same balance: how far to go before the screen is telling an experienced manager how to do their job.', oi:'' },
  { id:'M-30', side:'hm', group:'blocks', prov:'ASSUMED', screen:'Manager tasks', route:'#/hm/',
    assumed:'The manager’s list runs past the start date: Day 1, first week and first month phases, carrying meeting the new hire, agreeing the 30/60/90 plan, an end-of-week check-in and a first-month review.',
    resolve:'Everything a manager owed was drawn as pre-Day 1, which made the after-start half of the job invisible. These four are proposed, not sourced: no document says a manager owes them, where the 30/60/90 plan lives, or whether this portal owns anything after the start date at all. The first-month review should be designed alongside the day 30 survey, since they ask the same question a week apart.', oi:'' },

  { id:'M-31', side:'hm', group:'content', prov:'1:1', screen:'Send a welcome note', route:'#/hm/welcome',
    assumed:'Three tones for the same note: warm, brief and formal. Same facts, different register. Switching replaces the draft; the personal line survives.',
    resolve:'Pre-filling the note is most of the saving, but a pre-filled note that does not sound like the sender is worse than none, which is the argument for tones. Open: whether three is the right number, whether the set should vary by region or seniority, and whether a manager’s choice should be remembered for their next hire.', oi:'' },

  { id:'M-32', side:'hm', group:'blocks', prov:'ASSUMED', screen:'Confirm the first-day details', route:'#/hm/logistics',
    assumed:'People Experience own the orientation blueprint. When they change it, the manager’s confirmation goes stale, the task reopens and it is raised as a blocker.',
    resolve:'The two-portal picture has a third party in it. Nothing specifies what happens when People Experience edit a blueprint a manager has already confirmed against: whether the task reopens, whether the manager is told, or what the new hire sees in the gap. This prototype reopens it and says so, which is the strict reading. The softer one, updating silently because the blueprint is authoritative anyway, is arguable and cheaper.', oi:'' },

  { id:'M-33', side:'hm', group:'design', prov:'1:1', screen:'Set up their first day', route:'#/hm/calendar',
    assumed:'No IT setup window on Day 1. The new hire sets the machine up themselves, the help desk is open all day, and the pointer sits in their checklist rather than the manager’s calendar. The buddy check-in moves to Day 2 or 3.',
    resolve:'IT would not commit to a designated setup window, so an hour booked against them was a promise nobody had made. The buddy move is a judgement: Day 1 is full, and the conversation lands better once there is something to ask about. Neither is sourced beyond the conversation they came from.', oi:'' },

  { id:'M-29', side:'hm', group:'blocks', prov:'1:1', screen:'Not built', route:null, nolink:true,
    assumed:'There is a third portal. People Experience need their own view: every pending start at once, and the ability to open one hire and see roughly what that hire sees.',
    resolve:'Named as the next thing to design. It matters because the problem statement is that nobody has visibility at any point, and this prototype currently answers that for two of the three people who need it. What People Experience actually validate, background check clearance among them, has to be settled before the view can be drawn.', oi:'' },
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
    resolve:'The requirement says the portal updates dependent due dates and tasks. It does not say who approves the change, how late it can be requested, or what happens to work already in flight: an order placed, a badge queued for print, a calendar hold booked. Two consequences have since been named. The request lands on People Experience rather than on the manager, and the offer letter has to be reissued, which puts a document outside this portal on the critical path of a date change made inside it.', oi:'' },
  { id:'L-03', side:'link', group:'design', prov:'ASSUMED', screen:'Manager contact → new hire', route:'#/hm/',
    assumed:'The manager’s confirmed contact details feed the card the new hire sees, and the manager is explicitly told the new hire can reach them before Day 1.',
    resolve:'Pre-hire contact scope is not settled in any source, and nothing on the manager’s side tells them the new hire has their details, or sets any expectation about responding.', oi:'OI-23' },
  { id:'L-04', side:'link', group:'design', prov:'UAT', screen:'Equipment → both sides', route:'#/hm/computer',
    assumed:'Both sides read one equipment table. The new hire’s computer choice and their accessories order update the same three rows, and the manager reads the result.',
    resolve:'Confirmed in the live product, though the direction has since reversed: both orders are now the new hire’s (A-60), so this join runs new hire to manager rather than the other way. The value of it is unchanged: “where is my equipment?” is answered identically on both screens, naming the same person and the same unblocking task.', oi:'' },
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
  { id:'L-13', side:'link', group:'design', prov:'ASSUMED', screen:'Sidekick → Help requests', route:'#/handoffs',
    assumed:'A question passed from Sidekick to a person appears in the coordinator’s Help requests queue for that hire, with the question attached, and on the handoffs screen.',
    resolve:'The prototype wires the one handoff the AI layer has to a human into the queue that already exists, rather than a new inbox. Whether People Operations or the coordinator works it first is open with the operating model (A-72).', oi:'' },
];

HM_ASSUMPTIONS.forEach(a => ASSUMPTIONS.push(a));
LINK_ASSUMPTIONS.forEach(a => ASSUMPTIONS.push(a));


/* ---------- People Experience coordinator (third portal) ----------
   From PEX_Coordinator_Portal_UI_Spec.xlsx. That workbook is explicit
   that it is a strawman written before the PEX team were asked what
   they need, and that roughly two thirds is inference. The provenance
   is carried here so a reviewer can see which parts are guesses. */
const PEX_ASSUMPTIONS = [
  { id:'X-00', side:'pex', group:'blocks', prov:'ASSUMED', screen:'Today, what needs you', route:'#/pex/',
    assumed:'The coordinator lands on an exception queue, not a list: every hire that is late, blocked, unassigned or escalated, with the reason and a route to act. Twelve working queues, each with its own trigger.',
    resolve:'The largest single inference in the spec. The persona table says only "PEX dashboard with all new hires, filterable"; exception-first triage is derived from caseload logic, not a stated need. It is built because being told it is wrong is faster than a blank page, and because Janine\u2019s samples back it: the MangoApps hub leads with "Needs Your Attention" above the full list. If the PEX team say a plain list is what they want, this screen collapses into the caseload list. See OI-04.', oi:'OI-04' },

  { id:'X-01', side:'pex', group:'content', prov:'PRD', screen:'Caseload list', route:'#/pex/caseload',
    assumed:'A filterable list of every hire the coordinator owns, with saved public or private views, and a column naming what each hire is waiting on and who holds it.',
    resolve:'The one screen in the workbook with an unambiguous source: PRD Section 2 persona table for the list, PRD 3.6 for the eight filters and for multiple public or private views. Column choice is not specified anywhere. The "waiting on" column is the argument worth having, because it turns a status list into a work list; the Freshservice sample implements exactly that, down to per-party reminder state. What is not settled is behaviour at real caseload size. See OI-01.', oi:'' },

  { id:'X-02', side:'pex', group:'content', prov:'UAT', screen:'Individual hire record', route:'#/pex/caseload',
    assumed:'One record carrying the new hire\u2019s tasks, the manager\u2019s tasks and the other teams\u2019 tasks side by side, plus equipment, activity and the outstanding items.',
    resolve:'Modelled on the live HR case (HRC0943697), which already carries the new hire, hiring manager, start date and an equipment table with per-item blockers. What it does not carry today, and what this screen adds, is consolidated status across all five owning teams in one place. The proposal is to extend that record rather than invent a new object. See OI-03.', oi:'OI-03' },

  { id:'X-05', side:'pex', group:'content', prov:'PRD', screen:'Orientation blueprints', route:'#/pex/blueprints',
    assumed:'Per-location orientation content, editable only by People Experience, feeding the new hire\u2019s first-day details and the manager\u2019s Day 1 confirmation.',
    resolve:'PRD S3-US06 makes blueprints prebuilt per location, editable only by PEX, and the source of the Day 1 agenda, schedule, location and lunch. The capability is sourced; the editing interface is not. Note the dependency this creates: publishing a change reopens the manager\u2019s confirmed task and changes what the new hire is told, which is the M-32 conflict seen from the other end.', oi:'' },

  { id:'OI-01', side:'pex', group:'blocks', prov:'ASSUMED', screen:'Caseload list', route:'#/pex/caseload',
    assumed:'Twenty-four hires in flight for one coordinator. Switchable from the prototype controls, because the real number changes the design.',
    resolve:'THE question. The spec says it decides the entire shape: at five hires a filterable list is the home screen and triage is unnecessary; at fifty the list is unusable and triage is the only viable home screen. Nothing in any source gives the number. The closest thing to an answer is the Freshservice sample Janine circulated, which shows 257 open onboarding requests across 300 pages \u2014 many, not five. The onboarding dashboard holds the start-date distribution, which would give volume by period if headcount per coordinator were also known.', oi:'OI-01' },

  { id:'OI-07', side:'pex', group:'blocks', prov:'ASSUMED', screen:'Individual hire record', route:'#/pex/caseload',
    assumed:'The coordinator sees THAT a sensitive item was provided and when, never its content. Identity documents, emergency contacts, voluntary self-identification, banking and which policies were acknowledged all show as complete without showing what was entered.',
    resolve:'The middle of three defensible readings. The other two are that the coordinator sees everything the new hire sees, which is what the MangoApps sample implements as "View Portal" and what the brief\u2019s "highest level of admin" implies, or that they see exactly what the manager sees, which is the conservative position the new hire spec already took. The coordinator\u2019s role plausibly justifies more than the manager\u2019s, but plausibly is not an access model. The persona and content visibility matrix is unwritten for every persona, not just this one.', oi:'OI-07' },

  { id:'OI-06', side:'pex', group:'blocks', prov:'PRD', screen:'All coordinator screens', route:'#/pex/',
    assumed:'Readiness is shown as a plain count of what is done over what is assigned, the same as the manager sees, rather than a score.',
    resolve:'Readiness appears on every screen in the coordinator spec and is the most-used concept in it. PRD 3.6 requires readiness scoring surfaced per persona; neither it nor Section 2 defines composition, weighting or thresholds. The same gap blocks the manager\u2019s readiness view, so the two are kept consistent rather than inventing a formula on the third portal.', oi:'OI-06' },

  { id:'OI-02', side:'pex', group:'blocks', prov:'PRIOR', screen:'Boundary', route:null, nolink:true,
    assumed:'This portal answers "what do I do next" \u2014 named individuals, live status, actions taken from the screen. The Tableau PEX Ops view answers "how are we doing" \u2014 trends, SLA attainment, volumes.',
    resolve:'Two things are called the PEX dashboard. The Onboarding Dashboard planning workbook already defines three Tableau views including PEX Ops, destined for the Workforce Intelligence team; this is an operational portal in ServiceNow. Analysis versus action is the proposed distinction and nobody has ratified it. Readiness scoring, SLA timestamps and the filter set appear in both, which is normal until both try to be the place a coordinator starts their day.', oi:'OI-02' },

  { id:'OI-05', side:'pex', group:'design', prov:'ASSUMED', screen:'Not built', route:null, nolink:true,
    assumed:'Coordinator task queues grouped by task type rather than by hire \u2014 all pending Right to Work validations together, all background check verifications together \u2014 are deliberately not built.',
    resolve:'The spec proposes them on the judgement that the same action repeated twenty times is faster than opening twenty records. That is an assumption about how coordinators actually work, and an hour of watching someone work would settle it. Until it is settled, building the screen would be guessing twice. The nudge digest and a dedicated escalations screen are held back for the same reason: the spec argues the second is probably just a saved filter on the existing case list.', oi:'OI-05' },
];
PEX_ASSUMPTIONS.forEach(a => ASSUMPTIONS.push(a));

const SIDE_LABELS = {
  nh:   { label:'New hire',   short:'NH' },
  hm:   { label:'Manager',    short:'HM' },
  pex:  { label:'Coordinator', short:'PEX' },
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
