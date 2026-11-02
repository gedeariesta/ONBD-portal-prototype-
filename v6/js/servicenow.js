/* ============================================================
   ServiceNow today, rethought (v6)

   Every feature in the current ServiceNow onboarding walkthrough (Fernanda
   Casadio, January 2026), read as a feature and not as a procedure: what it
   lets someone do, not the steps ServiceNow puts them through to do it.
   Janine, 30 Oct: "do not put any weight on anything in ServiceNow today …
   what you've designed in the prototype, that is what I want." So nothing
   here copies how ServiceNow works. Each entry says where the feature lives
   in this prototype now, or why it does not.

   Each feature is pinned to the screen where it lives by a marker (SN-nn),
   shown with the "ServiceNow markers" switch. Markers are placed after each
   render by finding the anchor text on the page, so the screens themselves
   carry no ServiceNow bookkeeping.

   Loaded after sidekick.js and before app.js. Declarations only at load
   time; everything that reads S, $ or ic runs at call time.
   ============================================================ */

'use strict';

const SN_SOURCE = 'ServiceNow onboarding walkthrough, Fernanda Casadio, January 2026';

/* What became of each feature. */
const SN_VERDICTS = {
  here:   { label:'Rethought here',   hint:'The feature stays, designed again from what it is for' },
  merged: { label:'Folded in',        hint:'Still happens, inside something else, so it is no longer its own task' },
  drop:   { label:'Proposed to drop', hint:'Nobody needs it, or something better replaced it' },
  ask:    { label:'Open question',    hint:'Not decided. The entry says who decides' },
  beyond: { label:'Not drawn here',   hint:'After the first week, or owned by a single team. Kept on the list so nothing is lost' },
};

/* ServiceNow groups tasks into stages that open on a schedule. */
const SN_SETS = [
  { id:'case',  title:'Across every stage',     opens:'The onboarding case and the screens around it' },
  { id:'ready', title:'Get ready for Day 1',     opens:'Opens when the hire is completed in Workday' },
  { id:'final', title:'Final preparations',      opens:'Opens 72 hours before Day 1' },
  { id:'day1',  title:'Your first day',          opens:'Opens on Day 1' },
  { id:'week1', title:'Your first week',         opens:'Opens on Day 2' },
  { id:'month1',title:'Your first month',        opens:'Also opens on Day 2' },
  { id:'q1',    title:'Your first quarter',      opens:'Day 61, Global IT managers only' },
];

/* route + find: where the marker goes. find is text on that screen, inside
   one run of text (not split by bold or a link), and alt is a fallback for
   when that text is not on screen yet. No route means the feature
   has nowhere to live in this prototype, which the verdict explains. */
