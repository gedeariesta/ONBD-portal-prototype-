# Handoff — Equinix Pre-Day 1 portal prototype

Written 2026-09-24 at the end of a long session, for whoever picks this up next.

## What this is

An interactive prototype of the Equinix Pre-Day 1 onboarding portal, built to
be argued with in review rather than shipped. Gede is a designer at Equinix;
the audience is Janine and the People Experience team.

It is **one prototype with three persona lenses over one shared state**, which
is the whole point of it: change something as the new hire and the manager's
screen reacts, because they are reading the same object.

- **New hire** — Jordan Reyes, 14 days out, Senior Financial Analyst, Denver
- **Hiring manager** — Priya Anand, two incoming hires
- **People Experience** — Maya Chen, coordinator, 24 hires in flight

Switch with the "Viewing as" control in the top ribbon, or by URL
(`#/`, `#/hm/`, `#/pex/`).

## Stack

Deliberately plain: vanilla JS, hash routing, no build step, no framework, no
dependencies. One state object `S` persisted to `localStorage` under
`onbd-proto-v3`. If you are tempted to add a framework, don't — the reason
this can be reviewed by non-engineers is that the whole thing is four files.

```
v3/index.html            shell, ribbon, panels, script order
v3/css/styles.css        ~2,400 lines, all tokens at the top
v3/js/data.js            content + the assumption register
v3/js/hm.js              manager lens   (loaded before app.js)
v3/js/pex.js             coordinator lens (loaded before app.js)
v3/js/app.js             new-hire lens + shell + router
v3/tools/                QA harness — read v3/tools/README.md
build-standalone.js      inlines everything into one distributable file
dist/equinix-preday1-portals-v3.html   what Gede actually sends people
```

Load order matters: `hm.js` and `pex.js` only declare functions and their
route tables at load time; everything touching shared globals runs at call
time. `app.js` merges `HM_ROUTES` and `PEX_ROUTES` into `ROUTES`.

## Setup

```bash
# serve (no build step)
python3 -m http.server 8080 --directory .      # then open /v3/

# checks
cd v3/tools && npm install && node all.js      # ~6 min, exits non-zero on a problem

# the single distributable file
node build-standalone.js v3
```

`build-standalone.js` inlines fonts, icons and logos as data URIs and
**throws if any `assets/` reference is left unresolved** — that integrity
check has caught real breakage twice. Always rebuild `dist/` before sending.

## Two devices you need to know about

**The design-notes toggle.** Every piece of rationale is wrapped in `.pnote`
and hidden by `body:not(.notes)`. Off by default so the portal reads as
itself; on, it reveals the reasoning and the assumption markers. This is why
you can be blunt in the copy — it is not in the product view.

**The assumption register.** 116 entries (109 live, 7 retired) in `data.js`,
each with provenance: `UAT` / `1:1` / `PRIOR` / `PRD` / `ASSUMED`. Every
uncertain claim on screen carries a marker like `A-04` linking to its entry.
When you change something that contradicts a documented decision, **retire
the old entry rather than editing it** — the trail of what was decided and
reversed is the most valuable thing in here.

## v4, the AI-forward prototype (added 2026-09-24)

`v4/` is the current working version; v1 to v3 stay frozen for comparison.
Same stack and load order, plus `v4/js/sidekick.js` loaded before `app.js`.
State key `onbd-proto-v4`. Harness in `v4/tools` (`node all.js`), build with
`node build-standalone.js v4`, which writes
`dist/equinix-preday1-portals-v4-ai-forward.html`.

What changed, in the order a reviewer meets it:

- **Look:** equinix.com 2026 direction. Ink scenes with huge type only on the
  three home screens; calm cards everywhere else. Tokens at the top of
  `v4/css/styles.css`.
- **Journey:** three things before Day 1 (A-64); photo and intro optional
  (A-68); details in Workday on Day 1 (A-65); policies in the first week
  (A-66). The new hire, manager and coordinator all count the same three.
- **Sidekick:** the rule is "Sidekick talks, the system decides" (A-70).
  Scripted answers, keyword-matched, each citing an article; a handoff to a
  person lands in the coordinator's Help requests (A-72, L-13). The manager
  gets reminders in Teams (A-73); the coordinator gets a summary and
  question-to-filter chips on Today (A-74).
- **Register:** 128 entries, 113 live, 15 retired. New provenance `MTG`
  for what was said in the September 2026 workstream meetings.

Decisions that are easy to reverse if review disagrees: the manager's donut
chart is gone (its numbers moved into the scene); the photo and introduction
are optional; the job description is readable now but confirmed on Day 1;
personal details are a Workday handoff; policies cannot be signed before the
start date; the coordinator's compliance queue is removed and the badge queue
is a low-severity heads-up.

## State of play

v4 work is on branch `claude/equinix-preday-onboarding-f9rsa2`. The v3 notes below describe branch `claude/magical-planck-h6ef32`. No PR opened — Gede
has not asked for one.

Recent work, newest first:

