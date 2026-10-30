const fs = require('fs');
const path = require('path');
// Resolve against the v4 root so this runs from anywhere, not just v4/tools/.
const V3 = path.resolve(__dirname, '..');
const at = p => path.join(V3, p);
const css = fs.readFileSync(at('css/styles.css'),'utf8');
// Every script in js/, not a fixed list: v4 added sidekick.js and a fixed
// list silently reported all of its classes as unused.
const jsFiles = fs.readdirSync(at('js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f);
const js  = jsFiles.map(f=>fs.readFileSync(at(f),'utf8')).join('\n')
          + '\n' + fs.readFileSync(at('index.html'),'utf8');

// class names used in selectors
const declared = new Set();
css.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\.(-?[A-Za-z_][\w-]*)/g, (_,c)=>{ declared.add(c); return ''; });
const unused = [...declared].filter(c => {
  const re = new RegExp(`(?<![\\w-])${c.replace(/[-]/g,'\\-')}(?![\\w-])`);
  return !re.test(js);
}).sort();

// custom properties
const props = new Set();
css.replace(/(--[\w-]+)\s*:/g,(_,p)=>{props.add(p);return '';});
const unusedProps = [...props].filter(p => {
  const uses = (css.match(new RegExp(`var\\(\\s*${p}(?![\\w-])`,'g'))||[]).length
             + (js.match(new RegExp(`${p}(?![\\w-])`,'g'))||[]).length;
  return uses === 0;
}).sort();

console.log(`classes declared in CSS: ${declared.size}`);
console.log(`UNUSED CLASSES (${unused.length}):\n  ` + unused.join('\n  '));
console.log(`\nUNUSED CUSTOM PROPS (${unusedProps.length}):\n  ` + unusedProps.join('\n  '));