const SN_FEATURES = [
  /* ---------- the case itself ---------- */
  { id:'SN-01', set:'case', who:'Everyone', slides:'2, 26, 37, 53, 63',
    feature:'Tasks arrive in stages, each opening on a schedule',
    today:'Five stages, from “Get ready for Day 1” to “Your first month”, each opening at a fixed point and listing its tasks one after another.',
    verdict:'here', route:'#/', find:'Opens on its own before Day 1',
    here:'Every date is worked out from the start date, and things open on their own when they are due. The new hire sees three things before Day 1, not a stage of tasks.' },
  { id:'SN-02', set:'case', who:'Everyone', slides:'2',
    feature:'Onboarding starts when the hire is completed in Workday',
    today:'The case is created when the Hire process finishes in Workday.',
    verdict:'here', route:'#/pex/', find:'Caseload',
    here:'The same trigger. The new hire’s record and the coordinator’s caseload both start from the Workday hire, so nobody keys anything in twice.' },
  { id:'SN-03', set:'case', who:'Everyone', slides:'2',
    feature:'Who onboarding covers',
    today:'Interns and apprentices are out of scope.',
    verdict:'beyond', route:null,
    here:'The process tree covers every hire type on one journey, greying out the steps that do not apply (from Camille’s emerging talent requirements). This prototype draws employees and conversions.' },
  { id:'SN-04', set:'case', who:'New hire', slides:'5, 65',
    feature:'See progress, stage by stage',
    today:'A timeline of stages on the left, each with “0 of 3 to-dos completed”.',
    verdict:'here', route:'#/', find:'Ready for Day 1?',
    here:'Progress is shown by outcome (background check, equipment, workspace, people, paperwork) whoever owns the step, not by stage. The old stage view is kept one click away to compare.' },
  { id:'SN-05', set:'case', who:'New hire', slides:'5, 13',
    feature:'Filter and sort the to-do list',
    today:'Filters for who it is assigned to, required or optional, and a sort order.',
    verdict:'here', route:'#/', find:'Optional, if you have time',
    here:'With three things to do before Day 1 there is nothing to filter. Optional things sit in their own group, and things another team finishes are listed apart.' },
  { id:'SN-06', set:'case', who:'New hire and manager', slides:'5, 13',
    feature:'See where each piece of equipment is',
    today:'An “Equipment orders” table on the case: computer, accessories and mobile phone, with “NOT ORDERED YET” and what to do about it.',
    verdict:'here', route:'#/hm/', find:'The same table Jordan sees',
    here:'The same table, shared by the new hire and the manager, saying in words who it is waiting on.' },
  { id:'SN-07', set:'case', who:'Manager', slides:'13, 15',
    feature:'A history of the case, and files attached to it',
    today:'Activity and Attachments tabs on every task.',
    verdict:'drop', route:'#/hm/', find:'Status only, never what they entered',
    here:'The manager sees status, never what the new hire entered. The history lives on the coordinator’s record of the hire, where someone reads it.' },
  { id:'SN-08', set:'case', who:'Everyone', slides:'5, 14, 29, 33',
    feature:'Due dates and reminders',
    today:'Each task has a due date. Some send the same reminder every day until done.',
    verdict:'here', route:'#/', find:'Three things, then you’re ready',
    here:'Due dates come from the start date and lead times. Reminders come from Sidekick, once and in context, instead of the same email every day.' },
  { id:'SN-09', set:'case', who:'Manager', slides:'15',
    feature:'Hand a task to someone else',
    today:'“Delegate this task” on each manager task.',
    verdict:'ask', route:'#/hm/logistics', find:'Confirm the first-day details',
    here:'A Day 1 stand-in can be named for the first-day details. A standing stand-in who can act across the whole onboarding needs a permission model nobody has written yet (M-20). People Experience to decide.' },
  { id:'SN-10', set:'case', who:'Everyone', slides:'13, 15',
    feature:'Tell the onboarding team something is wrong',
    today:'A “Make a suggestion” button in the footer of every page.',
    verdict:'here', route:'#/', find:'Deadlines, forms and anything personal stay in your task list',
    here:'Sidekick asks whether each answer was right, and “Talk to a person” is always one tap away, landing in the coordinator’s help requests.' },
  { id:'SN-11', set:'case', who:'New hire and manager', slides:'10, 23, 30, 36, 50, 60',
    feature:'Emails at each stage',
    today:'An email as each stage opens. The new hire gets their username in one email and a temporary password in another; the manager gets advice to call, book a lunch and connect on LinkedIn.',
    verdict:'here', route:'#/hm/', find:'Deadlines, forms and anything personal stay in your task list',
    here:'The new hire hears from Sidekick on Paradox, where their candidate journey already ran. The manager hears from Sidekick in Teams. No password is ever sent by email.' },

  /* ---------- get ready for Day 1 ---------- */
  { id:'SN-12', set:'ready', who:'New hire', slides:'4',
    feature:'A welcome page with links about Equinix',
    today:'Links to the welcome video, “Celebrate your career move”, the inclusion and culture pages, Get Support and Workday.',
    verdict:'here', route:'#/', find:'You’ve joined a team that connects much more than technology.',
    here:'A welcome screen with the welcome video, an “Inside Equinix” strip that tells the story in short chapters, and Sidekick for support.' },
  { id:'SN-13', set:'ready', who:'New hire', slides:'6',
    feature:'Choose a computer and keyboard',
    today:'Laptop and keyboard preferences, offered when Day 1 is more than 15 days away. The keyboard choice is broken today.',
    verdict:'here', route:'#/equipment', find:'Early on your list, so there’s time to build it',
    here:'The new hire picks from the builds their role allows, or sees the one build it maps to, with the wait time shown before they choose.' },
  { id:'SN-14', set:'ready', who:'New hire', slides:'6, 7',
    feature:'Say where the equipment goes',
    today:'“Ship to your office address?” If no, any address can be typed in.',
    verdict:'here', route:'#/equipment', find:'An Equinix location, or the home address on your record.', alt:'Your computer and your accessories are both yours to pick.',
    here:'Changed in v6 (Janine, 30 Oct): an Equinix location or the home address on record, nothing else. Interns, and Senior Directors and above, can name another address. It stops laptops going to addresses Equinix does not know.' },
  { id:'SN-15', set:'ready', who:'New hire', slides:'7',
    feature:'Order accessories for working at home',
    today:'A separate task: a headset, or a headset plus other accessories, with its own address question.',
    verdict:'merged', route:'#/equipment', find:'Accessories for working from home',
    here:'Part of choosing equipment, on the same screen and the same order, with one address.' },
  { id:'SN-16', set:'ready', who:'Manager', slides:'6',
    feature:'The manager confirms the new hire’s computer choice',
    today:'Once the new hire submits, the manager gets a task to confirm it.',
    verdict:'drop', route:'#/hm/computer', find:'What Jordan chose',
    here:'No confirmation. The choice is already limited to what the role allows, so the manager sees it and nothing waits on them.' },
  { id:'SN-17', set:'ready', who:'New hire', slides:'8',
    feature:'Complete the Workday onboarding tasks',
    today:'A link out to Workday. Countries without Workday onboarding get a SharePoint link instead.',
    verdict:'here', route:'#/', find:'Address, emergency contact, bank and tax',
    here:'One Workday task on Day 1 for personal details, so nothing personal is collected twice. Open: what countries without Workday onboarding get.' },
  { id:'SN-18', set:'ready', who:'New hire', slides:'9',
    feature:'Find out about workplace adjustments and accommodations',
    today:'A task to read two articles, for US new hires and conversions only.',
    verdict:'ask', route:'#/equipment', find:'Need something different?',
    here:'A private line to the coordinator wherever equipment is chosen, for everyone. Open for People Experience: whether US hires also need the formal accommodations article as a step of its own.' },
  { id:'SN-19', set:'ready', who:'Manager', slides:'12, 13',
    feature:'A page per new hire for the manager',
    today:'“New Hire Onboarding – name” under My Requests and My Tasks, with the manager’s tasks listed one after another.',
    verdict:'here', route:'#/hm/', find:'yours done',
    here:'Sidekick in Teams first, with one checklist card. The portal is the full view, for when one chat is not enough, with every hire one tap apart.' },
  { id:'SN-20', set:'ready', who:'Manager', slides:'14',
    feature:'The hiring manager satisfaction survey',
    today:'A Glint survey sent as a task, with a reminder.',
    verdict:'here', route:'#/hm/', find:'Tell us how hiring Jordan went',
    here:'New in v6: on the manager’s Day 1 list, answered in Teams from Sidekick, with the final survey set’s questions and the recruiter already filled in (M-35).' },
  { id:'SN-21', set:'ready', who:'Manager', slides:'15, 16',
    feature:'Order equipment for the new hire',
    today:'The manager says whether the hire needs a computer and any role-specific hardware, then “Order Now” opens tickets for End User Technology.',
    verdict:'here', route:'#/hm/computer', find:'When a manager would step in',
    here:'The new hire orders first. If it is still not chosen 14 days before the start, the order comes to the manager (Janine, 30 Oct). Role-specific hardware is still open (M-17).' },
  { id:'SN-22', set:'ready', who:'Manager', slides:'17',
    feature:'Check the manager’s phone number',
    today:'A task to open Workday and check their own contact number.',
    verdict:'ask', route:'#/hm/', find:'Your contact details',
    here:'One tap, Still right or Change in Workday, in the checklist. It is probably there because the number goes in the new hire’s emails. Janine wants to challenge whether it is needed at all; People Experience to review.' },
  { id:'SN-23', set:'ready', who:'Manager', slides:'18',
    feature:'Choose a buddy',
    today:'A task to tick once done, with links to “role of a buddy” and the buddy programme.',
    verdict:'here', route:'#/hm/buddy', find:'Someone on Jordan’s team or in their function',
    here:'Pick someone from Jordan’s function. They are asked, and say yes before anything is booked. The buddy playbook replaces the links.' },
  { id:'SN-24', set:'ready', who:'Manager', slides:'19',
    feature:'Request apps and software',
    today:'Links to the app catalogue, a software installation form and E-Bot.',
    verdict:'ask', route:'#/hm/software', find:'Which applications Jordan has on their first day',
    here:'The apps come from the role, and the manager only adds or removes. Blocked until roles map to app lists. Janine: what happens to this information today is unclear, to go through with People Experience.' },
  { id:'SN-25', set:'ready', who:'Manager', slides:'20',
    feature:'Send a welcome email',
    today:'A task with a link to an email template article.',
    verdict:'here', route:'#/hm/welcome', find:'Already written. Add a line of your own',
    here:'The template is already written into the message. The manager adds a personal line and sends it.' },
  { id:'SN-26', set:'ready', who:'Manager', slides:'21',
    feature:'Arrange office seating',
    today:'“Please confirm office seating options for your new hire.”',
    verdict:'ask', route:'#/hm/logistics', find:'What we need from you is the part only you can answer',
    here:'Not in the process tree, and there may be no assigned seating any more. Janine to ask People Experience, then Workplace & Real Estate.' },
  { id:'SN-27', set:'ready', who:'Manager', slides:'22',
    feature:'Google Workspace access for some teams',
    today:'Only for Equinix Metal new hires, by cost centre.',
    verdict:'ask', route:'#/hm/software', find:'Choose Jordan’s apps',
    here:'If it is still needed, it is an app that comes with the role, not a manager task. To confirm with People Experience.' },
  { id:'SN-28', set:'ready', who:'Buddy', slides:'25',
    feature:'The buddy connects with the new hire',
    today:'A task for the buddy that only needs “complete”, with a link to the buddy programme.',
    verdict:'here', route:'#/hm/buddy', find:'A message from Sidekick in Teams that says what being a buddy means',
    here:'New in v6: the buddy gets a Sidekick message that says what to do before Day 1, on Day 1 and in the first month, and accepts from it (M-34).' },

  /* ---------- final preparations ---------- */
  { id:'SN-29', set:'final', who:'New hire', slides:'28',
    feature:'Set up a workspace at home',
    today:'A task with a link to an article.',
    verdict:'here', route:'#/', find:'Complete your at-home workspace setup',
    here:'In the first week, optional, with no due date.' },
  { id:'SN-30', set:'final', who:'New hire', slides:'29, 30',
    feature:'Get an Equinix username and password',
    today:'“Collect your Equinix credentials”, with a reminder every day, and a login link by email.',
    verdict:'here', route:'#/', find:'Your username and how to set your password',
    here:'Opens on its own the day before. How sign-in works is being designed separately (Brian, single sign-on).' },
  { id:'SN-31', set:'final', who:'Manager', slides:'32',
    feature:'Book a Day 1 meeting with the new hire',
    today:'A task to schedule it.',
    verdict:'here', route:'#/hm/calendar', find:'Your 1:1 is placed automatically',
    here:'The 1:1 is placed in the calendar automatically. The manager only looks.' },
  { id:'SN-32', set:'final', who:'Manager', slides:'33, 34',
    feature:'Give the new hire their username and password',
    today:'Two manager tasks, one with a reminder every day.',
    verdict:'drop', route:'#/hm/subtraction', find:'Provide the new hire’s username',
    here:'Gone. The new hire gets their own sign-in, and a manager should never handle someone else’s password.' },
  { id:'SN-33', set:'final', who:'Manager', slides:'35',
    feature:'Add the new hire to the team’s channels',
    today:'A task to add them to every relevant channel.',
    verdict:'here', route:'#/hm/', find:'One tap each. Neither needs a decision from you.',
    here:'The channels are suggested from the team. One tap adds them all.' },

  /* ---------- Day 1 ---------- */
  { id:'SN-34', set:'day1', who:'New hire', slides:'38',
    feature:'A Day 1 page with links',
    today:'Links to the welcome video, Employee Connection Networks, the org chart, ways of working and the Equinix values.',
    verdict:'merged', route:'#/', find:'Your first day, explained',
    here:'The Day 1 video stays. The rest comes from Sidekick in Teams when it is useful, instead of a page of links.' },
  { id:'SN-35', set:'day1', who:'New hire', slides:'40, 41, 42, 43',
    feature:'Set up apps, password and password manager',
    today:'Four tasks: set up basic apps, change your password, confirm your work apps, set up Keeper.',
    verdict:'merged', route:'#/', find:'You set up your own laptop, and the IT help desk is open all day',
    here:'One set of setup instructions that opens three days before, with the help desk open all of Day 1.' },
  { id:'SN-36', set:'day1', who:'New hire', slides:'44',
    feature:'Order a phone',
    today:'A Day 1 task, only in countries that offer it.',
    verdict:'here', route:'#/', find:'If your role needs one',
    here:'The same: optional on Day 1, if the role needs one, and listed in the equipment table so nobody wonders.' },
  { id:'SN-37', set:'day1', who:'New hire', slides:'45',
    feature:'Welcome to MyHR',
    today:'A task with a link to an article.',
    verdict:'drop', route:'#/', find:'About three things, most of them in person',
    here:'Janine wants it gone. Sidekick answers HR questions, and points to the article when it is the answer.' },
  { id:'SN-38', set:'day1', who:'New hire', slides:'46',
    feature:'Start enterprise training',
    today:'A Day 1 task with a link to the learning centre.',
    verdict:'here', route:'#/', find:'Short training on how Equinix handles information',
    here:'In the first week, with the training that is actually required named.' },
  { id:'SN-39', set:'day1', who:'New hire and manager', slides:'47, 48',
    feature:'Meet your manager, meet your buddy',
    today:'Two tasks to tick on Day 1.',
    verdict:'here', route:'#/hm/', find:'Meet Jordan and walk them in',
    here:'Meetings in the calendar, not tasks. Janine: these should not be things you tick.' },
  { id:'SN-40', set:'day1', who:'New hire', slides:'49',
    feature:'Bookmark DIO Central',
    today:'A Day 1 task for Global IT hires.',
    verdict:'beyond', route:null,
    here:'Content for one department. It belongs with that team’s own welcome, not the company onboarding.' },
  { id:'SN-41', set:'day1', who:'Manager', slides:'52',
    feature:'Introduce the new hire to stakeholders',
    today:'A Day 1 manager task.',
    verdict:'here', route:'#/hm/buddy', find:'Up to fifteen people',
    here:'Named before Day 1, each with a reason Jordan reads, so the introductions can be booked.' },

  /* ---------- first week ---------- */
  { id:'SN-42', set:'week1', who:'New hire', slides:'56',
    feature:'Tech onboarding',
    today:'A first-week task with a link to an article.',
    verdict:'merged', route:'#/', find:'Equipment setup instructions',
    here:'Part of the setup instructions, so there is one place for anything technical.' },
  { id:'SN-43', set:'week1', who:'New hire', slides:'57, 58',
    feature:'Learn the Equinix story, and how to talk about it',
    today:'Two courses: “The Platform Equinix story” and “How to talk about Equinix”.',
    verdict:'merged', route:'#/', find:'Inside Equinix',
    here:'Told before Day 1 in the Inside Equinix chapters, which is the part of preboarding meant to inspire. The courses can follow in the first month.' },
  { id:'SN-44', set:'week1', who:'New hire', slides:'59',
    feature:'Sign the media release form',
    today:'A task with a PDF on SharePoint.',
    verdict:'merged', route:'#/', find:'eight handbooks and a few notices',
    here:'Proposed: one more document in the single signing task, instead of a task of its own.' },
  { id:'SN-45', set:'week1', who:'Manager', slides:'62, 82, 83, 85',
    feature:'Checklist reminders for the manager',
    today:'Week 1 and Month 1 checklist reminders, for Global IT managers only.',
    verdict:'here', route:'#/hm/', find:'End of first week check-in',
    here:'Every manager gets their first week and first month on the same list as everything else. A department’s own checklist stays with that department.' },

  /* ---------- first month ---------- */
  { id:'SN-46', set:'month1', who:'New hire', slides:'67',
    feature:'Set priorities',
    today:'A task linking to Performance Every Day.',
    verdict:'here', route:'#/hm/', find:'Agree their 30, 60 and 90 day plan',
    here:'Agreed with the manager in the first week, rather than read alone.' },
  { id:'SN-47', set:'month1', who:'New hire', slides:'66',
    feature:'Introduction to Equinix course',
    today:'A first-month task.',
    verdict:'beyond', route:null,
    here:'After the first week. Sidekick can suggest it in Teams.' },
  { id:'SN-48', set:'month1', who:'New hire', slides:'68, 69, 70, 71, 75',
    feature:'Community, wellbeing and belonging',
    today:'Five optional tasks: Community and Belonging, Wellbeing, Equinix Impact, Employee Connection Networks, the Ambassador Program.',
    verdict:'beyond', route:null,
    here:'Not tasks. Suggestions from Sidekick in Teams when they are relevant, so the list keeps only what has to be done.' },
  { id:'SN-49', set:'month1', who:'New hire', slides:'72, 73, 76, 77, 78',
    feature:'Learning and tools',
    today:'Optional tasks: LinkedIn Learning, The Wheel of Cash, the Product Messaging Library, apps on your phone, virtual backgrounds.',
    verdict:'beyond', route:null,
    here:'The same: suggestions, not tasks.' },
  { id:'SN-50', set:'month1', who:'New hire who manages people', slides:'74, 79',
    feature:'Training for new people managers',
    today:'The People Manager Guide and compensation training, for new hires who manage people.',
    verdict:'beyond', route:null,
    here:'Only for new hires who manage people, and after the first week. Worth keeping as a rule.' },
  { id:'SN-51', set:'month1', who:'New hire', slides:'80',
    feature:'IT overview course',
    today:'A first-month task for Global IT hires.',
    verdict:'beyond', route:null,
    here:'Content for one department, like DIO Central.' },

  /* ---------- first quarter ---------- */
  { id:'SN-52', set:'q1', who:'Manager', slides:'84, 85',
    feature:'An enablement checklist at two months',
    today:'A Forms checklist sent on Day 61, to Global IT managers only.',
    verdict:'beyond', route:null,
    here:'The process tree has a 60-day and a 90-day check-in for every manager. The Global IT checklist stays with Global IT.' },
];

