const { launch, BASE, OUT, outDir } = require('./lib');
const ROUTES = ['','#/equipment','#/details','#/jd','#/intro','#/policies','#/network','#/flow','#/todos',
 '#/handoffs','#/startdate','#/bgcheck','#/hm/','#/hm/logistics','#/hm/computer','#/hm/software','#/hm/buddy',
 '#/hm/calendar','#/hm/welcome','#/hm/intro','#/hm/card','#/hm/subtraction',
 '#/pex/','#/pex/caseload','#/pex/blueprints','#/pex/hire/jreyes','#/pex/hire/wzhang'];

(async()=>{
 const b=await launch();
 const p=await b.newPage({viewport:{width:1440,height:1000}});
 await p.goto(BASE,{waitUntil:'networkidle'});
 await p.evaluate(()=>localStorage.clear()); await p.reload({waitUntil:'networkidle'}); await p.waitForTimeout(400);
 const f=[];
 for(const r of ROUTES){
  await p.evaluate(h=>location.hash=h||'#/',r); await p.waitForTimeout(240);
  const out=await p.evaluate(()=>{
   const bad=[];
   const vis=e=>{const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&e.offsetParent!==null;};
   const px=v=>parseFloat(v)||0;

   // A. stacked hairlines: adjacent siblings where one ends with a border and
   //    the next starts with one, separated by <14px of space
   document.querySelectorAll('#app *').forEach(e=>{
    const n=e.nextElementSibling; if(!n||!vis(e)||!vis(n))return;
    const a=getComputedStyle(e),c=getComputedStyle(n);
    if(px(a.borderBottomWidth)>0 && px(c.borderTopWidth)>0){
     const re=e.getBoundingClientRect(), rn=n.getBoundingClientRect();
     const gap=rn.top-re.bottom;
     // Only vertically stacked, horizontally overlapping siblings: a negative
     // gap means they sit side by side and the two borders never meet.
     const stacked = gap>=-1 && rn.left<re.right-4 && rn.right>re.left+4;
     if(!stacked) return;
     // Two hairlines with no background between them read as one 2px rule.
     // Bordered CARDS separated by real space are just card spacing, so the
     // parent has to be the shared surface for this to be a defect.
     const ps=getComputedStyle(e.parentElement);
     const insideOneSurface = px(ps.borderTopWidth)>0 || ps.backgroundColor!=='rgba(0, 0, 0, 0)';
     if(gap<4 || (insideOneSurface && gap<14))
      bad.push(`STACKED HAIRLINE ${e.className||e.tagName}+${n.className||n.tagName} gap=${gap.toFixed(0)}px in .${e.parentElement.className.split(' ')[0]||e.parentElement.tagName}`);
    }});

   // B. fixed overlays covering an interactive element
   document.querySelectorAll('.chat-fab,.proto-fab,.proto-drawer').forEach(fx=>{
    if(!vis(fx))return; const r=fx.getBoundingClientRect();
    document.querySelectorAll('#app button:not([disabled]),#app a,#app input,#app select').forEach(t=>{
     if(!vis(t))return; const q=t.getBoundingClientRect();
     if(q.bottom<0||q.top>innerHeight)return;
     if(q.left<r.right&&q.right>r.left&&q.top<r.bottom&&q.bottom>r.top){
      const mid=document.elementFromPoint((q.left+q.right)/2,(q.top+q.bottom)/2);
      if(mid&&!t.contains(mid)&&mid!==t)
       bad.push(`OVERLAY COVERS CONTROL ${fx.className.split(' ')[0]} over "${(t.textContent||'').trim().slice(0,28)}"`);
     }});});

   // C. fixed panels taller than the viewport (clipped off-screen)
   document.querySelectorAll('.proto-drawer,.panel,.hdr,.proto-ribbon').forEach(e=>{
    if(!vis(e))return; const r=e.getBoundingClientRect();
    if(r.top<-1||r.bottom>innerHeight+1){
     const s=getComputedStyle(e);
     if(s.position==='fixed'&&s.overflowY!=='auto'&&s.overflowY!=='scroll')
      bad.push(`FIXED PANEL CLIPPED ${e.className.split(' ')[0]} top=${r.top.toFixed(0)} bottom=${r.bottom.toFixed(0)}`);
    }});

   // D. sibling cards in a row with mismatched heights
   document.querySelectorAll('#app .hm-figs,#app .px-sum-stats,#app .two-col,#app .px-cols').forEach(row=>{
    const kids=[...row.children].filter(vis); if(kids.length<2)return;
    // Only meaningful for a genuinely horizontal row.
    const tops=kids.map(k=>k.getBoundingClientRect().top);
    if(Math.max(...tops)-Math.min(...tops)>4) return;
    const hs=kids.map(k=>k.getBoundingClientRect().height);
    const d=Math.max(...hs)-Math.min(...hs);
    if(d>12) bad.push(`RAGGED ROW ${row.className.split(' ')[0]} heights=${hs.map(h=>h.toFixed(0)).join('/')}`);
   });

   // E. text clipped by its own box
   document.querySelectorAll('#app *').forEach(e=>{
    if(e.children.length||!vis(e))return;
    const s=getComputedStyle(e);
    if(s.overflow==='hidden'||s.overflowX==='hidden'){
     if(e.scrollWidth>e.clientWidth+2 && s.textOverflow!=='ellipsis' && (e.textContent||'').trim())
      bad.push(`TEXT CLIPPED "${(e.textContent||'').trim().slice(0,32)}" ${e.scrollWidth}>${e.clientWidth}`);
    }});

   // F. empty interactive elements (no label, no icon)
   document.querySelectorAll('#app button,#app a[data-goto]').forEach(e=>{
    if(!vis(e))return;
    if(!(e.textContent||'').trim() && !e.querySelector('.ic,img,svg') && !e.getAttribute('aria-label'))
     bad.push(`EMPTY CONTROL <${e.tagName.toLowerCase()} class="${e.className}">`);
   });
   return bad;
  });
  out.forEach(x=>f.push(`${(r||'#/').padEnd(20)} ${x}`));
 }
 const uniq=[...new Set(f)];
 console.log(uniq.length?`FINDINGS (${uniq.length}):\n`+uniq.join('\n'):'no findings');
 await b.close();
})();