1. Plain-English and design clean-up pass (see below)
2. Rebuilt the "Your people" card on one emphasis system
3. Fixed six review findings + built checks for the bug classes behind them
4. Removed buddy auto-assignment (Janine's correction) + design/feature/text audits
5. Added the People Experience coordinator portal

The clean-up pass replaced spec vocabulary with plain words across all three
lenses: *persona* → role, *blueprint* → office/location details, *in flight*
→ active, *proxy* → stand-in, *nudge/chase* → remind, *compliance pack* →
required documents, *holds* → meetings, *Day −14* → in 14 days, and so on.
`v3/tools/prose.js` holds the glossary and fails on any of those words in
the product view (notes off). Design notes and register entries keep the spec's
terms on purpose, because reviewers need to match them to the source. The
equipment table was the one place this contradicted a decision: A-54 (copy
the ServiceNow strings verbatim) is retired in favour of A-63.

All checks clean: 364 screen-states, 0 contrast failures, 0 text under 11px,
0 unlabelled controls, 20/20 flows, no dead code.

## How Gede works, and what he actually wants

Read this bit. It is the difference between being useful and being tidy.

- **He reviews by looking.** He will open the file, spend ten seconds, and
  come back with things no automated check found. That is not a failure mode
  to defend against — it is the loop. Give him something to look at early.
- **Screenshot your own work before claiming it is done.** The largest miss
  in the last session was a diagram screen with overlapping labels that no
  check flagged, because it had never been opened. Measurable ≠ looked at.
- **He is direct and expects directness back.** "it's messy", "too much going
  on", "do another audit since this is just me looking at it for 10 seconds".
  Match that register. No hedging, no padding.
- **Deliver as a file.** He wants `dist/…html` sent in chat, not a URL and not
  a description. Rebuild it every time.
- **Prose over bullets in the artefact.** The copy voice throughout is plain
  sentences that say the awkward thing out loud — "Nothing assigns one for
  you, so if you do not name somebody Jordan starts without a buddy." Keep
  that. Do not soften it into product-marketing voice.
- **Commit messages here are long and explain reasoning.** That is deliberate;
  they are part of the design record. Keep doing it.

## What's next

Nothing is assigned. These are the live threads, roughly in the order they
matter.

**1. The open questions have never been worked through.** 23 distinct `OI-`
items are referenced from register entries but there is no screen that
collects them. The sharpest ones:

- `OI-01` **caseload size** — the coordinator's whole information architecture
  depends on whether she carries 5, 12 or 50 hires. At five, a plain list is
  the home screen; at fifty, only triage works. There is a prototype control
  to flip between 5/12/24. This is the spec's own first open item and it is
  still open.
- `OI-07` **what the coordinator can see** — built as the middle reading: she
  sees *that* something is incomplete, not *what* the new hire entered. Nobody
  has confirmed that is the intended boundary, and it is a privacy decision.
- `OI-06` **readiness definition** — "ready" has no agreed formula. The
  manager's readiness strip and the coordinator's queues both invent one, and
  they are kept consistent with each other rather than with anything real.

**2. The manual HBP Workday burden.** Sits outside every spec and every
screen. Nobody has costed it. It came up in the Janine notes and was never
resolved.

**3. Post-Day-1 is drawn but unsourced.** `M-30` proposes four manager tasks
after the start date (Day 1 meeting, 30/60/90 plan, end-of-first-week
check-in, first-month review). No document says the manager owns them, where
the 30/60/90 plan lives, or whether this portal owns anything after the start
date at all. It is the most speculative thing currently on screen.

**4. The manager's home is still heavy.** Five progress indicators stack
before the task list: hero percentage, Jordan's donut, readiness strip, phase
strip, and a progress table at the foot. Each was individually requested, so
they were labelled rather than cut. If Gede says the screen still feels
crowded, that is where the weight is — and cutting one is his call, not
yours.

**5. Two upstream design-system findings worth sending to whoever owns it.**
Both measured, both in the published tokens rather than in this prototype:

- The system's own `-dark` on `-light` tint pairings fail WCAG AA for green
  (4.30:1), yellow (1.54:1) and orange (2.83:1). Blue, violet, red and aqua
  pass.
- The link token is plain blue, not blue-dark, and it does not survive its own
  blue tint: 3.83:1. This one was found only after a "cohesion" cleanup
  removed the colour overrides that had been silently doing the contrast work.

`v3/tools/ratio.js` has the maths. Run it before inventing a colour.

## Traps

- **An assumption marker leaves its spaces behind when notes are off.**
  `Requirements ${am('A-17')}: JPG` reads as "Requirements : JPG". Put the
  marker after the punctuation. `prose.js` catches it.
- **A text run inside a flex row becomes its own column.** `Due <b>8 Aug</b>,
  earlier than…` in a `display:flex` line wrapped into two ragged stacks.
  Wrap the sentence in a `<span>` or don't make the line flex.
- **Nothing floats over the content column.** Prototype controls live in the
  ribbon now, and the chat button is a 52px circle in the margin. `audit2.js`
  checks this at 1280px, where the margin is thinnest.

- **`:first-of-type` / `:last-of-type` count elements of that tag, not that
  class.** `.pxc-row:first-of-type` never matched, because the header above it
  is also a `div`. Cost a stacked hairline that shipped. Use `+` or `:has()`.
- **`render()` is both "navigate" and "redraw".** It scrolls to top only when
  the route actually changed (`lastRoute`). If you add a scroll reset, respect
  that distinction or every button starts teleporting again.
- **The flow diagram's positions are intent, not geometry.** `data-x` is a
  date percentage; `layoutFlowLanes()` measures the rendered widths and packs
  them. Do not hand-tune the percentages to fix an overlap — fix the packer.
- **Don't write font sizes in px.** There are 10 named steps (`--t-micro`
  through `--t-hero`) and the scale is closed. It got to 24 sizes once.
- **Don't hand-mix a hex value.** Tint borders, tint inks and washes are all
  tokens now, with their contrast ratios recorded next to them.
- **The container is ephemeral.** Commit anything worth keeping. The QA
  harness lived in a scratchpad for the whole last session and was one
  timeout away from being lost, which is why it is in `v3/tools/` now.