const snById = id => SN_FEATURES.find(f => f.id === id);
let snFilter = 'all';
let snPending = null;            // a "show me" waiting for its screen to render

/* The marker itself. Drawn only by placeSnMarkers, after render. */
const snChip = id => `<span class="snm" data-sn="${id}" title="ServiceNow feature ${id}, click for details">${id}</span>`;

/* Find the deepest element holding the anchor text in one run of text.
   Markers, options and form fields are never anchors. */
function snAnchor(root, text) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const el = n.parentElement;
    if (!el || el.closest('.snm, .am, option, select, textarea, script, style')) continue;
    if (n.nodeValue.replace(/\s+/g, ' ').includes(text)) return el;
  }
  return null;
}

function placeSnMarkers(route) {
  document.body.classList.toggle('snmarks', !!S.snMarks);
  const root = $('#app');
  if (!root || route === '#/servicenow') return;
  SN_FEATURES.filter(f => f.route === route).forEach(f => {
    // alt is for a section that only appears partway through a task.
    let el = snAnchor(root, f.find) || (f.alt && snAnchor(root, f.alt));
    if (!el) return;
    // A marker inside a button or link would take its click.
    const host = el.closest('button, a');
    if (host) host.insertAdjacentHTML('afterend', ' ' + snChip(f.id));
    else el.insertAdjacentHTML('beforeend', ' ' + snChip(f.id));
  });
  if (snPending) {
    const m = root.querySelector(`.snm[data-sn="${snPending}"]`);
    snPending = null;
    if (m) {
      m.scrollIntoView({ block:'center' });
      m.classList.add('flash');
      setTimeout(() => m.classList.remove('flash'), 2400);
    }
  }
}

