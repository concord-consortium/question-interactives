# Agent Sim Recordings Fail Silently When Data Exceeds Firebase 1MB Document Limit (QI-163)

**Jira**: https://concord-consortium.atlassian.net/browse/QI-163

**Status**: **Closed**

## Overview

In the `agent-simulation` interactive (the "MoDa" / Agent Sim used in classroom activities), long recordings can generate a tick-data document that exceeds Firebase Firestore's 1MB per-document limit. The save call previously fired-and-forgot with no `await` and no error handling, so the recording was added to the on-screen recording list and persisted to `interactiveState` even though nothing was written to Firestore. This spec defined the behavior changes that make save failures observable (awaited save with 30s timeout, blocking error modal, transient placeholder, structured telemetry, and a `recording-save-failed` PubSub event), plus a visible "saving" indicator during the in-flight save window and visual marking of pre-existing broken recordings detected on mount. The shared Modal component was extended with a focus-managed `alert` mode used by the new error modal.

**Scope note:** This spec surfaces failures, prevents phantom entries, and marks pre-existing broken recordings visually. It **does not preserve the lost recording** — when a save fails, the tick data is cleared and the student must re-run the model with a shorter recording. Preserving large recordings (via compression, sampling, chunking, etc.) is out of scope and would be tracked as a separate ticket.

## Requirements

### Behavior on save failure

- The save call must be awaited and wrapped so any rejection from `objectStorage.add()` is observed.
- The `await` is raced against a 30-second timeout. If the timeout wins, the call is treated identically to a rejection (modal, placeholder, log event, console.error, `recording-save-failed` publish, tick-data clear). The `errorMessage` recorded in the `log` event and `console.error` for the timeout path is `"save timed out after 30s"`.
- When `objectStorage.add()` rejects (for any reason — 1MB limit, network failure, auth failure, permission denied, the 30s timeout, etc.):
  - A blocking error modal is shown to the student. While the modal is visible, a placeholder tile is shown in the recording strip for the failed recording. When the modal is dismissed, the placeholder is removed from the strip and the failed entry is removed from `recordings` / `interactiveState`.
  - **End state:** no entry for the failed recording in the recording list, no entry in `interactiveState`, no partial state anywhere.
  - `tickDataRef.current` is cleared (same as the success path).
- Save success behavior is unchanged: the recording is added to the list with `objectId`, `startedAt`, `duration`, `thumbnail`, and `snapshot`; `tickDataRef.current` is cleared.

### Error modal

- Implemented using the shared `Modal` component from `packages/helpers/src/components/modal.tsx` (variants `teal | orange`), extended with a new `mode` prop.
- The shared `Modal` gains an optional `mode?: "confirm" | "alert"` prop (default `"confirm"`, preserving all existing usages). In `alert` mode:
  - The Cancel button is not rendered.
  - The X close button in the title bar is not rendered.
  - Only the OK / confirm button is shown; it is the sole dismissal affordance.
- The QI-163 error modal renders in `alert` mode — error acknowledgment is single-button.
- **Focus management in `alert` mode**: when the modal opens, focus moves to the OK button. Tab and Shift+Tab cycle within the modal (focus trap). Escape dismisses the modal identically to clicking OK (Escape is routed through `onConfirm`, not `onCancel`, so equivalence is enforced by construction). On close, focus is restored to the element that had focus before the modal opened. If that element is no longer in the DOM, the currently-active element is blurred — `body.focus()` was considered and rejected because it's a no-op without a temporary `tabindex` mutation.
- The modal blocks until acknowledged. It must not block further interaction with the simulation after dismissal.
- Acknowledgment removes the failed recording placeholder from the strip and removes the failed entry from `recordings` / `interactiveState`.
- **Single-modal policy**: when the error modal is active, no other modal (e.g., the existing delete-recording confirm modal) may be visible. If a delete-confirm modal is open at the moment the save fails, it is dismissed before the error modal opens.

### Saving-state visual indicator

