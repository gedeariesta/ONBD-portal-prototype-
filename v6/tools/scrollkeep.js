const { launch, BASE, OUT, outDir } = require('./lib');
// Controls that change state and therefore trigger a rerender.
const CASES = [
 ['#/hm/',         '[data-quickconfirm]'],
 ['#/hm/calendar', '[data-hold]'],
 ['#/hm/software', '#app input[type=checkbox]:not([disabled])'],
 ['#/hm/buddy',    '[data-meetperson]'],
 ['#/equipment',   '[data-device]'],
 ['#/details',     '[data-tab]'],
 ['#/policies',    '[data-doc]'],
 ['#/pex/caseload','[data-pexfilterfield]'],
 ['#/pex/caseload','[data-pexview]'],
 ['#/pex/',        '[data-pexnudge]'],
 ['#/jd',          '[data-ack]'],
 ['#/intro',       '[data-tab]'],
 ['#/pex/blueprints','[data-pexbploc]'],
];
(async()=>{
 const b=await launch();
 const p=await b.newPage({viewport:{width:1440,height:900}});
 await p.goto(BASE,{waitUntil:'networkidle'});
 await p.evaluate(()=>localStorage.clear()); await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(400);
 const bad=[];
 for(const [route,sel] of CASES){
  await p.evaluate(h=>location.hash=h,route); await p.waitForTimeout(450);
  const H=await p.evaluate(()=>document.documentElement.scrollHeight-innerHeight);
  if(H<150){ console.log(`${route.padEnd(17)} page too short to test`); continue; }
  const y=Math.min(600,Math.round(H*0.6));
  await p.evaluate(v=>window.scrollTo(0,v),y); await p.waitForTimeout(200);
  const before=await p.evaluate(()=>Math.round(window.scrollY));
  const ok=await p.evaluate(s=>{const e=document.querySelector(s); if(!e)return false; e.click(); return true;}, sel);
  await p.waitForTimeout(450);
  const after=await p.evaluate(()=>Math.round(window.scrollY));
  const jumped=Math.abs(after-before)>40;
  console.log(`${route.padEnd(17)} ${sel.padEnd(42)} ${ok?`${before}->${after} ${jumped?'JUMPED':'held'}`:'control not found'}`);
  if(ok&&jumped) bad.push(`${route} ${sel}`);
 }
 console.log(bad.length?`\nSCROLL JUMPS (${bad.length}):\n`+bad.join('\n'):'\nno scroll jumps');
 await b.close();
})();