function snCounts() {
  return SN_FEATURES.reduce((a, f) => (a[f.verdict] = (a[f.verdict] || 0) + 1, a), {});
}

function renderServiceNow() {
  const counts = snCounts();
  const shown = snFilter === 'all' ? SN_FEATURES : SN_FEATURES.filter(f => f.verdict === snFilter);
  const placed = SN_FEATURES.filter(f => f.route).length;
  return `
  <div class="page sn-page">
    <div class="sn-head">
      <div class="sn-kicker">ServiceNow today, rethought</div>
      <h1>Every ServiceNow onboarding feature, and where it went</h1>
      <p class="flow-sub">All ${SN_FEATURES.length} features in the current ServiceNow walkthrough, taken as features and not as
      procedures: what each one lets someone do, not the steps ServiceNow puts them through. Each says where it lives in
      this prototype now, or why it doesn’t. ${placed} are marked on the screens.</p>
      <p class="sn-src">${ic('file-alt.svg','sm')}From the ${SN_SOURCE}. Slide numbers are that deck’s.</p>
      <div class="sn-switch">
        <span>Markers on the screens</span>
        <button class="sf ${S.snMarks ? '' : 'on'}" data-snmarks="off" aria-pressed="${!S.snMarks}">Hidden</button>
        <button class="sf ${S.snMarks ? 'on' : ''}" data-snmarks="on" aria-pressed="${!!S.snMarks}">Shown</button>
        <span class="sn-switch-note">Each marker opens its entry. “Show me” below turns them on and takes you there.</span>
      </div>
    </div>

    <div class="sn-filter" role="group" aria-label="Filter by what became of each feature">
      <button class="sf ${snFilter==='all'?'on':''}" data-snfilter="all">All <span>${SN_FEATURES.length}</span></button>
      ${Object.entries(SN_VERDICTS).map(([k, v]) => `
        <button class="sf ${snFilter===k?'on':''}" data-snfilter="${k}" title="${v.hint}">${v.label} <span>${counts[k] || 0}</span></button>`).join('')}
    </div>

    ${SN_SETS.map(set => {
      const rows = shown.filter(f => f.set === set.id);
      if (!rows.length) return '';
      return `
      <section class="sn-set">
        <div class="sn-set-h"><h2>${set.title}</h2><span>${set.opens}</span></div>
        <div class="sn-rows">
          ${rows.map(f => `
          <div class="sn-row" id="sn-${f.id}">
            <div class="sn-row-h">
              <span class="sn-id">${f.id}</span>
              <span class="sn-feature">${f.feature}</span>
              <span class="sn-v ${f.verdict}">${SN_VERDICTS[f.verdict].label}</span>
            </div>
            <div class="sn-meta">${f.who} · slide${f.slides.includes(',') ? 's' : ''} ${f.slides}</div>
            <div class="sn-line"><b>Today</b><span>${f.today}</span></div>
            <div class="sn-line here"><b>Here</b><span>${f.here}</span></div>
            ${f.route ? `<button class="btn quiet sm sn-show" data-snshow="${f.id}">Show me ${ic('arrow-right.svg','sm')}</button>` : ''}
          </div>`).join('')}
        </div>
      </section>`;
    }).join('')}
  </div>`;
}