- While `objectStorage.add()` is in flight (between Stop and save resolution), the recording strip renders the in-progress entry with a "saving" overlay: a dim/translucent overlay on the thumbnail and a small spinner.
- Detection signal: the entry's `objectId` is `undefined` AND the entry is not the currently-recording one.
- On save success: `objectId` is set on the entry → the saving overlay clears automatically.
- On save failure: the entry is removed from `recordings` and the failed-save placeholder + modal appear.
- Accessibility: the saving-state entry is rendered as a `<button>` with `aria-label "Recording N - saving..."`; the spinner SVG carries `aria-hidden="true"`. Saving entries are `disabled` to prevent selection during the in-flight window.

### Failed-recording placeholder in the strip

- While the error modal is visible, the recording strip shows a non-clickable placeholder tile in the position the failed recording would have occupied.
- The placeholder is rendered at the next index after all existing recordings, including any in `brokenObjectIds`. It never replaces or overlaps an existing entry. Broken-history entries and the failed-save placeholder use the same visual treatment but coexist as distinct strip positions.
- Visual: snapshot (if available) as background + translucent darkening overlay + centered warning-triangle icon. Not focusable, not clickable, no tooltip.
- The placeholder div uses `role="img"` with `aria-label "Recording N - failed to save"` so screen readers honor the label on the otherwise-roleless element.
- Closing the modal removes the placeholder. After dismissal, the strip shows zero entries for the failed save.

### Logging / telemetry

- On save failure, both of the following are emitted:
  - `console.error("[agent-simulation] Recording save failed", { objectId, errorMessage, approximateSizeBytes })`.
  - A researcher-report `log` event named `save-recording-failed` with payload `{ errorMessage, approximateSizeBytes }`. Approximate payload size is computed from `JSON.stringify(storedObject.data).length`.
- `approximateSizeBytes` is a character count from `JSON.stringify`, not a strict byte count — it is intentionally approximate. Tests assert it is a positive number, not an exact value.

### Recording-stopped PubSub and follow-up `recording-save-failed`

- The existing `recording-stopped` PubSub publish is unchanged in timing and payload.
- On save failure, a new follow-up publish is emitted synchronously in the catch handler **before the error modal opens**: `{ topic: "recording-save-failed", objectId }`. Tests assert the ordering via `jest.fn`'s `mock.invocationCallOrder` to be robust against React batching.
- This spec does not update any consumer (e.g., `live-graph`) to react to the new topic. Forward-compatible publish only.

### Handling of pre-existing broken recordings

- **No data is ever removed from `recordings` or `interactiveState` by this fix.** Pre-existing broken entries are detected and visually marked, not deleted.
- On every mount, the runtime iterates `recordings` and calls `objectStorage.readMetadata(recording.objectId)` for each entry that has an `objectId`. The set of `objectId`s whose `readMetadata` returns `undefined` is held in a transient, UI-only React state — `brokenObjectIds`. A per-mount cache makes follow-on detection a delta-fetch; the cache resets on unmount so broken state is self-healing across sessions.
- If `readMetadata` itself throws (network, auth, etc.), the entry is treated as **unknown** and rendered normally — do not mark broken on transient failures.
- The recording strip renders entries whose `objectId` is in `brokenObjectIds` with the same "broken" visual used for the failed-save modal placeholder: snapshot (if available) as background + translucent darkening overlay + centered warning-triangle icon.
- The broken state is signaled by at least two distinct visual cues — the warning-triangle icon and the darkening overlay — so that color is never the sole signal (WCAG 1.4.1).
- **No `aria-live` announcement** of detected broken entries on mount. AT users discover broken entries via the per-entry `aria-label` on focus.
- Broken-entry strip buttons and the failed-save placeholder both carry a stable `data-broken="true"` attribute. Tests assert on this attribute rather than on visual styling.
- Broken-entry strip buttons (interactive — clickable to select for delete) have an `aria-label` of the form `"Recording 3 - data missing, cannot play, select to delete"`.
- Failed-save modal placeholders (non-interactive) have a different `aria-label` that omits the action instruction: `"Recording 4 - failed to save"`. The placeholder is not a focusable interactive element.
- The warning-triangle SVG inside either state has `aria-hidden="true"`.
- Clicking a broken entry sets `currentRecordingIndex` (making the existing control-panel Delete action reachable), but suppresses the playback path: no `recording-selected` PubSub publish, no polling for `objectId`, no live-graph activation. The Play control is disabled while a broken entry is selected; Delete remains enabled.
- The strip's selected-state indicator on a broken entry is styled distinctly from the healthy-entry selected indicator (warning-colored ring).
- `interactiveState` and `recordings` are never mutated by this detection. The check re-runs on every mount, making the broken state self-healing if a recording later becomes readable.
- Existing delete-recording flow is reused without modification.
- Starting a new recording clears any broken-entry selection.

