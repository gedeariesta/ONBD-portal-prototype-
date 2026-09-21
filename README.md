# Pre-Day 1 portals — interactive prototype
### New hire, hiring manager, and the handoffs between them

**Three versions live side by side, deliberately.** Each earlier one is left
untouched so they can be cross-compared screen by screen and register row by
register row.

| | v1 | v2 | v3 |
|---|---|---|---|
| What it is | Original first pass | Edit notes applied | Both portals, wired together |
| Sources | `index.html`, `css/`, `js/` | `v2/` | `v3/` |
| Single file | `dist/equinix-preday1-prototype.html` | `…-v2.html` | `dist/equinix-preday1-portals-v3.html` |
| Sides | New hire | New hire | New hire **and** hiring manager |
| Register | 28 assumptions | 47 · 46 marked · 1 retired | 74 · 73 marked (47 NH · 18 HM · 9 connection) |
| Provenance | all inferred | UAT / 1:1 / PRIOR / ASSUMED | same, plus a side filter |

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
node build-standalone.js v3     # or: v1, v2, or: all
```

**Or serve the sources.** From the repo root:

```bash
python3 -m http.server 8080
# v1 → http://localhost:8080
# v2 → http://localhost:8080/v2/
# v3 → http://localhost:8080/v3/
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
| — | **Equipment** — three owners, status table, accessories form, INC *(v2, v3)* | `#/equipment` |
| 2 | Personal & contact details — 3-tab wizard, pre-fill distinction, autosave, validation, banking boundary card | `#/details` |
| 3 | Job description review — scroll-gated acknowledgement + dissent path → Under review | `#/jd` |
| 4 | Introduction + badge photo — one card, two independently completable sections; conversion variant | `#/intro` |
| — | **Suggested network** — the people the manager named, and bookable 1:1s *(v2, v3)* | `#/network` |
| 5 | Compliance pack — per-document scroll-gated acknowledgements, external Code of Conduct treatment, Japan addendum | `#/policies` |
| 6 | Task states, persona/country variants, Assumptions & gaps panel, one-screen flow overview | Prototype controls (bottom left) + `#/flow` |

**Hiring manager side (v3 only)**

| Screen | What it covers | Where |
|---|---|---|
| Readiness view | Multi-hire selector, readiness score, blockers, your tasks with dispositions, the new hire's progress, other teams | `#/hm/` |
| First-day details | Blueprint values read-only, availability, Day 1 proxy | `#/hm/logistics` |
| Order the computer | An order, not a confirmation — with a late-delivery warning | `#/hm/computer` |
| Application stack | Drawn in its blocked state: no persona, no default stack | `#/hm/software` |
| Assign a buddy | Suggestion, alternatives, capacity warning, and the visibility conflict | `#/hm/buddy` |
| Day 1 calendar | The 1:1 already placed; the rest as suggestions | `#/hm/calendar` |
| Welcome note | Pre-filled, personal line, read-only generated first-week block | `#/hm/welcome` |
| Name the network | Pick five, write why each — it reaches the new hire verbatim | `#/hm/network` |
| Forward the introduction | Arrives only after the new hire consents | `#/hm/intro` |
| Subtraction review | Every manager task by verdict | `#/hm/subtraction` |
| **The handoffs** | Where the two portals meet — nine connections, live state | `#/handoffs` |

## The prototype devices

- **Prototype ribbon** (top): persistent honesty marker + links to the
  assumption register and flow overview.
- **Prototype controls** (bottom left): **design notes** (hidden / shown, see
  below), persona (external / contract-to-permanent), country of hire (US /
  Japan), task-state scenario (first visit, in progress, under review, overdue,
  all complete), the runway to Day 1 (two weeks / three months, v2+) and the
  buddy visibility rule (v3). Clearly labelled: none of it is product UI.
