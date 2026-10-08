/* Executive View data and field spec.
   Sources: Onboarding_Dashboard_Planning_UPDATED_v3.1.xlsx (Dashboard Fields, HAM Equipment
   Insight, PEX Operations Insight) and the v4 design brief.

   kind:   'real' = figure from a named report, 'sample' = placeholder, 'none' = no data source yet
   status: data status, not performance. 'g' available, 'a' partial (needs integration or build),
           'r' no data source yet */
window.ONBD = {
  clusters: [
    { key: 'nh', label: 'NH Sentiment', tiles: [
      { name: 'New Hire Experience NPS', value: '+42', target: 'Target TBC', kind: 'sample', status: 'a',
        src: 'Survey platform (Glint)', type: 'Measure, KPI vs target', note: '30- and 90-day surveys exist. Not yet joined to the dashboard.' },
      { name: 'Day One Check-Out Sentiment', value: '4.3 / 5', target: 'Target TBC', kind: 'sample', status: 'a',
        src: 'Qualtrics / Sidekick', type: 'Measure, trend', note: 'Platform join needed. Survey platform to be set by Task #38.' },
      { name: 'Pulse Survey', pulse: [['Day 30', '4.1'], ['Day 60', null], ['Day 90', '3.9']], target: 'Target TBC', kind: 'sample', status: 'a',
        src: 'Qualtrics / Glint (TBC)', type: 'Measure, trend', note: 'Waiting on Task #38 for timing and questions. Day 60 is optional.' },
    ] },
    { key: 'hm', label: 'HM Success', tiles: [
      { name: 'Manager Experience NPS', value: '+31', target: 'Target TBC', kind: 'sample', status: 'a',
        src: 'Glint / ServiceNow (Helix)', type: 'Measure, KPI vs target', note: 'HM surveys exist. Not yet joined to the dashboard.' },
      { name: 'HM Readiness Score', value: '78 / 100', target: 'Target TBC', kind: 'sample', status: 'g',
        src: 'ServiceNow', type: 'Measure, gauge', note: 'Captured today (HM readiness view, S2-US13). Value shown is a placeholder.' },
      { name: 'Manager Day-1 Meet Rate', value: '86%', target: 'Target TBC', kind: 'sample', status: 'a',
        src: 'Outlook (proposed)', type: 'Measure %, KPI', note: 'Outlook tracking (S4-US08) not built. Interim option: a Day 1 survey question (Task #38).' },
    ] },
    { key: 'eq', label: 'Equipment Success', tiles: [
      { name: 'Laptop Delivered by Day 1', value: '97.5%', target: 'Target 98%', gap: '▼ 0.5 pts', kind: 'real', status: 'g',
        period: 'HAM Pro Report, Jan-May 2026', foot: 'May: 90.9% (NA, LATAM misses)',
        src: 'HAM Pro Report', type: 'Measure %, KPI + status', note: '586 of 601 delivered on or before Day 1. Delivery SLA not yet signed off (PRD P-07).' },
      { name: 'Loaner Reliance Rate', value: '23.8%', target: 'Target TBC', kind: 'real', status: 'g',
        period: 'HAM Pro Report, Jan-May 2026', foot: '144 of 604 started on a loaner',
        src: 'HAM Pro Report', type: 'Measure %, KPI + trend', note: 'ROI proxy for temporary device cost. About half of NA starts each month.' },
      { name: 'Late-Notice Rate (<14 days)', value: '41.9%', target: 'Target TBC', kind: 'real', status: 'g',
        period: 'HAM Pro Report, Jan-May 2026', foot: '253 of 604 requests',
        src: 'HAM Pro Report', type: 'Measure %, KPI + trend', note: 'ROI proxy for process delay. Top reason for late laptops.' },
    ] },
    { key: 'pex', label: 'PEX Success', tiles: [
      { id: 'onstart', name: 'Started on Original Date', value: '87.8%', target: 'Target TBC', kind: 'real', status: 'g',
        period: 'PEX 2026 dashboard, Jan-Sep 2026', spark: [.899, .821, .894, .924, .845, .883, .883, .861, .885],
        src: 'Workday / PEX report', type: 'Measure %, KPI + trend', note: 'Outcome proxy, not a task SLA. Aug is 87.3% in the deck, 86.1% recomputed.' },
      { id: 'qa', name: 'QA Pass Rate', value: '74.3%', target: 'Target TBC', kind: 'real', status: 'g',
        period: 'PEX 2026 dashboard, Jan-Sep 2026', spark: [.673, .745, .869, .721, .743, .68, .741, .82, .81],
        src: 'ServiceNow QA audits', type: 'Measure %, KPI + trend', note: 'Overall result (any fail counts). Stricter than QA Critical. Sep has 42 audits.' },
      { name: 'Task Completion % (Pre-Day 1)', value: '82%', target: 'Target TBC', kind: 'sample', status: 'g',
        src: 'ServiceNow', type: 'Measure %, progress', note: 'Task status is captured. Per-task SLAs wait on the portal build.' },
    ] },
  ],

  outcomes: [
    { name: 'Quality of Hire Index', status: 'r', src: 'Survey / Workday', note: 'Formula not defined (performance, retention, HM satisfaction).' },
    { name: 'Time to Productivity (30/60/90)', status: 'r', src: 'TBD', note: 'No data source. Needs a per-role definition of productive.' },
    { name: '% Meeting First Performance Expectations (3x3+)', status: 'r', src: 'Workday Performance', note: 'Needs performance reviews joined to onboarding cohorts. Goal: 95%.' },
    { name: '1st-Year Attrition & Exit Survey', status: 'a', src: 'Workday', note: 'Can be calculated from Workday terminations. Join not built.' },
    { name: 'Recruiter Time Saved Post-Offer', target: 'Target +20%', status: 'r', src: 'TBD / manual', note: 'No baseline yet.' },
  ],

  /* PEX persona split, Jan-Sep 2026 (real). NTC audits are not tagged separately. */
  persona: {
    All:     { hires: 1728, onstart: '87.8%', qa: '74.3%' },
    Regular: { hires: 1338, onstart: '87.6%', qa: '76.2%' },
    NTC:     { hires: 284,  onstart: '88.0%', qa: 'n/a' },
    Exec:    { hires: 106,  onstart: '90.6%', qa: '67.0%' },
  },

  /* New hires per month, Workday via PEX report (real). */
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
  hiresByMonth: [169, 134, 180, 184, 226, 256, 188, 173, 218],

  /* Regional split: sample data that adds up to the real 1,728. */
  regions: [
    { key: 'NA', label: 'North America', hires: 640, color: '#4E79A7', lon: -100, lat: 46 },
    { key: 'LATAM', label: 'Latin America', hires: 120, color: '#F28E2B', lon: -58, lat: -14 },
    { key: 'EMEA', label: 'EMEA', hires: 560, color: '#76B7B2', lon: 14, lat: 51 },
    { key: 'APAC', label: 'Asia Pacific', hires: 408, color: '#B07AA1', lon: 120, lat: 4 },
  ],
  /* ISO 3166 numeric -> [region, weight]. Sample: countries with hires only. */
  countries: {
    '840': ['NA', 88], '124': ['NA', 12],
    '484': ['LATAM', 25], '076': ['LATAM', 45], '170': ['LATAM', 10], '152': ['LATAM', 10], '604': ['LATAM', 5], '032': ['LATAM', 5],
    '826': ['EMEA', 24], '372': ['EMEA', 8], '276': ['EMEA', 16], '250': ['EMEA', 10], '528': ['EMEA', 12], '724': ['EMEA', 5], '380': ['EMEA', 4],
    '616': ['EMEA', 6], '752': ['EMEA', 3], '246': ['EMEA', 2], '756': ['EMEA', 3], '620': ['EMEA', 4], '100': ['EMEA', 6], '792': ['EMEA', 2],
    '784': ['EMEA', 3], '566': ['EMEA', 1], '710': ['EMEA', 1],
    '392': ['APAC', 22], '036': ['APAC', 18], '356': ['APAC', 20], '410': ['APAC', 7], '360': ['APAC', 7], '458': ['APAC', 8], '608': ['APAC', 6], '554': ['APAC', 2],
  },
  /* Too small for the 110m map, so drawn as points (a dual-axis layer in Tableau). */
  points: [
    { name: 'Singapore', region: 'APAC', lon: 103.8, lat: 1.35, w: 18 },
    { name: 'Hong Kong', region: 'APAC', lon: 114.2, lat: 22.3, w: 10 },
  ],

  /* NHO cohorts, two per month. Sample data: attendance capture not defined yet. */
  nho: {
    series: ['Live', 'Virtual', 'Did Not Attend'],
    cohorts: [
      { label: 'Jul 7', values: [52, 34, 8] }, { label: 'Jul 21', values: [47, 38, 9] },
      { label: 'Aug 4', values: [44, 36, 7] }, { label: 'Aug 18', values: [41, 40, 5] },
      { label: 'Sep 1', values: [58, 42, 9] }, { label: 'Sep 15', values: [55, 47, 7] },
    ],
  },
};
