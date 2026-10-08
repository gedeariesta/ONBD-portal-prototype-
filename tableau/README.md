# Onboarding Reimagined: Tableau measurement mockup

This is a **prototype of what we plan to measure and how it will be displayed** for the efficiency and effectiveness of the onboarding-reimagined project: the fields, measures, chart choices and filters. It isn't the dashboard itself. It's built to look like Tableau, and to contain only things Tableau can actually build, so the hand-off to whoever builds the real workbook is direct.

This is separate from the portal prototypes (`v1`–`v3`) at the repo root.

## What's here

| Path | What it is |
|---|---|
| `exec-view/index.html` | **Executive / Program View**, built from the v4 design prompt and the v3.1 planning workbook. Fixed 1600×900. A second tab has the build notes: where it departs from the prompt and why, numbers to confirm, the field spec, the Tableau recipe, and the two views not drawn yet. |
| `exec-view/data.js` | Every tile, value, source and readiness flag in one place. Each value is marked `real`, `illustrative` or `none`. |
| `dist/` | One-file builds of both pages for sending around. Rebuild with `node tableau/tools/build_standalone.js`. |
| `tools/build_geo.py` | Regenerates `exec-view/geo.js` (Natural Earth 110m, Web Mercator). |
| `RESEARCH.md` | Tableau's look (fonts, grays, default colors), every mark type, the 24 Show Me charts, common builds, viz extensions, and the **limits on what to mock**. Sources included. |
| `design-package/index.html` | The design package gallery, rendered inside Tableau Cloud viewer chrome. Three tabs: Show Me catalogue, Filters / legends / objects, Palettes & type. |
| `design-package/tokens.css` | Design tokens: Tableau font stack, sizes (pt converted to px), F1–F9 grays, Tableau 10, tooltip / control / chrome colors, dashboard size presets. |
| `design-package/components.css` | Worksheet frame, crosstabs, BAN, legends, tooltip, quick filters, parameter controls, viewer toolbar and sheet tabs, containers. |
| `design-package/charts.js` | `TabViz`: a dependency-free SVG kit that draws like Tableau. Includes hover tooltips and click-to-highlight. |
| `design-package/palettes.json` / `.js` | All of Tableau's built-in categorical, sequential, diverging and shape palettes. |

## Open it

Double-click `exec-view/index.html` or `design-package/index.html`, or the one-file copies in `dist/`. They work over `file://` and need no server or network.

## Using the kit for the real mock

```html
<link rel="stylesheet" href="design-package/tokens.css">
<link rel="stylesheet" href="design-package/components.css">
<div class="tab-sheet"><h3 class="tab-sheet-title">Days to Day-1 ready</h3><div class="tab-viz" id="v1"></div></div>
<script src="design-package/palettes.js"></script>
<script src="design-package/charts.js"></script>
<script>
  TabViz.hbar('#v1', { dim: 'Region', measure: 'AVG(Days to Ready)', refLine: 14,
    data: [{ label: 'EMEA', value: 18.4 }, { label: 'APAC', value: 15.1 }] });
</script>
```

**Renderers:**
- **Bars:** `hbar`, `vbar`, `stackedBar` (with `percent`), `sideBySide`, `bullet`
- **Time:** `line`, `area`, `combo` (dual axis), `gantt`
- **Points:** `dots` (with `dumbbell`), `scatter`
- **Distribution:** `histogram`, `boxplot`
- **Part-to-whole:** `pie` (with `donut`), `treemap`, `bubbles`, `funnel`
- **Grids and tables:** `heatmap`, `textTable`, `highlightTable`
- **KPIs:** `ban`, `sparkline`
- **Helpers:** `legend`, `ramp`

Each tile in the gallery lists the matching Tableau shelf recipe (Rows / Columns / Marks).

All numbers in the gallery are placeholder sample data.
