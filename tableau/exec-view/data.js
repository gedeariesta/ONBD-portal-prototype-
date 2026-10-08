/* Executive View data and field spec.
   Source: Onboarding_Dashboard_Planning_UPDATED_v3.1.xlsx (Dashboard Fields,
   HAM Equipment Insight, PEX Operations Insight tabs) and the v4 design prompt.

   kind: 'real'         value comes from a named report; shown as-is
         'illustrative' placeholder value only; shown with an ILLUSTRATIVE tag
         'none'         no instrument exists; shown as "Not yet measured"
   rag:  'g' data documented / available · 'a' partial, pending integration/build
         'r' no instrument exists yet. RAG = DATA READINESS, never performance. */
window.ONBD = {
  asOf: { ham: 'Jan–May 2026', pex: 'Jan–Sep 2026' },

  clusters: [
    { key: 'nh', label: 'NH Sentiment', tiles: [
      { name: 'New Hire Experience NPS', value: '+42', target: 'Target: TBC', kind: 'illustrative', rag: 'a',
        src: 'Survey platform (Glint)', type: 'Measure · KPI vs target', note: 'Success measure. 30/90-day instruments exist; need join to dashboard.' },
      { name: 'Day One Check-Out Sentiment', value: '4.3 / 5', target: 'Target: TBC', kind: 'illustrative', rag: 'a',
        src: 'Qualtrics / Sidekick', type: 'Measure · trend', note: 'PRD 3.7 Day One Check Out; platform join needed. Delivery platform set under Task #38.' },
      { name: 'Pulse Survey', pulse: [['Day 30', '4.1'], ['Day 60', 'optional'], ['Day 90', '3.9']], target: 'Target: TBC', kind: 'illustrative', rag: 'a',
        src: 'Qualtrics / Glint (TBC)', type: 'Measure · trend', note: 'Blocked on Task #38 (Survey & Listening): timing and question set not final. Day 60 optional.' },
    ] },
    { key: 'hm', label: 'HM Success', tiles: [
      { name: 'Manager Experience NPS', value: '+31', target: 'Target: TBC', kind: 'illustrative', rag: 'a',
        src: 'Survey platform (Glint / ServiceNow → Helix)', type: 'Measure · KPI vs target', note: 'Success measure. HM surveys exist; integration missing.' },
      { name: 'HM Readiness Score', value: '78 / 100', target: 'Target: TBC', kind: 'illustrative', rag: 'g',
        src: 'ServiceNow', type: 'Measure · gauge', note: 'Live today (PRD 2 + S2-US13 HM readiness view). Value here is a placeholder.' },
      { name: 'Manager Day-1 Meet Occurrence', value: '86%', target: 'Target: TBC', kind: 'illustrative', rag: 'a',
        src: 'Outlook integration (proposed)', type: 'Measure % · KPI', note: 'PRD S4-US08 Outlook tracking not built. Earlier path: survey item "I met my manager on Day 1" (Task #38).' },
    ] },
    { key: 'eq', label: 'Equipment Success', tiles: [
      { name: 'Laptop Delivered by Day 1', value: '97.5%', target: 'vs 98% target', gap: '▼ 0.5 pts', kind: 'real', rag: 'g',
        period: 'HAM Pro Report · Jan–May ’26', foot: 'May dipped to 90.9% (NA, LATAM)',
        src: 'HAM Pro Report (ServiceNow / shipment)', type: 'Measure % · KPI + status', note: '586 of 601 delivered on or before Day 1. SLA timeframe sign-off still open (PRD P-07).' },
      { name: 'Loaner Reliance Rate', value: '23.8%', target: 'Target: TBC', kind: 'real', rag: 'g',
        period: 'HAM Pro Report · Jan–May ’26', foot: '144 of 604 started on a loaner (~half of NA)',
        src: 'HAM / ServiceNow', type: 'Measure % · KPI + trend', note: 'ROI proxy: cost of temporary devices.' },
      { name: 'Late-Notice Rate (<14 days)', value: '41.9%', target: 'Target: TBC', kind: 'real', rag: 'g',
        period: 'HAM Pro Report · Jan–May ’26', foot: '253 of 604 requests; the top late-delivery reason',
        src: 'HAM / ServiceNow', type: 'Measure % · KPI + trend', note: 'ROI proxy: upstream process inefficiency (HR notice to EUT).' },
    ] },
    { key: 'pex', label: 'PEX Success', tiles: [
      { id: 'onstart', name: 'Started on Original Start Date', value: '87.8%', target: 'Target: TBC', kind: 'real', rag: 'g',
        period: 'PEX 2026 dashboard · Jan–Sep ’26', spark: [.899, .821, .894, .924, .845, .883, .883, .861, .885],
        src: 'Workday / PEX report', type: 'Measure % · KPI + trend', note: 'Outcome proxy, not a task-level SLA. Aug figure differs between deck (87.3%) and recompute (86.1%).' },
      { id: 'qa', name: 'Quality Audit Pass Rate', value: '74.3%', target: 'Target: TBC', kind: 'real', rag: 'g',
        period: 'PEX 2026 dashboard · Jan–Sep ’26', spark: [.673, .745, .869, .721, .743, .68, .741, .82, .81],
        src: 'ServiceNow QA audits', type: 'Measure % · KPI + trend', note: '"Overall" result (any fail = fail), stricter than the deck’s QA Critical. Sep sample small (42).' },
      { name: 'Task Completion % (pre-Day 1)', value: '82%', target: 'Target: TBC', kind: 'illustrative', rag: 'g',
        src: 'ServiceNow', type: 'Measure % · progress / funnel', note: 'Documented in PRD taxonomy; portal tasks still being built, so per-task SLAs are not defined yet.' },
    ] },
  ],

  outcomes: [
    { name: 'Quality of Hire Index', rag: 'r', src: 'Survey / Workday', note: 'Composite (performance + retention + HM satisfaction) not yet defined.' },
    { name: 'Time to Productivity (30/60/90)', rag: 'r', src: 'TBD', note: 'No instrument exists. "Productive" needs a per-role definition.' },
    { name: '95% Meet First Performance Expectations (3x3+)', rag: 'r', src: 'Workday Perf', note: 'Needs perf-review data joined to onboarding cohort.' },
    { name: '1st-Year Attrition & Exit Survey', rag: 'a', src: 'Workday', note: 'Computable from Workday term data; cohort join not built.' },
    { name: 'Recruiter Time Savings Post-Offer', target: 'Target +20%', rag: 'r', src: 'TBD / manual', note: 'No pre-state baseline, so the +20% target can’t be measured yet.' },
  ],

  /* PEX persona split (real, Jan–Sep 2026). NTC audits aren't tagged separately. */
  persona: {
    All:     { hires: 1728, onstart: '87.8%', qa: '74.3%' },
    Regular: { hires: 1338, onstart: '87.6%', qa: '76.2%' },
    NTC:     { hires: 284,  onstart: '88.0%', qa: 'n/a' },
    Exec:    { hires: 106,  onstart: '90.6%', qa: '67.0%' },
  },

  /* New hires per month (real: Workday via PEX report, Jan–Sep 2026). */
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
  hiresByMonth: [169, 134, 180, 184, 226, 256, 188, 173, 218],

  /* Regional split: ILLUSTRATIVE. Sums to the real 1,728 total. */
  regions: [
    { key: 'NA', label: 'North America', hires: 640, color: '#4E79A7', lon: -100, lat: 46 },
    { key: 'LATAM', label: 'Latin America', hires: 120, color: '#F28E2B', lon: -58, lat: -14 },
    { key: 'EMEA', label: 'EMEA', hires: 560, color: '#76B7B2', lon: 14, lat: 51 },
    { key: 'APAC', label: 'Asia-Pacific', hires: 408, color: '#B07AA1', lon: 120, lat: 4 },
  ],
  /* ISO 3166 numeric → [region, weight]. Countries with hires only (illustrative). */
  countries: {
    '840': ['NA', 88], '124': ['NA', 12],
    '484': ['LATAM', 25], '076': ['LATAM', 45], '170': ['LATAM', 10], '152': ['LATAM', 10], '604': ['LATAM', 5], '032': ['LATAM', 5],
    '826': ['EMEA', 24], '372': ['EMEA', 8], '276': ['EMEA', 16], '250': ['EMEA', 10], '528': ['EMEA', 12], '724': ['EMEA', 5], '380': ['EMEA', 4],
    '616': ['EMEA', 6], '752': ['EMEA', 3], '246': ['EMEA', 2], '756': ['EMEA', 3], '620': ['EMEA', 4], '100': ['EMEA', 6], '792': ['EMEA', 2],
    '784': ['EMEA', 3], '566': ['EMEA', 1], '710': ['EMEA', 1],
    '392': ['APAC', 22], '036': ['APAC', 18], '356': ['APAC', 20], '410': ['APAC', 7], '360': ['APAC', 7], '458': ['APAC', 8], '608': ['APAC', 6], '554': ['APAC', 2],
  },
  /* Singapore and Hong Kong are too small for the 110m map → drawn as symbols (dual-axis in Tableau). */
  points: [
    { name: 'Singapore', region: 'APAC', lon: 103.8, lat: 1.35, w: 18 },
    { name: 'Hong Kong', region: 'APAC', lon: 114.2, lat: 22.3, w: 10 },
  ],

  /* NHO cohorts: ILLUSTRATIVE (attendance capture not yet specified). 2 cohorts / month. */
  nho: {
    series: ['Live', 'Virtual', 'Did not attend'],
    cohorts: [
      { label: 'Jul 7', values: [52, 34, 8] }, { label: 'Jul 21', values: [47, 38, 9] },
      { label: 'Aug 4', values: [44, 36, 7] }, { label: 'Aug 18', values: [41, 40, 5] },
      { label: 'Sep 1', values: [58, 42, 9] }, { label: 'Sep 15', values: [55, 47, 7] },
    ],
  },
};