- **Design notes** (v3, in Prototype controls, **off by default**): one switch
  over every piece of commentary the prototype makes about itself — the `A-nn` /
  `M-nn` / `L-nn` markers, the manager-side dispositions and their rationale,
  and the callouts that argue a design rather than tell the reader something.
  Off, the portal reads the way the real one would; on, the full review apparatus
  comes back. The assumption register panel is unaffected and always available.
- **Assumption markers**: small `A-nn` chips on any element that rests on an
  assumption rather than a confirmed requirement. Hidden until **design notes**
  are switched on. Click one to open the
  register entry; click a register entry to jump to (and flash) the element.
  Entries map to the Open Items tab of the spec workbook. In v2 each entry also
  carries where it came from — **UAT** (seen in the live portal), **1:1**
  (stated by the platform owner), **PRIOR** (already agreed) or **ASSUMED**
  (still a judgement call) — and the panel ends with the questions that need
  answering before build. In v3 the panel filters by side: new hire, manager,
  or the connections between them.
- **Viewing as** (v3, in the ribbon): switch between the new hire's portal and
  the hiring manager's. A prototype device — in reality these are two people.

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

## v3 — the two portals, connected

v3 adds the hiring manager's side and wires it to the new hire's. **Both sides
read and write one shared state**, so a handoff is real rather than illustrated:
assign a buddy as the manager and the name appears on the new hire's screen;
order the computer and their equipment table stops saying it is waiting on you.

Switch sides with **Viewing as** in the ribbon. That switch is a prototype
device — a real manager and a real new hire are different people on different
screens.

### The nine handoffs — `#/handoffs`

The screen that proves the connections, and the one to open in a review. Each
row names both ends, the direction, its live state, and the assumption it rests
on. One row is flagged as a live **conflict**: the manager spec says the new
hire sees their buddy 72 hours before starting; the new hire prototype shows
them from assignment. v3 implements both rules and lets you switch between them,
because the two specifications genuinely disagree.

### The subtraction review — `#/hm/subtraction`

The design problem on the manager's side is the opposite of the new hire's: the
goal is to reduce what a manager is asked to do, not organise it better. So every
manager task carries a disposition on screen — **keep · exception-only ·
automate away · remove · undecided · adds work** — and the review screen groups
all sixteen by verdict, with the condition each one depends on. Three are struck
through as tasks that should not exist at all.

Two screens are drawn deliberately unflattering because that is the truth today:

- **Order the computer** is an *order*, not a confirmation. The manager places it
  and nothing moves until they do — which corrects the workbook's own baseline
  and makes the case for subtraction larger, not smaller.
- **Confirm the application stack** renders in its blocked state: no persona
  means no default stack, so the manager fills an empty list by hand — the
  opposite of what the task is meant to be.

### Manager-side and connection assumptions

The register now spans both portals and is filterable by side:

- **A-series (47)** — new hire, carried from v2 unchanged.
- **M-series (18)** — manager side: the readiness score has no agreed formula,
  what task detail a manager may see is unresolved, persona resolution blocks
  provisioning, the buddy suggestion's performance signal is withheld for
  privacy, and the credential task is recommended for deletion.
- **L-series (9)** — the joins themselves, including the buddy conflict, the
  introduction forward path that no source describes, and the decision that
  sensitive new hire tasks report status only and never content.

The panel also records four **source-integrity problems in the workbook itself**
— a missing manager row in the master inventory, sequence numbers that diverge
by one from 34 onward, a truncated corporate-card row, and label drift between
"accessories" and "access".

## The 1:1 changes

Applied from the meeting notes and handwritten follow-ups. v3 only; v1 and
v2 stay untouched.

**New hire**

- **Background check first.** It runs longest and nothing waits on it.
- **The phase strip runs to 90 days.** The live portal's five phases stop at
  the first month; the experience runs to three.
- **Equipment is the new hire's to choose**, not the manager's. Two states,
  both switchable from the prototype controls: one mapped build to confirm,
  or a real choice with full specifications, device illustrations and lead
  times. Models and specs are illustrative — the approved catalogue sits with
  End User Technology and has not been supplied.
