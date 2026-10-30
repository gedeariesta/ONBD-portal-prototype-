const { launch, BASE, OUT, outDir } = require('./lib');
const ROUTES=['','#/equipment','#/details','#/jd','#/intro','#/policies','#/network','#/flow','#/todos',
 '#/handoffs','#/startdate','#/bgcheck','#/hm/','#/hm/logistics','#/hm/computer','#/hm/software','#/hm/buddy',
 '#/hm/calendar','#/hm/welcome','#/hm/intro','#/hm/card','#/hm/subtraction',
 '#/pex/','#/pex/caseload','#/pex/blueprints','#/pex/hire/jreyes','#/pex/hire/wzhang'];
const WIDTHS=[1280,1440,1680];
(async()=>{
 const b=await launch();
 const f=[];
 for(const W of WIDTHS){
  const p=await b.newPage({viewport:{width:W,height:1000}});
  await p.goto(BASE,{waitUntil:'networkidle'});
  await p.evaluate(()=>localStorage.clear()); await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(400);
  for(const r of ROUTES){
   await p.evaluate(h=>location.hash=h||'#/',r); await p.waitForTimeout(260);
   const out=await p.evaluate(()=>{
    const bad=[];
    const vis=e=>{const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&e.offsetParent!==null;};
    // G. absolutely-positioned child escaping its positioned parent
    document.querySelectorAll('#app *').forEach(e=>{
     if(!vis(e)||getComputedStyle(e).position!=='absolute')return;
     const par=e.offsetParent; if(!par||par===document.body)return;
     // Popovers and gutter markers are meant to sit outside their box.
     const intentional = par.closest('.os-seg,.pv-wrap,[class*=tip]')
       || e.classList.contains('miles-mark') || /pop$|-pop/.test(e.className);
     if(getComputedStyle(par).overflow==='visible' && !intentional){
      const a=e.getBoundingClientRect(), b=par.getBoundingClientRect();
      const out=Math.max(b.left-a.left, a.right-b.right, b.top-a.top, a.bottom-b.bottom);
      if(out>3 && (e.textContent||'').trim())
       bad.push(`ESCAPES PARENT .${(e.className||'').split(' ')[0]} by ${out.toFixed(0)}px out of .${(par.className||'').split(' ')[0]} — "${(e.textContent||'').trim().slice(0,26)}"`);
     }});
    // H. two absolutely-positioned siblings overlapping each other
    document.querySelectorAll('#app .lane-track,#app [class*=track],#app [class*=strip]').forEach(box=>{
     const kids=[...box.children].filter(k=>vis(k)&&getComputedStyle(k).position==='absolute');
     for(let i=0;i<kids.length;i++)for(let j=i+1;j<kids.length;j++){
      const a=kids[i].getBoundingClientRect(),c=kids[j].getBoundingClientRect();
      const ox=Math.min(a.right,c.right)-Math.max(a.left,c.left);
      const oy=Math.min(a.bottom,c.bottom)-Math.max(a.top,c.top);
      if(ox>2&&oy>2)
       bad.push(`NODES OVERLAP "${(kids[i].textContent||'').trim().slice(0,20)}" / "${(kids[j].textContent||'').trim().slice(0,20)}" by ${ox.toFixed(0)}x${oy.toFixed(0)}px`);
     }});
    return bad;
   });
   out.forEach(x=>f.push(`${String(W)} ${(r||'#/').padEnd(18)} ${x}`));
  }
  await p.close();
 }
 const u=[...new Set(f)];
 console.log(u.length?`FINDINGS (${u.length}):\n`+u.join('\n'):'no findings');
 await b.close();
})();
