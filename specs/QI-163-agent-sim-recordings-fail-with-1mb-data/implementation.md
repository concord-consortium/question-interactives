# Implementation Plan: Agent Sim Recordings Fail Silently When Data Exceeds Firebase 1MB Document Limit (QI-163)

**Jira**: https://concord-consortium.atlassian.net/browse/QI-163
**Requirements Spec**: [requirements.md](requirements.md)
**Status**: **In Development**

## Implementation Plan

### Extend shared Modal with `alert` mode and focus management

**Summary**: Add a new optional `mode?: "confirm" | "alert"` prop to the shared `Modal` component. In `alert` mode, the Cancel button and the X close button are not rendered (the OK / confirm button is the sole dismissal affordance) and full focus management is added: initial focus on the confirm button, focus trap, Escape dismisses, focus is restored to the previously-focused element on close. The existing `confirm`-mode behavior is unchanged. Bump the `question-interactives-helpers` package version. This is a self-contained, independently reviewable change.

**Files affected**:
- `packages/helpers/src/components/modal.tsx` — add `mode` prop, conditional rendering, focus-management refs/effects.
- `packages/helpers/src/components/modal.test.tsx` — new file (or extend if it exists) with tests for both modes and focus management in `alert` mode.
- `packages/helpers/package.json` — bump `version`.

**Estimated diff size**: ~200 lines.

**Implementation details:**

`packages/helpers/src/components/modal.tsx` — full revised file:

```tsx
// NOTE: This project is on React 17, which doesn't have useId. The implementation
// substitutes `useMemo(() => `modal-title-${uuid()}`, [])` (uuid is already a direct
// dep of @concord-consortium/question-interactives-helpers via its s3-upload utility).
// Per-instance uniqueness is preserved; the rest of this sketch is unchanged.
import React, { ReactNode, useCallback, useEffect, useMemo, useRef } from "react";
import classnames from "classnames";
import { v4 as uuid } from "uuid";

import CloseIcon from "../assets/close-icon.svg";

import css from "./modal.scss";

interface Props {
  variant: "teal" | "orange";
  title: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  message: string | ReactNode;
  confirmLabel: string;
  onConfirm: (
    e: React.FormEvent<HTMLFormElement>
       | React.MouseEvent<HTMLButtonElement>
       | React.KeyboardEvent<HTMLDivElement>
  ) => void;
  onCancel: () => void;
  // Optional mode. Defaults to "confirm" (existing behavior). In "alert" mode the Cancel
  // button and X close button are hidden, and full focus management is applied: initial
  // focus on the confirm button, focus trap, Escape dismisses, focus is restored on close.
  mode?: "confirm" | "alert";
}

export const Modal = ({
  variant, title, Icon, message, confirmLabel, onConfirm, onCancel, mode = "confirm"
}: Props) => {
  const isAlert = mode === "alert";
  // Unique per-instance ids so aria-labelledby / aria-describedby never collide when
  // two modals coexist (e.g., the QI-163 error modal and the existing delete-confirm
  // modal). aria-describedby points at the message body so screen readers announce
  // both the title and the explanatory text when the dialog opens (ARIA APG).
  const titleId = useMemo(() => `modal-title-${uuid()}`, []);
  const messageId = useMemo(() => `modal-message-${uuid()}`, []);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<Element | null>(null);

  // Initial focus + focus restore (alert mode only).
  useEffect(() => {
    if (!isAlert) return;
    previouslyFocusedRef.current = document.activeElement;
    confirmButtonRef.current?.focus();
    return () => {
      const prev = previouslyFocusedRef.current as HTMLElement | null;
      if (prev && document.contains(prev) && typeof prev.focus === "function") {
        prev.focus();
      } else {
        // Previous focus target is gone; blur any active element so focus isn't
        // stranded inside the unmounting modal subtree. Without tabindex, calling
        // body.focus() is a no-op, so the load-bearing line here is the blur.
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
    };
  }, [isAlert]);

  // Escape dismisses + focus trap (alert mode only).
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isAlert) return;
    if (e.key === "Escape") {
      e.preventDefault();
      // Route Escape to onConfirm (not onCancel) in alert mode so it dismisses
      // identically to clicking OK by construction. Otherwise a caller passing
      // different handlers for onConfirm vs onCancel could silently violate the
      // requirement that Escape and OK behave identically. The onConfirm prop
      // signature includes React.KeyboardEvent<HTMLDivElement> in its union to
      // accept this path without a cast.
      onConfirm(e);
      return;
    }
    if (e.key === "Tab" && overlayRef.current) {
      const focusables = overlayRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      if (focusables.length === 1) {
        // Single focusable (alert mode's OK button): prevent Tab from moving
        // focus out of the modal. Removes order-dependence of the first/last
        // branches below.
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [isAlert, onConfirm]);

  return (
    <div
      ref={overlayRef}
      className={css.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onKeyDown={handleKeyDown}
    >
      <div className={css.modalContent}>
        <div className={classnames(css.titleBar, css[variant])}>
          <Icon className={css.titleIcon} />
          <div id={titleId} className={css.modalTitle}>{title}</div>
          {!isAlert && (
            <button onClick={onCancel} className={classnames(css.closeButton, css[variant])} aria-label="Close">
              <CloseIcon />
            </button>
          )}
        </div>
        <div className={css.modalBody}>
          {/* OK button is intentionally rendered outside <form> so pressing Enter
              on it doesn't double-fire onConfirm (button click + form submit).
              Keep it outside if you ever refactor this layout. */}
          <form onSubmit={onConfirm}>
            <div id={messageId} className={css.modalMessage}>{message}</div>
          </form>
          <div className={css.modalActions}>
            {!isAlert && (
              <button onClick={onCancel} className={classnames(css[variant])}>
                Cancel
              </button>
            )}
            <button
              ref={confirmButtonRef}
              onClick={onConfirm}
              className={classnames(css.modalConfirmButton, css[variant])}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

`packages/helpers/src/components/modal.test.tsx` — tests (summarized):

- `confirm` mode (default): renders both Cancel and X buttons; Tab cycles naturally; no initial-focus management.
- `alert` mode — Cancel/X hidden: assert no Cancel button and no X close button are rendered.
- `alert` mode — initial focus: render in alert mode; assert the OK button has focus on mount.
- `alert` mode — Escape dismissal: render in alert mode; press Escape; assert `onConfirm` was called (Escape routes through `onConfirm` to guarantee identical behavior to OK click). Assert `onCancel` was NOT called.
- `alert` mode — OK-click dismissal: render in alert mode; click OK; assert `onConfirm` was called.
- `alert` mode — focus restore on dismiss: render alert mode from a parent button with focus; dismiss via Escape (and separately via OK click); assert focus returns to the original parent button in both cases.
- `alert` mode — focus trap: render in alert mode; press Tab and Shift+Tab on the OK button; assert focus stays on OK (single-focusable trap).
- Both modes: `role="dialog"`, `aria-modal="true"`, `aria-labelledby={titleId}`, `aria-describedby={messageId}` present and pointing at the title and message elements respectively; `onConfirm` fires on OK click.
- Test environment for focus assertions: use `@testing-library/user-event`'s `userEvent.tab()` / `userEvent.keyboard("{Escape}")` rather than firing raw `keydown` events. JSDOM does not simulate native focus traversal on key events; only explicit `.focus()` calls update `document.activeElement`, so Tab tests that fire `keydown` will silently no-op.

`packages/helpers/package.json` — bump `version` (per project release conventions).

---

### agent-simulation: save-failure path (await + 30s timeout + error modal + transient placeholder + telemetry)

**Summary**: Replace the fire-and-forget `objectStorage.add(storedObject);` at [agent-simulation.tsx:462](../../packages/agent-simulation/src/components/agent-simulation.tsx#L462) with an `await` wrapped in try/catch and raced against a 30-second timeout. On any rejection (1MB limit, network, auth, timeout): emit `log("save-recording-failed", { errorMessage, approximateSizeBytes })`; emit `console.error` with the same payload; publish `{ topic: "recording-save-failed", objectId }` synchronously before the modal opens; show an `alert`-mode modal with the agreed copy; render a transient placeholder in the recording strip during the modal; clear `tickDataRef.current`; do not add anything to `recordings` / `interactiveState`; on modal acknowledge, remove the placeholder. Bump `@concord-consortium/object-storage` to `1.0.0-pre.9` and the `@concord-consortium/question-interactives-helpers` dep to the version from the previous step; bump agent-simulation's own version.

**Files affected**:
- `packages/agent-simulation/src/components/agent-simulation.tsx` — modify `save()` flow inside `handlePlayPause`, add save-failure state, render error modal (dismissing any open delete-recording confirm modal first, per single-modal policy), wire placeholder prop to `RecordingStrip`.
- `packages/agent-simulation/src/components/recording-strip.tsx` — accept optional `failedSavePlaceholder` prop and render it after the recordings list (before the "New" button).
- `packages/agent-simulation/src/components/recording-strip.scss` — add classes for `data-broken="true"` rendering (overlay, warning-triangle layout). Reusable for Step 3.
- `packages/agent-simulation/src/assets/warning-triangle-icon.svg` — new asset (or import an existing concord-consortium asset if one is conventional).
- `packages/agent-simulation/src/assets/spinner-icon.svg` — new asset for the saving-state spinner (or import an existing concord-consortium asset if one is conventional).
- `packages/agent-simulation/src/components/agent-simulation.test.tsx` — add tests for the rejection path, the 30s timeout path, the modal lifecycle, the placeholder lifecycle, and the absence of any new `recordings` entry on failure.
- `packages/agent-simulation/package.json` — bump `version`, bump `@concord-consortium/object-storage` to `1.0.0-pre.9`, bump `@concord-consortium/question-interactives-helpers` dep to the new version.

**Estimated diff size**: ~525 lines (including tests).

**Implementation details:**

State additions in `agent-simulation.tsx` (near the existing `useState` calls around line 78):

```tsx
// Save-failure UI state. failedSaveInfo is set on save failure and cleared when the user
// acknowledges the error modal. When non-null, the error modal is shown and a transient
// placeholder is rendered in the strip.
interface FailedSaveInfo {
  approximateSizeBytes: number;
  placeholderIndex: number;
  placeholderSnapshot?: string;
}
const [failedSaveInfo, setFailedSaveInfo] = useState<FailedSaveInfo | null>(null);
```

Replace the existing `save = async () => { … objectStorage.add(storedObject); … }` body (currently [agent-simulation.tsx:409-479](../../packages/agent-simulation/src/components/agent-simulation.tsx#L409-L479)) with awaited, error-handled flow.

**Important pre-condition:** When recording starts, `handleNewRecording` appends an empty entry to `recordings` ([agent-simulation.tsx:619-621](../../packages/agent-simulation/src/components/agent-simulation.tsx#L619-L621)), and the recording-started branch overwrites it with `{ modelName, startedAt, globalValues }` and commits to `interactiveState` via `setRecordings(pausedRecordings)` ([agent-simulation.tsx:377](../../packages/agent-simulation/src/components/agent-simulation.tsx#L377), [agent-simulation.tsx:395](../../packages/agent-simulation/src/components/agent-simulation.tsx#L395)). At the point `save()` runs, `recordings[currentRecordingIndex]` already exists. On save failure we must **actively remove** that in-progress entry to satisfy the Requirements end state ("no entry for the failed recording in the recording list, no entry in `interactiveState`, no partial state anywhere"). New recordings are always appended, so `currentRecordingIndex === recordings.length - 1 === notPausedRecordings.length - 1` at this point; after removal, the freed slot at index `currentRecordingIndex` is where the transient placeholder is rendered.

The existing inline `error` div at [agent-simulation.tsx:761](../../packages/agent-simulation/src/components/agent-simulation.tsx#L761) is **unchanged** by this step — it continues to serve simulation-setup errors. Save failures surface through the new modal, not the inline `error` state.

The new `recording-save-failed` publish uses the same `recordingChannelRef.current?.publish({...})` pattern as the existing `recording-stopped` publish at [agent-simulation.tsx:404](../../packages/agent-simulation/src/components/agent-simulation.tsx#L404), so no new channel wiring is needed.

Diff sketch:

```tsx
// Before:
//   objectStorage.add(storedObject);
//   notPausedRecordings[currentRecordingIndex] = { …optimistic update… };
//   setRecordings(notPausedRecordings);
//   tickDataRef.current = [];

