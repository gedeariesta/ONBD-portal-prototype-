const fs = require('fs');
const path = require('path');
// Resolve against the v3 root so this runs from anywhere, not just v3/.
const V3 = path.resolve(__dirname, '..');
const at = p => path.join(V3, p);
const files = ['js/data.js','js/hm.js','js/pex.js','js/app.js'];
const src = files.map(f => fs.readFileSync(at(f),'utf8')).join('\n');
const html = fs.readFileSync(at('index.html'),'utf8');
const all = src + '\n' + html;

const names = new Map();
for (const f of files) {
  const t = fs.readFileSync(at(f),'utf8');
  t.split('\n').forEach((l,i) => {
    let m;
    if ((m = /^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/.exec(l))) names.set(m[1], `${f}:${i+1}`);
    if ((m = /^function\s+([A-Za-z_$][\w$]*)\s*\(/.exec(l))) names.set(m[1], `${f}:${i+1}`);
  });
}
const dead = [];
for (const [n, where] of names) {
  const re = new RegExp(`(?<![\\w$.])${n.replace(/\$/g,'\\$')}(?![\\w$])`,'g');
  const hits = (all.match(re) || []).length;
  if (hits <= 1) dead.push(`${n}  (${where})`);
}
console.log(`declarations scanned: ${names.size}`);
console.log(dead.length ? 'UNREFERENCED:\n  ' + dead.join('\n  ') : 'none unreferenced');
