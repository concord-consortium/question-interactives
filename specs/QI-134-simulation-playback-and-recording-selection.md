# QI-134 Follow-On: Simulation Playback & Recording Selection in Live Graph

**Source Spec**: [specs/QI-134-simulation-playback-and-recording-selection/](specs/QI-134-simulation-playback-and-recording-selection/)

**Status**: **Closed**

## Overview

Extend the live-graph interactive to display chart data during simulation playback (play/pause), retain the last chart state when recordings stop, and show stored recording data when a user selects a previous recording in the agent-simulation UI.

Currently the live-graph interactive only charts data during active recording sessions in the agent-simulation. When a recording stops, the chart is cleared and a "Recording complete" message is displayed. Students cannot see graph data during normal simulation play/pause, nor can they review the graph for a previously saved recording.

This follow-on extends live-graph to support three additional scenarios: (1) live charting during simulation playback (not just recording), (2) retaining the last graph state when a recording or simulation stops instead of clearing it, and (3) displaying stored chart data when a student selects a previously saved recording. These changes make the graph a more useful analysis tool throughout the full simulation workflow.

## Requirements

### R1: Remove recordingStoppedMessage

Remove the `recordingStoppedMessage` field from the live-graph authored state schema, types, authoring UI, and demo config. Remove the `DEFAULT_RECORDING_STOPPED_MESSAGE` constant. Remove the `"stopped"` view state from `useLiveStream`. When a recording or simulation ends, the chart retains its last plotted state rather than clearing data and showing a message.

### R2: Simulation playback PubSub messages

When the agent-simulation is in non-recording mode and the user clicks play for the first time or after a reset, publish `simulation-started` (with cols and title). On each tick, publish `simulation-tick`. On pause, publish `simulation-paused`. On reset, publish `simulation-reset`. The existing `afterTick` callback is made mode-aware to publish the appropriate topic. The existing `recording-started` message is updated to include a `title` field.

### R3: Live-graph handles simulation playback messages

The `useLiveStream` hook subscribes to `simulation-started`, `simulation-tick`, `simulation-paused`, and `simulation-reset` messages using shared handler logic with the existing `recording-*` handlers. `simulation-paused` retains chart data. `simulation-reset` clears data and returns to waiting. Recording, simulation, and selected recording display are mutually exclusive.

### R4: Retain chart on recording stop

When `recording-stopped` is received, the live-graph retains the last plotted chart data. ViewState remains `"plotting"` and the R7 activity state indicator communicates that data is no longer live.

### R5: Recording selection PubSub message

When a user selects a recording in the RecordingStrip, publish `recording-selected` with `{ objectId, title, status }` where status is `"empty"`, `"waiting"`, `"ready"`, or `"failed"`. For `"waiting"` status, poll every 250ms (max 10s) until the objectId resolves. When deselecting (return to tinker), publish `recording-deselected` and trigger a simulation reset so the tick counter starts fresh. Creating a new recording slot also publishes `recording-selected` with `status: "empty"` to clear the live-graph, resets `hasBeenStarted`, and triggers a simulation reset.

### R6: Live-graph displays selected recording data

Handle `recording-selected` with per-status logic: `"empty"` shows "No recording data yet.", `"waiting"` shows "Saving recording...", `"ready"` fetches data via `readMetadata`/`readDataItem` from object storage, `"failed"` shows an error message. `recording-deselected` clears chart data (`colsRef`/`rowsRef`) and resets to idle/waiting. *(Original spec said retain data on deselect; changed during implementation because returning to tinker then pressing play appended simulation ticks to stale recording data.)*

### R7: Dynamic chart title suffix

Track activity state (idle, playing, paused, recording, stopped, recorded) derived from PubSub messages. Compose a dynamic chart title: `"AuthoredTitle: SourceTitle (StateLabel)"`. State transitions are announced to screen readers via a separate always-hidden `aria-live="polite"` region.

### R8: Logging

Log new message types via `logging.ts`: `logSimulationStarted`, `logSimulationPaused`, `logSimulationReset`, `logRecordingSelected`, `logRecordingDeselected`. Tick-level events are not logged individually.

### R9: Visual polish — fonts, colors, legend position, chart title alignment

