# New Hire Pre-Day 1 Portal — interactive prototype

**Two versions live side by side, deliberately.** `v1` is the original first pass;
`v2` applies the edit notes written against it. v1 is left untouched so the two
can be cross-compared screen by screen and register row by register row.

| | v1 | v2 |
|---|---|---|
| Sources | `index.html`, `css/`, `js/` | `v2/` |
| Single file | `dist/equinix-preday1-prototype.html` | `dist/equinix-preday1-prototype-v2.html` |
| Register | 28 assumptions | 47 entries · 46 marked · 1 retired |
| Provenance | all inferred | UAT / 1:1 / PRIOR / ASSUMED tags on every entry |

A clickable, first-pass prototype of the Equinix new-hire pre-boarding portal
(the real thing runs on ServiceNow Employee Center — this prototypes the
*experience*, not the platform).

**It is not a build spec, not an approved design, and not a commitment to any
assumption inside it.** The build spec is `Pre_Day_1_Task_UI_Spec.xlsx`; this
prototype exists to show flow and feel, surface knowledge and feature gaps,
and let arguments happen before development instead of during it.

## Run it

**Easiest — the single file.** Each version builds to one fully self-contained
HTML file (fonts, icons, styles and scripts inlined). Send it anywhere and
double-click it — no server, no folder structure needed. Rebuild after editing
the sources with:

```bash
node build-standalone.js v2     # or: v1, or: all
```

**Or serve the sources.** From the repo root:

```bash
python3 -m http.server 8080
# v1 → http://localhost:8080
# v2 → http://localhost:8080/v2/
```

