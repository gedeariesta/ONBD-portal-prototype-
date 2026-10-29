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
  const PH = { p1: 'Phase 1', tbc: 'TBC', ns: 'Later' };
  $('#statusLegend').innerHTML = V.legend({ title: 'Data Status', items: ['g', 'a', 'r'].map(k => ST[k].label), colors: ['g', 'a', 'r'].map(k => ST[k].color), inline: true });
  $('#statusLegend .tab-legend').style.marginLeft = 'auto';
  $('#statusLegend').style.marginLeft = 'auto';

  /* Long notes wrap inside the tooltip */
  const css = document.createElement('style');
  css.textContent = '.tab-tooltip .tt-row{white-space:normal}.tab-tooltip{max-width:320px}';
  document.head.appendChild(css);

  /* ---------------- KPI strip ---------------- */
  function tileHtml(t) {
    const rows = [['Measure', t.name], ['Phase', PH[t.phase] || '-'], ['Value', t.pulse ? 'See tile' : t.value + (t.kind === 'sample' ? ' (sample)' : '')], ['Data Status', ST_LONG[t.status]], ['Source', t.src], ['Field Type', t.type], ['Note', t.note]];
    const body = t.pulse
      ? `<div class="pulse">${t.pulse.map(([k, v]) => v == null ? `<div class="opt"><b>-</b><span>${k} (opt.)</span></div>` : `<div><b>${esc(v)}</b><span>${esc(k)}</span></div>`).join('')}<span class="t-tgt" style="padding-bottom:1px">${esc(t.target)}</span></div>`
      : `<div class="t-row"><span class="t-val" ${t.id ? `id="v-${t.id}"` : ''}>${esc(t.value)}</span><span class="t-tgt">${esc(t.target)}</span>${t.gap ? `<span class="t-gap">${esc(t.gap)}</span>` : ''}</div>`;
    const src = t.kind === 'real' ? (t.foot ? `${esc(t.foot)}<br>${esc(t.period)}` : esc(t.period)) : 'Sample value';
    return `<div class="tile ${t.kind}" style="--st:${ST[t.status].color}" ${tip(rows)}>
      <div class="t-name">${esc(t.name)}${t.phase ? `<span class="t-ph ${t.phase}">${PH[t.phase]}</span>` : ''}</div>${body}
      ${t.spark ? `<div class="t-spark" data-spark="${t.id}"></div>` : ''}
      <div class="t-src" ${t.id ? `id="s-${t.id}"` : ''}>${src}</div></div>`;
  }
  const row = sec => `<div class="kgrp"><div class="c-head"><span>${esc(sec.label)}</span><small>${esc(sec.sub || '')}</small></div><div class="ktiles" style="grid-template-columns:repeat(${sec.cols},1fr)">${sec.tiles.map(tileHtml).join('')}</div></div>`;
  const [out, nh, hm, pex] = D.sections;
  $('#kpis').innerHTML = `<div class="krow">${row(out)}</div><div class="krow">${row(nh)}</div><div class="krow" style="grid-template-columns:1fr 1fr">${row(hm)}${row(pex)}</div>`;
  D.sections.forEach(c => c.tiles.forEach(t => {
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

  /* ---------------- First 90 Days (sample) ---------------- */
  $('#f90Legend').innerHTML = V.legend({ title: 'Bucket', items: D.first90.map(x => x.name), colors: D.first90.map(x => x.color), inline: true });
  V.line('#f90', { x: D.waves, xField: 'Survey Wave', dim: 'Bucket', measure: '% Favorable (sample)', format: v => v + '%', height: 250, markers: true, zero: false,
    series: D.first90 });

  $('#revert').addEventListener('click', () => { $('#fPersona').value = 'All'; highlightRegion(null); });

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
  D.sections.forEach(c => c.tiles.forEach(t => measures.push([esc(c.label), esc(t.name) + (t.phase ? ' (' + PH[t.phase] + ')' : ''), sw(t.status), KIND[t.kind], esc(t.src), esc(t.note)])));
  measures.push(['Trend', 'First 90 Days', sw('a'), KIND.sample, 'Glint surveys', '% favorable per bucket at Week 2, Day 30 and Day 90.']);
  measures.push(['Volume', 'New Hires by Region', sw('g'), KIND.sample, 'Workday', 'Region, country and work location are PRD filters.']);
  measures.push(['Volume', 'New Hires by Month', sw('g'), KIND.sample, 'Workday', '']);
  measures.push(['Volume', 'NHO Attendance (future)', sw('r'), KIND.none, 'TBD', 'No way to record attendance yet.']);

  $('#defsBody').innerHTML = `
<div class="hdr"><div><h1>Definitions</h1><div class="sub">Onboarding Dashboard | Executive View</div></div></div>
${sheet('Measures', table(['Group', 'Measure', 'Data Status', 'Value Shown', 'Source', 'Notes'], measures, ['13%', '19%', '10%', '9%', '15%', '']))}
${sheet('Design Choices (v0.6)', table(['Choice', 'Why'], [
  ['Reads top-down: outcomes, new hire, then managers and PEX', 'The 35,000 ft view first, then detail.'],
  ['Equipment sits in New Hire Success', 'Getting a laptop on Day 1 is part of the new hire\'s experience, alongside the survey buckets.'],
  ['One Overall Onboarding Score', 'Built from the new-hire survey buckets, so there is one headline number instead of two overlapping ones.'],
  ['No exit survey', 'Offboarding is outside what this program controls.'],
  ['First 90 Days trend', 'Shows whether sentiment tracks up or down across Week 1, Day 30 and Day 90, without assuming a dip.'],
  ['PEX measures start at offer accepted', 'Earlier steps (job requisition, offer letter) are outside the program.'],
  ['Data status shown as a colored bar on each tile', 'A bar plus a legend reads as data status, not performance.'],
  ['Everything filters by region and function', 'Same filters on every sheet.'],
  ['Start Cohort and Talent Type filters', 'New hires grouped by start month or quarter; executive vs emerging talent from job level 2.'],
  ['Phase on every tile', 'Phase 1 is possible by March (Glint via Helix, Workday, existing content). TBC needs a path into Helix. Later waits on data not captured yet.'],
  ['Tool-agnostic', 'Drawn in Tableau style, but the measures and layout work in Tableau, Looker or Power BI.'],
], ['32%', '']))}
${sheet('Open Questions', table(['Item', 'Detail'], [
  ['Laptop by Day 1 denominator', '586 of 601 with a delivery date = 97.5%. 586 of 604 requests = 97.0%.'],
  ['Region names', 'HAM uses NA, EU, AP, LATAM. PEX CSAT uses AMER, EMEA, APAC. Needs one region, country, work location hierarchy across sources.'],
  ['Targets', 'Set: Laptop by Day 1 (98%) and PEX\'s standard goals for On-Time Start (90%) and Onboarding QA (98%). All others open.'],
  ['Overall Onboarding Score', 'Which 8 or 9 questions, and how are they weighted?'],
  ['Start Date Held', 'Where the original start date lives: offer letter or requisition.'],
  ['Equipment', 'Power BI source, update cadence and backup owner.'],
], ['32%', '']))}
${sheet('Build Notes', table(['Sheet', 'Build'], [
  ['KPI tiles', 'One Text sheet per tile in a horizontal container per group. Status bar: a narrow bar sheet colored by ' + dim('Data Status') + '.'],
  ['Sparkline', 'Line sheet with axes and headers hidden, on the Overall Onboarding Score tile.'],
  ['Map', 'Filled map: Detail ' + dim('Country') + ', Color ' + dim('Region') + '. Region labels from a second map layer (dual axis) at region centroids.'],
  ['New Hires by Month', 'Line: ' + dim('MONTH(Start Date)') + ' x ' + mea('CNTD(Hire ID)') + '.'],
  ['First 90 Days', 'Line: Columns ' + dim('Survey Wave') + ', Rows ' + mea('% Favorable') + ', Color ' + dim('Bucket') + '.'],
  ['Filters', 'Region, country, function, work location, talent type (job level 2), start cohort, period, remote / on-site. Apply to all sheets. Persona: Regular, NTC, Exec. Interns and apprentices are out of MVP.'],
], ['32%', '']))}
${sheet('Other Views (Defined, Not Built)', table(['View', 'Audience', 'Refresh', 'Contents'], [
  ['PEX Operational', 'PEX coordinators', 'Daily', 'New-hire list with status; task funnel; SLA timers and stuck items; escalations (Day 1-90); nudge status (Day -7, -72 hr); case CSAT.'],
  ['Hiring Manager', 'Hiring managers', 'Weekly or on demand', 'HM readiness score; equipment, software and badge status; multi-hire grid; outstanding tasks; Day 1 meet confirmation.'],
], ['16%', '16%', '14%', '']))}
<div style="height:14px"></div>`;
})();
