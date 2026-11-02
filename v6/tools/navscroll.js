const { launch, BASE, OUT, outDir } = require('./lib');
(async()=>{
 const b=await launch();
 const p=await b.newPage({viewport:{width:1440,height:900}});
 await p.goto(BASE,{waitUntil:'networkidle'});
 await p.evaluate(()=>localStorage.clear()); await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(400);
 const bad=[];
 for(const [from,to] of [['#/','#/policies'],['#/hm/','#/hm/buddy'],['#/pex/','#/pex/caseload'],['#/policies','#/'],['#/pex/caseload','#/pex/hire/jreyes']]){
  await p.evaluate(h=>location.hash=h,from); await p.waitForTimeout(400);
  await p.evaluate(()=>window.scrollTo(0,Math.min(600,document.documentElement.scrollHeight-innerHeight))); await p.waitForTimeout(200);
  const before=await p.evaluate(()=>Math.round(window.scrollY));
  await p.evaluate(h=>location.hash=h,to); await p.waitForTimeout(450);
  const after=await p.evaluate(()=>Math.round(window.scrollY));
  const ok=after===0;
  console.log(`${from} -> ${to}`.padEnd(38), `scrollY ${before} -> ${after}`, ok?'starts at top':'DID NOT RESET');
  if(!ok) bad.push(`${from} -> ${to}`);
 }
 console.log(bad.length?`\nFAIL (${bad.length})`:'\nnavigation always starts at the top');
 await b.close();
})();
