# Agent Sim Recordings Fail Silently When Data Exceeds Firebase 1MB Document Limit (QI-163)

**Jira**: https://concord-consortium.atlassian.net/browse/QI-163
**Repo**: https://github.com/concord-consortium/question-interactives
**Implementation Spec**: [implementation.md](implementation.md)
**Status**: **In Development**

## Overview

In the `agent-simulation` interactive (the "MoDa" / Agent Sim used in classroom activities), long recordings can generate a tick-data document that exceeds Firebase Firestore's 1MB per-document limit. The save call currently fires-and-forgets with no `await` and no error handling, so the recording is added to the on-screen recording list and persisted to `interactiveState` even though nothing was written to Firestore. This spec defines the behavior changes that make save failures observable (awaited save with 30s timeout, blocking error modal, transient placeholder, structured telemetry, and a `recording-save-failed` PubSub event), plus a visible "saving" indicator during the in-flight save window and visual marking of pre-existing broken recordings detected on mount. The shared Modal component is extended with a focus-managed `alert` mode used by the new error modal.

**Scope note:** This spec surfaces failures, prevents phantom entries, and marks pre-existing broken recordings visually. It **does not preserve the lost recording** — when a save fails, the tick data is cleared and the student must re-run the model with a shorter recording. Preserving large recordings (via compression, sampling, chunking, etc.) is out of scope and would be tracked as a separate ticket.

## Project Owner Overview

When a student runs an Agent Sim model long enough to generate more than ~1MB of tick data, hitting "Stop" appears to succeed: a new thumbnail shows up in the recording strip, and the model behaves as if the recording is saved. In reality, the Firestore batch write fails atomically and nothing is persisted. The next time the activity loads — or when a linked Live Graph tries to read the recording — the recording is missing or broken, and the student has no idea why. Recordings that push the data limit silently disappear, which is confusing and erodes trust in classroom data collection. Save failures also occur today from transient causes (network, auth, permissions) with the same invisible result.

This fix makes the failure visible. The save call is awaited and raced against a 30-second timeout; either a rejection or a timeout opens a blocking error modal with the message "This recording was too large to save and could not be kept. Please record a shorter session and try again." The student dismisses the modal and the failed entry is gone — not in the strip, not in `interactiveState`. Researchers can reconcile via a new `save-recording-failed` log event that carries the error message and an approximate payload size. As a related improvement, recordings whose data is missing from Firestore (because of a past silent failure before this fix shipped) are detected at mount and visually marked with a warning treatment, so students and teachers can see and delete them rather than encountering surprise breakage. While a normal save is in progress, the in-progress entry now shows a "saving" overlay rather than appearing as a normal recording, eliminating a confusing intermediate state on slow saves. The shared Modal component is extended with an accessible `alert` mode (focus trap, Escape dismissal, focus restoration, `aria-labelledby`/`aria-describedby`) so the error dialog meets WCAG dialog patterns; the existing `confirm` mode used by other interactives is unchanged.

Teacher dashboards and live-data integrity tooling are out of scope; this is purely the student-facing fix for the silent-failure bug plus its accessibility and UX prerequisites.

## Background

### Where the bug lives

