/* Shared setup for the QA harness.

   These scripts were written against one container and hardcoded a
   version-pinned Chromium path and an absolute repo path, both of which are
   wrong in any other container. Everything environment-shaped lives here so
   the scripts themselves stay about what they check.

   Run them from this directory with a static server on BASE (see README.md).  */

const fs = require('fs');
const path = require('path');

/* Playwright in this image ships its browsers under PLAYWRIGHT_BROWSERS_PATH
   with a build number in the folder name, and that number changes. Find it
   rather than pinning it. */
function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  const candidates = [];
  const walk = dir => {
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory() && /chromium|chrome/i.test(e.name)) walk(p);
      else if (e.isFile() && /^(chrome|headless_shell)$/.test(e.name)) candidates.push(p);
    }
  };
  walk(root);
  if (!candidates.length) return undefined;   // let Playwright use its own default
  // Prefer full Chromium over the headless shell (the shell cannot do
  // everything these checks need), then newest build.
  const full = candidates.filter(p => /\/chrome$/.test(p));
  return (full.length ? full : candidates).sort().pop();
}

const BASE = process.env.PROTO_BASE || 'http://localhost:8080/v3/';
const REPO = path.resolve(__dirname, '..', '..');
const OUT  = path.join(__dirname, 'audit');     // gitignored screenshot scratch

async function launch() {
  const { chromium } = require('playwright');
  const exe = chromiumPath();
  return chromium.launch(exe ? { executablePath: exe } : {});
}

/* Every check starts from a clean slate: the prototype persists to
   localStorage, so a previous run's toggles would otherwise leak in and
   silently change what is being measured. */
async function freshPage(browser, viewport = { width: 1440, height: 1000 }) {
  const page = await browser.newPage({ viewport });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  return page;
}

function outDir() { fs.mkdirSync(OUT, { recursive: true }); return OUT; }

module.exports = { BASE, REPO, OUT, launch, freshPage, outDir, chromiumPath };
