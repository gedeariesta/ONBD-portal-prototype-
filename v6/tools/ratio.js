const hex=h=>{h=h.replace('#','');if(h.length===3)h=[...h].map(c=>c+c).join('');
  return [0,2,4].map(i=>parseInt(h.substr(i,2),16));};
const lum=c=>{const[r,g,b]=hex(c).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);});
  return .2126*r+.7152*g+.0722*b;};
const cr=(a,b)=>{const l1=lum(a),l2=lum(b);return ((Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05));};
const TINT={green:'#DFFBE5',yellow:'#FFF1CC',orange:'#FFE4CC',blue:'#CCE3FF',violet:'#E9DBFF',red:'#FFEBEE',aqua:'#C7FDFF'};
const DARK={green:'#2A8346',yellow:'#FDB90D',orange:'#F55200',blue:'#00408C',violet:'#411980',red:'#AD050C',aqua:'#00737A'};
console.log('=== DS -dark on its own -light tint (AA needs 4.5) ===');
for(const k in TINT) console.log(`  ${k.padEnd(7)} ${cr(DARK[k],TINT[k]).toFixed(2)}:1  ${cr(DARK[k],TINT[k])>=4.5?'pass':'FAIL'}`);
console.log('\n=== hand-mixed inks, on their tint ===');
const INK={'#1F6B38':'green','#8a5a00':'yellow','#8a3200':'orange','#7a3a10':'orange','#7a1119':'red'};
for(const[c,k]of Object.entries(INK)) console.log(`  ${c} on ${k.padEnd(7)} ${cr(c,TINT[k]).toFixed(2)}:1  ${cr(c,TINT[k])>=4.5?'pass':'FAIL'}  | on white ${cr(c,'#FFFFFF').toFixed(2)}:1`);
console.log('\n=== candidate single orange ink on orange+yellow tints ===');
for(const c of ['#8a3200','#7a3a10','#7A3A10']) console.log(`  ${c}: orange ${cr(c,TINT.orange).toFixed(2)}  yellow ${cr(c,TINT.yellow).toFixed(2)}`);
console.log('\n=== near-duplicate washes ===');
for(const[a,b]of[['#F4F9FF','#F7FBFF'],['#FDFBFF','#FBF8FF']])
  console.log(`  ${a} vs ${b}: deltaL ${(Math.abs(lum(a)-lum(b))*100).toFixed(3)}%  (indistinguishable under ~0.5%)`);