- **Banking and direct deposit are captured in the portal**, editable, on a
  pay tab inside the details task. Withholding allowances come with them; the
  tax forms themselves stay with Payroll.
- **Inside Equinix is a narrow strip** with a disclosure, not a full-width box,
  and links out to the real thing rather than paraphrasing it.
- **The recruiter hands over to People Experience** visibly: the concierge is
  promoted, the recruiter greys out but stays reachable.
- **Badge completion is gone.** Security has no integration, so the portal was
  reporting something it could not see. Background check takes its place as a
  top-level readiness step.
- **No IT setup window.** Self-setup, with the help desk open all day.

**Hiring manager**

- **Their own phase strip**, the same device as the new hire's, and the task
  list grouped chronologically: before Day 1, Day 1, first week, first month.
  Everything used to be drawn as pre-Day 1, which made the after-start half of
  the job invisible. The four post-start tasks are proposed, not sourced.
- **Jordan's journey as a donut** over four states, with the share in the
  middle and every slice direct-labelled. The status colours are validated,
  not eyeballed: worst adjacent pair 16.7 ΔE under deuteranopia.
- **Everyone else as a strip**, hover naming the owner. Not a pie: three items
  are three equal thirds, and that says only "there are three".
- **Overdue is split.** Blockers carry only what the manager can act on;
  a separate, quieter block carries what is waiting on the new hire.
- **Ordering the computer is gone**, and its disposition moves to *remove* —
  the largest single saving in the subtraction review.
- **Three tones for the welcome note**, because a pre-filled note that does
  not sound like the sender is worse than none.
- **People Experience edits reach the checklist.** Change the orientation
  blueprint and the manager's confirmation goes stale, the task reopens, and
  it is raised as a blocker. A third party in a two-portal picture.
- **Ambassador removed.** One function-based buddy; anyone else is simply
  someone to meet.

## The cleanup pass

A design and copy pass over v3 only. No screens, features, routes or register
entries were added or removed; v1 and v2 are untouched.

**The problem.** The prototype narrated itself inside the product. Design
rationale sat in the same visual layer as product content: every task card
carried a why-this-exists sentence, every section heading a defensive subtitle,
the Coming-up items carried both a note and an `expl` that restated it, 97
markers were inline, and every manager task carried a disposition badge plus its
argument. Five gradient and alert blocks competed on the landing page alone.

**What changed.**

- **One switch for all commentary.** Rationale, markers, dispositions and the
  callouts that argue a design now sit behind **Design notes** in Prototype
  controls, off by default. It is a body class over markup that always carries
  the notes, so nothing is deleted and nothing needs re-rendering.
- **Copy rewritten, not just hidden.** Section subtitles that defended a
  decision became labels ("Not yours on purpose, listed so you can see nothing
  has been forgotten" → "Nothing for you to do"). The Coming-up items lost the
  note/`expl` duplication and gained a separate `dnote` field for the
  commentary. Duplicated labels went (`Country of hire` as both heading and
  field label; "The same table Jordan sees" twice on the manager's screen).
- **One red accent per screen.** The brand rule ran on every `h2` — eight times
  a page — and had stopped reading as an accent. It now appears once, on the
  page title. The live-to-do link's red bar became blue, the equipment case
  header charcoal, the overflow note neutral.
- **One gradient family.** Both heroes now run the same blue ramp; the
  reflection prompt dropped from magenta-violet to charcoal. The six Inside
  Equinix chapter colours stay — that is editorial content, not chrome.
- **Density and depth.** One soft shadow instead of two stacked, tighter card
  padding and section rhythm, and the hero art no longer runs under the last two
  milestone labels.

Result: the landing page drops from 3741px to 3662px and the manager's readiness
view from 4093px to 3524px, with far more removed from the visual field than
those numbers suggest — the markers and dispositions were inline rather than
stacked.

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
v3/               v3 — both portals; adds js/hm.js for the manager side
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
