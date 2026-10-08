# Tableau research: look, chart types, and build limits

Background for the onboarding-reimagined measurement mockup. The mock prototypes **fields, measures and displays**. It isn't the product. Anything in it has to be buildable in Tableau Desktop / Tableau Cloud, and it should look the way Tableau will render it.

Confidence tags: **[official]** = Tableau docs / Tableau-published; **[derived]** = Tableau's own palette files via a faithful mirror; **[observed]** = Tableau's default rendering as commonly seen, not documented. Check these in Format › Workbook before treating them as a spec.

---

## 1. Look and feel

### Type
| Element | Value | Confidence |
|---|---|---|
| Family | **Tableau** family: Tableau Light / Book / Regular / Medium / Semibold / Bold. Default since 10.4 (2018) | [official] Trailhead: Tableau's own fonts are used by default |
| Predecessor UI font | Benton Sans Book; Medium for section titles | [official] Extensions API style guide |
| Fallbacks | Helvetica, Arial, Open Sans, Segoe UI, San Francisco | [official] Extensions API style guide |
| Base UI size | 10pt Windows / 12pt Mac (Desktop UI) | [official] Extensions API style guide |
| Dashboard title | ≈ 18pt | [observed] |
| Worksheet title | ≈ 15pt Book, #333 | [observed] |
| Headers, tooltip, legend, cell text | ≈ 9pt Book, #333 | [observed] |
| Axis tick labels | ≈ 8pt, #666 | [observed] |
| Recommended minimum for readability | 12pt for presentation dashboards | [official] Trailhead |

The Tableau fonts install with Tableau Desktop but aren't licensed for web embedding. `tokens.css` names them first, so anyone with Desktop installed sees the real typeface. Everyone else falls back to Arial, which is the substitute Tableau's own extension guide names. The Palettes & type tab reports which font the browser is actually using.

### UI grays and functional colors [official, Extensions API style guide]
Fills F1 to F9: `#FAFAFA #F5F5F5 #EBEBEB #E6E6E6 #E1E1E1 #D4D4D4 #CBCBCB #B4B4B4 #666666 #333333`.
Functional colors: Dimension blue `#4996B2`, Measure green `#00B180`, Go `#2DCC97`, Attention `#EB4454`, Action `#EB8F50`. The blue/green pills in the gallery use these. Font colors are black at 100/80/70/60/35% opacity.

### Marks and defaults
- Default single-color mark: Tableau 10 blue `#4E79A7`. Default text color: black. [official: color palette help]
- Default categorical palette: **Tableau 10**. Default continuous palette: blue sequential for all-positive values, orange-blue diverging when values cross zero. [official]
- Highlighting: selecting a mark fades the others. Hover shows the tooltip, and the tooltip carries Keep Only / Exclude / View Data commands. [official]
- Bars have square ends, no outline, and stacked segments touch. Gridlines sit on the value axis only, with light pane dividers. [observed]
- Workbook themes: Default, Smooth (10.x+), Clean, Modern, Classic. The mock matches Default/Smooth. [official]

### Palettes [derived]
All 15 categorical, 15 sequential and 15 diverging palettes, plus 9 shape palettes, are in `design-package/palettes.json`. They come from the ggthemes mirror of Tableau's palette definitions (`data-raw/theme-data/tableau.yml`).

Tableau 10: `#4E79A7 #F28E2B #E15759 #76B7B2 #59A14F #EDC948 #B07AA1 #FF9DA7 #9C755F #BAB0AC`.

**Accessibility finding.** I ran Tableau 10 through a colour-vision-deficiency validator:
- Red (slot 3) and green (slot 5) are indistinguishable for deuteranopes (ΔE 0.7).
- Orange, teal, yellow, pink and gray are below 3:1 contrast on white.

What this means for the mock:
- Keep categorical series to 6 or fewer.
- Always pair color with a legend or direct labels.
- Use gray vs blue for before/after comparisons, which is the pattern the gallery uses.
- Don't put red and green side by side for good/bad. Use blue vs red, or Tableau's **Color Blind** palette (`#1170AA #FC7D0B …`).

### Dashboard sizing and objects [official]
- **Size presets:** Desktop Browser 1000×800 (default), Generic Desktop 1366×768, Laptop 800×600, PowerPoint 1600×900, plus Automatic and Range. Separate device layouts are available for Tablet and Phone.
- **Objects:** Horizontal and Vertical containers, Text, Image, Web Page, Blank, Navigation button, Download button (PDF / PowerPoint / PNG, and Crosstab once published), Extension, Pulse Metric. Data Story appears in some versions. Ask Data is retired.
- **Placement:** objects are either Tiled (in the container tree) or Floating (absolute position).

### Viewer chrome (Tableau Cloud / Server)
- **Toolbar:** Undo, Redo, Revert, Refresh, Pause, Custom Views ("View: Original"), Alerts, Subscribe, Edit, Share, Download (Image / Data / Crosstab / PDF / PowerPoint / Tableau Workbook), Comments, Full Screen.
- **Sheet tabs:** shown when the workbook is published with tabs.

---

## 2. Graphing options

### Mark types (Marks card) [official]
| Mark | Use / constraint |
|---|---|
| Automatic | Chosen from the inner Rows/Columns fields. Never chooses Pie or Polygon. |
| Bar | Auto-stacks. A date dimension switches Automatic to Line. |
| Line | Path can be linear, step or jump. |
| Area | Stacked, needs a date or continuous dimension. |
| Square | Heat maps, highlight tables, treemaps. |
| Circle | Filled circles, manual selection only. |
| Shape | 20 built-in shapes (see the shape palettes), or custom images. |
| Text | Text tables and BANs. Numbers that don't fit show `#`. |
| Map | Filled geography, needs a geographic role. |
| Pie | Needs Angle. Never chosen automatically. |
| Gantt Bar | Length = the field on Size. Durations and timelines. |
| Polygon | Custom shapes, needs a Path field. Rare. |
| Density | Kernel-density glow over overlapping points. |