// After:
const SAVE_TIMEOUT_MS = 30_000;

// Capture the recording index at the start of save() so both branches operate
// on the same slot even if state changes during the await.
const savingIndex = currentRecordingIndex;

const addPromise = objectStorage.add(storedObject);
// Absorb any late rejection on the timeout path. If the timeout fires, the underlying
// add() promise is still pending; if it eventually rejects (e.g., Firestore returns
// "doc too big" after our timer fired), this prevents an unhandled-rejection warning.
// The forward marker for researchers is the log("save-recording-failed", { errorMessage:
// "save timed out after 30s" }) event already emitted in the catch handler below.
addPromise.catch(() => {});

let timeoutId: ReturnType<typeof setTimeout> | undefined;
try {
  await Promise.race([
    addPromise,
    new Promise((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error("save timed out after 30s")),
        SAVE_TIMEOUT_MS
      );
    }),
  ]);
  // Success path — functional setState avoids any stale-closure risk from the
  // pre-await `notPausedRecordings` snapshot.
  setRecordings(prev => {
    const next = [...prev];
    next[savingIndex] = {
      ...next[savingIndex],
      objectId: storedObject.id,
      startedAt,
      duration,
      thumbnail,
      snapshot,
    };
    return next;
  });
} catch (err) {
  // Computed inside the catch (only on failure) so the success path doesn't
  // pay for a ~1MB stringify of the tick data we already sent to Firestore.
  const approximateSizeBytes = JSON.stringify(storedObject.data).length;
  const errorMessage = err instanceof Error ? err.message : String(err);
  // Synchronous publish BEFORE the modal opens, per spec.
  recordingChannelRef.current?.publish({
    topic: "recording-save-failed",
    objectId: storedObject.id,
  });
  // Telemetry.
  console.error("[agent-simulation] Recording save failed", {
    objectId: storedObject.id,
    errorMessage,
    approximateSizeBytes,
  });
  log("save-recording-failed", { errorMessage, approximateSizeBytes });
  // Actively remove the in-progress entry that was committed to recordings/
  // interactiveState when recording started. Without this, a partial entry
  // (modelName/startedAt/globalValues, no objectId) would persist.
  // Functional setState avoids stale-closure risk during the await window.
  setRecordings(prev => prev.filter((_, i) => i !== savingIndex));
  setCurrentRecordingIndex(-1);
  // Single-modal policy: dismiss any open delete-confirm before opening the
  // error modal so we don't render two aria-modal="true" dialogs at once with
  // competing focus traps. The user can re-open delete-confirm afterward;
  // indices may have shifted because we just removed the in-progress entry.
  setShowDeleteRecordingConfirm(false);
  // Surface to the user. Placeholder occupies the slot just freed by removal,
  // which is the position the recording would have had on success.
  setFailedSaveInfo({
    approximateSizeBytes,
    placeholderIndex: savingIndex,
    placeholderSnapshot: snapshot,
  });
} finally {
  // Clear the 30s timer if add() resolved or rejected before it fired. Without
  // this, the reject callback runs 30s later into a settled promise (no observable
  // effect, but holds a closure for 30s).
  if (timeoutId !== undefined) clearTimeout(timeoutId);
}
// Tick data is cleared in both paths.
tickDataRef.current = [];
```

At the `save()` call site ([agent-simulation.tsx:479](../../packages/agent-simulation/src/components/agent-simulation.tsx#L479)), add a comment so a future maintainer doesn't re-introduce the bug by adding code that expects the save to be persisted before continuing:

```tsx
// save() handles its own errors internally via try/catch + modal.
// Intentionally not awaited so handlePlayPause stays synchronous.
save();
```

**Note on late-resolving timeouts**: If the 30s timeout fires but `add()` eventually resolves server-side, a "ghost" record may persist in Firestore with no corresponding `interactiveState.recordings[]` entry. This is explicitly accepted in [requirements.md](requirements.md) under Out of Scope — local UI integrity beats Firestore integrity for this fix; the `log("save-recording-failed", { errorMessage: "save timed out after 30s" })` event is the forward marker for researchers reconciling orphan records. Defensive cleanup was considered and rejected as fragile (the Firebase JS SDK exposes no cancellation handle for batched writes, so a post-timeout delete would race the original write with no atomic guarantee).

Render the error modal next to the existing delete-recording modal (around [agent-simulation.tsx:807-817](../../packages/agent-simulation/src/components/agent-simulation.tsx#L807-L817)):

```tsx
{failedSaveInfo && (
  <Modal
    mode="alert"
    variant="orange"
    title="Recording Save Failed"
    Icon={WarningTriangleIcon}
    message="This recording was too large to save and could not be kept. Please record a shorter session and try again."
    confirmLabel="OK"
    onConfirm={() => setFailedSaveInfo(null)}
    onCancel={() => setFailedSaveInfo(null)}
  />
)}
```

Pass the placeholder to `RecordingStrip`:

```tsx
<RecordingStrip
  isRecording={isRecording}
  onNewRecording={handleNewRecording}
  onSelectRecording={handleSelectRecording}
  recordings={recordings}
  currentRecordingIndex={currentRecordingIndex}
  failedSavePlaceholder={failedSaveInfo ? {
    index: failedSaveInfo.placeholderIndex,
    snapshot: failedSaveInfo.placeholderSnapshot,
  } : undefined}
