const { launch, BASE, OUT, outDir } = require('./lib');
(async()=>{
 const b=await launch();
 for(const W of [1280,1440,1680]){
  const p=await b.newPage({viewport:{width:W,height:1100}});
  await p.goto(BASE,{waitUntil:'networkidle'});
  await p.evaluate(()=>localStorage.clear()); await p.reload({waitUntil:'networkidle'});
  await p.evaluate(()=>location.hash='#/flow'); await p.waitForTimeout(700);
  const r=await p.evaluate(()=>{
   const bad=[];
   const check=(sel,box)=>{
    document.querySelectorAll(box).forEach(bx=>{
     const items=[...bx.querySelectorAll(sel)].map(e=>({e,r:e.getBoundingClientRect()}));
     const br=bx.getBoundingClientRect();
     items.forEach(({e,r})=>{
      if(r.left<br.left-1||r.right>br.right+1)
       bad.push(`OUTSIDE ${sel} "${e.textContent.trim().slice(0,22)}" l=${(r.left-br.left).toFixed(0)} r=${(br.right-r.right).toFixed(0)}`);
     });
     for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
      const a=items[i].r,c=items[j].r;
      const ox=Math.min(a.right,c.right)-Math.max(a.left,c.left);
      const oy=Math.min(a.bottom,c.bottom)-Math.max(a.top,c.top);
      if(ox>1&&oy>1) bad.push(`OVERLAP "${items[i].e.textContent.trim().slice(0,18)}" / "${items[j].e.textContent.trim().slice(0,18)}" ${ox.toFixed(0)}x${oy.toFixed(0)}`);
     }});
   };
   check('.axis-pt','.flow-axis'); check('.fnode','.lane-track');
   // dots must still sit on their true dates
   document.querySelectorAll('.axis-pt').forEach(pt=>{
    const ax=pt.closest('.flow-axis').getBoundingClientRect();
    const want=ax.left+(parseFloat(pt.dataset.x)/100)*ax.width;
    const dot=pt.querySelector('.apt-dot').getBoundingClientRect();
    const got=(dot.left+dot.right)/2;
    if(Math.abs(got-want)>1.5) bad.push(`DOT OFF DATE ${pt.dataset.x}% by ${(got-want).toFixed(1)}px`);
   });
   return bad;
  });
  console.log(`${W}px: ` + (r.length? r.length+' problems\n  '+[...new Set(r)].join('\n  ') : 'clean'));
  await p.screenshot({path: outDir()+`/flow-${W}.png`,fullPage:true});
  await p.close();
 }
 await b.close();
})();