/* The slide-over a marker opens. */
function openSn(id) {
  const f = snById(id);
  if (!f) return;
  $('#snBody').innerHTML = `
    <div class="sn-pop">
      <div class="sn-row-h"><span class="sn-id">${f.id}</span><span class="sn-v ${f.verdict}">${SN_VERDICTS[f.verdict].label}</span></div>
      <h3>${f.feature}</h3>
      <div class="sn-meta">${f.who} · ${SN_SETS.find(s => s.id === f.set).title} · slide${f.slides.includes(',') ? 's' : ''} ${f.slides}</div>
      <div class="sn-line"><b>In ServiceNow today</b><span>${f.today}</span></div>
      <div class="sn-line here"><b>Here</b><span>${f.here}</span></div>
      <button class="btn secondary sm mt16" data-goto="#/servicenow" data-snclose="1">All ${SN_FEATURES.length} features</button>
    </div>`;
  $('#snPanel').classList.add('show');
  $('#overlay').classList.add('show');
}

/* Clicks on this side. Returns true when it handled one. */
function snGlobalClick(t, e) {
  const chip = t.closest('.snm');
  if (chip) { e.preventDefault(); e.stopPropagation(); openSn(chip.dataset.sn); return true; }
  const sw = t.closest('[data-snmarks]');
  if (sw) { S.snMarks = sw.dataset.snmarks === 'on'; save(); rerender(); return true; }
  const fl = t.closest('[data-snfilter]');
  if (fl) { snFilter = fl.dataset.snfilter; rerender(); return true; }
  const show = t.closest('[data-snshow]');
  if (show) {
    const f = snById(show.dataset.snshow);
    S.snMarks = true; save();
    snPending = f.id;
    if (location.hash === f.route) rerender(); else location.hash = f.route;
    return true;
  }
  if (t.closest('[data-snclose]')) closePanels();
  return false;
}

const SN_ROUTES = { '#/servicenow': renderServiceNow };