/>
```

`recording-strip.tsx` — extend `Props` and render the placeholder after the recordings array:

```tsx
interface Props {
  isRecording: boolean;
  onNewRecording: () => void;
  onSelectRecording: (index: number) => void;
  recordings: IRecordings;
  currentRecordingIndex: number;
  failedSavePlaceholder?: { index: number; snapshot?: string };
}
```

Augment the existing `recordings.map(...)` rendering to apply a saving-state overlay when an entry has no `objectId` and isn't the currently-recording one. This is the in-flight save window between Stop and save resolution. The detection signal needs no new state — `objectId === undefined` on a non-recording entry is the entire signal, and it self-clears when either the success path adds `objectId` or the failure path removes the entry.

```tsx
{recordings.map((recording, index) => {
  const isSaving =
    recording.objectId === undefined &&
    !(isRecording && index === currentRecordingIndex);
  const style: CSSProperties = recording.thumbnail ? {
    backgroundImage: `url(${recording.thumbnail})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  } : {};
  return (
    <button
      key={index}
      className={classNames(css.recordingButton, {
        [css.currentRecordingButton]: index === currentRecordingIndex,
        [css.savingRecording]: isSaving,
      })}
      onClick={() => onSelectRecording(index)}
      // Saving-state entries are non-selectable: clicking would call
      // handleSelectRecording with objectId === undefined, which would publish
      // recording-selected and start polling, confusing live-graph during the
      // in-flight save window. Step 3 adds a defensive guard in
      // handleSelectRecording itself; this disabled prop is the UI half of
      // the defense-in-depth pair.
      disabled={isSaving || (isRecording && index !== currentRecordingIndex)}
      style={style}
      data-saving={isSaving || undefined}
      aria-label={isSaving ? `Recording ${index + 1} - saving...` : undefined}
    >
      {isSaving && <span className={css.savingOverlay} aria-hidden="true" />}
      {isSaving && <SpinnerIcon className={css.savingSpinner} aria-hidden="true" />}
      <span className={classNames(css.recordingIndex, { [css.currentRecording]: index === currentRecordingIndex })}>
        {index + 1}
      </span>
    </button>
  );
})}
```

Then the failed-save placeholder (unchanged from earlier in this step):

```tsx
{failedSavePlaceholder && (
  // role="img" so screen readers honor aria-label on this otherwise-roleless,
  // non-focusable div. The placeholder is a visual symbol (warning triangle +
  // overlay) representing the failed recording — role="img" matches that intent
  // exactly and is the standard ARIA pattern. The interactive broken-history
  // entries in Step 3 use <button>, so they don't need this.
  <div
    className={classNames(css.recordingButton, css.brokenRecording)}
    data-broken="true"
    role="img"
    aria-label={`Recording ${failedSavePlaceholder.index + 1} - failed to save`}
    style={failedSavePlaceholder.snapshot ? {
      backgroundImage: `url(${failedSavePlaceholder.snapshot})`,
      backgroundSize: "cover",
      backgroundPosition: "center"
    } : undefined}
  >
    <span className={css.brokenOverlay} />
    <WarningTriangleIcon className={css.brokenIcon} aria-hidden="true" />
    <span className={classNames(css.recordingIndex)}>{failedSavePlaceholder.index + 1}</span>
  </div>
)}
{/* … existing newRecordingButton … */}
```

`recording-strip.scss` — add (sketch):

```scss
.savingRecording {
  position: relative;
}
.savingOverlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
}
.savingSpinner {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 40%;
  height: 40%;
  animation: spin 1s linear infinite;
  color: var(--saving-spinner-color, #ffffff);
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.brokenRecording {
  position: relative;
  cursor: default;
  pointer-events: none; // placeholder is non-interactive
}
.brokenOverlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
}
.brokenIcon {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 50%;
  height: 50%;
  color: var(--warning-icon-color, #f5a623);
}
```

`agent-simulation.test.tsx` — extend test harness. Use a jest spy/mock that wraps `objectStorage.add` to reject (or hang past timeout). Assertions per spec:

- After clicking Stop on a recording when `add()` rejects with a thrown `Error("doc too big")`:
  - The error modal is rendered (find by role `dialog` and matching title text).
  - The strip contains a placeholder element with `data-broken="true"` and `aria-label` matching `/failed to save/`.
  - `recordings` (read via the `setInteractiveState` spy) contains no new entry.
  - `console.error` was called with the expected payload (verify via jest spy on `console.error`).
  - The `log` event was dispatched (verify via a spy on the helper).
  - The `recording-save-failed` pubsub publish was invoked **before the state update that opens the modal**. Spy on both `recordingChannelRef.current.publish` and the `setFailedSaveInfo` state setter (or whichever boundary the harness can intercept). Assert ordering via jest's `mock.invocationCallOrder`: `expect(publishSpy.mock.invocationCallOrder[0]).toBeLessThan(setFailedSaveInfoSpy.mock.invocationCallOrder[0])`. This is robust against React 18 batching / concurrent rendering, unlike asserting on render timing.
- After clicking OK on the modal:
  - The modal is unmounted.
  - The placeholder is removed from the strip.
  - `recordings` is unchanged from pre-failure state.
- 30s timeout case: make `add()` return a promise that never resolves; use `jest.useFakeTimers()`; advance 30s with `jest.advanceTimersByTime(30_000)`, then **flush microtasks** (e.g., `await Promise.resolve()` or a `flushPromises()` helper) so the `Promise.race` rejection propagates into the catch handler and the resulting state updates flush before assertions run. Assert the same observables as the rejection case, with `errorMessage: "save timed out after 30s"`.
- Auto-stop via `maxRecordingTime` → save-fail: trigger the auto-stop path (the `setInterval` callback at [agent-simulation.tsx:380-393](../../packages/agent-simulation/src/components/agent-simulation.tsx#L380-L393) calls `handlePlayPauseRef.current()` when `updatedDuration > maxRecordingTimeInMs`) with `add()` rigged to reject. The save-failure path must behave identically to the user-stop path: modal rendered, placeholder shown, `recordings` cleaned of the in-progress entry, `currentRecordingIndex` reset to -1, telemetry emitted, pubsub published.
- Cleanup invariant: after a save failure, observe via the existing test-harness state-capture mechanism (the same one used by other tests to assert on `recordings`) that:
  1. The number of recording-strip buttons is back to its pre-`handleNewRecording` count (the in-progress entry that was appended at start-of-recording is gone from the rendered UI).
  2. A simulated unmount/remount of the component yields zero new entries (confirms no partial entry was persisted to `interactiveState`).
  Spy mechanics are deferred to the implementer; the intent is "no failed entry persists across mounts."
- Repeat-failure regression: trigger save-fail, dismiss the modal, click "New Recording", record, stop with `add()` rigged to fail again. Assert: the second modal opens; its placeholder appears at the correctly-recomputed slot (one position after the existing recordings, which now equals the freed index of the new in-progress entry); both failures emit independent `log("save-recording-failed", …)` events; `failedSaveInfo` returns to `null` after each dismissal; no stale state leaks between cycles.
- Single-modal policy: open the delete-recording confirm modal (e.g., select an existing recording and click Delete), then trigger save-fail on a separate in-progress recording. Assert: at most one modal is rendered at any time — the delete-confirm is dismissed before the error modal opens. The error modal is the one visible after the failure. Verifying via DOM: only one element with `role="dialog"` is present after the failure path runs.
- Saving-state indicator: make `add()` return a promise that resolves only when the test explicitly does. Stop the recording. Assert: while the promise is pending, the in-progress entry's button carries `data-saving="true"` and an `aria-label` matching `/saving\.\.\./`, and a `.savingOverlay`/`.savingSpinner` are rendered. Resolve the promise; assert the saving indicators clear and the entry now has its normal `aria-label` (or undefined). Repeat for the failure path: with `add()` rejecting, assert the saving state shows during the await window, then transitions to the failed placeholder (`data-broken="true"`) when the rejection lands.
- Saving-state non-selectability: while a saving entry is rendered, assert the `<button>` is `disabled` (cannot be focused/clicked) AND that programmatic call to `handleSelectRecording` for that index is a no-op — no `recording-selected` publish, no polling timer started, `currentRecordingIndex` may be updated by the React state setter but no downstream side effects occur.

`package.json` updates:

```diff
-    "@concord-consortium/object-storage": "1.0.0-pre.8",
+    "@concord-consortium/object-storage": "1.0.0-pre.9",
-    "@concord-consortium/question-interactives-helpers": "^1.24.0",
+    "@concord-consortium/question-interactives-helpers": "^<new-version-from-Step-1>",
```

Bump `agent-simulation` `version` per project release conventions.

---

### agent-simulation: broken-history detection + visual + click-to-select-for-delete

**Summary**: On every mount and whenever `recordings` changes, iterate entries with an `objectId` and call `objectStorage.readMetadata(objectId)` for each. Build a `brokenObjectIds: Set<string>` (entries whose `readMetadata` returned `undefined`). Entries whose `readMetadata` throws are treated as **unknown** and rendered normally — do not mark broken on transient failures. Pass `brokenObjectIds` to `RecordingStrip`. Broken-history entries render with the same `data-broken="true"` visual treatment as the failed-save placeholder, with a different `aria-label` ("Recording N - data missing, cannot play, select to delete") that reflects their interactivity. Clicking a broken entry sets `currentRecordingIndex` but suppresses the playback path (no `recording-selected` publish, no polling). The Play control is disabled while a broken entry is selected; Delete is enabled. Starting a new recording clears any broken-entry selection (existing reset/play flow already handles this — verify and add a test).

**Files affected**:
- `packages/agent-simulation/src/components/agent-simulation.tsx` — add broken-history detection effect, broken-set state, modified `handleSelectRecording` branch, modified `canPlay` to disable when a broken entry is selected.
- `packages/agent-simulation/src/components/recording-strip.tsx` — accept `brokenObjectIds` prop, render broken entries with overlay + warning icon + appropriate `aria-label`, distinct selection ring.
- `packages/agent-simulation/src/components/recording-strip.scss` — selection-ring styling for broken entries (reuses `.brokenRecording`/`.brokenOverlay`/`.brokenIcon` from Step 2).
- `packages/agent-simulation/src/components/agent-simulation.test.tsx` — tests for detection, click-to-select, Play disabled, starting a new recording.

**Estimated diff size**: ~350 lines (including tests).

**Implementation details:**

State + effect in `agent-simulation.tsx`:

```tsx
const [brokenObjectIds, setBrokenObjectIds] = useState<Set<string>>(new Set());

// Per-mount cache: objectId -> "ok" | "broken". A useRef Map persists across
// renders within a single mount and resets on unmount, which preserves the
// requirement's "self-healing on every mount" semantic while avoiding redundant
// readMetadata calls within a session. Without the cache, adding one new
// recording triggers N readMetadata calls (re-checks all N existing IDs); with
// it, only the new ID is fetched. The "broken -> ok" self-heal still works
// (a fresh mount starts with an empty cache). The "ok -> broken" transition
// within a single session is not detected, but that requires Firestore data
// being deleted out-of-band, which the storage abstraction doesn't expose.
const metadataCacheRef = useRef<Map<string, "ok" | "broken">>(new Map());

// Stable cache key derived from just the objectIds. This is the only data the
// detection effect cares about; depending on `recordings` directly would re-fire
// every 500ms while a recording is in progress (the live-duration setInterval
// at agent-simulation.tsx:380-393 mutates the in-progress entry on every tick),
// causing N+1 Firestore reads per second per active recording.
// JSON.stringify (rather than join with a delimiter) is unambiguously delimiter-
// safe: Firestore document IDs may contain any character except "/", "..", and
// "__name__", so a naive separator like "," could collide. The serialized array
// is small (<100 ids x ~40 chars) and recomputed at most every 500ms.
const objectIdsKey = useMemo(
  () => JSON.stringify(
    recordings.map(r => r.objectId).filter((id): id is string => !!id)
  ),
  [recordings]
);

// Detect pre-existing broken recordings on every mount and whenever the set of
// objectIds changes. We never mutate recordings / interactiveState — broken
// state is purely UI. If readMetadata throws (network, auth), the entry is
// left out of the cache so a later mount can retry (treated as unknown for the
// current render).
// No aria-live announcement on detection by design: broken-history is passive
// state, not a notification-worthy event; the per-entry aria-label is the AT
// signal on focus.
useEffect(() => {
  let cancelled = false;
  const detect = async () => {
    const objectIds: string[] = JSON.parse(objectIdsKey);
    const cache = metadataCacheRef.current;

    // Only fetch metadata for IDs not yet in the cache. Each result is recorded
    // so subsequent objectIdsKey changes (e.g., a new recording added) only
    // fetch the delta rather than re-checking every existing ID.
    const newIds = objectIds.filter(id => !cache.has(id));
    await Promise.all(
      newIds.map(async (objectId) => {
        try {
          const md = await objectStorage.readMetadata(objectId);
          cache.set(objectId, md === undefined ? "broken" : "ok");
        } catch {
          // transient failure — leave out of cache so a later mount can retry
        }
      })
    );

    if (cancelled) return;

    // Rebuild brokenObjectIds from the cache, filtered to current objectIds.
    const broken = new Set<string>();
    for (const objectId of objectIds) {
      if (cache.get(objectId) === "broken") broken.add(objectId);
    }
    setBrokenObjectIds(broken);
  };
  detect();
  return () => { cancelled = true; };
}, [objectIdsKey, objectStorage]);
```

Modify `handleSelectRecording` — early-return the playback path when the selected entry is broken:

```tsx
const handleSelectRecording = (index: number) => {
  cancelRecordingPoll();
  setCurrentRecordingIndex(index);
  setPaused(true);

  const recording = recordings[index];
  if (!recording) return;

  // Saving-state guard: entries whose objectId is undefined are still in
  // the save-in-flight window (between Stop and add() resolution). Selecting
  // such an entry would publish recording-selected and start polling for
  // objectId — both pointless until the save resolves, and the live-graph
  // package would react to the publish in confusing ways. The UI half of
  // this defense lives on the <button disabled> in the recording strip;
  // this guard catches any programmatic call path.
  if (!recording.objectId) {
    return;
  }

  // Broken-entry selection: skip the playback path entirely. Only purpose of selection
  // here is to enable the existing control-panel Delete action.
  if (brokenObjectIds.has(recording.objectId)) {
    return;
  }

  // … existing publish/polling logic unchanged below this point …
};
```

Modify `canPlay` (currently a `useMemo` around [agent-simulation.tsx:93](../../packages/agent-simulation/src/components/agent-simulation.tsx#L93)):

```tsx
const selectedIsBroken =
  currentRecording?.objectId !== undefined &&
  brokenObjectIds.has(currentRecording.objectId);

const canPlay = (hasCodeSource
  ? !!blocklyCode && (!externalBlocklyCode || blocklyCode === externalBlocklyCode)
  : true) && !selectedIsBroken;
```

Pass `brokenObjectIds` to `RecordingStrip`:

```tsx
<RecordingStrip
  /* … existing props … */
  brokenObjectIds={brokenObjectIds}
/>
```

`recording-strip.tsx` — extend `Props` and render broken entries with the same visual treatment as the placeholder:

```tsx
interface Props {
  /* … existing props … */
  brokenObjectIds: Set<string>;
}
```

```tsx
{recordings.map((recording, index) => {
  const isBroken = recording.objectId !== undefined && brokenObjectIds.has(recording.objectId);
  const style: CSSProperties = recording.thumbnail ? {
    backgroundImage: `url(${recording.thumbnail})`,
    backgroundSize: "cover",
    backgroundPosition: "center"
  } : {};
  return (
    <button
      key={index}
      className={classNames(css.recordingButton, {
        [css.currentRecordingButton]: index === currentRecordingIndex && !isBroken,
        [css.currentBrokenRecordingButton]: index === currentRecordingIndex && isBroken,
        [css.brokenRecording]: isBroken,
      })}
      onClick={() => onSelectRecording(index)}
      disabled={isRecording && index !== currentRecordingIndex}
      style={style}
      data-broken={isBroken || undefined}
      aria-label={isBroken
        ? `Recording ${index + 1} - data missing, cannot play, select to delete`
        : undefined}
    >
      {isBroken && <span className={css.brokenOverlay} />}
      {isBroken && <WarningTriangleIcon className={css.brokenIcon} aria-hidden="true" />}
      <span className={classNames(css.recordingIndex, { [css.currentRecording]: index === currentRecordingIndex })}>
        {index + 1}
      </span>
    </button>
  );
})}
```

`recording-strip.scss` — add:

```scss
.currentBrokenRecordingButton {
  outline: 2px solid var(--warning-ring-color, #f5a623);
  outline-offset: -2px;
}
```

`agent-simulation.test.tsx` — add:

- Mock `objectStorage.readMetadata` so it returns `undefined` for a specific `objectId` and a valid metadata object for others. Confirm only the matching entry renders with `data-broken="true"` and the documented `aria-label`.
- Mock `readMetadata` to throw for a specific `objectId`. Confirm that entry does NOT render with `data-broken="true"` (treated as unknown).
- Click a broken entry. Assert: `currentRecordingIndex` is set, no `recording-selected` publish happened (spy on `PubSubChannel`), no polling timer started, Play control is disabled in the rendered `ControlPanel`, Delete control is enabled.
- With a broken entry selected, click Play (verify it is disabled / no-op).
- With a broken entry selected, trigger a new recording via the existing flow; assert `currentRecordingIndex` is cleared (existing reset/play behavior; this is a regression test).
- After confirming delete on a broken entry, the entry is removed from `recordings` and `interactiveState` (existing flow continues to work).
- Metadata cache delta-fetch: mount the component with 5 existing recordings; spy on `objectStorage.readMetadata`. After initial mount, assert it was called 5 times (cold cache). Then trigger an `objectIdsKey` change by adding ONE new recording (e.g., simulate a save success that appends an `objectId`); assert `readMetadata` was called exactly ONCE more — only the new ID, not the existing 5 (per-mount cache hit). Unmount and remount with the same 5 + 1 recordings; assert `readMetadata` is called 6 times (cache is reset on unmount, preserving self-healing semantic).

---

## Open Questions

<!-- None at time of writing. Add here if implementation surfaces a new question. -->

## Self-Review

### Senior Engineer

#### RESOLVED: Late rejection of `add()` after the 30s timeout fires becomes an unhandled rejection
**Resolution**: Step 2 code sketch updated. `objectStorage.add(storedObject)` is now hoisted to `addPromise` with an inline `addPromise.catch(() => {})` immediately attached to absorb any late rejection on the timeout path. The forward marker remains `log("save-recording-failed", { errorMessage: "save timed out after 30s" })`. A code comment in the sketch explains the rationale so a future maintainer doesn't remove the seemingly-empty catch.

#### RESOLVED: Leaked `setTimeout` if `add()` resolves before the 30s deadline
**Resolution**: Step 2 sketch updated to capture the timer id in a `let timeoutId` and `clearTimeout(timeoutId)` in a `finally` block, so the timer is cleaned up regardless of which branch wins the race. A code comment explains the intent.

#### RESOLVED: Stale closure on `notPausedRecordings` after the await
**Resolution**: Step 2 sketch updated. Both branches now use functional `setRecordings(prev => …)` — success rebuilds the array from `prev`, failure filters from `prev`. The pre-await `notPausedRecordings` snapshot is no longer referenced post-await. Additionally, `currentRecordingIndex` is captured into a `savingIndex` const at the top of save() so both branches and the placeholder index use the same slot even if state changes during the await.

#### RESOLVED: `save()` is still fire-and-forget at the call site
**Resolution**: Step 2 sketch now includes the call-site comment documenting that `save()` is intentionally not awaited and handles errors internally. Prevents a future maintainer from adding code after `save();` that expects the persist to have completed.

---

### QA Engineer

#### RESOLVED: 30s timeout test needs explicit microtask flushing
**Resolution**: Step 2 test bullet for the 30s timeout case now explicitly calls out the microtask flush: advance fake timers with `jest.advanceTimersByTime(30_000)`, then `await Promise.resolve()` (or a `flushPromises()` helper) before assertions, so the `Promise.race` rejection propagates into the catch handler.

#### RESOLVED: No test for Escape-key dismissal of the alert-mode modal
**Resolution**: Step 1's `modal.test.tsx` test bullets expanded into individually-enumerated alert-mode cases: Cancel/X hidden, initial focus, **Escape dismissal**, OK-click dismissal, focus restore on dismiss (covers both Escape and OK paths), and single-focusable focus trap.

#### RESOLVED: `setInteractiveState` spy target unclear
**Resolution**: Cleanup-invariant test bullet rewritten to describe the assertion in terms of observable outcomes (recording-strip button count + unmount/remount yielding zero new entries) rather than a specific spy mechanism. Spy mechanics are deferred to the implementer, who can reuse whatever pattern the existing `agent-simulation.test.tsx` already uses for `recordings` assertions.

#### RESOLVED: Second-failure regression case is uncovered
**Resolution**: Added a "Repeat-failure regression" test bullet to Step 2 covering the full cycle: fail → dismiss → new recording → fail again. Asserts modal lifecycle, placeholder index recomputation, independent telemetry per cycle, and no stale state leaking between cycles.

---

### WCAG Accessibility Expert

#### RESOLVED: Hardcoded `id="modal-title"` risks collision with simultaneous modal
**Resolution**: Step 1 `modal.tsx` sketch updated. `useId` is imported from React and a `const titleId = useId();` is added at the top of the component. Both the `aria-labelledby` attribute on the dialog overlay and the `id` on the title `<div>` now reference `titleId`. Removes any duplicate-id risk if two modals coexist.

#### RESOLVED: `document.body.focus()` fallback is a silent no-op without `tabindex`
**Resolution**: Step 1 sketch updated. The fallback branch now calls `(document.activeElement as HTMLElement | null)?.blur?.()` — load-bearing because it releases focus from anywhere stale inside the unmounting modal subtree. A comment notes that `body.focus()` is a no-op without tabindex; we don't bother with it. This handles only the rare case where the previously-focused element has been removed from the DOM during the modal's lifetime; the common path (`prev.focus()`) is unchanged.

#### RESOLVED: Focus trap with a single focusable button
**Resolution**: Step 1 sketch updated to add an early-return for `focusables.length === 1`: `e.preventDefault()` and return immediately, with a comment explaining this is the alert-mode OK-button case. Removes the order-dependence between the first/last branches.

#### RESOLVED: Implementation does not call out that the modal's existing inline form behavior may double-fire onConfirm
**Resolution**: Step 1 `modal.tsx` sketch now includes a JSX comment near the `<form>` warning that OK must stay outside the form to avoid Enter double-firing `onConfirm` (button click + form submit). Prevents a future refactor regression.

---

### Performance Engineer

#### RESOLVED: `approximateSizeBytes` is computed on the success path even though it's only used on failure
**Resolution**: Step 2 sketch updated. The `JSON.stringify(storedObject.data).length` computation has been moved inside the catch block, with a comment explaining that the success path no longer pays the O(N) stringify cost of the tick data we just sent to Firestore.

#### RESOLVED: Per-recordings-change `Promise.all(readMetadata)` fan-out cost AND detection effect over-firing during active recordings
**Resolution**: Both findings (PE-2 and PE-3) share the same root cause and fix. Step 3 sketch updated to derive a stable `objectIdsKey = useMemo(() => recordings.map(r => r.objectId).filter(Boolean).join(","), [recordings])` and change the detection effect dependency from `[recordings, objectStorage]` to `[objectIdsKey, objectStorage]`. The effect now re-fires only when an `objectId` is added or removed — not when `duration` (or any other recording field) changes. Eliminates the N+1 Firestore reads/sec during active recordings (the most severe Performance Engineer finding). A code comment in the sketch explains the rationale so a future maintainer doesn't simplify the deps back to `[recordings]`.

#### RESOLVED: 30s timeout in a backgrounded tab
**Resolution**: Accepted as a known limitation. Added an Out of Scope entry to `requirements.md` documenting that browsers throttle/pause `setTimeout` in background tabs, the timeout may fire later than 30s if the student switches tabs mid-save, the dominant scenario (foreground save) is unaffected, and a real fix would require service-worker plumbing well beyond this ticket.

---

### Round 2 — issues surfaced by round-1 resolutions

#### RESOLVED: Mid-save mutation could make `savingIndex` reference the wrong slot (Senior Engineer)
**Issue**: SE-3's resolution captures `savingIndex = currentRecordingIndex` at the top of `save()` and uses it on both the success and failure branches. This is safe against field updates to `recordings` during the await (PE-2/3's concern), but if the user manages to delete an entry *before* `savingIndex` mid-save (would require actively selecting a different entry then deleting it via the confirm-delete flow, against the UI's normal direction), the captured index would point at the wrong slot.

**Resolution**: Accepted as a known limitation. The save window is short (typically <2s for normal recordings, capped at 30s). Hardening would require identifying the in-progress entry by uniqueness (no `objectId`) rather than by index — a future-proof option if observed in practice would be `setRecordings(prev => prev.filter((r, i) => !(i === savingIndex && !r.objectId)))`, only removing the entry if it's still the no-objectId placeholder. Deferred until evidence of the edge case occurring.

#### RESOLVED: Modal lacks `aria-describedby` pointing at the message body (WCAG)
**Issue**: WCAG-1's `useId()` resolution wired `aria-labelledby={titleId}`, but the message body had no `aria-describedby` reference. ARIA APG recommends `aria-describedby` for dialog body content so screen readers announce both the title AND the explanatory message when the dialog opens. Without it, AT users hear only "Recording Save Failed" and must navigate to discover the explanation about what to do next.

**Resolution**: Step 1 sketch updated. Added `const messageId = useId();` parallel to `titleId`. The overlay now declares `aria-describedby={messageId}` and the `.modalMessage` div carries `id={messageId}`. Combined `aria-labelledby` + `aria-describedby` is the standard ARIA APG dialog pattern. The "Both modes" test bullet updated to assert both attributes are present and reference the right elements.

#### RESOLVED: Test environment for focus assertions not specified (QA Engineer)
**Issue**: The new Modal tests assert on `document.activeElement`, focus restoration, and Tab/Shift+Tab traversal. JSDOM has limited focus simulation: `.focus()` works, but raw `keydown` events do NOT trigger native focus traversal — Tab tests that fire `keydown` silently no-op. Without an explicit note, the implementer may waste time debugging "why doesn't my Tab test work" before discovering they need `userEvent`.

**Resolution**: Added a test-environment bullet to Step 1's `modal.test.tsx` test list: use `@testing-library/user-event`'s `userEvent.tab()` and `userEvent.keyboard("{Escape}")` rather than raw `keydown` events. Documents the JSDOM quirk inline.

---

### External Review — Copilot (development review)

#### RESOLVED: `objectIdsKey` comma-join could collide with Firestore IDs (Senior Engineer)
**Issue**: The PE-2/3 resolution used `.join(",")` to build a stable cache key from the recording objectIds, with a code comment claiming the delimiter "can't appear inside a Firestore object id." That claim is unsupported: Firestore document IDs can contain any character except `/`, `..`, and `__name__`. If an objectId ever contains a comma, the split-back-out would corrupt the broken-detection set and mis-mark entries. The `@concord-consortium/object-storage` library happens to generate UUID-like IDs in practice, but the contract isn't enforced.

**Resolution**: Step 3 sketch updated to use `JSON.stringify` (instead of comma-join) and `JSON.parse` (instead of split). Unambiguously delimiter-safe regardless of what characters Firestore allows. The serialized array is small (<100 ids × ~40 chars) and recomputed at most every 500ms. The misleading code comment was also rewritten.

#### RESOLVED: Timeout path can leave an orphan Firestore record on late resolve (Senior Engineer)
**Issue**: When the 30s timeout fires but `objectStorage.add()` eventually resolves server-side, the stored record persists in Firestore with no corresponding `interactiveState.recordings[]` entry. Spec does not describe cleanup or reconciliation.

**Resolution**: Already addressed by an Out of Scope entry in `requirements.md` (line 158) — local UI integrity beats Firestore integrity for this fix; the `log("save-recording-failed", { errorMessage: "save timed out after 30s" })` event is the forward marker for researchers reconciling orphan records. The reviewer was missing this context, so Step 2 of `implementation.md` now includes a "Note on late-resolving timeouts" paragraph that cross-references the OoS entry and explains why defensive cleanup was rejected (no cancellation handle in the Firebase JS SDK; a post-timeout delete would race the original write atomically). No behavioral change.

#### RESOLVED: "publish happened before the modal rendered" test wording is brittle (QA Engineer)
**Issue**: The Step 2 test bullet asserted on render timing ("the render that surfaces the modal"), which is unreliable under React 18 batching and concurrent rendering. Render order isn't a stable signal for sequencing assertions.

**Resolution**: Test bullet rewritten to use jest's `mock.invocationCallOrder` to assert the publish was invoked before the `setFailedSaveInfo` state setter (the call that opens the modal). Order-of-call assertion is robust across React's rendering modes. Concrete assertion shown inline: `expect(publishSpy.mock.invocationCallOrder[0]).toBeLessThan(setFailedSaveInfoSpy.mock.invocationCallOrder[0])`.

#### RESOLVED: Failed-save placeholder uses a roleless `<div>` with `aria-label` (WCAG)
**Issue**: The Step 2 sketch rendered the failed-save placeholder as a roleless `<div>` with `aria-label` and `data-broken="true"`. ARIA spec says `aria-label` on a generic element is unreliable — some screen readers ignore it. AT users may miss the "Recording N - failed to save" announcement entirely. The broken-history entries in Step 3 are `<button>` elements, so they're unaffected — only the placeholder needs the fix.

**Resolution**: Step 2 placeholder sketch updated to add `role="img"` to the wrapper `<div>`. The placeholder is a visual symbol (warning triangle + overlay) with a text alternative — `role="img"` matches that intent and is the standard ARIA pattern for honoring `aria-label` on otherwise-roleless elements. Single-attribute fix; no SCSS or markup restructuring. A code comment explains why the placeholder uses `role="img"` but the Step 3 broken-history entries use `<button>`.

---

### External Review — Copilot, second and third pass

#### RESOLVED: Focus-restore fallback `blur()` deviates from the requirement text (WCAG)
**Issue**: WCAG-2's round-1 resolution replaced `document.body.focus?.()` with `(document.activeElement as HTMLElement | null)?.blur?.()` on the rationale that `body.focus()` is a no-op without a temporary `tabindex` mutation. But `requirements.md` line 73 still said "focus is restored to ... the document body if that element is no longer in the DOM" — so the implementation now contradicted the written requirement. Reviewer flagged this as a potential audit/QA risk.

**Resolution**: Aligned by updating the requirement rather than the implementation. The blur path is the practically-better choice (no global DOM mutation, no `tabindex` shenanigans, and the common path of `prev.focus()` is the load-bearing case anyway — the fallback only fires when the previously-focused element has been removed from the DOM during the modal's lifetime). `requirements.md` line 73 rewritten to specify the blur fallback explicitly with rationale, so the implementation now matches the spec text and a future auditor will find the decision logged in both places.

#### RESOLVED: Modal alert-mode Escape routes through `onCancel`, can diverge from `onConfirm` (WCAG / Senior Engineer)
**Issue**: Step 1 sketch's `handleKeyDown` called `onCancel()` when Escape was pressed, while OK click called `onConfirm`. The requirement (requirements.md line 73) is that Escape dismisses "identically to clicking OK." If a caller ever passed different handlers for `onCancel` vs `onConfirm`, the requirement would silently break. The QI-163 caller happens to wire both to the same function, so the bug doesn't manifest today — but the API is misleading and a future caller could easily violate the invariant.

**Resolution**: Step 1 sketch updated to route Escape to `onConfirm` (not `onCancel`) in alert mode. Now identical-to-OK is enforced by construction, not by caller discipline. `onCancel` is unused in alert mode but kept in the props signature to avoid a breaking change for existing confirm-mode callers; a future ticket could make it optional via TS discriminated union. The test bullet for Escape dismissal was updated to assert `onConfirm` was called (and `onCancel` was NOT) when Escape is pressed in alert mode.

#### RESOLVED: Multi-modal coexistence — error modal can render alongside delete-confirm modal (WCAG / Senior Engineer)
**Issue**: During a save (potentially up to 30s on the timeout path), the user can select an existing recording, click Delete, and open the delete-confirm modal. If `add()` then rejects, the error modal renders on top — two `aria-modal="true"` dialogs simultaneously with competing focus traps. WCAG and screen-reader violation.

**Resolution**: Added a "single-modal policy" bullet to `requirements.md` under "Error modal": when the save-failure path runs, any open delete-confirm modal is dismissed before the error modal opens. Step 2 catch handler in `implementation.md` updated to call `setShowDeleteRecordingConfirm(false)` (the existing state name in [agent-simulation.tsx:807](../../packages/agent-simulation/src/components/agent-simulation.tsx#L807)) before `setFailedSaveInfo({...})`. After acknowledging the error, the user can re-open delete-confirm if needed — indices may have shifted because the failed in-progress entry was removed, so restarting the flow is safer than trying to resume. New test bullet asserts only one `role="dialog"` element is present after the failure path runs from a delete-confirm-open state.

#### RESOLVED: Pending-save UX is undefined — in-progress entry looks "normal" before save resolves (UX)
**Issue**: Between Stop and save resolution (up to 30s on the timeout path), the in-progress entry was already in `recordings` with `modelName`, `startedAt`, and `duration` set, so the strip rendered it as if it were saved. On slow saves the user would briefly see a "normal" recording that then either updated (success) or disappeared and was replaced by the warning placeholder (failure). Jarring UX, particularly visible on the 30s timeout path.

**Resolution**: Added a new "Saving-state visual indicator" section to `requirements.md` and a corresponding rendering block in Step 2's `recording-strip.tsx` sketch. Detection signal: `recording.objectId === undefined` AND not the currently-recording entry. No additional React state needed — the signal self-clears when either the success path sets `objectId` or the failure path removes the entry. New SCSS classes `.savingOverlay` and `.savingSpinner` (with a `@keyframes spin`) added to `recording-strip.scss`; a new `spinner-icon.svg` asset added to the files list. The `aria-label` switches to `"Recording N - saving..."` while saving; the spinner SVG carries `aria-hidden="true"`. Estimated diff size for Step 2 bumped to ~525 lines. A test bullet covers both the success-clear and failure-transition paths (saving → placeholder).

---

### External Review — Copilot, fourth pass

#### RESOLVED: Stale `onConfirm` closure in `handleKeyDown` useCallback (Senior Engineer)
**Issue**: Copilot-6 changed the Escape handler to call `onConfirm` instead of `onCancel`, but the `useCallback` dependency array still listed `[isAlert, onCancel]`. A stale `onConfirm` would be captured if the prop changed between renders, leading to silently-wrong dismissal behavior on parent state updates.

**Resolution**: Step 1 sketch's `handleKeyDown` deps updated to `[isAlert, onConfirm]`. Pure regression from the Copilot-6 fix; one-character change.

#### RESOLVED: Escape passes `KeyboardEvent` typed as `MouseEvent` (Senior Engineer)
**Issue**: The Escape path called `onConfirm(e as unknown as React.MouseEvent<HTMLButtonElement>)` — at runtime the event is a `KeyboardEvent`, so any caller reading `MouseEvent`-only fields (`button`, `clientX`, etc.) would silently get undefined. TypeScript types no longer reflected runtime behavior.

**Resolution**: Expanded the `onConfirm` prop type union to include `React.KeyboardEvent<HTMLDivElement>` alongside the existing `FormEvent`/`MouseEvent`. The cast is dropped; the Escape path now calls `onConfirm(e)` directly with the correct type. Conservative widening — no risk to existing confirm-mode callers since the parameter stays required and the union only grows. A code comment near the call site explains the union motivation.

#### RESOLVED: "Files affected" bullet still says modals "coexist" (QA Engineer)
**Issue**: Step 2's `agent-simulation.tsx` Files-affected bullet said "render error modal + delete-recording modal coexist". This predated the Copilot-7 single-modal policy and now contradicted the catch-handler logic that dismisses delete-confirm before opening the error modal. An implementer skimming the header could miss the policy and reintroduce the WCAG violation.

**Resolution**: Bullet rewritten to "render error modal (dismissing any open delete-recording confirm modal first, per single-modal policy)". Aligns with the catch-handler code and with the requirement bullet added in Copilot-7.

---

### External Review — Copilot, fifth pass

#### RESOLVED: Saving-state entries remain selectable (Senior Engineer — HIGH)
**Issue**: The Copilot-8 saving-state rendering kept the `<button>` element fully interactive — `onClick={() => onSelectRecording(index)}` and only the standard `disabled={isRecording && index !== currentRecordingIndex}` guard. Clicking a saving entry called `handleSelectRecording` with `recording.objectId === undefined`, which went down the playback path (published `recording-selected`, started polling for `objectId`). The live-graph package reacts to that publish; pointless work while the save is in flight, and surfaces invalid intermediate UI.

**Resolution**: Defense-in-depth fix applied in two places:
1. **Step 2 `recording-strip.tsx` button** — `disabled` now also disables saving entries: `disabled={isSaving || (isRecording && index !== currentRecordingIndex)}`.
2. **Step 3 `handleSelectRecording`** — new early-return guard `if (!recording.objectId) return;` runs before the broken-entry check. Catches any programmatic call path that bypasses the disabled button.

The broken-entry check was simplified from `if (recording.objectId && brokenObjectIds.has(recording.objectId))` to `if (brokenObjectIds.has(recording.objectId))` because the new saving-state guard above it ensures `recording.objectId` is defined past that point. New test bullet asserts the disabled button AND the programmatic-call no-op.

#### RESOLVED: Broken-history detection re-fetches all metadata on every objectId change (Performance Engineer)
**Issue**: The PE-2/3 resolution removed the 500ms re-fetch during live recording, but the remaining behavior was still O(N) per `objectIdsKey` change. When the user saved a new recording (success path adds an `objectId`), the detection effect re-fetched metadata for ALL existing objectIds, not just the new one. For 20 recordings, that's 20 Firestore reads per save success.

**Resolution**: Step 3 sketch updated to introduce a per-mount cache: `metadataCacheRef = useRef<Map<string, "ok" | "broken">>(new Map())`. The detection effect now filters `objectIds` to those not in the cache, fetches only the delta, and rebuilds `brokenObjectIds` from the cache. A fresh mount starts with an empty cache, preserving the "self-healing on every mount" semantic the original spec required. The "broken → ok" self-heal still works (next mount fetches fresh); the "ok → broken" transition within a single session is not detected, which is acceptable because it requires Firestore data being deleted out-of-band — the storage abstraction doesn't expose that. New test bullet asserts the delta-fetch behavior (5 reads on cold mount, +1 read on adding a new ID, 6 reads on remount).

