/* Executive View renderer. Data: data.js. Kit: ../design-package. */
(function () {
  'use strict';
  const D = window.ONBD, V = window.TabViz, G = window.ONBD_GEO;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tip = rows => `data-tip="${esc(JSON.stringify(rows))}"`;
  const RAG = { g: ['●', 'Documented / available'], a: ['◑', 'Partial — pending integration or build'], r: ['○', 'No instrument yet'] };
  /* Readiness glyph: filled / half / open circle (Tableau "proportions" shape set), RAG-colored */
  const RAGC = { g: '#4CAF50', a: '#F2B600', r: '#F44336' };
  const ragSvg = r => `<svg viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill="${r === 'g' ? RAGC.g : '#fff'}" stroke="${RAGC[r]}" stroke-width="1.6"/>${r === 'a' ? `<path d="M6 1a5 5 0 0 1 0 10Z" fill="${RAGC.a}"/>` : ''}</svg>`;
  const ragHtml = r => `<span class="rag" title="Data readiness: ${RAG[r][1]}">${ragSvg(r)}</span>`;
  document.querySelectorAll('[data-rag]').forEach(el => el.innerHTML = ragSvg(el.dataset.rag));
  const KIND = { real: 'Real figure', illustrative: 'Illustrative placeholder', none: 'Not yet measured' };
  const fmtInt = n => n.toLocaleString('en-US');

  /* Long field notes need to wrap inside the Tableau tooltip */
  const st = document.createElement('style'); st.textContent = '.tab-tooltip .tt-row{white-space:normal}.tab-tooltip{max-width:320px}'; document.head.appendChild(st);

  /* ---------------- KPI strip ---------------- */
  function tileHtml(t) {
    const rows = [['Field', t.name], ['Data', KIND[t.kind]], ['Readiness', RAG[t.rag][1]], ['Source', t.src], ['Tableau', t.type], [t.note]];
    let body;
    if (t.pulse) {
      body = `<div class="pulse">${t.pulse.map(([k, v]) => v === 'optional' ? `<div class="opt"><b>Day 60</b><span>optional</span></div>` : `<div><b>${esc(v)}</b><span>${esc(k)}</span></div>`).join('')}<div style="align-self:flex-end"><span class="t-tgt">${esc(t.target)}</span></div></div>`;
    } else {
      body = `<div class="t-row"><span class="t-val" ${t.id ? `id="v-${t.id}"` : ''}>${esc(t.value)}</span><span class="t-tgt">${esc(t.target)}</span>${t.gap ? `<span class="t-gap">${esc(t.gap)}</span>` : ''}</div>`;
    }
    const src = t.kind === 'real' ? (t.foot ? `${t.foot}\n${t.period}` : t.period) : 'Illustrative value · ' + t.src;
    return `<div class="tile" ${tip(rows)}>
      <div class="t-name">${ragHtml(t.rag)}<span>${esc(t.name)}</span></div>
      <span class="t-tag ${t.kind === 'real' ? 'real' : ''}">${t.kind === 'real' ? 'REAL' : 'ILLUSTRATIVE'}</span>
      ${body}
      ${t.spark ? `<div class="t-spark" data-spark="${t.id}"></div>` : ''}
      <div class="t-src" ${t.id ? `id="s-${t.id}"` : ''}>${esc(src).replace('\n', '<br>')}</div>
    </div>`;
  }
  let html = D.clusters.map(c => `<div class="cluster"><div class="c-head"><span>${esc(c.label)}</span><em>${c.tiles.length} measures</em></div>${c.tiles.map(tileHtml).join('')}</div>`).join('');
  html += `<div class="cluster outcomes"><div class="c-head"><span>Program Outcomes &amp; ROI</span><em>lagging · no instrument yet</em></div>` +
    D.outcomes.map(o => `<div class="o-row" ${tip([['Field', o.name], ['Data', KIND.none], ['Readiness', RAG[o.rag][1]], ['Source', o.src], [o.note]])}>${ragHtml(o.rag)}<span class="o-name">${esc(o.name)}</span><span class="o-val">— Not yet measured${o.target ? `<i>${esc(o.target)}</i>` : ''}</span></div>`).join('') +
    `<div class="roi"><b>ROI Visibility (proxy)</b> — Estimated from industry-standard proxies (cost of early attrition, time-to-productivity, recruiter hours saved). Assumptions to be specified. Not yet measured. Live proxies today: loaner reliance and late-notice rate (Equipment).</div></div>`;
  $('#kpis').innerHTML = html;
  D.clusters.forEach(c => c.tiles.forEach(t => {
    if (!t.spark) return;
    V.sparkline(document.querySelector(`[data-spark="${t.id}"]`), { values: t.spark, height: 26, color: '#4E79A7' });
  }));

  /* ---------------- Map (Tableau filled map, Web Mercator) ---------------- */
  const LAT0 = 78, LAT1 = -58, merc = l => Math.log(Math.tan(Math.PI / 4 + (Math.max(LAT1, Math.min(LAT0, l)) * Math.PI / 180) / 2));
  const proj = (lon, lat) => [(lon + 180) / 360 * G.w, (merc(LAT0) - merc(lat)) / (merc(LAT0) - merc(LAT1)) * G.h];
  const regionBy = Object.fromEntries(D.regions.map(r => [r.key, r]));
  const wsum = {};
  Object.values(D.countries).forEach(([r, w]) => wsum[r] = (wsum[r] || 0) + w);
  D.points.forEach(p => wsum[p.region] = (wsum[p.region] || 0) + p.w);
  const hiresOf = (r, w) => Math.round(regionBy[r].hires * w / wsum[r]);

  let m = `<svg viewBox="70 75 880 440" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Filled map of new hires by region">`;
  G.countries.forEach(c => {
    const hit = D.countries[c.id];
    if (!hit) { m += `<path class="land" d="${c.d}"/>`; return; }
    const [r, w] = hit, reg = regionBy[r];
    m += `<path class="ctry mark" data-region="${r}" d="${c.d}" fill="${reg.color}" ${tip([['Country', c.name], ['Region', reg.label], ['New hires', fmtInt(hiresOf(r, w)) + ' (illustrative)']])}/>`;
  });
  D.points.forEach(p => {
    const [x, y] = proj(p.lon, p.lat), reg = regionBy[p.region];
    m += `<circle class="pt mark" data-region="${p.region}" cx="${x}" cy="${y}" r="4" fill="${reg.color}" stroke="#fff" stroke-width="1" ${tip([['Country', p.name], ['Region', reg.label], ['New hires', fmtInt(hiresOf(p.region, p.w)) + ' (illustrative)']])}/>`;
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
    const el = e.target.closest('[data-region]');
    e.stopPropagation();
    const cur = $('#fRegion').value;
    highlightRegion(el && el.dataset.region !== cur ? el.dataset.region : null);
  });
  $('#fRegion').addEventListener('change', e => highlightRegion(e.target.value === '(All)' ? null : e.target.value));
  document.querySelectorAll('#regionLegend .lg-item').forEach((it, i) => it.addEventListener('click', () => highlightRegion($('#fRegion').value === D.regions[i].key ? null : D.regions[i].key)));

  /* Monthly trend under the map (real) */
  const cap = document.createElement('div');
  cap.className = 'tab-caption'; cap.style.margin = '2px 0 0'; cap.textContent = 'Monthly new hires, 2026 (real — Workday via PEX report)';
  $('#trend').before(cap);
  V.line('#trend', { x: D.months, xField: 'Start month', measure: 'New hires', format: 'int', height: 92, markers: true, zero: false,
    series: [{ name: 'New hires', values: D.hiresByMonth, color: '#4E79A7' }] });

  /* ---------------- NHO attendance (illustrative) ---------------- */
  const nhoColors = ['#4E79A7', '#A0CBE8', '#D4D4D4'];
  V.palettes.categorical._nho = nhoColors.concat(V.palettes.categorical['Tableau 10'].slice(3));
  $('#nhoLegend').innerHTML = V.legend({ title: 'Attendance', items: D.nho.series, colors: nhoColors, inline: true });
  V.stackedBar('#nho', { rows: D.nho.cohorts, series: D.nho.series, palette: '_nho', labels: true, format: 'int', rowHeight: 30,
    dimA: 'NHO cohort', dimB: 'Attendance', measure: 'New hires (illustrative)', axisTitle: 'New hires in cohort' });
  const tot = D.nho.cohorts.reduce((a, c) => a + c.values[0] + c.values[1] + c.values[2], 0);
  const live = D.nho.cohorts.reduce((a, c) => a + c.values[0], 0), virt = D.nho.cohorts.reduce((a, c) => a + c.values[1], 0);
  $('#nhoRate').textContent = Math.round((live + virt) / tot * 100) + '%';
  $('#nhoLive').textContent = Math.round(live / (live + virt) * 100) + '%';

  /* ---------------- Persona filter (wired to real PEX persona data) ---------------- */
  const srcOnstart = $('#s-onstart').textContent, srcQa = $('#s-qa').textContent;
  $('#fPersona').addEventListener('change', e => {
    const p = D.persona[e.target.value];
    $('#v-onstart').textContent = p.onstart;
    $('#v-qa').textContent = p.qa;
    $('#s-qa').textContent = p.qa === 'n/a' ? 'NTC audits not tagged separately in source' : srcQa;
    $('#s-onstart').textContent = e.target.value === 'All' ? srcOnstart : `${e.target.value} only · ${srcOnstart}`;
    document.querySelectorAll('.t-spark').forEach(s => s.style.visibility = e.target.value === 'All' ? '' : 'hidden');
    $('#hiresTot').textContent = fmtInt(p.hires);
    $('#hiresPersona').textContent = e.target.value === 'All' ? 'all personas' : e.target.value + ' persona (map split unchanged)';
  });
  $('#revert').addEventListener('click', () => { $('#fPersona').value = 'All'; $('#fPersona').dispatchEvent(new Event('change')); highlightRegion(null); });

  /* ---------------- Fit / zoom (Tableau shows fixed-size dashboards at 100%; fit is for review) ---------------- */
  let zoom = 'fit';
  function applyZoom() {
    const stage = $('#exec .stage'), inner = $('#stageInner');
    const s = zoom === 'fit' ? Math.min(1, (stage.clientWidth - 24) / 1600) : 1;
    $('#dash').style.transform = `scale(${s})`; $('#dash').style.transformOrigin = '0 0';
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

  /* ---------------- Build notes & field spec ---------------- */
  const R = r => `${ragHtml(r)} ${RAG[r][1]}`, G3 = `${ragHtml('g')} ${ragHtml('a')} ${ragHtml('r')}`;
  const dim = s => `<span class="pill">${esc(s)}</span>`, mea = s => `<span class="pill m">${esc(s)}</span>`;
  const specRows = [];
  D.clusters.forEach(c => c.tiles.forEach(t => specRows.push([c.label, t.name, '@' + t.rag, KIND[t.kind], t.src, t.type])));
  D.outcomes.forEach(o => specRows.push(['Program Outcomes & ROI', o.name, '@' + o.rag, KIND.none, o.src, 'Measure · KPI vs target']));
  $('#notesBody').innerHTML = `
<h2>What this is</h2>
<p>The Executive / Program View from the v4 design prompt, built from the v3.1 planning workbook. It uses only components Tableau has: text-mark KPI sheets, a filled map, a line, a stacked bar, quick filters, and text objects. Hover any tile for its field spec. The two other views (PEX Operational, Hiring Manager) are defined below but not drawn yet.</p>

<h2>Where this departs from the prompt, and why</h2>
<table><tr><th style="width:28%">Change</th><th>Why</th></tr>
<tr><td>Filters are a row of Tableau dropdowns at the top, not pill chips at the bottom.</td><td>Tableau filter controls can't be styled as chips, and filters belong above what they filter. They sit on the same line as the readiness legend to save height.</td></tr>
<tr><td>Readiness is shape-coded (${G3}) as well as colored, and numbers are never colored.</td><td>A red dot next to a number reads as "bad performance". The shapes, the legend wording and the neutral numbers keep readiness and performance apart. Shapes also survive color-blindness and grayscale printing.</td></tr>
<tr><td>Readiness is set per tile from the field spec, not one color per cluster.</td><td>Clusters are mixed. HM Readiness Score and Task Completion are documented (${ragHtml('g')}) even though their values here are placeholders. 1st-year attrition is ${ragHtml('a')} (computable, join not built), not ${ragHtml('r')}.</td></tr>
<tr><td>Every tile has a REAL or ILLUSTRATIVE tag. Real tiles name their source and period.</td><td>Equipment covers Jan–May 2026 and PEX covers Jan–Sep 2026. Leaders will compare tiles side by side, so the window has to be on the tile, not only in the footer.</td></tr>
<tr><td>Program Outcomes &amp; ROI shows 5 compact rows instead of tiles.</td><td>The prompt asks for at most 3 tiles per cluster but lists 5 outcome measures. None has a number yet, so a row with "Not yet measured" carries the same message in less space.</td></tr>
<tr><td>Recruiter time savings stays under Outcomes &amp; ROI (as in the prompt).</td><td>The workbook tags it PEX Success. Keeping it in Outcomes holds PEX at 3 tiles and groups it with the other un-instrumented ROI measures. Easy to move back.</td></tr>
<tr><td>Region colors come from Tableau 10 (blue, orange, teal, purple), not the brand palette.</td><td>Brand red and RAG red/green already carry meaning on this page. Only countries with hires are filled, which is how a Tableau filled map behaves. Singapore and Hong Kong are too small for the map, so they're symbols on a dual axis.</td></tr>
<tr><td>NHO bars include a gray "Did not attend" segment.</td><td>Shows the attendance rate in the chart itself, not only in the callout.</td></tr>
<tr><td>Fixed size 1600 × 900.</td><td>16:9 as asked, and Tableau's PowerPoint preset, so exports line up with slides.</td></tr>
<tr><td>Onboarding case CSAT (97%) is not on the page.</td><td>131 responses year-to-date is too thin for an executive tile. It fits better in the PEX Ops view.</td></tr>
</table>

<h2>Numbers to confirm before this goes in front of leadership</h2>
<table><tr><th style="width:28%">Item</th><th>Detail</th></tr>
<tr><td>Laptop by Day 1 = 97.5%</td><td>586 delivered on or before Day 1, out of 601 deliveries with a recorded date. The report covers 604 requests; 3 have no delivery bucket. Out of 604 it would be 97.0%. Pick one denominator.</td></tr>
<tr><td>Region naming</td><td>HAM uses NA / EU / AP / LATAM. PEX CSAT uses AMER / EMEA / APAC. The mock uses NA / LATAM / EMEA / APAC. WFI needs one region hierarchy (region → country → work location) across all sources, or the Region filter can't work on every sheet.</td></tr>
<tr><td>August on-start rate</td><td>87.3% in the deck vs 86.1% recomputed from the raw tab. The trend uses the recompute.</td></tr>
<tr><td>Loaner reason totals</td><td>143 vs 159 vs 144, depending on the cut (see HAM tab).</td></tr>
<tr><td>Targets</td><td>Only the laptop target (98%, EUT) and recruiter time savings (+20%) exist. Everything else is TBC.</td></tr>
</table>

<h2>Field spec (Executive View)</h2>
<table><tr><th>Cluster</th><th>Field</th><th>Readiness</th><th>On this page</th><th>Source</th><th>Tableau</th></tr>
${specRows.map(r => `<tr>${r.map(c => `<td>${/^@[gar]$/.test(c) ? R(c[1]) : esc(c)}</td>`).join('')}</tr>`).join('')}
<tr><td>Volume &amp; Flow</td><td>New hires by region / country</td><td>${R('g')}</td><td>Real total, illustrative split</td><td>Workday</td><td>Filled map: Detail ${dim('Country')}, Color ${dim('Region')}, Tooltip ${mea('CNTD(Hire ID)')}</td></tr>
<tr><td>Volume &amp; Flow</td><td>New hires by month</td><td>${R('g')}</td><td>Real</td><td>Workday via PEX report</td><td>Line: ${dim('MONTH(Start Date)')} × ${mea('CNTD(Hire ID)')}</td></tr>
<tr><td>NHO Attendance</td><td>Live vs virtual by cohort, attendance rate</td><td>${R('a')}</td><td>Illustrative</td><td>NHO Blueprint / ServiceNow</td><td>Stacked bar: Rows ${dim('Cohort')}, Columns ${mea('CNTD(Hire ID)')}, Color ${dim('Attendance Mode')}</td></tr>
</table>

<h2>Tableau build recipe</h2>
<ul>
<li><b>KPI tiles:</b> one sheet per tile (Text mark), placed in a horizontal container per cluster with a gray background. Readiness glyph = a Shape mark on a calculated readiness field. The REAL / ILLUSTRATIVE tag drops out in the real build.</li>
<li><b>Sparklines:</b> separate line sheets, headers and axes hidden, floated inside the tile container.</li>
<li><b>Map:</b> filled map on ${dim('Country')} with ${dim('Region')} on Color. Region labels come from a second, dual-axis map layer at region centroids.</li>
<li><b>Filters:</b> Region, Country, Work Location, Persona, Start Date and Remote/On-Site. Apply to all sheets using the shared data source. Persona leads with Regular, NTC and Exec; interns and apprentices are out of MVP scope.</li>
<li><b>Header and footer:</b> text objects. Navy background on the header container.</li>
</ul>

<h2>The other two views (defined, not drawn)</h2>
<table><tr><th style="width:18%">View</th><th style="width:22%">Audience · refresh</th><th>Contents</th></tr>
<tr><td>PEX Operational</td><td>PEX coordinators (Fulfillers) · daily / near-real-time</td><td>New-hire list with live status; task funnel (pending / incomplete / completed); SLA timers between activities and stuck items; escalations and new-joiner flags (Day 1–90); nudge status at Day −7 / −72 hr; case CSAT. Filters: the Exec set plus manager co-location and the Day-1 proxy.</td></tr>
<tr><td>Hiring Manager</td><td>Hiring managers, incl. several parallel hires · on demand / weekly</td><td>HM readiness score; per-item trackers (equipment, software, badge); multi-hire progression grid; outstanding tasks by day / week; Day-1 manager-meet confirmation. Filters: my hires, start date, status.</td></tr>
</table>`;
})();
