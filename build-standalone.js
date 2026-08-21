#!/usr/bin/env node
/* Builds a single self-contained HTML file per prototype version.
   Inlines styles.css + data.js + app.js into index.html, converts every
   font and icon reference into a data: URI so the file works opened
   directly (file://, content://), with no server and no sibling folders.

     node build-standalone.js        # v1 → dist/equinix-preday1-prototype.html
     node build-standalone.js v2     # v2 → dist/equinix-preday1-prototype-v2.html
     node build-standalone.js all    # both
*/

const fs = require('fs');
const path = require('path');

const VERSIONS = {
  v1: { src: '.',  out: 'equinix-preday1-prototype.html' },
  v2: { src: 'v2', out: 'equinix-preday1-prototype-v2.html' },
};

const arg = (process.argv[2] || 'v1').toLowerCase();
const targets = arg === 'all' ? Object.keys(VERSIONS) : [arg];
for (const t of targets) {
  if (!VERSIONS[t]) throw new Error(`Unknown version "${t}". Use v1, v2 or all.`);
  build(VERSIONS[t]);
}

function build({ src, out: outName }) {
const root = path.join(__dirname, src);

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let css = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
const dataJs = fs.readFileSync(path.join(root, 'js/data.js'), 'utf8');
const appJs = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');

// Fonts → data URIs (css references ../assets/fonts/*.woff2)
css = css.replace(/url\('\.\.\/assets\/fonts\/([^']+)'\)/g, (_, f) => {
  const b64 = fs.readFileSync(path.join(root, 'assets/fonts', f)).toString('base64');
  return `url('data:font/woff2;base64,${b64}')`;
});

// Icon map for the runtime helper in app.js (dynamic references),
// also used below to rewrite literal references in HTML/CSS/data.js.
const iconDir = path.join(root, 'assets/icons');
const iconData = {};
for (const f of fs.readdirSync(iconDir)) {
  iconData[f] = 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(iconDir, f)).toString('base64');
}

// Assemble page: inline css and scripts
html = html.replace('<link rel="stylesheet" href="css/styles.css">', () => `<style>\n${css}\n</style>`);
html = html.replace('<script src="js/data.js"></script>',
  () => `<script>\nconst ICON_DATA = ${JSON.stringify(iconData)};\n</script>\n<script>\n${dataJs}\n</script>`);
html = html.replace('<script src="js/app.js"></script>', () => `<script>\n${appJs}\n</script>`);

// Rewrite literal icon references (HTML attrs, inline styles, data.js strings)
for (const [f, uri] of Object.entries(iconData)) {
  html = html.split(`assets/icons/${f}`).join(uri);
}

// The only acceptable leftover is the runtime fallback path inside iconUrl().
const leftovers = [...new Set([...html.matchAll(/assets\/[^'"`\s)]*/g)].map(m => m[0]))]
  .filter(s => s !== 'assets/icons/');
if (leftovers.length) throw new Error('Unresolved asset references: ' + leftovers.join(', '));

const distDir = path.join(__dirname, 'dist');
fs.mkdirSync(distDir, { recursive: true });
const out = path.join(distDir, outName);
fs.writeFileSync(out, html);
console.log(`Wrote ${out} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
}