(Don't open the multi-file `index.html` directly from Downloads or a zip
preview — without its sibling `css/`, `js/` and `assets/` folders it renders
as bare HTML. That's what the single file in `dist/` is for.)

View it in a laptop-width browser (≥ 1280px — the prototype is deliberately
laptop-only, A-28). Progress persists in `localStorage`; to start fresh, use
**Prototype controls → First visit**.

## What's inside

| Stage | What it covers | Where |
|---|---|---|
| 1 | Portal shell, task list, phase strip, contacts, assistant | `#/` (landing) |
| — | **Equipment** — three owners, status table, accessories form, INC *(v2 only)* | `#/equipment` |
| 2 | Personal & contact details — 3-tab wizard, pre-fill distinction, autosave, validation, banking boundary card | `#/details` |
| 3 | Job description review — scroll-gated acknowledgement + dissent path → Under review | `#/jd` |
| 4 | Introduction + badge photo — one card, two independently completable sections; conversion variant | `#/intro` |
| — | **Suggested network** — five people, reasons, bookable 1:1s *(v2 only)* | `#/network` |
| 5 | Compliance pack — per-document scroll-gated acknowledgements, external Code of Conduct treatment, Japan addendum | `#/policies` |
| 6 | Task states, persona/country variants, Assumptions & gaps panel, one-screen flow overview | Prototype controls (bottom left) + `#/flow` |

## The prototype devices

- **Prototype ribbon** (top): persistent honesty marker + links to the
  assumption register and flow overview.
- **Prototype controls** (bottom left): switch persona (external /
  contract-to-permanent), country of hire (US / Japan), task-state scenario
  (first visit, in progress, under review, overdue, all complete) and — in v2 —
  the runway to Day 1 (two weeks / three months). Clearly labelled: none of it
  is product UI.
- **Assumption markers**: small `A-nn` chips on any element that rests on an
  assumption rather than a confirmed requirement. Click one to open the
  register entry; click a register entry to jump to (and flash) the element.
  Entries map to the Open Items tab of the spec workbook. In v2 each entry also
  carries where it came from — **UAT** (seen in the live portal), **1:1**
  (stated by the platform owner), **PRIOR** (already agreed) or **ASSUMED**
  (still a judgement call) — and the panel ends with the five questions that
  need answering before build.

## Example new hire

Jordan Reyes, Senior Financial Analyst, Finance — Global FP&A, reporting to
Priya Anand, Denver (hybrid), starting 18 August 2026. The prototype clock is
fixed at 4 August 2026 so dates render stably. In v2 every due date is an offset
from the start date, so switching to the three-month runway (start 3 November)
moves the whole list with it; the Overdue scenario sits three days out on either
runway.

## Design system

Visuals follow the Equinix Brand Center packs supplied with the brief:

- **Type**: Nexa Text (woff2, in `assets/fonts/`) — the brand's primary typeface.
- **Color**: brand palette tokens in `css/styles.css` (`--eq-*` and neutral
  ramp Black → Charcoal → Carbon → … → Silver → White). Red is reserved for
  the brand mark; blue `#086AE3` carries interaction, per accessibility
  guidance (WCAG AA, no color-only type).
- **Icons**: a curated subset of the Equinix brand icon set (`assets/icons/`),
  rendered via CSS mask so they inherit text color.
- **Illustration**: airy adjacent-color linear gradients and the
  Fortress-derived hexagon motif, used sparingly.

Brand assets are Equinix property, included here solely for this internal
prototype.

## What changed in v2

Applied from the edit notes, with provenance carried into the register so a
reader can tell observed fact from judgement call.

**Seen in the live UAT portal** — built, not assumed:
- *"More to-dos may be assigned later."* under **Coming up**, verbatim. One line;
  it closes the "false floor" objection on its own.
- **Equipment rebuilt.** Three items with three different owners (computer →
  hiring manager, accessories → new hire, phone → Day 1 optional), a status
  table showing what each item is waiting on, the real accessories form
  (top-level select, automatic headset, at-home framing), office-first shipping
  with a required courier phone, and an INC to Global Helpdesk Tier 2 with a CSV
  and a comment thread rather than a RITM.
- **Five phase names** adopted from the live portal in place of four invented
  milestones.

**Stated by the platform owner:**
- Equipment moved to **first** in *Do these now* — the "when your role and
  location are confirmed" gate does not exist.
- Right to work opened now; **medical check** added (country-conditional).
- **Suggested network** — a new proposed task: the manager names five people
  outside the reporting line with a reason each, they're notified, and the new
  hire books 1:1s. Explicitly not the org chart, explicitly not the buddy.
- **Start-date runway** is bimodal — a prototype control switches between two
  weeks and three months, and every due date follows.

**From the earlier change request:** identity/right-to-work capture on Tab 1
(with the overlap flagged as a proposal), and four contacts in the rail —
hiring manager and onboarding buddy alongside the coordinator and recruiter.

**Retired, not added:** `A-09` (capture the shipping address once on Tab 1) was
wrong in direction — shipping defaults to the office address derived from role
and location, so the equipment task never waits on personal details. The Tab 1
checkbox is gone, the marker is off the screen, and workbook item OI-28 closes.

## Files

```
index.html        v1 — shell, panels, prototype ribbon/controls
css/styles.css    v1 — design tokens + all components
js/data.js        v1 — content: assumption register, documents, copy
js/app.js         v1 — state, router, all six stages of behaviour
v2/               v2 — same structure, with its own copy of assets/
assets/fonts/     Nexa Text (woff2)
assets/icons/     brand icon subset + Fortress mark
build-standalone.js  bundles either version into one portable HTML file
dist/             the portable single-file builds
```

## Deliberately out of scope

Stage-1 credential screens, banking, tax, benefits election, the hiring-manager
portal, real policy text, real badge specs, notifications, and everything after
Day 1 — see Appendix B of the design prompt. Banking, tax, swag and dietary
requirements are **confirmed deliberate exclusions**, not gaps.

Right to work and the medical check are shown but not built: v2 surfaces them as
available now, completed in their own systems. Equipment moved *into* scope in
v2 — accessories only, with the computer and phone shown as other people's
tasks. Omissions are decisions, not oversights.