- Package: [packages/agent-simulation](../../packages/agent-simulation/)
- Main component: [agent-simulation.tsx](../../packages/agent-simulation/src/components/agent-simulation.tsx)
- Save site: [agent-simulation.tsx:409-479](../../packages/agent-simulation/src/components/agent-simulation.tsx#L409-L479) (the `save` async function inside `handlePlayPause`)
- Storage library: [`@concord-consortium/object-storage`](../../node_modules/@concord-consortium/object-storage/) version `1.0.0-pre.8`

### What the save flow does today

1. When the user stops a recording, `save()` is invoked.
2. A `StoredObject` is assembled with: a snapshot PNG (dataURL), a thumbnail PNG, a data table containing every tick of simulation state (`cols` + `rows`), and the model code text.
3. `objectStorage.add(storedObject)` is called **without `await` and without try/catch** ([agent-simulation.tsx:462](../../packages/agent-simulation/src/components/agent-simulation.tsx#L462)).
4. The local `recordings` state is updated optimistically with `objectId`, `startedAt`, `duration`, `thumbnail`, and `snapshot` ([agent-simulation.tsx:465-473](../../packages/agent-simulation/src/components/agent-simulation.tsx#L465-L473)), which also writes through to `interactiveState` via `setInteractiveState`.
5. `tickDataRef.current` is cleared.

### How `objectStorage.add` actually fails

The Firebase implementation ([firebase-object-storage.js:153-174](../../node_modules/@concord-consortium/object-storage/dist/firebase-object-storage.js#L153-L174)) writes the metadata document and each `data` item as separate Firestore documents — all inside a single `batch.commit()`. Firestore batched writes are atomic, so when any one document exceeds the 1MB per-document limit (almost always the `simulation-tick-data` data item for long recordings), the entire batch is rejected and **nothing** is persisted. The `add` promise rejects, but because the call site doesn't `await` or `.catch()` it, the rejection becomes an unhandled rejection and the UI proceeds as if save succeeded.

So the Jira description ("saves the metadata but fails saving the data") is approximately right from the user's perspective: the metadata appears in the recording list (because the local React `recordings` state is updated), even though nothing reached Firestore. There is no partial-write scenario at the Firestore layer — both pieces fail together — but the symptom is identical.

### What the recording list shows

[recording-strip.tsx:75-94](../../packages/agent-simulation/src/components/recording-strip.tsx#L75-L94) renders the saved recordings as a horizontal strip of thumbnail buttons driven from local `recordings` state. There is no visual indicator for save status; a failed save currently looks identical to a successful one.

### Existing error UI

An `error` state and inline error div already exist at [agent-simulation.tsx:78](../../packages/agent-simulation/src/components/agent-simulation.tsx#L78) and [agent-simulation.tsx:761](../../packages/agent-simulation/src/components/agent-simulation.tsx#L761) (`<div className={css.error}>{error}</div>`). It is currently used only for simulation setup errors. It is a candidate channel for surfacing the save error, but the placement and styling may need review.

### Downstream consumers

The `live-graph` package reads recordings via `readMetadata` / `readDataItem`. When a recording is selected, agent-sim publishes a `recording-selected` PubSub message with `status` of `"waiting"` / `"ready"` / `"failed"`. The `failed` status is currently only emitted when polling for an `objectId` times out at 10s ([agent-simulation.tsx:664-688](../../packages/agent-simulation/src/components/agent-simulation.tsx#L664-L688)). Because the silently-failed save still sets `objectId` in local state, that polling never trips for this bug.

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

- Implemented using the shared `Modal` component from [packages/helpers/src/components/modal.tsx](../../packages/helpers/src/components/modal.tsx) (variants `teal | orange`), extended with a new `mode` prop.
- The shared `Modal` gains an optional `mode?: "confirm" | "alert"` prop (default `"confirm"`, preserving all existing usages). In `alert` mode:
  - The Cancel button is not rendered.
  - The X close button in the title bar is not rendered.
  - Only the OK / confirm button is shown; it is the sole dismissal affordance.
- The QI-163 error modal renders in `alert` mode — error acknowledgment is single-button. This avoids misleading semantics where two buttons (Cancel + Confirm) both dismiss.
- **Focus management in `alert` mode**: when the modal opens, focus moves to the OK button. Tab and Shift+Tab cycle within the modal (focus trap). Escape dismisses the modal identically to clicking OK. On close, focus is restored to the element that had focus before the modal opened. If that element is no longer in the DOM, the currently-active element is blurred (focus released) — explicitly focusing `<body>` was considered and rejected because `body.focus()` is a no-op without a temporary `tabindex` mutation, which is a gross global DOM side-effect for a corner case that only fires when the previously-focused element has been removed. The common path of focusing `prev` is the load-bearing case; blur is an acceptable practical fallback. Focus management for the existing `confirm` mode is **out of scope for this ticket** and tracked as a follow-up (see [Out of Scope](#out-of-scope)).
- The modal blocks until acknowledged. It must not block further interaction with the simulation after dismissal (the student can start a new recording, edit code, etc.).
- Title, message copy, and visual variant are documented in [RESOLVED: Error modal copy and variant](#resolved-error-modal-copy-and-variant).
- Acknowledgment removes the failed recording placeholder from the strip and removes the failed entry from `recordings` / `interactiveState`.
- **Single-modal policy**: when the error modal is active, no other modal (e.g., the existing delete-recording confirm modal) may be visible. If a delete-confirm modal is open at the moment the save fails, it is dismissed before the error modal opens. This avoids two `aria-modal="true"` dialogs rendering simultaneously with competing focus traps, which would confuse both keyboard navigation and assistive tech. After acknowledging the error, the user can re-open delete-confirm if they still want to delete a recording — indices may have shifted because the failed in-progress entry was removed, so restarting the flow is also safer than trying to "resume" the prior delete intent.

### Saving-state visual indicator

- While `objectStorage.add()` is in flight (between Stop and save resolution), the recording strip renders the in-progress entry with a "saving" overlay: a dim/translucent overlay on the thumbnail and a small spinner.
- Detection signal: the entry's `objectId` is `undefined` AND the entry is not the currently-recording one. This window opens at recording-stop (when `save()` is invoked) and closes when `setRecordings(...)` either adds `objectId` (success path) or removes the entry (failure path). No additional state is required.
- On save success: `objectId` is set on the entry → the saving overlay clears automatically because the detection signal is false.
- On save failure: the entry is removed from `recordings` and the failed-save placeholder + modal appear (per [Behavior on save failure](#behavior-on-save-failure)). The saving overlay implicitly transitions to the failed placeholder; no special handoff state is needed.
- Accessibility: the saving-state entry is rendered as the same `<button>` as healthy entries (it's interactive — the user could attempt to select it, though playback is effectively a no-op until save resolves). Its `aria-label` reads `"Recording N - saving..."` while saving, replacing the normal label. The spinner SVG carries `aria-hidden="true"`.
- This is forward-compatible: if a future ticket adds compression/chunking that meaningfully extends save time, the saving state is already visible.

### Failed-recording placeholder in the strip

- While the error modal is visible, the recording strip shows a non-clickable placeholder tile in the position the failed recording would have occupied.
- The placeholder is rendered at the next index after all existing recordings, including any in `brokenObjectIds`. It never replaces or overlaps an existing entry. Broken-history entries and the failed-save placeholder use the same visual treatment but coexist as distinct strip positions.
- The placeholder must be visually distinguishable from successful thumbnails. Visual details are governed by [OPEN: Placeholder tile visual](#open-placeholder-tile-visual).
- Closing the modal removes the placeholder. After dismissal, the strip shows zero entries for the failed save.

### Logging / telemetry

- On save failure, both of the following are emitted:
  - `console.error("[agent-simulation] Recording save failed", { objectId, errorMessage, approximateSizeBytes })`.
  - A researcher-report `log` event named `save-recording-failed` with payload `{ errorMessage, approximateSizeBytes }`. Approximate payload size is computed from `JSON.stringify(storedObject.data).length` (or the tick-data item alone) and reported in bytes.
- `approximateSizeBytes` is a character count from `JSON.stringify`, not a strict byte count — it is intentionally approximate. Tests must assert it is a positive number, not an exact value.

### Recording-stopped PubSub and follow-up `recording-save-failed`

- The existing `recording-stopped` PubSub publish at [agent-simulation.tsx:404](../../packages/agent-simulation/src/components/agent-simulation.tsx#L404) is unchanged in timing and payload.
- On save failure, a new follow-up publish is emitted synchronously in the catch handler **before the error modal opens**: `{ topic: "recording-save-failed", objectId }`. The publish ordering is fixed so consumers can react to the state change without waiting on user acknowledgment of the modal.
- This spec does not update any consumer (e.g., `live-graph`) to react to the new topic. Forward-compatible publish only.

### Handling of pre-existing broken recordings

- **No data is ever removed from `recordings` or `interactiveState` by this fix.** Pre-existing broken entries are detected and visually marked, not deleted.
- On every mount, the runtime iterates `recordings` and calls `objectStorage.readMetadata(recording.objectId)` for each entry that has an `objectId`. The set of `objectId`s whose `readMetadata` returns `undefined` (the storage batch is atomic, so missing metadata implies the entire save failed) is held in a transient, UI-only React state — call it `brokenObjectIds`.
- If `readMetadata` itself throws (network error, auth error, etc.), the entry is treated as **unknown** and rendered normally — do not mark broken on transient failures. A future mount can re-evaluate.
- The recording strip renders entries whose `objectId` is in `brokenObjectIds` with the same "broken" visual used for the failed-save modal placeholder: snapshot (if available) as background + translucent darkening overlay + centered warning-triangle icon.
- The broken state is signaled by at least two distinct visual cues — the warning-triangle icon and the darkening overlay — so that color (e.g., the warning-colored selection ring) is never the sole signal. WCAG 1.4.1 (Use of Color) compliance.
- **No `aria-live` announcement of detected broken entries on mount.** AT users discover broken entries via the per-entry `aria-label` on focus. Rationale: broken-history is passive state, not a new event; a startup announcement would risk noise (most sessions have zero broken entries) and add `aria-live`-region management for marginal value. Implementation should include a brief code comment near the broken-set computation noting this deliberate choice, so future a11y reviewers don't re-litigate it.
- Broken-entry strip buttons and the failed-save placeholder both carry a stable `data-broken="true"` attribute. Tests assert on this attribute rather than on visual styling, keeping them robust to future CSS or icon changes.
- Broken-entry strip buttons (interactive — clickable to select for delete) have an `aria-label` of the form `"Recording 3 - data missing, cannot play, select to delete"`.
- Failed-save modal placeholders (non-interactive — the modal blocks all interaction, and the placeholder vanishes on dismiss) have a different `aria-label` that omits the action instruction: `"Recording 4 - failed to save"`. The placeholder is not a focusable interactive element.
- The warning-triangle SVG inside either state has `aria-hidden="true"` so its presence is not announced redundantly.
- No visible caption or tooltip is added — the visual treatment (warning triangle + dark overlay) is the sighted-user signal; the `aria-label` is the AT signal.
- Clicking a broken entry sets `currentRecordingIndex` (making the existing control-panel Delete action reachable), but suppresses the playback path: no `recording-selected` PubSub publish, no polling for `objectId`, no live-graph activation. The Play control is disabled while a broken entry is selected; Delete remains enabled.
- The strip's selected-state indicator on a broken entry is styled distinctly from the healthy-entry selected indicator (e.g., warning-colored ring) so it does not imply playback will work. Specific styling is an implementation detail.
- No user notification is shown when broken entries are detected — the visual mark is the notification.
- `interactiveState` and `recordings` are never mutated by this detection. The check re-runs on every mount, making the broken state self-healing if a recording later becomes readable.
- Existing delete-recording flow (control-panel button → confirm modal → filter `recordings` by index → write through to `interactiveState`) is reused without modification; it operates the same on broken entries as on healthy ones once the entry is selected.
- Starting a new recording (Play from the no-recording state) clears any broken-entry selection, identical to clearing a healthy-entry selection. Selection of a broken entry is purely for enabling the existing Delete control; it does not persist across recording-state transitions.

### Dependency bump

- `@concord-consortium/object-storage` is bumped from `1.0.0-pre.8` to `1.0.0-pre.9` in [packages/agent-simulation/package.json](../../packages/agent-simulation/package.json) as part of this fix. The pre.9 diff only changes Firebase Auth persistence behavior (`setPersistence(NONE)`, removes pre-sign-in `signOut`); it is unrelated to this bug but is taken opportunistically.

### Package version bump

- `packages/agent-simulation/package.json` `version` is bumped per project release conventions.
- `packages/helpers/package.json` (`question-interactives-helpers`) `version` is also bumped, because the shared Modal component is extended with the new `mode` prop. The agent-simulation `package.json` dependency on `@concord-consortium/question-interactives-helpers` is bumped accordingly.

### Tests

- Tests must cover the save-failure path end to end: modal rendering, placeholder lifecycle (visible while modal open, removed on dismiss), `log` event emission, `console.error` emission, `recording-save-failed` pubsub publish ordering (before modal opens), tick-data clear, and the invariant that no entry is added to `recordings` / `interactiveState` for a failed save.
- Tests must cover the 30s timeout path with the same assertions.
- Tests must cover broken-entry detection at mount: `readMetadata` returning `undefined` results in the entry being included in `brokenObjectIds`; `readMetadata` throwing results in the entry being rendered normally (treated as unknown).
- Tests must cover broken-entry click-to-select behavior: setting `currentRecordingIndex`, suppressing the `recording-selected` publish and polling, Play control disabled, Delete control enabled.
- The mechanism for injecting a rejecting / hanging `add()` is left to implementation. Acceptable approaches include a jest spy/mock that replaces `add()` for individual test cases, or extending the in-package `DemoObjectStorage` test wrapper with a failure-injection prop. The published `@concord-consortium/object-storage` package must not be modified.

## Technical Notes

- The atomic batch behavior at [firebase-object-storage.js:153-174](../../node_modules/@concord-consortium/object-storage/dist/firebase-object-storage.js#L153-L174) means there is no need to handle the "metadata saved but data missing" case — it cannot occur with the current storage implementation.
- The 1MB Firestore document limit is per document, not per batch. The tick data item is overwhelmingly the largest payload; metadata, snapshot, thumbnail, and code text are well under the limit for any plausible model.
- Snapshot PNGs are stored as base64 dataURLs and can grow large for big canvases, but in practice tick data is the dominant cause.
- The `error` state at [agent-simulation.tsx:78](../../packages/agent-simulation/src/components/agent-simulation.tsx#L78) renders inline at [agent-simulation.tsx:761](../../packages/agent-simulation/src/components/agent-simulation.tsx#L761). Reusing this surface is the lowest-cost option; whether to keep it or introduce a different surface (toast, modal, dedicated recording-strip badge) is an open question.
- Latest available `@concord-consortium/object-storage` is `1.0.0-pre.9`; current dependency is `1.0.0-pre.8`.
- `setRecordings` writes through to `interactiveState` via `setInteractiveState`; whichever revert/skip approach is chosen, both must stay in sync to avoid the failed recording reappearing on a future load.
- Tests live in [agent-simulation.test.tsx](../../packages/agent-simulation/src/components/agent-simulation.test.tsx). The `ObjectStorageProvider` test harness pattern there should be extended to cover a rejecting `add()`.

## Out of Scope

- Increasing or working around the Firestore 1MB document limit (no compression, sampling, chunking, or splitting the data item into multiple sub-documents).
- Preemptive payload-size detection before calling `add()`.
- Changing other interactives' save flows (live-graph, labbook, etc.).
- Changing how the `live-graph` package reacts to missing recording data.
- Retrying the save automatically.
- Persisting unsaved tick data across page reloads.
- Modifying `@concord-consortium/object-storage` internals (e.g., returning a structured error or per-item status).
- Increasing the `maxRecordingTime` cap or adding warnings as the recording approaches a size that would fail.
- Retroactive cleanup or audit of historical `interactiveState.recordings[]` entries whose data was never saved. Such entries are visually marked at mount time but remain in saved state; researchers cross-referencing local state with Firestore should expect orphan entries.
- Teacher-side visibility into student save failures (Class Dashboard surfacing, real-time telemetry, etc.). Structural to the activity-player architecture, not specific to this fix.
- Focus management for the shared Modal's existing `confirm` mode (used by delete-recording and other interactives). The new `alert` mode adds focus management for QI-163, but retrofitting the `confirm` mode is left to a follow-up ticket to avoid regressions in existing usages.
- Cancelling or cleaning up in-flight Firestore writes when the 30s save timeout fires. The Firebase JS SDK does not expose a cancellation handle for batched writes, so a late-resolving write may leave a "ghost" metadata + data record in Firestore with no corresponding `interactiveState.recordings[]` entry. Researchers querying Firestore directly should expect occasional orphan records traceable to timeout events; the `log("save-recording-failed", { errorMessage: "save timed out after 30s" })` event is the forward marker. Local UI integrity beats Firestore integrity for this fix — the student must never see a wedged save spinner.
- Reliable 30s save-timeout behavior when the activity is in a backgrounded browser tab. Browsers throttle or pause `setTimeout` in background tabs, so the timeout may fire significantly later than 30s if the student switches tabs mid-save. The dominant scenario is foreground save (student stops recording and waits for the response), which is unaffected. Defeating browser throttling would require service-worker plumbing well beyond this fix.

## Open Questions

### RESOLVED: Error message copy and placement
**Decision**: C — show a blocking modal using the existing shared `Modal` component. Exact copy and variant remain open in [OPEN: Error modal copy and variant](#open-error-modal-copy-and-variant).

### RESOLVED: Failed-recording placeholder
**Decision**: Hybrid — show a non-clickable placeholder tile in the recording strip while the error modal is visible; remove the placeholder when the modal is dismissed. Visual details remain open in [OPEN: Placeholder tile visual](#open-placeholder-tile-visual).

### RESOLVED: Tick data on failure
**Decision**: A — always clear `tickDataRef.current` on failure, same as the success path. Student must re-run the model to retry.

### RESOLVED: Save failure log event
**Decision**: A — emit both `log("save-recording-failed", { errorMessage, approximateSizeBytes })` AND `console.error` with the same payload.

### RESOLVED: object-storage version bump
**Decision**: B — bump to `1.0.0-pre.9`. The diff (vs. pre.8) only changes Firebase Auth persistence behavior (sets `app.auth().setPersistence(Persistence.NONE)`, removes the `signOut()` call before `signInWithCustomToken`). Unrelated to this bug but taken opportunistically.

### RESOLVED: Recording-stopped PubSub on failure
**Decision**: C — keep emitting `recording-stopped` immediately (unchanged), and emit a new follow-up `recording-save-failed` publish after the failure is observed. No consumer changes in scope. Payload shape remains open in [OPEN: recording-save-failed payload](#open-recording-save-failed-payload).

### RESOLVED: Pre-existing failed recordings in interactiveState
**Decision**: Originally B (mount-time cleanup that removes broken entries). **Revised** to a no-data-loss approach: detect broken entries on every mount via `readMetadata` and render them visually as broken (same overlay used for the failed-save placeholder), but never remove them from `recordings` / `interactiveState`. Broken entries are not selectable for playback. The detection re-runs on every mount, so the state is self-healing. See [Handling of pre-existing broken recordings](#handling-of-pre-existing-broken-recordings) for full details. A sub-question on whether and how broken entries can be deleted remains open in [OPEN: Broken-entry delete affordance](#open-broken-entry-delete-affordance).

---

### RESOLVED: Error modal copy and variant
**Decision**: variant `orange`, title `"Recording Save Failed"`, message `"This recording was too large to save and could not be kept. Please record a shorter session and try again."`, confirmLabel `"OK"`. Orange is reused (consistent with the existing destructive-confirm visual treatment) rather than introducing a new variant. Message is direct about data loss (responding to Education Researcher review) and drops the "may have" hedge (responding to Student review). Accepted trade-off: wording is slightly misleading for non-size failures (network/auth), but size is the dominant cause for this bug and the underlying error message is captured in the `log` event and `console.error` for researchers.

### RESOLVED: Placeholder tile visual
**Decision**: B (modified) — empty box at thumbnail dimensions. If a `snapshot` dataURL was captured before save failed, use it as the background with a translucent darkening overlay; if not, use a solid muted background. Either way, overlay a centered warning-triangle icon so "this isn't a normal recording" reads at a glance. Not focusable, not clickable, no tooltip. The placeholder is short-lived (removed when the error modal is dismissed), so no hover affordances or accessibility for interaction are needed.

### RESOLVED: recording-save-failed payload
**Decision**: B — `{ topic: "recording-save-failed", objectId }`. Matches the correlation pattern already used by `recording-selected` (which carries `objectId` alongside `status`). `errorMessage` is intentionally excluded from the PubSub payload — it lives only in the `log` event and `console.error`, which are the right channels for diagnostic detail.

### RESOLVED: Cleanup timing and edge cases
**Decision**: Superseded by the no-data-loss revision. The cleanup never removes anything, so most of the original edge cases dissolve:
- **Timing**: detection runs on every mount (safe because it doesn't mutate state).
- **Race with fresh saves**: not a concern — we don't remove on failure, we just visually mark, and the broken state re-evaluates on subsequent mounts.
- **`readMetadata` itself throwing**: render the entry normally (treat as unknown). Do not mark broken on transient failures.
- **User notification**: none — the broken visual is the notification.

See [Handling of pre-existing broken recordings](#handling-of-pre-existing-broken-recordings) for the implemented behavior.

## Self-Review

### Senior Engineer

#### RESOLVED: Hanging `add()` promise has no timeout
**Resolution**: Added 30-second `Promise.race` timeout in the Requirements section under "Behavior on save failure". On timeout, the call is treated identically to a rejection (same modal, placeholder, log event, pubsub publish, tick-data clear), with `errorMessage` recorded as `"save timed out after 30s"`.

#### RESOLVED: When exactly is `recording-save-failed` published?
**Resolution**: Spec updated to specify the publish happens synchronously in the catch handler, before the modal opens. Payload also folded in (`{ topic: "recording-save-failed", objectId }`).

#### RESOLVED: Co-occurrence of a new failure with existing broken entries
**Resolution**: Added explicit clarification to the "Failed-recording placeholder in the strip" Requirements bullets — broken-history entries and the failed-save placeholder coexist as distinct strip positions; the placeholder is rendered at the next index after all existing recordings (including broken ones) and never replaces or overlaps an existing entry.

#### RESOLVED: Selected broken entry + starting a new recording
**Resolution**: Added an explicit Requirements bullet under "Handling of pre-existing broken recordings" — starting a new recording clears any broken-entry selection identical to clearing a healthy-entry selection; broken-entry selection does not persist across recording-state transitions.

---

### QA Engineer

#### RESOLVED: Test harness for a rejecting `objectStorage.add()`
**Resolution**: Added a new "Tests" subsection in Requirements specifying end-to-end coverage of the save-failure, timeout, broken-entry detection, and broken-entry click-to-select paths. Implementation mechanism (jest mock vs. extending `DemoObjectStorage`) is deferred; the published `@concord-consortium/object-storage` package must not be modified.

#### RESOLVED: `approximateSizeBytes` semantics
**Resolution**: Added a clarifying bullet in the Logging/telemetry section — the field is intentionally approximate (character count, not strict bytes); tests assert positive number, not exact value.

#### RESOLVED: Observable hook for the broken set
**Resolution**: Required a stable `data-broken="true"` attribute on broken-entry strip buttons and the failed-save placeholder. Tests assert on this attribute rather than visual styling.

---

### Product Manager

#### RESOLVED: Strict "do not show failed recording metadata in the list" — placeholder fidelity to ticket intent
**Resolution**: Placeholder design kept as-is in Requirements (end state matches ticket; transient placeholder is a UX improvement for visual continuity). **Deferred to External Review (Phase 4)** for stakeholder confirmation with Leslie — the transient placeholder is an addition the ticket does not explicitly authorize and should be acknowledged before merging.

#### RESOLVED: Data loss is not mitigated
**Resolution**: Added a "Scope note" paragraph to the Overview making the data-loss limitation explicit. **Deferred to External Review (Phase 4)** for stakeholder confirmation that visibility-only (no preservation) is acceptable, and to recommend a separate follow-up ticket for compression/chunking work.

#### RESOLVED: No monitoring of save-failure rate
**Resolution**: Out of scope. The `log("save-recording-failed", { errorMessage, approximateSizeBytes })` event already provides the raw signal a future dashboard would consume. Building dashboards or alerting is a different kind of work tracked separately if/when needed.

---

### Education Researcher

#### RESOLVED: Modal copy could mislead students into thinking data is recoverable
**Resolution**: Updated modal message from "This recording could not be saved. It may have too much data — try recording for a shorter time." to "This recording was too large to save and could not be kept. Please record a shorter session and try again." Direct about data loss; drops the "may have" hedge. Also resolves the Student-role finding on the same hedge.

#### RESOLVED: Historical research data integrity
**Resolution**: Acknowledged as a known limitation. This fix only addresses go-forward integrity. Added an Out of Scope entry noting that historical `interactiveState.recordings[]` entries whose data was never saved are visually marked at mount but remain in saved state, and researchers cross-referencing local state with Firestore should expect orphan entries. **Deferred to External Review (Phase 4)** for stakeholder confirmation that this limitation is acceptable.

---

### Student

#### RESOLVED: Warning-triangle icon needs an accessible label and possibly a visible tooltip
**Resolution**: Required an `aria-label` on broken-entry strip buttons (and the failed-save placeholder) describing the state, e.g., `"Recording 3 - data missing, cannot play, select to delete"`. Warning-triangle SVG carries `aria-hidden="true"`. Declined the visible caption — strip space is tight, visual treatment is already strong, and the `aria-label` covers AT users. Overlaps with WCAG #3 (`aria-disabled` semantics conflict); resolution there will fold this in.

#### RESOLVED: "May have too much data" hedge
**Resolution**: Bundled with the Education Researcher data-loss finding. Modal message is now "This recording was too large to save and could not be kept. Please record a shorter session and try again." — no "may" hedge, direct about data loss, concrete action.

---

### Teacher

#### RESOLVED: Teacher has no visibility into student save failures
**Resolution**: Out of scope. Structural to the activity-player architecture, not specific to this fix. Added an Out of Scope entry naming "teacher-side visibility" so future readers don't ask the question. The `log("save-recording-failed", ...)` event is accessible via researcher reports today; future teacher-dashboard work could surface it if desired.

---

### WCAG Accessibility Expert

#### RESOLVED: Shared `Modal` always renders a "Cancel" button
**Resolution**: Extend the shared Modal with a new optional `mode?: "confirm" | "alert"` prop (default `"confirm"` preserves existing behavior). In `alert` mode, the Cancel button and the X close button are not rendered; OK is the sole dismissal. The QI-163 error modal uses `alert` mode. The `question-interactives-helpers` package version is bumped accordingly. Added to Requirements under "Error modal" and "Package version bump".

#### RESOLVED: Shared `Modal` has no focus trap, no initial-focus, no Escape handler
**Resolution**: Split the work. For QI-163, the new `alert` mode of the shared Modal gains all four focus-management behaviors (initial focus on OK, focus trap, Escape dismisses, focus restoration on close). Specified in the Error modal Requirements. Focus management for the existing `confirm` mode (used by other interactives) is **out of scope** for this ticket — added to Out of Scope and should be tracked as a follow-up ticket to avoid regressing existing usages.

#### RESOLVED: Broken-entry `aria-disabled` semantics conflict with the click-to-select-for-delete behavior
**Resolution**: Confirmed the Requirements text is already consistent — `aria-disabled="true"` and `cursor: not-allowed` were removed when the spec was revised for option B (clicking a broken entry selects it for delete). Broken-entry strip buttons remain fully keyboard-interactive; the `aria-label` ("Recording N - data missing, cannot play, select to delete") communicates the broken state to AT users; the warning-triangle SVG has `aria-hidden="true"`. No further Requirements changes needed.

#### RESOLVED: Color-only signal risk for broken state
**Resolution**: Added an explicit Requirements bullet under "Handling of pre-existing broken recordings" stating that at least two distinct visual cues (warning-triangle icon + darkening overlay) signal the broken state, so color is never the sole signal. Locks in WCAG 1.4.1 compliance against future CSS-only changes.

#### RESOLVED: `aria-live` announcement of newly-detected broken entries on mount
**Resolution**: Deliberately skipped. Broken-history is passive state, not a notification-worthy event; an `aria-live` startup announcement would risk noise for the common case of zero broken entries and add `aria-live`-region management for marginal AT value. AT users discover broken entries via the per-entry `aria-label` on focus. Added a Requirements bullet explicitly recording this choice (and instructing implementation to leave a brief code comment) so future a11y reviewers don't re-litigate.

---

### Round 2 — issues introduced by round-1 resolutions

#### RESOLVED: 30s timeout can leave ghost Firestore records
**Issue**: When the 30s timeout fires we abandon the `add()` promise and clear local state, but the underlying Firestore batch write may still eventually succeed server-side (the SDK retries internally beyond our timeout). The Firebase JS SDK exposes no cancellation handle for `batch.commit()`. Result: a metadata + data record can land in Firestore with no `interactiveState.recordings[]` reference, becoming an orphan visible only to direct Firestore queries.
**Resolution**: Accepted as a known limitation. Added an Out of Scope entry making the trade-off explicit: local UI integrity beats Firestore integrity for this fix; the `log("save-recording-failed", { errorMessage: "save timed out after 30s" })` event is the forward marker for researchers reconciling orphans. Defensive cleanup (best-effort post-timeout delete) was considered and rejected as fragile (races the original write, no guarantee).

#### RESOLVED: `aria-label` content differs for placeholder vs broken-history entry
**Issue**: The originally-approved `aria-label` ("Recording N - data missing, cannot play, select to delete") describes interactive broken-history entries correctly but is misleading for the non-interactive failed-save placeholder (modal blocks interaction; placeholder vanishes on dismiss; "select to delete" is false in that context).
**Resolution**: Differentiated the two labels. Broken-history entries keep the action-instruction label. Failed-save placeholders use `"Recording N - failed to save"` (state only, no instruction). The placeholder is also not a focusable interactive element. Both states still carry `data-broken="true"` and the same visual treatment.

---

### RESOLVED: Broken-entry delete affordance
**Decision**: B — clicking a broken entry sets `currentRecordingIndex` (so the existing control-panel delete action becomes reachable), but suppresses the playback path entirely: no `recording-selected` PubSub publish, no polling, no live-graph wakeup. The Play control is disabled while a broken entry is selected; Delete is enabled. The strip's selected-indicator for a broken entry should be styled distinctly (e.g., warning-colored ring rather than the normal selected ring) so it doesn't suggest playback will work — visual specifics are an implementation detail. Reuses the existing delete-confirm modal flow with no new affordances.
