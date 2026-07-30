# New Hire Pre-Day 1 Portal — interactive prototype

A clickable, first-pass prototype of the Equinix new-hire pre-boarding portal
(the real thing runs on ServiceNow Employee Center — this prototypes the
*experience*, not the platform).

**It is not a build spec, not an approved design, and not a commitment to any
assumption inside it.** The build spec is `Pre_Day_1_Task_UI_Spec.xlsx`; this
prototype exists to show flow and feel, surface knowledge and feature gaps,
and let arguments happen before development instead of during it.

## Run it

No build step. Serve the folder with any static server and open it in a
laptop-width browser (≥ 1280px — the prototype is deliberately laptop-only, A-28):

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

Progress persists in `localStorage`. To start fresh, use **Prototype controls →
First visit**.

## What's inside

| Stage | What it covers | Where |
|---|---|---|
| 1 | Portal shell, task list, milestone strip, contacts, assistant | `#/` (landing) |
| 2 | Personal & contact details — 3-tab wizard, pre-fill distinction, autosave, validation, banking boundary card | `#/details` |
| 3 | Job description review — scroll-gated acknowledgement + dissent path → Under review | `#/jd` |
| 4 | Introduction + badge photo — one card, two independently completable sections; conversion variant | `#/intro` |
| 5 | Compliance pack — per-document scroll-gated acknowledgements, external Code of Conduct treatment, Japan addendum | `#/policies` |
| 6 | Task states, persona/country variants, Assumptions & gaps panel (28 entries), one-screen flow overview | Prototype controls (bottom left) + `#/flow` |

## The prototype devices

- **Prototype ribbon** (top): persistent honesty marker + links to the
  assumption register and flow overview.
- **Prototype controls** (bottom left): switch persona (external /
  contract-to-permanent), country of hire (US / Japan), and task-state
  scenario (first visit, in progress, under review, overdue, all complete).
  Clearly labelled — none of it is product UI.
- **Assumption markers**: small `A-nn` chips on any element that rests on an
  assumption rather than a confirmed requirement. Click one to open the
  register entry; click a register entry to jump to (and flash) the element.
  All 28 entries map to the Open Items tab of the spec workbook.

## Example new hire

Jordan Reyes, Senior Financial Analyst, Finance — Global FP&A, reporting to
Priya Anand, Denver (hybrid), starting Monday 18 August 2026. The prototype
clock is fixed at 4 August 2026 so dates render stably (the Overdue scenario
shifts it to 15 August).

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

## Files

```
index.html        shell, panels, prototype ribbon/controls
css/styles.css    design tokens + all components
js/data.js        content: assumption register, documents, copy
js/app.js         state, router, all six stages of behaviour
assets/fonts/     Nexa Text (woff2)
assets/icons/     brand icon subset + Fortress mark
```

## Deliberately out of scope

Stage-1 identity/credential screens, banking, tax, right to work, equipment
selection, benefits election, the hiring-manager portal, real policy text,
real badge specs, notifications, and everything after Day 1 — see Appendix B
of the design prompt. Omissions are decisions, not oversights.