- All chart text uses Lato font family (`'Lato', sans-serif`) via Chart.js global defaults. All chart text color is `#3f3f3f`.
- Chart title: 16px. Axis labels: 14px. Tick labels: 12px.
- Legend text: 16px, Lato, `#3f3f3f`. Legend line swatches use `strokeWidth="1.3"` to match graph line weight.
- Renamed `chartTitlePosition` to `legendPosition` — the authorable position option (top/right/bottom/left) controls the custom legend placement, not the Chart.js title. Legend supports vertical layout for left/right positions.
- Added `chartTitleAlignment` authoring option (Center/Start/End, defaults to Center) mapped to Chart.js `plugins.title.align`.

### R10: Always-visible chart with overlay messages

The chart (axes, title, grid) is always rendered in all view states, including "waiting" and "no-source". Status messages ("Waiting for data...", "No data source configured", etc.) are overlaid as a centered pill-styled badge (semi-transparent white background, subtle border, rounded corners) on top of the chart. This gives students a preview of the graph structure before data arrives, and updates in the authoring preview as well. The legend is only shown when `viewState === "plotting"`.

## Technical Notes

- Both recording and simulation messages share the same `recordingChannelRef` channel (keyed to the interactive ID). The live-graph subscribes to a single channel per linked interactive and differentiates by topic prefix.
- The `afterTick` callback in agent-simulation uses an `inRecordingModeRef` to check recording mode at tick time, since the callback is captured in a closure during `resetSimulationWithPreservedGlobals`.
- R6 uses `useObjectStorage()` from `@concord-consortium/object-storage` — a new dependency for the live-graph package. The fetch is a two-step process: `readMetadata` to find the dataTable item, then `readDataItem` to get cols and rows.
- A `fetchEpochRef` counter cancels stale object storage fetches when a new source arrives before the previous fetch completes.
- Activity state announcements use a separate always-hidden `aria-live="polite"` div so they are screen-reader-only. Visible status messages are rendered as an absolutely-positioned overlay (`css.overlay`) inside the chart container, styled as a pill badge. *(Original spec used a single polite region with priority logic; split into two divs during implementation to prevent activity labels from rendering visibly when the chart title already shows the state.)*
- The Chart component is always rendered (even with empty cols/rows) so axes and title are visible in all states. The `cols` prop accepts an empty array when no data source is active, and Chart.js renders the configured axes and title as an empty scaffold.
- When exiting recording mode (return to tinker or creating a new recording), the agent-simulation resets `hasBeenStarted` to `false` and triggers `resetSimulationWithPreservedGlobals` via `setNewRecordingCount`. This ensures the next play publishes `simulation-started` (clearing stale live-graph data) and resets the tick counter to 0.

## Out of Scope

- Simultaneous recording and simulation playback (mutually exclusive).
- Changes to the graph package (`packages/graph`) -- only live-graph is affected.
- Persisting simulation playback data to object storage (only recordings are persisted).
- Any changes to the RecordingStrip UI component itself.

## Decisions

### Should simulation-paused retain chart data or clear it?

**Context**: When a user pauses a non-recording simulation, should the chart freeze in place or clear?

**Options considered**:
- A) Retain chart data on pause. Chart freezes and resumes appending on next play.
- B) Clear chart data on pause.

**Decision**: A) Retain chart data. Chart freezes and resumes appending (single continuous chart session).

---

### Should resuming after pause append to existing data or restart?

**Context**: If the user pauses and then resumes playback, should new ticks append to the existing chart rows, or should a new `simulation-started` clear and restart the chart?

**Options considered**:
- A) Append. Pause just stops ticks, play resumes appending.
- B) Restart with a new `simulation-started`.

**Decision**: A) Append. Ticks simply resume — no re-publishing of `simulation-started`.

---

### What message should be sent when agent-simulation has no objectId for a selected recording?

**Context**: A recording that hasn't been saved yet won't have an `objectId`.

**Options considered**:
- A) Send `recording-selected` with `objectId: null` immediately.
- B) Poll with `setTimeout` until the objectId becomes available, then send with the objectId.

**Decision**: B) Poll every 250ms until objectId resolves (max 10 seconds). Send `recording-selected` with `status: "waiting"` immediately, then follow up with `status: "ready"` or `status: "failed"`.

