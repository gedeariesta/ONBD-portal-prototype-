const { launch, BASE, OUT, outDir } = require('./lib');

function lum(c){const s=c.map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return 0.2126*s[0]+0.7152*s[1]+0.0722*s[2];}
function ratio(a,b){const L1=lum(a),L2=lum(b);return (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);}
function parse(s){const m=s.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);return m?{c:[+m[1],+m[2],+m[3]],a:m[4]===undefined?1:+m[4]}:null;}

(async () => {
  const b = await launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  // Every route, not a sample: v4 restyled all of them.
  const routes = ['', '#/equipment', '#/details', '#/jd', '#/intro', '#/policies', '#/network', '#/flow', '#/todos',
    '#/handoffs', '#/startdate', '#/bgcheck', '#/hm/', '#/hm/logistics', '#/hm/computer', '#/hm/software', '#/hm/buddy',
    '#/hm/calendar', '#/hm/welcome', '#/hm/intro', '#/hm/card', '#/hm/subtraction',
    '#/pex/', '#/pex/caseload', '#/pex/hire/jreyes', '#/pex/hire/wzhang', '#/pex/blueprints'];
  const all = { lowContrast: [], noAlt: [], noLabel: [], tinyText: [] };

  for (const r of [...routes, 'sidekick:nh', 'sidekick:hm']) {
    if (r.startsWith('sidekick:')) {
      // The Sidekick panel is where the most new text is, so it is measured
      // open, with an answer, a source line and the person handoff showing.
      await p.goto(BASE + (r.endsWith('hm') ? '#/hm/' : '#/'), { waitUntil: 'networkidle' });
      await p.waitForTimeout(400);
      await p.evaluate(() => document.getElementById('chatFab').click()); await p.waitForTimeout(300);
      await p.evaluate(() => document.querySelector('#chatBody [data-skq]').click()); await p.waitForTimeout(300);
    } else {
      await p.goto(BASE + r, { waitUntil: 'networkidle' });
      await p.waitForTimeout(500);
    }
    const res = await p.evaluate(() => {
      const out = { text: [], imgs: 0, noAlt: 0, unlabelled: [], tiny: [] };
      // The effective background: walk up to the first ancestor that paints
      // one. v3 skipped anything on a gradient or a dark surface, which in
      // v4 would have skipped every page (the body carries the wash) and
      // every scene, where the new contrast risk actually is. Now:
      //  - the page wash counts as its darkest blend over white, lilac at
      //    30%, so text on it is measured against the worst point;
      //  - a scene is measured against its ink fill;
      //  - only a gradient with no solid fill under it is skipped, since
      //    no single colour stands for it.
      const WASH = 'rgb(242, 240, 255)';
      const bgOf = el => { let n = el; while (n && n !== document.documentElement) {
        const cs = getComputedStyle(n);
        if (n === document.body) return cs.backgroundImage.includes('gradient') ? WASH : (cs.backgroundColor || 'rgb(255,255,255)');
        const c = cs.backgroundColor;
        if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) {
          const a = c.match(/rgba\([^)]*,\s*([\d.]+)\)/);
          if (!a || +a[1] >= 0.95) return c;        // translucent washes fall through to what is under them
        }
        if (cs.backgroundImage && cs.backgroundImage.includes('gradient')) return null;
        n = n.parentElement; } return 'rgb(255,255,255)'; };
      const onGradient = el => bgOf(el) === null;
      document.querySelectorAll('#app *, .rail *, .panel *').forEach(el => {
        if (!el.offsetParent && el.tagName !== 'BODY') return;
        if (onGradient(el)) return;
        const hasOwnText = [...el.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim().length > 1);
        if (!hasOwnText) return;
        const cs = getComputedStyle(el);
        const fs = parseFloat(cs.fontSize);
        if (fs < 11) out.tiny.push({ t: el.innerText.slice(0,40), fs });
        out.text.push({ fg: cs.color, bg: bgOf(el), fs, fw: cs.fontWeight, t: el.innerText.slice(0,45) });
      });
      // Gradient text has no single colour, so every stop is measured
      // against the background and the worst one counts. The brand
      // gradient's red end is about 4:1 on white, which clears AA only as
      // large text; the pastel one on ink clears it at any size.
      out.grads = [...document.querySelectorAll('#app *, .panel *')].filter(e => {
        const cs = getComputedStyle(e);
        return e.offsetParent && (cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text')
          && cs.backgroundImage.includes('gradient');
      }).map(e => {
        const cs = getComputedStyle(e);
        let n = e.parentElement; while (n && bgOf(n) === null) n = n.parentElement;
        return { t: e.innerText.slice(0, 40), fs: parseFloat(cs.fontSize), fw: cs.fontWeight,
                 stops: [...cs.backgroundImage.matchAll(/rgba?\([^)]+\)/g)].map(m => m[0]), bg: n ? bgOf(n) : 'rgb(255,255,255)' };
      });
      document.querySelectorAll('img').forEach(i => { out.imgs++; if (!i.alt) out.noAlt++; });
      document.querySelectorAll('button, a[data-goto], [role=button]').forEach(el => {
        const label = (el.innerText||'').trim() || el.getAttribute('aria-label') || el.getAttribute('title');
        if (!label) out.unlabelled.push(el.className || el.tagName);
      });
      return out;
    });
    res.text.forEach(t => {
      const f = parse(t.fg), g = parse(t.bg);
      if (!f || !g || f.a < 0.95) return;
      const cr = ratio(f.c, g.c);
      const large = t.fs >= 18.66 || (t.fs >= 14 && +t.fw >= 700);
      const need = large ? 3 : 4.5;
      if (cr < need) all.lowContrast.push({ r: r || '#/', cr: cr.toFixed(2), need, fs: t.fs, t: t.t });
    });
    res.grads.forEach(x => {
      const g = parse(x.bg); if (!g) return;
      const worst = Math.min(...x.stops.map(parse).filter(Boolean).map(f => ratio(f.c, g.c)));
      const large = x.fs >= 18.66 || (x.fs >= 14 && +x.fw >= 700);
      const need = large ? 3 : 4.5;
      if (worst < need) all.lowContrast.push({ r: r || '#/', cr: worst.toFixed(2) + ' (worst gradient stop)', need, fs: x.fs, t: x.t });
    });
    res.tiny.forEach(x => all.tinyText.push({ r: r || '#/', ...x }));
    res.unlabelled.forEach(x => all.noLabel.push({ r: r || '#/', el: x }));
    if (res.noAlt) all.noAlt.push({ r: r || '#/', n: res.noAlt, of: res.imgs });
  }
  const uniq = (arr, k) => [...new Map(arr.map(x => [k(x), x])).values()];
  console.log('LOW CONTRAST:', all.lowContrast.length);
  uniq(all.lowContrast, x => x.t + x.cr).slice(0, 14).forEach(x => console.log(`  ${x.cr} (need ${x.need}) ${x.fs}px ${x.r} :: ${x.t.replace(/\n/g,' ')}`));
  console.log('\nTEXT UNDER 11px:', all.tinyText.length);
  uniq(all.tinyText, x => x.t).slice(0, 8).forEach(x => console.log(`  ${x.fs}px ${x.r} :: ${x.t.replace(/\n/g,' ')}`));
  console.log('\nUNLABELLED CONTROLS:', all.noLabel.length, uniq(all.noLabel, x=>x.el).slice(0,8).map(x => x.el).join(' | '));
  console.log('IMAGES MISSING ALT:', JSON.stringify(all.noAlt));
  await b.close();
})();