### Dependency bump

- `@concord-consortium/object-storage` was bumped from `1.0.0-pre.8` to `1.0.0-pre.9` in `packages/agent-simulation/package.json`. The pre.9 diff only changes Firebase Auth persistence behavior; it is unrelated to this bug but was taken opportunistically.

### Package version bump *(not implemented — user direction)*

- The spec originally called for bumping `version` in both `packages/helpers/package.json` and `packages/agent-simulation/package.json`. Per user direction, this repo's release process manages package `version` bumps externally; bumping them inside a feature PR creates churn and conflicts with that process. Both packages remain at `1.24.0`. The new Modal `mode` prop is fully backwards-compatible (defaults to `"confirm"`, preserving existing usages), so no SemVer signal to consumers is needed inside this PR.

### Tests

- End-to-end coverage of the save-failure path: modal rendering, placeholder lifecycle (visible while modal open, removed on dismiss), `log` event emission, `console.error` emission, `recording-save-failed` pubsub publish ordering (before modal opens via `mock.invocationCallOrder`), tick-data clear, and the invariant that no entry is added to `recordings` / `interactiveState` for a failed save.
- 30s timeout path with the same assertions, using `jest.useFakeTimers()` and microtask flushing.
- Auto-stop via `maxRecordingTime` → save-fail behaves identically to user-stop.
- Cleanup invariant: an unmount/remount with the post-failure `interactiveState` yields zero new entries.
- Repeat-failure regression: fail → dismiss → new recording → fail again, with no stale state between cycles.
- Single-modal policy: with delete-confirm open at the moment of save failure, only the error modal remains.
- Saving overlay: visible during the in-flight window with `data-saving="true"` and `aria-label "Recording N - saving..."`; the button is `disabled`; programmatic click does not publish `recording-selected`.
- Saving → broken placeholder transition on failure.
- Broken-entry detection at mount: `readMetadata` returning `undefined` results in the entry being included in `brokenObjectIds`; `readMetadata` throwing results in the entry being rendered normally.
- Broken-entry click-to-select behavior: setting `currentRecordingIndex`, suppressing the `recording-selected` publish and polling, Play disabled, Delete enabled.
- Metadata cache: cold mount fetches all ids; adding a new recording's `objectId` triggers exactly one new `readMetadata` call (delta-fetch); unmount/remount resets the cache.
- Starting a new recording clears any broken-entry selection (asserted via the `currentBrokenRecordingButton` className disappearing).
- Modal tests (in `packages/helpers/src/components/modal.test.tsx`): `confirm` mode renders both Cancel and X buttons; `alert` mode hides them, initial-focuses OK, traps focus on the single focusable, restores focus on dismiss via both OK and Escape, and routes Escape through `onConfirm`. Both modes have `aria-modal`, `aria-labelledby`, `aria-describedby` with per-instance unique ids.
- The mechanism for injecting a rejecting / hanging `add()` was a `jest.mock`/`mockReturnValue` override of `useObjectStorage`. The published `@concord-consortium/object-storage` package was not modified.

## Technical Notes

