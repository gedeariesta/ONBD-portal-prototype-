/* Executive View data and field spec.
   Sources: Onboarding_Dashboard_Planning_UPDATED_v3.1.xlsx (Dashboard Fields, HAM Equipment
   Insight) and the v4 design brief. PEX tiles follow PEX's own SLAs and targets (People
   Experience 2026 Dashboard and the Aug 2026 monthly performance deck); their values are samples.

   kind:   'real' = figure from a named report, 'sample' = placeholder, 'none' = no data source yet
   status: data status, not performance. 'g' available, 'a' partial (needs integration or build),
           'r' no data source yet */
window.ONBD = {
  /* Sections, top-down: the 35,000 ft view first, then the new hire, then the people around them. */
  sections: [
    { key: 'out', label: 'Program Outcomes', sub: 'Is onboarding working?', cols: 4, tiles: [
      { id: 'overall', name: 'Overall Onboarding Score', value: '76%', target: 'Target TBC', kind: 'sample', status: 'a', spark: [.72, .75, .76],
        src: 'Glint new-hire survey', type: 'Measure %, KPI + trend', note: 'Built from the new-hire survey buckets. Trend shows Week 1, Day 30 and Day 90.' },
      { name: 'Productive by Day 90', value: '81%', target: 'Target TBC', kind: 'sample', status: 'a',
        src: 'Hiring-manager survey (new question)', type: 'Measure %, KPI', note: 'Share of new hires their manager rates fully productive at Day 90. The question and scale are still open.' },
      { name: 'Quality of Hire', value: '72', target: 'Index', kind: 'sample', status: 'g',
        src: 'Tableau (existing)', type: 'Measure, KPI', note: 'Already exists in Tableau.' },
      { name: '1st-Year Attrition', value: '11%', target: 'Lower is better', kind: 'sample', status: 'g',
        src: 'Workday / Tableau', type: 'Measure %, KPI + trend', note: 'New hires who leave within their first year.' },
    ] },
    { key: 'nh', label: 'New Hire Success', sub: 'What the new hire experiences: survey buckets and equipment', cols: 6, tiles: [
      { name: 'Early Readiness & Navigation', value: '78%', target: 'Target TBC', kind: 'sample', status: 'a',
        src: 'Glint new-hire survey', type: 'Survey bucket, % favorable', note: 'Tasks, equipment and access, knowing where to get help.' },
      { name: 'Support & Connection', value: '81%', target: 'Target TBC', kind: 'sample', status: 'a',
        src: 'Glint new-hire survey', type: 'Survey bucket, % favorable', note: 'Manager, team and buddy support; belonging.' },
      { name: 'Role Clarity & Ramp-Up', value: '73%', target: 'Target TBC', kind: 'sample', status: 'a',
        src: 'Glint new-hire survey', type: 'Survey bucket, % favorable', note: 'Expectations, resources to contribute, role matches what was described.' },
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
    { key: 'hm', label: 'Hiring Managers', sub: 'Manager survey', cols: 3, tiles: [
      { name: 'HM Readiness', value: '74%', target: 'Target TBC', kind: 'sample', status: 'a',
        src: 'Glint hiring-manager survey', type: 'Survey bucket, % favorable', note: 'Did the manager know their tasks and have what they needed before Day 1?' },
      { name: 'HM Enablement', value: '70%', target: 'Target TBC', kind: 'sample', status: 'a',
        src: 'Glint hiring-manager survey', type: 'Survey bucket, % favorable', note: 'Portal, PEX support and guidance for setting expectations.' },
      { name: 'HM Overall / CSAT', value: '82%', target: 'Target TBC', kind: 'sample', status: 'a',
        src: 'Glint hiring-manager survey', type: 'Survey item, % favorable', note: 'Overall satisfaction with how the new hire was onboarded.' },
    ] },
    { key: 'pex', label: 'PEX', sub: 'From offer accepted', cols: 3, tiles: [
      { name: 'On-Time Start', value: '86%', target: 'Goal 90%', kind: 'sample', status: 'a',
        src: 'Workday (PEX onboarding SLA)', type: 'Measure %, KPI vs goal', note: "PEX's onboarding SLA: actual hire date on or before the proposed hire date. PEX's own minimum is 80%." },
      { name: 'Onboarding QA', value: '94%', target: 'Goal 98%', kind: 'sample', status: 'a',
        src: 'PEX QA audits', type: 'Measure %, KPI vs goal', note: 'Audited onboarding transactions with no critical error. Overall QA score sits in the PEX detail sheet.' },
      { name: 'Onboarding Cases per New Hire', value: '1.3', target: 'Lower is better', kind: 'sample', status: 'a',
        src: 'ServiceNow + Workday', type: 'Ratio, KPI + trend', note: 'Onboarding cases from new hires and their managers, divided by new hires that month. Fewer cases means the portal is answering more questions.' },
    ] },
  ],

  /* First 90 Days: % favorable per bucket at each survey wave (sample). */
  waves: ['Week 1', 'Day 30', 'Day 90'],
  first90: [
    { name: 'Early Readiness & Navigation', values: [76, 79, 80], color: '#4E79A7' },
    { name: 'Support & Connection', values: [83, 81, 79], color: '#59A14F' },
    { name: 'Role Clarity & Ramp-Up', values: [69, 73, 77], color: '#F28E2B' },
    { name: 'Hiring Managers', values: [74, 71, null], color: '#B07AA1', dashed: true },
  ],

  /* New hires per month: sample data. */
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
  hiresByMonth: [150, 140, 170, 190, 210, 240, 200, 180, 205],

  /* Regional split: sample data, adds up to the sample monthly total (1,685). */
  regions: [
    { key: 'NA', label: 'North America', hires: 620, color: '#4E79A7', lon: -100, lat: 46 },
    { key: 'LATAM', label: 'Latin America', hires: 115, color: '#F28E2B', lon: -58, lat: -14 },
    { key: 'EMEA', label: 'EMEA', hires: 550, color: '#76B7B2', lon: 14, lat: 51 },
    { key: 'APAC', label: 'Asia Pacific', hires: 400, color: '#B07AA1', lon: 120, lat: 4 },
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

};
