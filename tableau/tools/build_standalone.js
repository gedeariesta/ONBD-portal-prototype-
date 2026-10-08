#!/usr/bin/env node
/* Inlines CSS and JS into one self-contained HTML file per page.
     node tableau/tools/build_standalone.js
   → tableau/dist/onboarding-exec-view.html, tableau/dist/tableau-design-package.html */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const pages = [
  ['exec-view/index.html', 'onboarding-exec-view.html'],
  ['design-package/index.html', 'tableau-design-package.html'],
];
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
for (const [src, out] of pages) {
  const dir = path.dirname(path.join(root, src));
  let html = fs.readFileSync(path.join(root, src), 'utf8');
  html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, h) => `<style>\n${fs.readFileSync(path.join(dir, h), 'utf8')}\n</style>`);
  html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, h) => `<script>\n${fs.readFileSync(path.join(dir, h), 'utf8').replace(/<\/script/gi, '<\\/script')}\n</script>`);
  fs.writeFileSync(path.join(root, 'dist', out), html);
  console.log('dist/' + out, (html.length / 1024).toFixed(0) + ' KB');
}
