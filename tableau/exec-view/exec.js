/* Executive View renderer. Data: data.js. Kit: ../design-package. */
(function () {
  'use strict';
  const D = window.ONBD, V = window.TabViz, G = window.ONBD_GEO;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tip = rows => `data-tip="${esc(JSON.stringify(rows))}"`;
  const fmtInt = n => n.toLocaleString('en-US');

  /* Data status: shown as the tile's left bar and in a color legend */
  const ST = { g: { label: 'Available', color: '#4CAF50' }, a: { label: 'Partial', color: '#FFC107' }, r: { label: 'No Data Source', color: '#F44336' } };
  const ST_LONG = { g: 'Available', a: 'Partial (needs integration or build)', r: 'No data source yet' };
  const KIND = { real: 'Actual', sample: 'Sample', none: 'Not measured' };
  $('#statusLegend').innerHTML = V.legend({ title: 'Data Status', items: ['g', 'a', 'r'].map(k => ST[k].label), colors: ['g', 'a', 'r'].map(k => ST[k].color), inline: true });
  $('#statusLegend .tab-legend').style.marginLeft = 'auto';
  $('#statusLegend').style.marginLeft = 'auto';

  /* Long notes wrap inside the tooltip */
  const css = document.createElement('style');
  css.textContent = '.tab-tooltip .tt-row{white-space:normal}.tab-tooltip{max-width:320px}';
  document.head.appendChild(css);

  /* ---------------- KPI strip ---------------- */
  function tileHtml(t) {
    const rows = [['Measure', t.name], ['Value', t.pulse ? 'See tile' : t.value + (t.kind === 'sample' ? ' (sample)' : '')], ['Data Status', ST_LONG[t.status]], ['Source', t.src], ['Field Type', t.type], ['Note', t.note]];
    const body = t.pulse
      ? `<div class="pulse">${t.pulse.map(([k, v]) => v == null ? `<div class="opt"><b>-</b><span>${k} (opt.)</span></div>` : `<div><b>${esc(v)}</b><span>${esc(k)}</span></div>`).join('')}<span class="t-tgt" style="padding-bottom:1px">${esc(t.target)}</span></div>`
      : `<div class="t-row"><span class="t-val" ${t.id ? `id="v-${t.id}"` : ''}>${esc(t.value)}</span><span class="t-tgt">${esc(t.target)}</span>${t.gap ? `<span class="t-gap">${esc(t.gap)}</span>` : ''}</div>`;
    const src = t.kind === 'real' ? (t.foot ? `${esc(t.foot)}<br>${esc(t.period)}` : esc(t.period)) : 'Sample value';
    return `<div class="tile ${t.kind}" style="--st:${ST[t.status].color}" ${tip(rows)}>
      <div class="t-name">${esc(t.name)}</div>${body}
      ${t.spark ? `<div class="t-spark" data-spark="${t.id}"></div>` : ''}
      <div class="t-src" ${t.id ? `id="s-${t.id}"` : ''}>${src}</div></div>`;
  }
  let html = D.clusters.map(c => `<div class="cluster"><div class="c-head">${esc(c.label)}</div>${c.tiles.map(tileHtml).join('')}</div>`).join('');
  html += `<div class="cluster outcomes"><div class="c-head">Program Outcomes &amp; ROI</div>` +
    D.outcomes.map(o => `<div class="o-row" style="--st:${ST[o.status].color}" ${tip([['Measure', o.name], ['Value', 'Not measured'], ['Data Status', ST_LONG[o.status]], ['Source', o.src], ['Note', o.note]])}><span class="o-name">${esc(o.name)}</span><span class="o-val">Not measured${o.target ? `<br>${esc(o.target)}` : ''}</span></div>`).join('') +
    `<div class="roi"><b>ROI (proxy): not measured.</b> To be estimated from cost of early attrition, time to productivity and recruiter hours saved. Assumptions TBD. Equipment shows two live proxies: loaner reliance and late notice.</div></div>`;
  $('#kpis').innerHTML = html;
  D.clusters.forEach(c => c.tiles.forEach(t => {
    if (t.spark) V.sparkline(document.querySelector(`[data-spark="${t.id}"]`), { values: t.spark, height: 26, color: '#4E79A7' });
  }));

  /* ---------------- Map: filled map, Web Mercator ---------------- */
  const LAT0 = 78, LAT1 = -58, merc = l => Math.log(Math.tan(Math.PI / 4 + (Math.max(LAT1, Math.min(LAT0, l)) * Math.PI / 180) / 2));
  const proj = (lon, lat) => [(lon + 180) / 360 * G.w, (merc(LAT0) - merc(lat)) / (merc(LAT0) - merc(LAT1)) * G.h];
  const regionBy = Object.fromEntries(D.regions.map(r => [r.key, r]));
  const wsum = {};
  Object.values(D.countries).forEach(([r, w]) => wsum[r] = (wsum[r] || 0) + w);
  D.points.forEach(p => wsum[p.region] = (wsum[p.region] || 0) + p.w);
  const hiresOf = (r, w) => Math.round(regionBy[r].hires * w / wsum[r]);
  const mapTip = (name, r, w) => tip([['Country', name], ['Region', regionBy[r].label], ['New Hires', fmtInt(hiresOf(r, w)) + ' (sample)']]);

  let m = `<svg viewBox="70 75 880 440" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Map of new hires by region">`;
  G.countries.forEach(c => {
    const hit = D.countries[c.id];
    m += hit ? `<path class="ctry mark" data-region="${hit[0]}" d="${c.d}" fill="${regionBy[hit[0]].color}" ${mapTip(c.name, hit[0], hit[1])}/>` : `<path class="land" d="${c.d}"/>`;
  });
  D.points.forEach(p => {
    const [x, y] = proj(p.lon, p.lat);
    m += `<circle class="mark" data-region="${p.region}" cx="${x}" cy="${y}" r="4" fill="${regionBy[p.region].color}" stroke="#fff" stroke-width="1" ${mapTip(p.name, p.region, p.w)}/>`;
  });
  D.regions.forEach(r => {
    const [x, y] = proj(r.lon, r.lat);
    m += `<g class="rlbl" data-region="${r.key}" pointer-events="none"><text x="${x}" y="${y - 6}" text-anchor="middle" class="n">${fmtInt(r.hires)}</text><text x="${x}" y="${y + 13}" text-anchor="middle">${esc(r.label)}</text></g>`;
  });
  $('#map').innerHTML = m + '</svg>';
  $('#regionLegend').innerHTML = V.legend({ title: 'Region', items: D.regions.map(r => r.label), colors: D.regions.map(r => r.color) });

  function highlightRegion(key) {
    document.querySelectorAll('#map [data-region]').forEach(el => el.classList.toggle('faded', !!key && el.dataset.region !== key));
    $('#fRegion').value = key || '(All)';
  }
  $('#map').addEventListener('click', e => {
    e.stopPropagation();
    const el = e.target.closest('[data-region]'), cur = $('#fRegion').value;
    highlightRegion(el && el.dataset.region !== cur ? el.dataset.region : null);
  });
  $('#fRegion').addEventListener('change', e => highlightRegion(e.target.value === '(All)' ? null : e.target.value));
  document.querySelectorAll('#regionLegend .lg-item').forEach((it, i) => it.addEventListener('click', () => highlightRegion($('#fRegion').value === D.regions[i].key ? null : D.regions[i].key)));

  V.line('#trend', { x: D.months, xField: 'Month', measure: 'New Hires', format: 'int', height: 92, markers: true, zero: false,
    series: [{ name: 'New Hires', values: D.hiresByMonth, color: '#4E79A7' }] });

  /* ---------------- NHO attendance (sample) ---------------- */
  const nhoColors = ['#4E79A7', '#A0CBE8', '#D4D4D4'];
  V.palettes.categorical._nho = nhoColors.concat(V.palettes.categorical['Tableau 10'].slice(3));
  $('#nhoLegend').innerHTML = V.legend({ title: 'Attendance', items: D.nho.series, colors: nhoColors, inline: true });
  V.stackedBar('#nho', { rows: D.nho.cohorts, series: D.nho.series, palette: '_nho', labels: true, format: 'int', rowHeight: 30,
    dimA: 'Cohort', dimB: 'Attendance', measure: 'New Hires (sample)', axisTitle: 'New Hires' });
  const sum = i => D.nho.cohorts.reduce((a, c) => a + c.values[i], 0);
  const live = sum(0), virt = sum(1), tot = live + virt + sum(2);
  $('#nhoRate').textContent = Math.round((live + virt) / tot * 100) + '%';
  $('#nhoLive').textContent = Math.round(live / (live + virt) * 100) + '%';

  /* ---------------- Persona filter: drives the real PEX persona figures ---------------- */
  const srcOnstart = $('#s-onstart').innerHTML, srcQa = $('#s-qa').innerHTML;
  $('#fPersona').addEventListener('change', e => {
    const k = e.target.value, p = D.persona[k];
    $('#v-onstart').textContent = p.onstart;
    $('#v-qa').textContent = p.qa;
    $('#s-onstart').innerHTML = k === 'All' ? srcOnstart : `${k} only<br>${srcOnstart}`;
    $('#s-qa').innerHTML = p.qa === 'n/a' ? 'NTC audits not tagged in source' : (k === 'All' ? srcQa : `${k} only<br>${srcQa}`);
    document.querySelectorAll('.t-spark').forEach(s => s.style.visibility = k === 'All' ? '' : 'hidden');
    $('#hiresTot').textContent = fmtInt(p.hires);
    $('#hiresPersona').textContent = k === 'All' ? 'All personas' : `${k} persona (map not filtered)`;
  });
  $('#revert').addEventListener('click', () => { $('#fPersona').value = 'All'; $('#fPersona').dispatchEvent(new Event('change')); highlightRegion(null); });

  /* ---------------- Fit / 100% ---------------- */
  let zoom = 'fit';
  function applyZoom() {
    const stage = $('#exec .stage'), inner = $('#stageInner');
    const s = zoom === 'fit' ? Math.min(1, (stage.clientWidth - 24) / 1600) : 1;
    $('#dash').style.transform = `scale(${s})`;
    inner.style.width = 1600 * s + 'px'; inner.style.height = 900 * s + 'px';
  }
  document.querySelectorAll('#zoom button').forEach(b => b.addEventListener('click', () => {
    zoom = b.dataset.z; document.querySelectorAll('#zoom button').forEach(x => x.setAttribute('aria-pressed', x === b)); applyZoom();
  }));
  window.addEventListener('resize', applyZoom); applyZoom();

  /* ---------------- Tabs ---------------- */
  document.querySelectorAll('.tab-tabs button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.tab-tabs button').forEach(x => x.setAttribute('aria-selected', x === b));
    document.querySelectorAll('body > section').forEach(s => s.hidden = s.id !== b.dataset.tab);
    applyZoom();
  }));

  /* ---------------- Definitions tab ---------------- */
  const sw = k => `<span class="sw" style="background:${ST[k].color}"></span>${ST[k].label}`;
  const dim = s => `<span class="pill">${esc(s)}</span>`, mea = s => `<span class="pill m">${esc(s)}</span>`;
  const table = (cols, rows, widths) => `<table class="tab-xtab"><thead><tr>${cols.map((c, i) => `<th${widths && widths[i] ? ` style="width:${widths[i]}"` : ''}>${c}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const sheet = (title, body) => `<div class="sheet"><div class="tab-sheet-title">${title}</div>${body}</div>`;

  const measures = [];
  D.clusters.forEach(c => c.tiles.forEach(t => measures.push([esc(c.label), esc(t.name), sw(t.status), KIND[t.kind], esc(t.src), esc(t.note)])));
  D.outcomes.forEach(o => measures.push(['Program Outcomes &amp; ROI', esc(o.name), sw(o.status), KIND.none, esc(o.src), esc(o.note)]));
  measures.push(['Volume', 'New Hires by Region', sw('g'), 'Actual total, sample split', 'Workday', 'Region, country and work location are PRD filters.']);
  measures.push(['Volume', 'New Hires by Month', sw('g'), KIND.real, 'Workday (PEX report)', 'Jan-Sep 2026.']);
  measures.push(['NHO', 'NHO Attendance: Live vs Virtual', sw('a'), KIND.sample, 'NHO Blueprint / ServiceNow', 'Capture method not defined. Two cohorts a month.']);

  $('#defsBody').innerHTML = `
<div class="hdr"><div><h1>Definitions</h1><div class="sub">Onboarding Dashboard | Executive View</div></div></div>
${sheet('Measures', table(['Group', 'Measure', 'Data Status', 'Value Shown', 'Source', 'Notes'], measures, ['13%', '19%', '10%', '9%', '15%', '']))}
${sheet('Changes From the Brief', table(['Change', 'Reason'], [
  ['Filters at the top as dropdowns', 'Tableau filters can\'t be styled as chips. Filters sit above the sheets they affect.'],
  ['Data status shown as a colored bar on each tile', 'Dots next to numbers read as performance. A bar plus a legend reads as data status.'],
  ['Data status set per measure, not per cluster', 'Clusters are mixed. HM Readiness Score is captured today. 1st-year attrition is partial.'],
  ['Sample values in gray; source and period under actual values', 'Equipment covers Jan-May 2026 and PEX covers Jan-Sep 2026.'],
  ['Program Outcomes &amp; ROI as five rows', 'The brief caps clusters at three tiles but lists five outcomes. None has a value yet.'],
  ['Recruiter Time Saved under Outcomes &amp; ROI', 'The workbook lists it under PEX Success. Kept here so PEX stays at three tiles.'],
  ['Region colors from Tableau 10', 'Red and green already mean data status. Only countries with hires are filled.'],
  ['Did Not Attend segment in NHO bars', 'Shows the attendance rate in the chart.'],
  ['Onboarding case CSAT left off', '131 responses YTD. Better suited to the PEX Ops view.'],
  ['Fixed size 1600 x 900', '16:9, the same as Tableau\'s PowerPoint size.'],
], ['32%', '']))}
${sheet('Open Questions', table(['Item', 'Detail'], [
  ['Laptop by Day 1 denominator', '586 of 601 with a delivery date = 97.5%. 586 of 604 requests = 97.0%.'],
  ['Region names', 'HAM uses NA, EU, AP, LATAM. PEX CSAT uses AMER, EMEA, APAC. Needs one region, country, work location hierarchy across sources.'],
  ['Aug start-date rate', 'Deck 87.3%, recompute 86.1%. The trend uses 86.1%.'],
  ['Loaner counts', '144, 143 or 159 depending on the cut.'],
  ['Targets', 'Set: Laptop by Day 1 (98%), Recruiter Time Saved (+20%). All others TBC.'],
], ['32%', '']))}
${sheet('Build Notes', table(['Sheet', 'Build'], [
  ['KPI tiles', 'One Text sheet per tile in a horizontal container per group. Status bar: a narrow bar sheet colored by ' + dim('Data Status') + '.'],
  ['Sparklines', 'Line sheets with axes and headers hidden.'],
  ['Map', 'Filled map: Detail ' + dim('Country') + ', Color ' + dim('Region') + '. Region labels from a second map layer (dual axis) at region centroids.'],
  ['New Hires by Month', 'Line: ' + dim('MONTH(Start Date)') + ' x ' + mea('CNTD(Hire ID)') + '.'],
  ['NHO Attendance', 'Stacked bar: Rows ' + dim('Cohort') + ', Columns ' + mea('CNTD(Hire ID)') + ', Color ' + dim('Attendance Mode') + '.'],
  ['Filters', 'Apply to all sheets on the shared data source. Persona: Regular, NTC, Exec. Interns and apprentices are out of MVP.'],
], ['32%', '']))}
${sheet('Other Views (Defined, Not Built)', table(['View', 'Audience', 'Refresh', 'Contents'], [
  ['PEX Operational', 'PEX coordinators', 'Daily', 'New-hire list with status; task funnel; SLA timers and stuck items; escalations (Day 1-90); nudge status (Day -7, -72 hr); case CSAT.'],
  ['Hiring Manager', 'Hiring managers', 'Weekly or on demand', 'HM readiness score; equipment, software and badge status; multi-hire grid; outstanding tasks; Day 1 meet confirmation.'],
], ['16%', '16%', '14%', '']))}
<div style="height:14px"></div>`;
})();
