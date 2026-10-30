const { launch, BASE, OUT, outDir } = require('./lib');
const R=['#/','#/equipment','#/hm/','#/hm/buddy','#/pex/','#/pex/caseload','#/pex/hire/jreyes','#/pex/blueprints'];
(async()=>{
  const b=await launch();
  const p=await b.newPage({viewport:{width:1440,height:1000}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
  p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text());});
  p.on('requestfailed',r=>errs.push('REQFAIL '+r.url().slice(0,90)));
  await p.goto('file://' + require('path').join(require('./lib').REPO,'dist','equinix-preday1-portals-v4-ai-forward.html'),{waitUntil:'load'});
  await p.waitForTimeout(700);
  for(const r of R){ await p.evaluate(h=>location.hash=h,r); await p.waitForTimeout(280); }
  await p.evaluate(()=>location.hash='#/pex/'); await p.waitForTimeout(500);
  const st=await p.evaluate(()=>({
    fontLoaded: document.fonts.check('700 15px "Nexa Text"'),
    logo: !!document.querySelector('.brand img') && document.querySelector('.brand img').naturalWidth>0,
    iconPainted: getComputedStyle(document.querySelector('.ic')).maskImage.startsWith('url("data:'),
    hex: !!document.querySelector('.px-summary.hexfield'),
    chatHidden: getComputedStyle(document.querySelector('.chat-fab')).display==='none',
    app: document.getElementById('app').innerHTML.length,
  }));
  console.log(st);
  console.log(errs.length?'ERRORS:\n'+[...new Set(errs)].slice(0,8).join('\n'):'no console/network errors');
  await p.screenshot({path: outDir()+'/dist-pex.png',fullPage:false});
  await b.close();
})();
