# QA harness

Headless checks for the Pre-Day 1 portal prototype. They exist because this
prototype has no build step and no framework, so nothing else will tell you
that a change broke a screen you were not looking at.

## Running

```bash
cd v3/tools
npm install                 # playwright only; browsers are already in the image
python3 -m http.server 8080 --directory ../..   &   # serve the repo root
node all.js                 # every check, exits non-zero on a problem
```

`all.js` runs cheapest-first so a dead reference surfaces before the browser
checks spend two minutes reaching the same conclusion. Individual scripts run
on their own the same way (`node qa.js`).

Two environment knobs, both optional:

- `PROTO_BASE` — where the prototype is served. Default `http://localhost:8080/v3/`.
- `CHROMIUM_PATH` — override the browser. By default `lib.js` searches
  `PLAYWRIGHT_BROWSERS_PATH` and prefers full Chromium over the headless
  shell. Do not pin a build number here; it changes between images.

## What each one checks

| Script | Checks |
|---|---|
| `dead.js` | Top-level declarations nothing references |
| `deadcss.js` | CSS classes and custom properties nothing uses |
| `qa.js` | 364 screen-states (28 routes × 13 control combinations): console errors, `undefined`/`NaN` in rendered text, near-empty screens, horizontal overflow |
| `prose.js` | Plain English over 140 screen-states with design notes off: a glossary of jargon (each with what to say instead), and any space before punctuation, which is what a hidden assumption marker leaves behind |
| `a11y.js` | WCAG AA contrast computed from rendered colours, text under 11px, unlabelled controls, missing alt text |
| `flows.js` | 20 interaction flows end to end, including scroll behaviour and flow-diagram packing |
| `audit2.js` | Stacked hairlines, fixed overlays covering controls, the chat button over the content column, clipped fixed panels, ragged rows, clipped text, empty controls, at 1440 and 1280px |
| `audit3.js` | Absolutely-positioned content escaping its parent or colliding, at 1280/1440/1680px |
| `flowcheck.js` | Flow diagram: nothing outside its track, nothing overlapping, axis dots still on their true dates |
| `scrollkeep.js` | A state change holds scroll position |
| `navscroll.js` | Navigation resets to the top |
| `distcheck.js` | The standalone build over `file://`: fonts, logo, icons, no console or network errors |
| `ratio.js` | Contrast maths for the tint inks. Run it before inventing a colour. |

## Known false positives

`deadcss.js` always reports `w3` and `woff2` as unused classes. They are not
classes: one comes from an SVG data URI (`www.w3.org`) and the other from
`format('woff2')`. `all.js` knows to ignore exactly that pair.

## Why these exist in this shape

Each check was written the day something got through review. `scrollkeep.js`
exists because `render()` called `scrollTo(0,0)` unconditionally, so every
button press yanked the page to the top. `flowcheck.js` exists because the
flow diagram had overlapping nodes and labels hanging off their tracks, and
no amount of reading the CSS would have caught it — the positions are
percentages and the widths come from the text.

That is the pattern worth keeping: when a visual bug gets through, add the
check that would have caught its whole class, not just that instance.

`audit/` here is gitignored screenshot scratch. Nothing reads it; it is for
looking at.
