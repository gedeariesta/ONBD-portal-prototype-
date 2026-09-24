#!/usr/bin/env node
/* Runs every check and exits non-zero if any of them reports a problem.

   Order is cheapest-first, so a syntax break or a dead reference surfaces
   before the browser ones spend two minutes getting to the same conclusion. */

const { execFileSync } = require('child_process');
const path = require('path');

const CHECKS = [
  ['dead.js',       'unreferenced declarations'],
  ['deadcss.js',    'unused CSS classes and tokens'],
  ['qa.js',         '364 screen-states across 13 control combinations'],
  ['prose.js',      'plain English: jargon and stray spacing, notes off'],
  ['a11y.js',       'contrast, text size, labels, alt text'],
  ['flows.js',      'interaction flows end to end'],
  ['audit2.js',     'hairlines, overlays, floating buttons, ragged rows, clipped text, at 2 widths'],
  ['audit3.js',     'positioned content escaping or colliding, at 3 widths'],
  ['flowcheck.js',  'flow diagram packing and axis-dot accuracy'],
  ['scrollkeep.js', 'a state change holds scroll position'],
  ['navscroll.js',  'navigation starts at the top'],
];

// Each script reports problems in prose rather than by exit code, so match on
// what a clean run says. Anything else is treated as a failure.
const CLEAN = [
  /no problems found/i, /no findings/i, /none unreferenced/i,
  /FAIL 0/, /no scroll jumps/i, /navigation always starts at the top/i,
  /LOW CONTRAST: 0/,
  /^\d+px: clean$/m,          // flowcheck reports per viewport width
];

let failed = 0;
for (const [script, what] of CHECKS) {
  process.stdout.write(`${script.padEnd(15)} ${what} ... `);
  let out = '';
  try {
    out = execFileSync(process.execPath, [path.join(__dirname, script)],
      { cwd: __dirname, encoding: 'utf8', timeout: 20 * 60 * 1000 });
  } catch (e) {
    console.log('ERRORED');
    console.log((e.stdout || '') + (e.stderr || e.message));
    failed++;
    continue;
  }
  // deadcss always lists w3/woff2, which are false positives from a data URI
  // and a font format, not class names.
  const noise = /UNUSED CLASSES \(2\):\s*\n\s*w3\s*\n\s*woff2/;
  const clean = CLEAN.some(re => re.test(out)) || noise.test(out);
  const bad = /PROBLEMS \(|FINDINGS \(|FAIL [1-9]|SCROLL JUMPS \(|UNREFERENCED:|LOW CONTRAST: [1-9]/.test(out);
  if (bad || !clean) { console.log('PROBLEMS'); console.log(out); failed++; }
  else console.log('clean');
}

console.log(failed ? `\n${failed} check(s) reported problems` : '\nall checks clean');
process.exit(failed ? 1 : 0);
