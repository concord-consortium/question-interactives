# QI-169 — Image Question: cooperating focus protocol (client side)

**Date:** 2026-06-23
**Jira:** [QI-169](https://concord-consortium.atlassian.net/browse/QI-169)
**Branch:** `QI-169-image-focus-protocol`
**Design spec reference:** AP-108 / activity-player#549
**Reference implementation:** `lara/lara-typescript/src/example-interactives/src/focus-interactive-coop/app.tsx`

## Background

Activity Player (AP) is gaining an iframe focus-trap system (AP-108) so keyboard
focus can move into, through, and out of iframed interactives in a predictable
order. An interactive can either be **non-cooperating** (AP wraps it with
sentinel elements and manages focus from the outside) or **cooperating** (the
interactive declares the `focusProtocol` capability and places/relinquishes
focus itself in response to messages from AP).

This story makes the **image-question** interactive the first cooperating
interactive. Image-question is the ideal first case because it opens an AP modal
dialog (`showModal({ type: "dialog" })`) whose URL points back at the *same*
interactive — so the opened dialog is a second iframe of image-question, and that
dialog is exactly the AP-focus-trap-modal shape the protocol is designed for.

## Scope

In scope (matches the `focus-interactive-coop` reference, generalized to
image-question's dynamic content):

- Declare `focusProtocol: true` in `supportedFeatures`.
- On `focusEnter { mode }` place entry focus:
  - `"forward"` → first focusable element
  - `"reverse"` → last focusable element
  - `"restore"` → last-focused element, falling back to first
- Track the last-focused element (for `restore`).
- On `Escape`, post `focusExit { mode: "escape" }`.
- Verify hook behavior with unit tests.

Explicitly **out of scope** (deferred, consistent with the reference
implementation's "later phase" note):

- **Directional `focusExit { mode: "forward" | "reverse" }` on Tab boundaries.**
  The interactive does **not** trap Tab. Forward/reverse exit flows out of the
  iframe naturally through AP's sentinels. The QI-169 ticket text lists this, but
  the reference defers it to a later phase; this story follows the reference.
- Nested cooperation (a QI that embeds child interactives and relays their focus).
- The companion LARA library work (the `focusProtocol` / `addFocusEnterListener`
  / `sendFocusExit` API already exists in the linked `lara-interactive-api@1.14.0`).
- AP host-side integration (the dialog overlay + `FocusManager`), which is being
  implemented in parallel in the `cooperating-focus-protocol` AP worktree.

## Key principle: this is not a trap

The interactive lets focus flow naturally and never wraps focus back on itself.
It is a focus-protocol **participant**: it *places* entry focus when AP tells it
to, *notifies* AP on Escape, and otherwise stays out of the way. No
`preventDefault` on Tab, no focus capture.

## Dependency status

- `@concord-consortium/lara-interactive-api` is linked via **yalc at version
  1.14.0**, which provides the client APIs this design uses:
  - `addFocusEnterListener((mode: "forward" | "reverse" | "restore") => void)`
  - `removeFocusEnterListener()`
  - `sendFocusExit(mode: "forward" | "reverse" | "escape")`
  - `ISupportedFeatures.focusProtocol?: boolean`
- End-to-end verification in AP depends on the in-progress AP worktree
  (`activity-player.worktrees/cooperating-focus-protocol`) landing. That is an
  external dependency, not a blocker for this story's code and unit tests.

## Architecture

A single, self-contained, `lara-interactive-api`-only hook owns all cooperating
behavior. `BaseQuestionApp` wires it behind one opt-in flag. Image-question opts
in. There is **no `dialogMode` branching** — the same hook runs for the inline
iframe and the dialog iframe. (Running in both modes is fewer branches and also
makes `restore` meaningful: after the dialog closes, AP can restore focus to the
inline "Edit"/"Make Drawing" button that opened it.)

| Unit | Location | Responsibility |
|---|---|---|
| `useFocusProtocol` | `packages/helpers/src/hooks/use-focus-protocol.ts` | The whole client protocol: place focus on `focusEnter`, track last-focused, forward `Escape` as `focusExit("escape")`. |
| `getFocusableElements` | `packages/helpers/src/utilities/focusable-elements.ts` | Return visible/enabled focusable elements within a root, in DOM order. Isolated for unit testing. |
| `BaseQuestionApp` | `packages/helpers/src/components/base-question-app.tsx` | New `focusProtocol?: boolean` prop: merges `focusProtocol: true` into the existing `setSupportedFeatures` call **and** calls `useFocusProtocol({ enabled })`. |
| image-question app | `packages/image-question/src/components/app.tsx` | Passes `focusProtocol` to `BaseQuestionApp`. |

### Why `BaseQuestionApp` owns the wiring

`setSupportedFeatures` is called exactly once in `BaseQuestionApp`. Adding a
second `setSupportedFeatures` call from the hook would race the existing effect
(last write wins). Instead, the hook does **not** call `setSupportedFeatures`;
`BaseQuestionApp` merges `focusProtocol` into its single call and turns the hook
on via the same `focusProtocol` prop. One flag enables the whole feature, and
there is one source of truth for supported features.

If image-question later needs image-question-specific focus behavior that does
not generalize, we can revisit (e.g. hook options or a dedicated wrapper), but
the single boolean flag is the starting point.

## Component behavior

### `useFocusProtocol(options: { enabled: boolean })`

Document-scoped — the whole iframe document is the participant, so there is no
container ref to thread. When `enabled` is false the hook attaches nothing (it is
a no-op), so non-cooperating interactives that pass through `BaseQuestionApp` are
unaffected. `enabled` is expected to be true only at runtime (not authoring /
report).

On mount (when enabled):

1. `addFocusEnterListener(mode => { … })`:
   - `"reverse"` → `getFocusableElements(document).at(-1)?.focus()`
   - `"restore"` → `(lastFocused ?? getFocusableElements(document)[0])?.focus()`
   - else (`"forward"`) → `getFocusableElements(document)[0]?.focus()`
2. `document.addEventListener("focusin", onFocusIn)` — record `lastFocused = target`
   when `target` is an element other than `document.body`.
3. `document.addEventListener("keydown", onKeyDown)` — on `Escape`, call
   `sendFocusExit("escape")`. No other keys are handled.

On unmount: `removeFocusEnterListener()` and remove both document listeners.

Notes:

- `lastFocused` is held in a ref (no re-render needed).
- Escape is always forwarded, matching the reference. A future widget that needs
  to consume Escape (e.g. cancel an in-progress drawing-tool text edit) would be
  responsible for suppressing it before it reaches this listener; that refinement
  is out of scope here.

### `getFocusableElements(root: ParentNode = document): HTMLElement[]`

Query a standard focusable selector and return matches in DOM order, filtered to
elements that are enabled and visible:

- Selector covers: `a[href]`, `button`, `input`, `textarea`, `select`,
  `[tabindex]` (excluding `tabindex="-1"`), and other natively focusable
  elements as needed.
- Exclude disabled form controls.
- Exclude non-visible elements: an element is treated as not focusable if its
  computed `visibility` is `hidden`, or if it (or any ancestor) has the `hidden`
  attribute or computed `display: none`. `visibility` inherits so the element's own
  computed value already accounts for ancestors; `display` and `hidden` do not, so
  those are checked by walking up the ancestor chain.

This utility resolves "first" (for `forward`) and "last" (for `reverse`) focus
targets from image-question's dynamic dialog content (drawing-tool toolbar
buttons → answer textarea → Cancel → Done).

**Known risk to validate in tests:** the recently a11y-upgraded drawing-tool
toolbar may use a roving `tabindex` (only one toolbar button tabbable at a time),
which can change which element resolves as "first". Tests exercise this against
representative DOM so the behavior is pinned down.

## Wiring summary

```
image-question app.tsx
  └─ BaseQuestionApp focusProtocol           // opt-in flag
       ├─ setSupportedFeatures({ interactiveState, authoredState, focusProtocol })
       └─ useFocusProtocol({ enabled: focusProtocol })   // every mode: runtime, report, authoring
            ├─ addFocusEnterListener → place focus (first / last / restore)
            ├─ focusin → track lastFocused
            └─ keydown Escape → sendFocusExit("escape")
```

## Testing

- **`getFocusableElements`** — unit tests over DOM fixtures: DOM order,
  disabled controls excluded, hidden elements excluded, `tabindex="-1"` excluded,
  positive `tabindex` included.
- **`useFocusProtocol`** — React Testing Library + jsdom, mocking
  `addFocusEnterListener` (capture the registered callback) and `sendFocusExit`:
  - Render a container with several focusable elements.
  - Drive the captured callback with `"forward"` / `"reverse"` / `"restore"` and
    assert `document.activeElement`.
  - For `"restore"`, focus an element first, then assert it is re-focused; assert
    the first-element fallback when nothing was focused.
  - Dispatch `Escape` keydown and assert `sendFocusExit("escape")`.
  - Assert listeners are removed and `removeFocusEnterListener` is called on
    unmount.
  - Assert the hook is a no-op when `enabled` is false.
- **End-to-end in AP** — deferred to when the AP `cooperating-focus-protocol`
  worktree lands; tracked as an external dependency.

## Follow-up work (not this story)

- Directional `focusExit { mode: "forward" | "reverse" }` on Tab boundaries.
- Escape suppression when an inner widget legitimately consumes Escape.
- Trapping focus within image-question's own internal modal (the media-library
  upload dialog) while it is open.
- Promoting `focusProtocol` to additional question interactives.
