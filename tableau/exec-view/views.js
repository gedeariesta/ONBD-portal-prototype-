/* Extra sheets: PEX Detail, PEX Operations, My New Hires (hiring manager).
   All values are samples. Phase for all three: Later (needs the future ServiceNow PEX setup
   and the new onboarding portal). Kit: ../design-package. */
(function () {
  'use strict';
  const V = window.TabViz, UI = window.ONBD_UI;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tip = rows => `data-tip="${esc(JSON.stringify(rows))}"`;
  const T = (name, value, target, status, note, extra = {}) => Object.assign({ name, value, target, status, note, kind: 'sample', phase: 'ns', src: extra.src || 'ServiceNow / Workday', type: extra.type || 'Measure' }, extra);
  const tiles = (sel, list) => { $(sel).innerHTML = list.map(UI.tileHtml).join(''); };
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

  /* ======================= PEX Detail ======================= */
  tiles('#pexTiles', [
    T('Start Date Held', '86%', 'Goal 90%', 'r', "PEX's onboarding SLA: hire date on or before the original date. Source of the original date is open.", { type: 'Measure %, KPI vs goal' }),
    T('Days Shifted', '4.2', 'avg days, when changed', 'r', 'Average days a start date moved, for hires whose date changed (14% of hires). Flag: changed / not changed.', { type: 'Measure, days' }),
    T('Onboarding QA (Critical)', '94%', 'Goal 98%', 'r', 'Audited onboarding transactions with no critical error. Still to define whose questions count.', { src: 'PEX QA audits', type: 'Measure %, KPI vs goal' }),
    T('Onboarding QA (Overall)', '89%', 'Goal 98%', 'r', 'Covers the rest of the QA form. Stricter than critical.', { src: 'PEX QA audits', type: 'Measure %, KPI vs goal' }),
    T('Cases per New Hire', '1.3', 'Lower is better', 'a', 'Onboarding cases from new hires and their managers, divided by new hires that month.', { type: 'Ratio, KPI + trend' }),
  ]);
  V.hbar('#pexSteps', { dim: 'Step', measure: 'On time %', format: 'pct', max: 1, refLine: .9, refLabel: ' ', rowHeight: 34,
    data: [{ label: 'Background check', value: .93 }, { label: 'Start date held', value: .86 }], sort: false });
  V.hbar('#pexRegion', { dim: 'Region', measure: 'Start date held', format: 'pct', max: 1, refLine: .9, refLabel: ' ', rowHeight: 28, colorBy: 'none', color: '#76B7B2',
    data: [{ label: 'AMER', value: .84 }, { label: 'EMEA', value: .88 }, { label: 'APAC', value: .87 }], sort: false });
  tiles('#pexSelf', [
    T('HR-Raised %', '1.4%', 'Goal 2% or less', 'a', 'Onboarding cases HR opened on someone\'s behalf. High means people aren\'t self-serving.', { type: 'Measure %' }),
    T('Chat-to-Case Conversion', '24%', 'Lower is better', 'a', 'Onboarding chats that had to become a case.', { type: 'Measure %' }),
  ]);
  tiles('#pexSat', [
    T('Onboarding Case CSAT', '93%', 'Goal 85%', 'a', 'Share of responses rated satisfied or very satisfied.', { type: 'Measure %' }),
    T('Survey Response Rate', '7%', 'Goal 5%', 'a', 'Few people answer case surveys, so new-hire sentiment comes from Glint on the Executive View.', { type: 'Measure %' }),
  ]);
  $('#pexLoadLegend').innerHTML = V.legend({ title: 'Cases', items: ['Received', 'Closed'], colors: ['#4E79A7', '#BAB0AC'], inline: true });
  V.line('#pexLoad', { x: months, xField: 'Month', dim: 'Cases', measure: 'Onboarding cases (sample)', format: 'int', height: 270, markers: true, zero: false,
    series: [{ name: 'Received', values: [210, 190, 240, 255, 280, 310, 260, 235, 270], color: '#4E79A7' }, { name: 'Closed', values: [195, 200, 225, 250, 265, 300, 270, 230, 255], color: '#BAB0AC', dashed: true }] });
  $('#pexFuture').innerHTML = [
    ['Tier 0: Self-Service', 'Questions answered in myHR (pre-hire sign-in, knowledge articles) without a case'],
    ['Tier 1: Resolved by PEX', 'Cases the PEX team resolves in the system, and how fast'],
    ['Escalated to Tier 2', 'Share of cases that need the next level of support'],
    ['Clean Start Rate', 'Start date held, no critical QA error and laptop by Day 1, all for the same new hire'],
    ['Pre-Day 1 Tasks On Time', 'Portal tasks done by their due date, for new hires, managers and PEX'],
  ].map(([t, d]) => `<div class="fut"><b>${t}</b>${d}</div>`).join('');

  /* ======================= PEX Operations ======================= */
  tiles('#opsTiles', [
    T('Starting in Next 14 Days', '46', 'new hires', 'a', 'New hires with a start date in the next 14 days.', { src: 'Workday' }),
    T('On Track', '34', '74%', 'a', 'All tasks due so far are done.'),
    T('At Risk', '8', 'need a nudge', 'a', 'A task is due within 3 days and not started.'),
    T('Stuck Items', '5', 'no progress 3+ days', 'a', 'Items that haven\'t moved for 3 or more days.'),
    T('Open Escalations', '3', 'Day 1 to 90', 'a', 'New joiners flagged for follow-up in their first 90 days.'),
  ]);
  const hires = [
    ['NH-10482', 'Nov 10', 5, 'AMER', 'Professional', '11 / 12', 'ok', 'Sent', ''],
    ['NH-10477', 'Nov 10', 5, 'EMEA', 'Emerging talent', '9 / 12', 'risk', 'Day -3', 'Not co-located'],
    ['NH-10491', 'Nov 12', 7, 'APAC', 'Professional', '7 / 12', 'stuck', 'Day -3', 'Right to work pending'],
    ['NH-10503', 'Nov 13', 8, 'AMER', 'Executive', '10 / 12', 'ok', 'Sent', 'Date changed (+7 days)'],
    ['NH-10488', 'Nov 14', 9, 'EMEA', 'Professional', '8 / 12', 'risk', 'Day -7', ''],
    ['NH-10512', 'Nov 17', 12, 'AMER', 'Professional', '6 / 12', 'ok', 'Day -7', ''],
    ['NH-10509', 'Nov 17', 12, 'APAC', 'Emerging talent', '5 / 12', 'ok', 'Day -7', ''],
    ['NH-10515', 'Nov 17', 12, 'EMEA', 'Professional', '3 / 12', 'stuck', 'Day -7', 'Equipment not ordered'],
    ['NH-10521', 'Nov 18', 13, 'AMER', 'Professional', '5 / 12', 'ok', 'Day -7', 'Not co-located'],
    ['NH-10524', 'Nov 19', 14, 'APAC', 'Professional', '4 / 12', 'ok', 'Day -7', ''],
    ['NH-10527', 'Nov 19', 14, 'EMEA', 'Executive', '6 / 12', 'ok', 'Day -7', ''],
    ['NH-10530', 'Nov 19', 14, 'AMER', 'Professional', '2 / 12', 'risk', 'Day -7', 'Date changed (+14 days)'],
  ];
  const stLabel = { ok: 'On track', risk: 'At risk', stuck: 'Stuck' };
  $('#opsList').innerHTML = `<table class="tab-xtab ops-t"><thead><tr><th class="l">New Hire</th><th class="l">Start</th><th>Days to Start</th><th class="l">Region</th><th class="l">Talent Type</th><th>Tasks Done</th><th class="l">Status</th><th class="l">Next Nudge</th><th class="l">Flags</th></tr></thead><tbody>` +
    hires.map(h => `<tr class="mark" ${tip([['New Hire', h[0]], ['Start', h[1]], ['Status', stLabel[h[6]]], ['Tasks done', h[5]], ['Flags', h[8] || 'None']])}><td class="l">${h[0]}</td><td class="l">${h[1]}</td><td>${h[2]}</td><td class="l">${h[3]}</td><td class="l">${h[4]}</td><td>${h[5]}</td><td class="l"><span class="st ${h[6]}">${stLabel[h[6]]}</span></td><td class="l">${h[7]}</td><td class="l" style="color:#9B2C2C">${esc(h[8])}</td></tr>`).join('') +
    `</tbody></table>`;
  const fSeries = ['Complete', 'In progress', 'Not started', 'Overdue'], fColors = ['#59A14F', '#A0CBE8', '#D4D4D4', '#E15759'];
  V.palettes.categorical._ops = fColors.concat(V.palettes.categorical['Tableau 10'].slice(4));
  $('#opsFunnelLegend').innerHTML = V.legend({ title: 'Status', items: fSeries, colors: fColors, inline: true });
  V.stackedBar('#opsFunnel', { percent: true, labels: true, palette: '_ops', series: fSeries, dimA: 'Task', dimB: 'Status', measure: 'New hires', format: 'int', rowHeight: 34,
    rows: [
      { label: 'Personal details', values: [40, 3, 2, 1] }, { label: 'Right to work', values: [31, 8, 4, 3] }, { label: 'Bank details', values: [35, 5, 5, 1] },
      { label: 'Background check', values: [33, 10, 2, 1] }, { label: 'Equipment confirmed', values: [36, 4, 4, 2] }, { label: 'Policy acknowledgements', values: [28, 6, 11, 1] },
    ] });
  V.heatmap('#opsStuck', { ramp: 'Red', labels: true, format: 'int', rowField: 'Owner', colField: 'Days without progress', measure: 'Open items', cellHeight: 26,
    cols: ['3-5', '6-10', '10+'], rows: [{ label: 'New hire', values: [3, 1, 0] }, { label: 'Hiring manager', values: [2, 2, 1] }, { label: 'IT / equipment', values: [1, 1, 0] }, { label: 'PEX', values: [1, 0, 0] }, { label: 'Security / badge', values: [0, 1, 1] }] });
  const nSeries = ['Acted on', 'Opened, no action', 'Not opened'], nColors = ['#4E79A7', '#A0CBE8', '#D4D4D4'];
  V.palettes.categorical._nudge = nColors.concat(V.palettes.categorical['Tableau 10'].slice(3));
  $('#opsNudgeLegend').innerHTML = V.legend({ title: '', items: nSeries, colors: nColors, inline: true });
  V.stackedBar('#opsNudges', { percent: true, labels: true, palette: '_nudge', series: nSeries, dimA: 'Nudge', dimB: 'Result', measure: 'Nudges', format: 'int', rowHeight: 34,
    rows: [{ label: 'Day -7', values: [52, 18, 10] }, { label: 'Day -3 (72 hr)', values: [31, 9, 6] }] });
  $('#opsEsc').innerHTML = `<table class="tab-xtab ops-t"><thead><tr><th class="l">New Hire</th><th class="l">Day</th><th class="l">Reason</th><th class="l">Owner</th></tr></thead><tbody>` +
    [['NH-10233', 'Day 12', 'No system access yet', 'IT'], ['NH-10198', 'Day 31', 'No manager 1:1 yet', 'Hiring manager'], ['NH-10251', 'Day 6', 'Payroll setup missing', 'PEX']]
      .map(r => `<tr class="mark" ${tip([['New Hire', r[0]], ['Day', r[1]], ['Reason', r[2]], ['Owner', r[3]]])}><td class="l">${r[0]}</td><td class="l">${r[1]}</td><td class="l">${r[2]}</td><td class="l">${r[3]}</td></tr>`).join('') + `</tbody></table>`;

  /* ======================= My New Hires (hiring manager) ======================= */
  tiles('#hmTiles', [
    T('My Hires Starting', '4', 'next 60 days', 'a', 'Hires where you are the hiring manager.', { src: 'Workday' }),
    T('Readiness Score', '78', '/ 100', 'a', 'How ready your hires are for Day 1, from completed pre-Day 1 steps.', { type: 'Score 0-100' }),
    T('My Tasks Due This Week', '3', 'tasks', 'a', 'Tasks assigned to you in the portal.'),
    T('Overdue', '1', 'task', 'r', 'Past its due date.'),
    T('Day 1 Meetings Booked', '3 of 4', '', 'a', 'Day 1 meeting with your new hire on the calendar.', { src: 'Portal / Outlook (proposed)' }),
  ]);
  const steps = ['Offer accepted', 'Background check', 'Equipment', 'Accounts & access', 'Badge', 'Buddy assigned', 'Day 1 meeting booked', 'Pre-Day 1 tasks'];
  const lab = { done: 'Done', prog: 'In progress', not: 'Not started', late: 'Overdue', na: 'n/a' };
  const owner = ['Recruiting', 'PEX', 'IT', 'IT', 'Security', 'You', 'You', 'New hire'];
  const grid = [
    ['Data Center Technician', 'Nov 17', ['done', 'done', 'done', 'prog', 'prog', 'done', 'done', 'prog']],
    ['Network Engineer', 'Nov 24', ['done', 'done', 'prog', 'not', 'not', 'late', 'done', 'prog']],
    ['Account Executive', 'Dec 1', ['done', 'prog', 'not', 'not', 'not', 'not', 'done', 'not']],
    ['Analyst (remote)', 'Dec 8', ['done', 'prog', 'not', 'not', 'na', 'not', 'not', 'not']],
  ];
  $('#hmGrid').innerHTML = `<table class="grid-t"><thead><tr><th class="l">New hire (start)</th>${steps.map(s => `<th>${s}</th>`).join('')}</tr></thead><tbody>` +
    grid.map(([role, start, cells]) => `<tr><td class="l">${role}<br><span style="color:#898989;font-size:11px">Starts ${start}</span></td>` +
      cells.map((c, i) => `<td class="c c-${c} mark" ${tip([['New hire', role], ['Step', steps[i]], ['Status', lab[c]], ['Owner', owner[i]]])}>${lab[c]}</td>`).join('') + '</tr>').join('') + '</tbody></table>';
  $('#hmGridLegend').innerHTML = V.legend({ title: 'Status', items: ['Done', 'In progress', 'Not started', 'Overdue'], colors: ['#59A14F', '#A0CBE8', '#EBEBEB', '#E15759'], inline: true });
  $('#hmTodo').innerHTML = '<div class="todo">' + [
    ['Assign a buddy', 'Network Engineer', 'Due Nov 3', true],
    ['Confirm equipment request', 'Account Executive', 'Due Nov 14', false],
    ['Share 30-60-90 plan', 'Data Center Technician', 'Due Nov 17', false],
    ['Book Day 1 meeting', 'Analyst (remote)', 'Due Nov 28', false],
    ['Introduce to the team', 'Data Center Technician', 'Day 1', false],
  ].map(([t, who, due, late]) => `<div class="todo-i${late ? ' late' : ''}" ${tip([['Task', t], ['New hire', who], ['Due', due + (late ? ' (overdue)' : '')]])}><span>${t}</span><small>${who}</small><span class="due">${due}${late ? '<br>Overdue' : ''}</span></div>`).join('') + '</div>';
  const gs = ['On track', 'At risk'];
  V.palettes.categorical._hmg = ['#4E79A7', '#F28E2B'].concat(V.palettes.categorical['Tableau 10'].slice(2));
  $('#hmGanttLegend').innerHTML = V.legend({ title: 'Readiness', items: gs, colors: ['#4E79A7', '#F28E2B'], inline: true });
  V.gantt('#hmGantt', { palette: '_hmg', statuses: gs, dim: 'New hire', colorField: 'Readiness', min: -28, max: 35, tickStep: 7, today: 0, todayLabel: ' ',
    tickFormat: t => t === 0 ? 'Today' : (t > 0 ? '+' : '') + t + 'd', unit: ' days',
    tasks: [
      { label: 'Data Center Technician', start: -20, dur: 32, status: 'On track' },
      { label: 'Network Engineer', start: -15, dur: 34, status: 'At risk' },
      { label: 'Account Executive', start: -6, dur: 32, status: 'On track' },
      { label: 'Analyst (remote)', start: -2, dur: 35, status: 'At risk' },
    ] });
})();
