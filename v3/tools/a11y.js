const { launch, BASE, OUT, outDir } = require('./lib');

function lum(c){const s=c.map(v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return 0.2126*s[0]+0.7152*s[1]+0.0722*s[2];}
function ratio(a,b){const L1=lum(a),L2=lum(b);return (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);}
function parse(s){const m=s.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);return m?{c:[+m[1],+m[2],+m[3]],a:m[4]===undefined?1:+m[4]}:null;}

(async () => {
  const b = await launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const routes = ['', '#/equipment', '#/details', '#/hm/', '#/pex/', '#/pex/caseload', '#/pex/hire/jreyes', '#/pex/blueprints'];
  const all = { lowContrast: [], noAlt: [], noLabel: [], tinyText: [] };

  for (const r of routes) {
    await p.goto(BASE + r, { waitUntil: 'networkidle' });
    await p.waitForTimeout(500);
    const res = await p.evaluate(() => {
      const out = { text: [], imgs: 0, noAlt: 0, unlabelled: [], tiny: [] };
      // effective background by walking up for a non-transparent ancestor
      const bgOf = el => { let n = el; while (n && n !== document.documentElement) {
        const c = getComputedStyle(n).backgroundColor;
        if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return c; n = n.parentElement; } return 'rgb(255,255,255)'; };
      const onGradient = el => { let n = el; while (n && n !== document.documentElement) {
        const cs = getComputedStyle(n);
        if (cs.backgroundImage && cs.backgroundImage.includes('gradient')) return true;
        const c = cs.backgroundColor; const m = c && c.match(/rgba?\((\d+), (\d+), (\d+)/);
        if (m && (+m[1]+ +m[2]+ +m[3]) < 300 && !/rgba\(0, 0, 0, 0\)/.test(c)) return true; /* dark surface */
        n = n.parentElement; } return false; };
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