- The atomic batch behavior in `@concord-consortium/object-storage`'s Firebase implementation means there is no need to handle the "metadata saved but data missing" case — it cannot occur with the current storage implementation.
- The 1MB Firestore document limit is per document, not per batch. The tick data item is overwhelmingly the largest payload; metadata, snapshot, thumbnail, and code text are well under the limit for any plausible model.
- Snapshot PNGs are stored as base64 dataURLs and can grow large for big canvases, but in practice tick data is the dominant cause.
- `setRecordings` writes through to `interactiveState` via `setInteractiveState`; both must stay in sync to avoid the failed recording reappearing on a future load. Implementation introduces a `recordingsRef` so functional `setRecordings(prev => …)` callers resolve `prev` without nesting `setInteractiveState` inside a React state updater.
- The detection effect depends on a memoized `objectIdsKey` derived from `JSON.stringify(recordings.map(r => r.objectId).filter(Boolean))` so it does not re-fire every 500 ms while a recording is in progress (the live-duration setInterval mutates the in-progress entry's `duration` on every tick). `JSON.stringify` rather than `join(",")` is used because Firestore document IDs may legitimately contain commas.

## Out of Scope

- Increasing or working around the Firestore 1MB document limit (no compression, sampling, chunking, or splitting the data item into multiple sub-documents).
- Preemptive payload-size detection before calling `add()`.
- Changing other interactives' save flows (live-graph, labbook, etc.).
- Changing how the `live-graph` package reacts to missing recording data.
- Retrying the save automatically.
- Persisting unsaved tick data across page reloads.
- Modifying `@concord-consortium/object-storage` internals.
- Increasing the `maxRecordingTime` cap or adding warnings as the recording approaches a size that would fail.
- Retroactive cleanup or audit of historical `interactiveState.recordings[]` entries whose data was never saved. Such entries are visually marked at mount time but remain in saved state; researchers cross-referencing local state with Firestore should expect orphan entries.
- Teacher-side visibility into student save failures (Class Dashboard surfacing, real-time telemetry, etc.).
- Focus management for the shared Modal's existing `confirm` mode. The new `alert` mode adds focus management for QI-163; retrofitting the `confirm` mode is left to a follow-up ticket to avoid regressions in existing usages.
- Cancelling or cleaning up in-flight Firestore writes when the 30s save timeout fires. The Firebase JS SDK does not expose a cancellation handle for batched writes; a late-resolving write may leave a "ghost" record in Firestore with no corresponding `interactiveState.recordings[]` entry. The `log("save-recording-failed", { errorMessage: "save timed out after 30s" })` event is the forward marker.
- Reliable 30s save-timeout behavior when the activity is in a backgrounded browser tab. Browsers throttle/pause `setTimeout` in background tabs; the dominant scenario (foreground save) is unaffected.
- Cleanup of historical `interactiveState.recordings[]` entries that have `startedAt` set but no `objectId` (orphans left by silent failures BEFORE this fix shipped). With the saving-state visual indicator from Phase 2, those entries render as "saving..." indefinitely and are non-selectable via the UI. A per-mount sweep that filters such entries is deferred to a separate ticket. Note that `objectId`-bearing orphans (where `readMetadata` returns `undefined`) ARE handled by the broken-history detection in this fix.

## Not Yet Implemented

- **Package `version` bumps** (both `packages/helpers/package.json` and `packages/agent-simulation/package.json`) — The spec called for bumping `version` per project release conventions. Deferred per user direction: this repo's release process manages `version` bumps externally, so they're not bumped in feature PRs. Both packages remain at `1.24.0`.
- **Confirm-mode focus management on the shared Modal** — Tracked in the Out of Scope list; should be a follow-up ticket to extend the focus-trap / Escape / focus-restore behavior to `confirm` mode without regressing existing callers.
- **Cleanup of `startedAt`-without-`objectId` orphans** — Tracked in the Out of Scope list; affects users upgrading from a pre-fix version who had a silent failure. Such entries now render as "saving..." indefinitely. A per-mount sweep is deferred to a separate ticket.
- **Cleanup of late-resolving Firestore "ghost" records after 30s timeout** — Tracked in the Out of Scope list; the Firebase JS SDK exposes no cancellation handle, so a late-resolving write may leave an orphan record in Firestore. The `log("save-recording-failed", { errorMessage: "save timed out after 30s" })` event is the forward marker for researchers.
