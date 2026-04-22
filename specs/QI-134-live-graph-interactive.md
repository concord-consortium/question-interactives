# Live Graph Interactive (QI-134)

**Jira**: https://concord-consortium.atlassian.net/browse/QI-134

**Status**: **Closed**

## Overview

A new standalone `live-graph` package that subscribes to a single linked interactive's PubSub channel and renders `recording-started` / `recording-tick` / `recording-stopped` messages as a continuously updating, multi-series Chart.js line chart. Authoring covers chart framing (title, axis labels, fixed or auto-scaled y-axis), an x-axis column mapping, configurable column filtering and display names, and the pre-data/no-source status messages students see. A keyboard-accessible HTML legend lets students toggle series visibility (state persists across recordings by column name within the session). A reusable `pubSubSimulation` extension of the shared `DemoComponent` ships with the interactive for local development: a configurable, user-controlled recording state machine (Start / Pause / Continue / Stop / Reset / Restart) backed by an in-demo `PubSubManager` host, plus a persisted config editor.

## Requirements

### Runtime (Student View)

- Subscribes to a PubSub channel from a single linked data-source interactive and renders incoming data as a multi-series line chart. Source ID is fixed at runtime mount.
- All data series superimposed on a single chart, updating in real time.
- X-axis auto-compresses when data exceeds the right edge (no scrolling or truncation).
- Legend auto-generated from column names (after filtering and display-name mapping).
- Students toggle individual series on/off via the legend using mouse click or keyboard (Tab + Enter/Space). Each legend entry is a focusable button with `aria-pressed`.
- Author-configurable "no data source configured", "waiting for data", and "recording stopped" messages with sensible defaults.
- Student-friendly warning when authored x-axis column is missing from published data; `console.error` and `log` event emitted. Ticks discarded until a new `recording-started` includes the column.
- Fixed message when column filtering produces an empty plottable set.
- Chart clears on new `recording-started`. Toggle state persists across recordings by column name within the session.
- No internal cap on data-point count in v1.
- Six view states: `no-source`, `waiting`, `plotting`, `stopped`, `filter-empty`, `x-axis-missing`.
- ARIA label derived from chart title. Dual ARIA live regions: `polite` for expected states (including stopped), `assertive` for x-axis-missing warning.
- Five log events: `toggle-series`, `recording-started`, `recording-stopped`, `x-axis-compressed`, `x-axis-column-missing`.
- rAF-coalesced chart rendering for high tick rates.
- On `recording-stopped`, chart clears and displays an author-configurable "recording stopped" message (default: "Recording complete."). Transitions back to plotting on next `recording-started`.
- Defensive handling of unexpected PubSub message order (tick-before-started discarded, orphan stopped transitions to stopped state, repeated started clears, ticks-after-stopped discarded).
- Defensive tick payload coercion: missing columns → `null`, non-finite values → `null`, extra keys ignored.
- Detailed data-table accessibility *(deferred to a follow-up)*.

### Authoring (Author View)

- Data Source Interactive dropdown via `linkedInteractiveProps` with `customValidate` for `"none"` sentinel.
- Chart title, X-axis column (with placeholder text), X-axis label, X-axis max.
- Y-axis label, Y-axis range (Auto-scale / Fixed with yMin/yMax — conditional fields always visible, disabled when not applicable).
- Column display names (URLSearchParams-based parser), Column filtering (All / Allow / Ignore with conditional list fields).
- Chart height in pixels (defaults to 400). Applied as an inline style; `useAutoHeight` reports the value to the parent iframe.
- No-data message, No-source message, and Recording-stopped message with authoring help text.
- Field ordering via `ui:order` with conditional fields positioned after their parent.
- Custom Authoring component renders RJSF Form directly (bypasses BaseAuthoring to avoid unnecessary Firebase JWT calls).

### Demo

- `pubSubSimulation` config prop on `DemoComponent` with recording controls rendered in the runtime-container iframe.
- Four-state state machine: Idle → Recording → Paused → Stopped. Controls: Start / Pause+Stop / Continue+Stop / Reset+Restart.
- Reset clears chart and returns to Idle without starting a new recording.
- Built-in generators: sine, random, increment, constant. Custom generators via slug + `fn`.
- Per-instance generator state (no module-level bleed between instances).
- Config editor modal (portaled to document.body) with column add/remove, generator selection, parameter editing, tick rate.
- localStorage persistence per URL with override indicator. Reset to default clears override.
- PubSubManager routing via `onPhoneReady` prop on IframeRuntime.
- Linked interactive injection in DemoAuthoringComponent for dropdown population.
- Live-graph demo config exercises all 5 generator types with custom fuzzy wave using `previousValue`.

### Compatibility

- Works with existing PubSub publishers without changes.
- Does not appear in teacher's Class Dashboard (BaseApp, no student answer).
- Log events visible in researcher reports.

## Technical Notes

- Package scaffolded from `packages/starter` with BaseQuestionApp → BaseApp conversion.
- Chart.js 3.9.1 with react-chartjs-2 4.3.1 (matches existing packages).
- PubSub routing uses `PubSubManager` from `@concord-consortium/interactive-api-host` following the activity-player pattern.
- Chart.js animation disabled (`options.animation = false`) for streaming use case.
- Column colors shared between chart and legend via `columnColor(index)` helper.
- X-axis scale: `linear` when xAxisColumn is set (pre-parsed `{x, y}` points, non-finite x points omitted), `category` when blank (row-index labels).
- Axis bounds computed with manual loop (not `Math.min(...array)`) to avoid stack overflow on large datasets.

## Out of Scope

- Modifying the existing graph interactive.
- Changes to existing PubSub publishers.
- Bar charts, scatter plots, or other chart types.
- Saving interactive state or report-item support.
- Accessible data-table fallback or chart summary for screen readers — deferred to a follow-up.
- Advanced axis customization (custom tick formatting, log scale, date/time scales).
- Session replay / catching up on missed ticks.
- Multiple linked data sources on a single live-graph.

## Not Yet Implemented

- Accessible data-table fallback for screen readers — deferred to a follow-up ticket.
- WCAG contrast and color-blind accessibility for the line color palette — current implementation uses Chart.js default colors as a placeholder.