### Show Me (24 types) [official names, list per InterWorks / Playfair]
Text table · Heat map · Highlight table · Symbol map · Filled map · Pie · Horizontal bars · Stacked bars · Side-by-side bars · Treemap · Circle views · Side-by-side circles · Lines (continuous) · Lines (discrete) · Dual lines · Area (continuous) · Area (discrete) · Dual combination · Scatter plot · Histogram · Box-and-whisker · Gantt · Bullet graphs · Packed bubbles.

All of them except the two maps are in the gallery. Maps were left out because nothing in the onboarding measures is geographic beyond region, and a bar chart serves region better.

### Common builds outside Show Me (all buildable)
- **BAN / KPI tile:** Text mark, delta calc, sparkline sheet beside it
- **Funnel:** mirrored bars on a dual axis
- **Donut:** dual-axis MIN(0) trick
- **Dumbbell:** dual axis with Line and Circle
- **Lollipop**
- **Waterfall:** Gantt bar with a running total
- **Small multiples**
- **Cohort retention grid:** highlight table with table calcs
- **Calendar heat map**
- **Slope chart**
- **Control chart:** reference band of ±n standard deviations
- **Analytics pane:** reference lines, bands and distributions, trend lines, forecast, clusters, box plot, totals

### Viz Extensions (2024.2+, Tableau Exchange)
Extra mark types delivered as extensions:
- **By Tableau:** Sankey, Radial.
- **Third-party:** Sunburst, Radar, Donut, Gauge, Waterfall, Streamgraph, KPI cards, SuperTables and more.

Some third-party extensions need a license for Tableau Cloud or Server. **Treat these as "possible but needs approval"** in the mock. A Sankey (pre-boarding stage → outcome) is a likely ask.

### Interactivity Tableau can do (mock only these)
- **Quick filters:** single or multiple values as a list, dropdown or custom list (search), slider (range / at least / at most), relative date, wildcard match.
- **Parameters:** dropdown, list, slider or type-in. Parameter actions set them by clicking a mark.
- **Dashboard actions:** filter, highlight, URL, Go to Sheet, Change Set Values, Change Parameter.
- **Other:** Viz in Tooltip; show/hide button on containers; Download object; navigation buttons; drill-down hierarchies (the + / − on headers).

### Limits on what to mock (things Tableau can't do, or does poorly)
- **No free-form UI controls.** Filter and parameter controls have fixed shapes. Only font, color, border and title can change. There are no custom toggles, chips or tabs; buttons are faked with sheets or navigation objects.
- **No rich per-mark styling.** No rounded bars (without workarounds), no gradients, no shadows, no per-bar hover animations.
- **Text styling is limited.** Font size is fixed per field, not responsive. There is no CSS-style wrapping control in headers.
- **No in-viz editing or forms.** The dashboard is read-only. Data entry needs an extension or a separate tool.
- **Tooltips sit on top.** A tooltip can't be styled as a card and appears on hover or click.
- **Layout is a container tree, not a grid.** Mocks should stick to rows and columns of tiles.
- **Dual axis is possible but risky.** Use sparingly and synchronize axes when the units match.

---

## Sources
- Tableau Help, [Change the Type of Mark in the View](https://help.tableau.com/current/pro/desktop/en-us/viewparts_marks_marktypes.htm)
- Tableau Help, [Color Palettes and Effects](https://help.tableau.com/current/pro/desktop/en-us/viewparts_marks_markproperties_color.htm)
- Tableau Help, [Create Custom Color Palettes](https://help.tableau.com/current/pro/desktop/en-us/formatting_create_custom_colors.htm)
- Tableau Help, [Format at the Workbook Level](https://help.tableau.com/current/pro/desktop/en-us/formatting_workbook.htm)
- Tableau Help, [Create a Dashboard](https://help.tableau.com/current/pro/desktop/en-us/dashboards_create.htm)
- Tableau Help, [Show Me](https://help.tableau.com/current/pro/desktop/en-us/buildauto_showme.htm)
- Tableau Help, [The Tableau Workspace](https://help.tableau.com/current/pro/desktop/en-us/environment_workspace.htm)
- Tableau Extensions API style guide: [Fonts](https://tableau.github.io/extensions-api/docs/Style_Guidelines/ux_fonts/), [Color](https://tableau.github.io/extensions-api/docs/Style_Guidelines/ux_color/)
- Trailhead, [Format Your Visualizations](https://trailhead.salesforce.com/content/learn/modules/tableau-visualization-formatting-on-the-web/format-your-visualizations)
- Tableau blog, [How we designed the new color palettes in Tableau 10](https://www.tableau.com/blog/colors-upgrade-tableau-10-56782)
- ggthemes, [tableau_color_pal](https://jrnold.github.io/ggthemes/reference/tableau_color_pal.html) and [tableau.yml](https://github.com/jrnold/ggthemes/blob/main/data-raw/theme-data/tableau.yml)
- InterWorks, [Tableau Essentials: Chart Types](https://interworks.com/blog/ccapitula/2014/08/04/tableau-essentials-chart-types-introduction/); [What Are Tableau Viz Extensions?](https://interworks.com/blog/2025/01/10/what-are-tableau-viz-extensions/)
- Playfair Data, [The Definitive Guide to Dashboard Objects in Tableau](https://playfairdata.com/the-definitive-guide-to-dashboard-objects-in-tableau/)
- Tableau Exchange, [Viz Extensions](https://exchange.tableau.com/en-us/viz-extensions)