---

### Should recording-deselected clear the chart or retain the last selected recording's data?

**Context**: When the user returns to tinker mode (deselects a recording).

**Options considered**:
- A) Clear chart data and return to waiting.
- B) Retain the last displayed recording data.

**Decision**: A) Clear chart data and return to waiting. The simulation also resets so the tick counter starts fresh.

---

### Should fetchRecordingData use objectStorage.monitor() or a direct read API?

**Context**: The graph package uses `objectStorage.monitor()` with a persistent callback. For R6's one-shot fetch, a direct read would be simpler.

**Options considered**:
- A) Wrap `monitor()` for one-shot use.
- B) Use `readMetadata()` + `readDataItem()` directly.

**Decision**: B) Use direct read APIs. The `IObjectStorage` interface exposes `readMetadata()` and `readDataItem()` methods. No need to wrap `monitor()`.

---

### Should the reducer action type be renamed from "recording-started" to "source-started"?

**Context**: The reducer action now handles both recording and simulation sources.

**Options considered**:
- A) Rename to `"source-started"` for clarity.
- B) Keep `"recording-started"` and add a separate `"simulation-started"` action.

**Decision**: A) Rename to `"source-started"`. The reducer is local to `use-live-stream.ts` so the rename is low-risk.

---

### Where should the object storage fetch logic live — in useLiveStream or in runtime.tsx?

**Context**: The fetch result writes directly into `colsRef`/`rowsRef` and dispatches reducer actions.

**Options considered**:
- A) Fetch in `useLiveStream` — keeps data management co-located with refs and dispatch.
- B) Fetch in `runtime.tsx` — keeps the hook simpler.

**Decision**: A) Fetch in `useLiveStream`. The fetch writes directly into refs and dispatches actions, all internal to the hook. With direct `readMetadata()`/`readDataItem()` APIs, the async complexity is minimal.

---

### R5 distinguishing selecting a completed recording from selecting an empty slot

**Context**: `handleSelectRecording` is called both for completed recordings (to view data) and empty slots (to record into).

**Decision**: Added a `status` field (`"empty"` | `"waiting"` | `"ready"` | `"failed"`) so the agent-sim publishes `recording-selected` for all selections and the live-graph handles each case appropriately.

---

### R7 "(Stopped)" label ambiguity for selected historical recordings

**Context**: Selected historical recordings showed "(Stopped)" which was confusing since nothing was "playing" from the student's perspective.

**Decision**: Use "(Recorded)" for selected historical recordings. "(Stopped)" is retained only for a just-completed recording or simulation.

---

### R6 fetchRecordingData reads streamState.sourceTitle via stale closure

**Context**: `fetchRecordingData` referenced `streamState.sourceTitle` via closure, which would be stale by the time the async fetch completes.

**Decision**: Added `sourceTitleRef` kept in sync with `streamState.sourceTitle`, used in the fetch instead of the closure-captured value.

---

### R6 no cancellation of in-flight object storage fetch when a new source arrives

**Context**: Stale fetch could overwrite new source data.

**Decision**: Added `fetchEpochRef` counter. Incremented on every source change. `fetchRecordingData` captures the epoch at call time and checks it before writing results — discards stale responses.

---

### R6 fetchRecordingData dispatches source-started on success, re-incrementing recordingEpoch

**Context**: Fetch success would double-bump `recordingEpoch`, resetting the x-axis compression detector.

**Decision**: Added a `"data-loaded"` reducer action that bumps `updatedAt` and clears `statusMessage` but does not touch `recordingEpoch`.

---

### R7 aria-live announcement could re-announce on every tick-driven re-render

**Context**: Deriving politeText from stateLabel on every render could cause spurious re-announcements.

**Decision**: Split into a separate `activityAnnouncement` state variable updated via `useEffect` only on `activityState` transitions. Rendered in a separate always-hidden `aria-live="polite"` div so it is screen-reader-only and does not affect visible layout.

---

### R7 tick handler dispatches activity-changed on first tick after pause

**Context**: Two dispatches on the first tick after resume cause a double re-render in React 17.

**Decision**: Accepted. The row is pushed imperatively before either dispatch. The double-render paints the same data point twice — negligible impact.
